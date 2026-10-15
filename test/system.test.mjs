import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {join,resolve,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {saveProviderEnv,loadEnv,localStore} from '../storage.mjs';
import {tokenCatalog,readSupply,clearTokenCache,mappedAssets,normalizeUnlock} from '../tokenomist.mjs';
import {personalizedRisk} from '../risk.mjs';
import {createPhoneState,validatePhone,callBlock,placeCall,authenticatePhone,quietTime,provisionAgent} from '../phone.mjs';
const addr='0x'+'1'.repeat(40);
function wallet(){return {chainId:'43114',address:addr,network:'Avalanche C-Chain',fetchedAt:new Date().toISOString(),assets:[{address:'native',symbol:'AVAX',units:'1',rawBalance:'1000000000000000000',usdValue:10},{address:addr,symbol:'AVAX',units:'1',rawBalance:'1000000',usdValue:null}],reserve:{symbol:'AVAX',units:'1',rawBalance:'1000000000000000000',decimals:18},assessment:{status:'attention',gap:'1',target:'2'},indexerStatus:'ok',warnings:[],tokensTruncated:false};}
const config={elevenKey:'fixture'};
function liveState(){return {snapshot:wallet(),settings:{address:addr,chainId:'43114',target:'2',monitor:true,goal:'rent',dueDate:'2099-01-01'},error:null,incident:{id:'reserve-1',status:'open'}};}
function readyPhone(){const p=createPhoneState();p.settings={...p.settings,toNumber:'+12025550123',agentId:'agent_fixture',phoneNumberId:'phone_fixture',enabled:true,consent:true,quietStart:0,quietEnd:0};return p;}
test('.env roundtrip retains unrelated config and never writes provider keys into local state',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'guardian-test-'));try{const path=join(dir,'.env');const c={ubotToken:'fake.token',elevenKey:'fixture',avalancheKey:'fixture',tokenomistKey:'fixture',ubotTemplate:'{"prompt":"{{prompt}}"}',mode:'ubot'};await saveProviderEnv(path,c);const env=await loadEnv(path);assert.equal(env.UBOT_TOKEN,c.ubotToken);assert.equal(Buffer.from(env.UBOT_TEMPLATE_BASE64,'base64').toString(),c.ubotTemplate);await saveProviderEnv(path,{...c,elevenKey:''});assert.equal((await loadEnv(path)).ELEVENLABS_API_KEY,'');await assert.rejects(saveProviderEnv(path,{...c,ubotToken:"x\ny"}));const store=localStore(dir);await Promise.all([store.save({n:1}),store.save({n:2})]);assert.equal((await store.load()).n,2);assert.equal(await store.secret(),await store.secret());assert.ok(!(await readFile(join(dir,'state.json'),'utf8')).includes('fixture'));}finally{assert.ok(resolve(dir).startsWith(resolve(tmpdir())+sep+'guardian-test-'));await rm(dir,{recursive:true,force:true});}
});
test('Tokenomist authenticates, caches by key, maps chain+contract instead of spoofed symbol',async()=>{
 clearTokenCache();let requests=0;const f=async(url,o)=>{requests++;assert.ok(o.headers['x-api-key']);return {ok:true,json:async()=>({status:true,data:[{id:'avalanche-2',symbol:'AVAX',name:'Avalanche'}],metadata:{}})};};
 await tokenCatalog('a',f);await tokenCatalog('a',f);await tokenCatalog('b',f);assert.equal(requests,2);const m=mappedAssets(wallet());assert.equal(m[0].tokenId,'avalanche-2');assert.equal(m[1].tokenId,null);assert.equal(mappedAssets({...wallet(),chainId:'43113'})[0].tokenId,null);
});
test('Tokenomist v5 cliff and emission remain separate, with precision and partial coverage',async()=>{
 clearTokenCache();const date=new Date(Date.now()+86400000).toISOString();const f=async url=>({ok:true,json:async()=>({status:true,metadata:{totalPages:1},data:url.includes('token/list')?[{id:'avalanche-2',symbol:'AVAX'}]:url.includes('unlock/events')?[{unlockDate:date,cliffUnlocks:{cliffAmount:100,allocationBreakdown:[{unlockPrecision:'month',allocationName:'Team'}]}}]:[{startDate:date,unlockAmount:150}]})});
 const r=await readSupply(wallet(),'fixture',{horizonDays:30},{},f);assert.equal(r.events[0].amount,100);assert.equal(r.events[0].precision,'month');assert.equal(r.emissions[0].amount,150);assert.equal(r.emissions[0].includesCliff,true);assert.equal(r.status,'partial');assert.equal(r.coverage[1].status,'unmapped');
 const fuji=await readSupply({...wallet(),chainId:'43113'},'fixture',{}, {},()=>{throw new Error('must not fetch');});assert.equal(fuji.status,'not-applicable');
 assert.equal(normalizeUnlock({unlockDate:'bad',cliffUnlocks:{}},{id:'x'}),null);
});
test('Tokenomist permission failure is unavailable, never a zero-risk conclusion',async()=>{
 clearTokenCache();const result=await readSupply(wallet(),'fixture',{}, {},async url=>url.includes('token/list')?{ok:true,json:async()=>({status:true,data:[{id:'avalanche-2'}]})}:{ok:false,status:403});assert.equal(result.status,'unavailable');assert.ok(result.warnings.some(w=>w.includes('403')));
});
test('personalized risk relates events to due date and limits concentration to priced coverage',()=>{
 const live=liveState();live.supply={status:'partial',fetchedAt:new Date().toISOString(),warnings:[],events:[{id:'e',symbol:'AVAX',date:new Date(Date.now()+86400000).toISOString(),precision:'month'}]};const r=personalizedRisk(live);assert.equal(r.eventsBeforeGoal,1);assert.equal(r.concentration.complete,false);assert.equal(r.reasons.some(r=>r.type==='concentration'),false);live.error='offline';assert.equal(personalizedRisk(live).status,'unavailable');
});
test('phone validation, quiet hours and opt-in guard outbound requests',()=>{
 assert.throws(()=>validatePhone({toNumber:'0951234567'},createPhoneState().settings));assert.throws(()=>validatePhone({enabled:true},createPhoneState().settings));assert.throws(()=>validatePhone({publicUrl:'http://localhost'},createPhoneState().settings));const p=readyPhone(),l=liveState();p.settings.enabled=false;assert.match(callBlock(p,l,config),/ยังไม่ได้เปิด/);assert.equal(callBlock(p,l,config,true),null);assert.equal(quietTime({quietStart:22,quietEnd:8},Date.parse('2026-10-15T17:00:00Z')),true);assert.equal(quietTime({quietStart:22,quietEnd:8},Date.parse('2026-10-15T08:00:00Z')),false);
});
test('phone intent is persisted before network; uncertain response cannot retry the incident after restart',async()=>{
 const p=readyPhone(),l=liveState();let saved,submit=0;
 const f=async(url)=>{if(url.includes('/phone-numbers'))return {ok:true,json:async()=>({phone_numbers:[{phone_number_id:'phone_fixture',provider:'twilio'}]})};if(url.endsWith('/agents?page_size=100'))return {ok:true,json:async()=>({agents:[{agent_id:'agent_fixture'}]})};submit++;assert.equal(saved.calls[0].status,'submitting');throw new Error('connection lost');};
 const persist=async()=>{saved=JSON.parse(JSON.stringify(p));};const c=await placeCall(p,l,config,persist,false,f);assert.equal(c.status,'unknown');assert.match(callBlock(saved,l,config),/ไปแล้ว/);assert.equal(submit,1);
});
test('phone successful submission is not represented as answered; daily cap still applies to manual calls',async()=>{
 const p=readyPhone(),l=liveState();const f=async url=>({ok:true,json:async()=>url.includes('/phone-numbers')?{phone_numbers:[{phone_number_id:'phone_fixture',provider:'twilio'}]}:url.includes('/agents?')?{agents:[{agent_id:'agent_fixture'}]}:{success:true,conversation_id:'conv_fixture'}});const c=await placeCall(p,l,config,async()=>{},true,f);assert.equal(c.status,'submitted');p.settings.maxCallsPerDay=1;assert.match(callBlock(p,l,config,true),/สูงสุด/);
});
test('phone callbacks require secret plus unexpired session bound to the same wallet settings',()=>{
 const p=readyPhone(),l=liveState();p.sessions.test={expiresAt:Date.now()+60000,settings:JSON.stringify(l.settings)};const h={'x-guardian-secret':'secret','x-guardian-session':'test'};assert.equal(authenticatePhone(h,'secret',p,l),true);assert.equal(authenticatePhone({...h,'x-guardian-secret':'秘密'},'secret',p,l),false);l.settings.address='another';assert.equal(authenticatePhone(h,'secret',p,l),false);
});
test('provisioning does not overwrite an existing unrelated agent',async()=>{const p=readyPhone();await assert.rejects(provisionAgent(p,config,'secret',async()=>{},()=>{throw new Error('must not fetch');}),/ป้องกัน/);});
