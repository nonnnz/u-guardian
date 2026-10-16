import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {translate, messages} from '../public/messages.js';
import {withLanguage,language,t} from '../locale.mjs';
import {planningPrompt,answerPrompt} from '../agent-prompts.mjs';
import {createGuardian} from '../guardian-service.mjs';
import {createState} from '../domain.mjs';
import {createLiveState} from '../live-wallet.mjs';
import {createApplication} from '../application.mjs';
import {unsupportedWatchReason,validateWatchIntent,runAgent,createAgentState} from '../agent.mjs';
import {transcribe,speech} from '../providers.mjs';

const guardian=()=>{const demo=createState();return {demo,g:createGuardian({config:{mode:'demo'},live:createLiveState(),getDemo:()=>demo,getMode:()=> 'demo',refresh:async()=>{},persist:async()=>{},cloud:true})};};
const noThai=text=>assert.doesNotMatch(text,/[\u0e00-\u0e7f]/);

test('English catalog covers authored copy and interpolation never alters user values',()=>{
 for(const [source,value]of Object.entries(messages)){assert.ok(value);noThai(value);assert.deepEqual(source.match(/\{\d+\}/g),value.match(/\{\d+\}/g));}
 assert.equal(translate('ตั้งค่า'),'Settings');assert.equal(translate('ตั้งค่า','th'),'ตั้งค่า');
 assert.equal(translate('ถึงวันทบทวน: {0}','en',['เป้าหมายของฉัน']), 'Review due: เป้าหมายของฉัน');
 assert.equal(translate('user-supplied text','en'),'user-supplied text');
});

test('request language is isolated across overlapping asynchronous operations',async()=>{
 const results=await Promise.all(['en','th'].map(lang=>withLanguage(lang,async()=>{await new Promise(r=>setTimeout(r,lang==='en'?10:1));return [language(),t('ตั้งค่า')];})));
 assert.deepEqual(results,[['en','Settings'],['th','ตั้งค่า']]);assert.equal(language(),'th');
});

test('planner and explainer use selected language independently of history',()=>{
 for(const lang of ['en','th']){
  const data={message:'Check my wallet',context:{language:lang},history:[{role:'assistant',text:'ข้อความเดิม'}],evidence:[],stepsLeft:5};
  const name=lang==='en'?'English':'Thai';assert.ok(planningPrompt(data).includes(`brief ${name} reply`));assert.ok(answerPrompt(data).includes(`concise ${name} text`));
 }
});

test('English demo supports briefing, health, changes and confirmed wallet watch',async()=>withLanguage('en',async()=>{
 const {g,demo}=guardian();let r=await g.brief();noThai(r.text);await g.acknowledge();
 r=await g.message('Check my wallet health.');assert.equal(r.evidence[0].tool,'assess_wallet');noThai(JSON.stringify(r));
 r=await g.message('Watch for quantity changes across my wallet.');assert.equal(r.proposals.length,1);assert.equal(g.agent.rules.length,0);noThai(r.text);
 await g.confirm(r.proposals[0].id);demo.assets.find(a=>a.symbol==='USDC').units-=25;
 r=await g.message('What changed since my last briefing?');assert.equal(r.evidence[0].tool,'investigate_changes');assert.equal(r.evidence[0].result.changes[0].delta,'-25');noThai(r.text);
 assert.equal(g.summary().notifications.length,1);noThai(g.summary().monitoring);
 const advice=await g.message('What should I buy for long-term savings?');assert.equal(advice.evidence.length,0);assert.match(advice.text,/How long/);
}));

test('English unsupported conditions and negated watch requests cannot create a replacement draft',async()=>withLanguage('en',async()=>{
 for(const message of ['Alert me when AVAX drops 10%','Watch my portfolio value','Notify me when my balance is below five','Text me when my wallet changes','Notify me while the app is closed']){
  assert.ok(unsupportedWatchReason(message));const {g}=guardian();const r=await g.message(message);assert.equal(r.proposals.length,0);noThai(r.text);
 }
 for(const message of ["Do not notify me when my wallet changes","Don't track my wallet",'Watch only AVAX in my wallet'])assert.throws(()=>validateWatchIntent({kind:'wallet_change',label:'Wallet quantities'},message));
}));

test('English agent passes locale into both phases and appends English confirmation',async()=>withLanguage('en',async()=>{
 let calls=0;const r=await runAgent({message:'Watch for changes across my wallet',config:{},agent:createAgentState(),context:{dataMode:'demo'},tools:{propose_watch:()=>({id:'draft',status:'draft'})},call:async(_c,p)=>{
  calls++;assert.match(p,/English/);return p.includes('PLANNER')?JSON.stringify({type:'tool',tool:'propose_watch',args:{kind:'wallet_change',label:'Wallet quantities'},finishAfterTool:true}):'Your draft is ready.';
 }});assert.equal(calls,2);noThai(r.text);assert.match(r.text,/Confirm watch/);
}));

test('HTTP defaults to English, honors Thai and serves the shared catalog',async()=>{
 const app=await createApplication({port:4190,env:{},store:{load:async()=>null,save:async()=>{},secret:async()=>'fixture'}});
 const request=async(path,lang,body)=>{
  const req=Readable.from(body===undefined?[]:[Buffer.from(JSON.stringify(body))]);req.url=path;req.method=body===undefined?'GET':'POST';req.headers={host:'127.0.0.1:4190','x-guardian-client':'local-poc','content-type':'application/json',...(lang?{'x-guardian-language':lang}:{})};
  let status,result;await app.handler(req,{setHeader(){},writeHead(code){status=code;},end(data){result=String(data);}});return {status,result};
 };
 const en=await request('/api/agent/chat',undefined,{message:'Check my wallet health'});assert.equal(en.status,200);noThai(JSON.parse(en.result).text);
 const th=await request('/api/agent/chat','th',{message:'ช่วยตรวจสุขภาพกระเป๋า'});assert.match(JSON.parse(th.result).text,/[\u0e00-\u0e7f]/);
 const invalid=await request('/api/agent/chat','en',{message:''});assert.equal(invalid.status,400);noThai(JSON.parse(invalid.result).error);
 assert.equal((await request('/messages.js')).status,200);
});

test('voice adapter sends English/Thai STT hints and preserves TTS text',async()=>{
 const original=globalThis.fetch,seen=[];
 try{
  globalThis.fetch=async(url,options)=>{seen.push({url,body:options.body});return url.includes('speech-to-text')?Response.json({text:'Check my wallet'}):new Response(new Uint8Array([1,2,3]));};
  const config={elevenKey:'fixture',voiceId:'voice',sttModel:'scribe_v2',ttsModel:'eleven_v3'};
  for(const lang of ['en','th'])await withLanguage(lang,()=>transcribe(config,new Uint8Array([1]),'audio/webm'));
  assert.equal(seen[0].body.get('language_code'),'eng');assert.equal(seen[1].body.get('language_code'),'tha');
  await withLanguage('en',()=>speech(config,'AVAX represents 57% of priced holdings.'));
  assert.equal(JSON.parse(seen[2].body).text,'AVAX represents 57% of priced holdings.');
  assert.equal(JSON.parse(seen[2].body).language_code,'en');
  await withLanguage('th',()=>speech(config,'สวัสดีค่ะ พร้อมช่วยคุณแล้ว'));
  assert.equal(JSON.parse(seen[3].body).language_code,'th');
 }finally{globalThis.fetch=original;}
});

test('stored system notifications follow the selected language without rewriting user labels',async()=>{
 const {g}=guardian();g.agent.notifications.push({scope:'demo',id:'fixture',text:'ถึงวันทบทวน: My plan',messageKey:'ถึงวันทบทวน: {0}',messageValues:['My plan']});
 assert.equal(withLanguage('en',()=>g.summary().notifications[0].text),'Review due: My plan');
 assert.equal(withLanguage('th',()=>g.summary().notifications[0].text),'ถึงวันทบทวน: My plan');
 assert.equal(g.agent.notifications[0].text,'ถึงวันทบทวน: My plan');
});
