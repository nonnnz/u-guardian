import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultTemplate,verifyUbotConnection} from '../providers.mjs';

const existing=()=>({ubotToken:'saved-test-token',ubotTemplate:defaultTemplate,mode:'demo',ubotStatus:'untested',elevenKey:'preserved'});
test('Connect reuses a saved token and enables U-bot only after verification',async()=>{
 const config=existing();let called;
 const result=await verifyUbotConnection(config,{ubotToken:''},async c=>{called=c;assert.equal(config.mode,'demo');return 'connected';});
 assert.equal(called.ubotToken,'saved-test-token');
 assert.equal(result.config.mode,'ubot');assert.equal(result.config.ubotStatus,'verified');
 assert.equal(result.config.elevenKey,'preserved');assert.equal(config.mode,'demo');
});
test('Connect normalizes a supplied Bearer token and preserves unrelated providers',async()=>{
 const result=await verifyUbotConnection(existing(),{ubotToken:'Bearer replacement-test-token'},async c=>{assert.equal(c.ubotToken,'replacement-test-token');return 'connected';});
 assert.equal(result.config.elevenKey,'preserved');
});
test('Failed authentication does not replace the existing credential or agent mode',async()=>{
 const config=existing(),before=structuredClone(config);
 await assert.rejects(verifyUbotConnection(config,{ubotToken:'invalid-test-token'},async()=>{throw new Error('U-bot HTTP 401');}),/401/);
 assert.deepEqual(config,before);
});
test('Connect rejects missing credentials, invalid templates and unrelated fields before network access',async()=>{
 let calls=0;const call=async()=>{calls++;return 'unexpected';};
 await assert.rejects(verifyUbotConnection({...existing(),ubotToken:''},{},call),/ยังไม่มี U-bot token/);
 await assert.rejects(verifyUbotConnection(existing(),{ubotTemplate:'{"broken":"{{prompt}}"'},call),/JSON/);
 await assert.rejects(verifyUbotConnection(existing(),{ubotToken:'bad\nvalue'},call),/token/);
 await assert.rejects(verifyUbotConnection(existing(),{elevenKey:'overwrite'},call),/พารามิเตอร์/);
 assert.equal(calls,0);
});
