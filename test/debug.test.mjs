import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {createDebug,debugEvent} from '../debug.mjs';
import {runAgent,createAgentState} from '../agent.mjs';
import {createApplication} from '../application.mjs';
import {ubot,defaultTemplate} from '../providers.mjs';

test('trace redacts credentials recursively, in prompt strings and provider errors; bounds payloads',()=>{
 const log=createDebug({ubotToken:'private-credential',elevenKey:'eleven-secret'});
 log.add('test','private-credential',{Authorization:'Bearer other-token',tokenId:'avalanche-2',nested:{'x-api-key':'unknown'},prompt:'private-credential eleven-secret Bearer foreign-token api_key="another-secret"',long:'x'.repeat(50000)});
 const output=JSON.stringify(log.finish('complete'));
 for(const secret of ['private-credential','eleven-secret','other-token','foreign-token','another-secret','unknown'])assert.ok(!output.includes(secret));
 assert.ok(output.includes('avalanche-2'));assert.ok(log.events[0].truncated);
 for(let i=0;i<200;i++)log.add('test','large',{text:'y'.repeat(30000)});
 assert.ok(JSON.stringify(log.finish('complete')).length<700000);assert.ok(log.finish('complete').limited);
});

test('parallel requests keep independent traces and disabled logging has no output',async()=>{
 const a=createDebug(),b=createDebug();
 await Promise.all([a.run(async()=>{await new Promise(r=>setTimeout(r,10));debugEvent('test','request A');}),b.run(async()=>{debugEvent('test','request B');})]);
 debugEvent('test','outside request');
 assert.deepEqual(a.events.map(e=>e.label),['request A']);assert.deepEqual(b.events.map(e=>e.label),['request B']);
});

test('agent trace records invalid JSON retry, parsed plan, tool args, failure evidence and final response',async()=>{
 const log=createDebug();let calls=0;
 const result=await log.run(()=>runAgent({message:'research',config:{},agent:createAgentState(),context:{dataMode:'live'},tools:{search_tokens:()=>{throw new Error('Provider 403');}},call:async(_config,prompt)=>{
  calls++;if(calls===1)return 'invalid JSON';if(calls===2)return '{"type":"tool","tool":"search_tokens","args":{"query":"AVAX"}}';
  assert.match(prompt,/Provider 403/);return '{"type":"answer","text":"No coverage"}';
 }}));
 assert.equal(result.text,'No coverage');
 const types=log.events.map(e=>e.type);
 for(const type of ['model.start','model.result','agent.validation','agent.decision','tool.start','tool.error','agent.answer'])assert.ok(types.includes(type));
 assert.ok(types.indexOf('tool.error')<types.lastIndexOf('model.start'));
 assert.equal(log.events.find(e=>e.type==='tool.start').data.input.query,'AVAX');
 assert.ok(log.events.every((e,i)=>e.seq===i+1&&e.elapsedMs>=0));
});

test('U-bot transport records actual expanded template and raw response without bearer',async t=>{
 const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;});
 globalThis.fetch=async(_url,options)=>{assert.equal(options.headers.Authorization,'Bearer secret-token');return new Response('{"type":"answer","text":"done"}',{headers:{'content-type':'text/plain'}});};
 const log=createDebug({ubotToken:'secret-token'});
 await log.run(()=>ubot({ubotToken:'secret-token',ubotTemplate:defaultTemplate},'question'));
 const start=log.events.find(e=>e.type==='provider.start');
 assert.equal(start.data.input.payload.mode,'professional');assert.match(start.data.input.payload.userText,/question/);
 assert.ok(!start.data.input.payload.userText.includes('{{prompt}}'));
 assert.equal(log.events.find(e=>e.type==='provider.result').data.result.status,200);
 assert.ok(!JSON.stringify(log.events).includes('secret-token'));
});

async function request(app,path,body,debug=false){
 const req=Readable.from([Buffer.from(JSON.stringify(body))]);Object.assign(req,{method:'POST',url:path,headers:{host:'test.local',origin:'https://test.local','content-type':'application/json','x-guardian-client':'local-poc',...(debug?{'x-guardian-debug':'1'}:{})}});
 let status,data;await app.handler(req,{setHeader(){},writeHead(code){status=code;},end(bytes){data=JSON.parse(bytes);}});return {status,data};
}
test('debug is opt-in, returns error traces, and never enters persisted session state',async()=>{
 let saved;const store={load:async()=>saved,save:async value=>{saved=structuredClone(value);},secret:async()=>'private-phone-secret'};
 const app=await createApplication({cloud:true,host:'test.local',env:{},store});
 const plain=await request(app,'/api/agent/chat',{message:'health'});assert.equal(plain.data.debug,undefined);
 const traced=await request(app,'/api/agent/chat',{message:'health'},true);assert.equal(traced.data.debug.status,'complete');
 assert.ok(traced.data.debug.events.some(e=>e.type==='tool.result'));
 assert.equal(traced.data.debug.events.at(-1).type,'request.complete');
 assert.ok(!JSON.stringify(saved).includes('request.start'));assert.ok(!JSON.stringify(saved).includes('debug'));
 const failed=await request(app,'/api/agent/chat',{message:''},true);assert.equal(failed.status,400);assert.equal(failed.data.debug.status,'error');assert.equal(failed.data.debug.events.at(-1).type,'request.error');
 const next=await request(app,'/api/agent/brief',{},true);assert.notEqual(next.data.debug.id,traced.data.debug.id);assert.ok(next.data.debug.events.some(e=>e.label==='Local briefing (no U-bot call)'));
});

test('voice debug returns audio envelope and provider metadata; regular speech stays binary',async t=>{
 const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;});
 globalThis.fetch=async()=>new Response(Buffer.from('audio fixture'),{headers:{'content-type':'audio/mpeg'}});
 const store={load:async()=>null,save:async()=>{},secret:async()=>'secret'};
 const app=await createApplication({cloud:true,host:'test.local',env:{ELEVENLABS_API_KEY:'eleven-secret',ELEVENLABS_VOICE_ID:'voice-fixture'},store});
 const r=await request(app,'/api/speech',{text:'hello'},true);
 assert.equal(Buffer.from(r.data.audio,'base64').toString(),'audio fixture');
 assert.ok(r.data.debug.events.some(e=>e.label==='Speech generated'));
 assert.ok(!JSON.stringify(r.data.debug).includes('eleven-secret'));
 assert.ok(!JSON.stringify(r.data.debug).includes(Buffer.from('audio fixture').toString('base64')));
 const req=Readable.from([Buffer.from(JSON.stringify({text:'hello'}))]);Object.assign(req,{method:'POST',url:'/api/speech',headers:{host:'test.local','content-type':'application/json','x-guardian-client':'local-poc'}});
 let binary;await app.handler(req,{setHeader(){},writeHead(){},end(body){binary=body;}});
 assert.ok(Buffer.isBuffer(binary));assert.equal(binary.toString(),'audio fixture');
});
