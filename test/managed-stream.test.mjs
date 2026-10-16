import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {cloudConfig} from '../cloud-config.mjs';
import {createApplication} from '../application.mjs';

function memoryStore(){let value=null;return {load:async()=>value,save:async next=>{value=structuredClone(next);},secret:async()=> 'fixture-session-secret'};}
async function call(app,path,body,stream=false){
 const req=Readable.from(body===undefined?[]:[Buffer.from(JSON.stringify(body))]);
 req.method=body===undefined?'GET':'POST';req.url=path;req.headers={host:'guardian.vercel.app','content-type':'application/json','x-guardian-language':'en','x-guardian-client':'local-poc',...(stream?{'x-guardian-stream':'1'}:{})};
 let status=200,contentType='',output='';
 await app.handler(req,{destroyed:false,setHeader(){},writeHead(code,headers){status=code;contentType=headers?.['Content-Type']||'';},flushHeaders(){},write(chunk){output+=chunk;},end(chunk){output+=chunk||'';}});
 return {status,contentType,output};
}

test('operator credentials are shared per request without entering or storing visitor keys',async()=>{
 const env={GUARDIAN_USE_SERVER_KEYS:'1',ELEVENLABS_API_KEY:'fixture-voice-key',AVALANCHE_DATA_API_KEY:'fixture-chain-key',TOKENOMIST_API_KEY:'fixture-supply-key',ELEVENLABS_VOICE_ID:'fixture-voice-id'};
 for(const stored of [{},{ubotToken:'visitor-attempt',mode:'demo',ubotStatus:'untested'}]){
  const resolved=cloudConfig(env,stored);
  assert.equal(resolved.managed,true);assert.equal(resolved.config.ubotToken,undefined);assert.equal(resolved.config.mode,stored.mode);assert.deepEqual(resolved.persist(resolved.config),{mode:stored.mode,ubotStatus:stored.ubotStatus});
  const app=await createApplication({cloud:true,host:'guardian.vercel.app',env:{},managedProviders:true,store:memoryStore(),config:resolved.config});
  const state=JSON.parse((await call(app,'/api/state')).output);
  assert.equal(state.integration.managedProviders,true);assert.equal(state.integration.ubotConfigured,false);assert.equal(state.integration.elevenConfigured,true);assert.equal(state.integration.avalancheConfigured,true);assert.equal(state.integration.tokenomistConfigured,true);
  assert.ok(!JSON.stringify(state).includes('visitor-attempt'));
  const blocked=await call(app,'/api/integrations',{ubotToken:'visitor-attempt'});assert.equal(blocked.status,403,blocked.output);
 }
 assert.equal(cloudConfig({...env,UBOT_TOKEN:'fixture-rotated'},{}).config.ubotToken,undefined);
 assert.equal(cloudConfig({},{}).managed,false);
});

test('stream announces actual tool work and returns final answer as one result',async()=>{
 const app=await createApplication({cloud:true,host:'guardian.vercel.app',env:{},store:memoryStore()});
 const r=await call(app,'/api/agent/chat',{message:'Check my wallet health.'},true);
 assert.match(r.contentType,/application\/x-ndjson/);
 const events=r.output.trim().split('\n').map(JSON.parse);
 const phases=events.filter(e=>e.type==='phase').map(e=>e.phase);
 assert.equal(phases[0],'thinking');assert.ok(phases.includes('search'),JSON.stringify(events));assert.ok(phases.includes('answer'),JSON.stringify(events));
 assert.equal(events.at(-1).type,'result');assert.equal(events.at(-1).status,200);
 assert.ok(events.at(-1).data.text);assert.ok(events.at(-1).data.evidence.length>0);
 assert.equal(events.filter(e=>e.type==='result').length,1);
 assert.ok(events.slice(0,-1).every(e=>e.type==='phase'&&!('args' in e)&&!('result' in e)));
});
