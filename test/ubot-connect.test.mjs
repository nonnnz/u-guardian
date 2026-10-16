import test from 'node:test';
import assert from 'node:assert/strict';
import {ubot,verifyUbotConnection} from '../providers.mjs';

const existing=()=>({mode:'demo',ubotStatus:'untested',elevenKey:'preserved'});
test('Connect verifies a real provider response before enabling the shared account',async()=>{
 const config=existing();let prompt;
 const result=await verifyUbotConnection(config,{},async(_config,text)=>{prompt=text;assert.equal(config.mode,'demo');return 'Connected';});
 assert.match(prompt,/Connected/);
 assert.equal(result.config.mode,'ubot');assert.equal(result.config.ubotStatus,'verified');
 assert.equal(result.config.elevenKey,'preserved');assert.equal(config.mode,'demo');
});
test('Failed authentication leaves the visitor disconnected',async()=>{
 const config=existing(),before=structuredClone(config);
 await assert.rejects(verifyUbotConnection(config,{},async()=>{throw new Error('Authentication failed');}),/Authentication failed/);
 assert.deepEqual(config,before);
});
test('Connect rejects all browser credentials before network access',async()=>{
 let calls=0;const call=async()=>{calls++;return 'unexpected';};
 for(const input of [{ubotToken:'Bearer token'},{ubotTemplate:'{}'},{elevenKey:'overwrite'},[]])
  await assert.rejects(verifyUbotConnection(existing(),input,call),/credentials/);
 assert.equal(calls,0);
});
test('Server login and chat use only server credentials; expired access token is retried',async t=>{
 const previous=Object.fromEntries(['UBOT_SUPABASE_ANON_KEY','UBOT_EMAIL','UBOT_PASSWORD'].map(k=>[k,process.env[k]]));
 const original=globalThis.fetch;
 t.after(()=>{globalThis.fetch=original;for(const [key,value] of Object.entries(previous))if(value===undefined)delete process.env[key];else process.env[key]=value;});
 Object.assign(process.env,{UBOT_SUPABASE_ANON_KEY:'anon-fixture',UBOT_EMAIL:'demo@example.com',UBOT_PASSWORD:'password-fixture'});
 let logins=0,chats=0;
 globalThis.fetch=async(url,options)=>{
  if(url.includes('/auth/v1/token')){assert.equal(JSON.parse(options.body).password,'password-fixture');return Response.json({access_token:`access-${++logins}`,refresh_token:'never-store'});}
  assert.equal(url,'https://u.bot/api/chat');chats++;
  assert.equal(options.headers.Authorization,`Bearer access-${logins}`);
  const body=JSON.parse(options.body);assert.equal(body.mode,'professional');assert.equal(body.userText,'hello');
  return chats===1?new Response('',{status:401}):new Response('real answer',{headers:{'Content-Type':'text/plain'}});
 };
 assert.equal(await ubot({},'hello'), 'real answer');assert.equal(logins,2);assert.equal(chats,2);
});
