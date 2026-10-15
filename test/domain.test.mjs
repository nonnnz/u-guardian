import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, assessment, triggerIncident, simulate, prepare, confirm, updateProfile } from '../domain.mjs';
import { parseReply } from '../providers.mjs';

test('reserve incident → simulation → draft → confirmed, without changing portfolio total',()=>{
  const s=createState(); assert.equal(assessment(s).gap,0);
  assert.equal(triggerIncident(s).shouldCall,true); assert.equal(s.reserve,320); assert.equal(assessment(s).gap,180);
  assert.equal(simulate(s,180).after,500); assert.equal(s.reserve,320);
  const d=prepare(s,180);confirm(s,d.id);
  assert.equal(s.reserve,500);assert.equal(s.reserve+s.available,1500);assert.equal(s.incident.status,'resolved');
  assert.throws(()=>confirm(s,d.id),/ยืนยันแล้ว/);
});
test('repeated detection does not move money or call again',()=>{const s=createState();triggerIncident(s);const before=s.reserve;assert.deepEqual(triggerIncident(s),{repeated:true,shouldCall:false});assert.equal(s.reserve,before);});
test('call preference is honored',()=>{const s=createState();s.profile.callEnabled=false;assert.equal(triggerIncident(s).shouldCall,false);});
test('invalid amounts and targets do not mutate balances',()=>{const s=createState();for(const n of [0,-10,NaN,Infinity,100000,.001]) assert.throws(()=>prepare(s,n));assert.equal(s.reserve,620);assert.throws(()=>updateProfile(s,{target:0,due:'bad'}));});
test('profile change invalidates a draft and resolves recovered goal',()=>{const s=createState();triggerIncident(s);const d=prepare(s,180);updateProfile(s,{target:300,goal:'changed',due:'2026-10-22'});assert.equal(s.incident.status,'resolved');assert.throws(()=>confirm(s,d.id));});
test('expired draft cannot execute',()=>{const s=createState();const d=prepare(s,20);d.expiresAt=0;assert.throws(()=>confirm(s,d.id),/หมดอายุ/);assert.equal(s.reserve,620);});
test('provider parser handles JSON, SSE and AI SDK delta streams',()=>{
 assert.equal(parseReply('{"choices":[{"message":{"content":"hello"}}]}','application/json'),'hello');
 assert.equal(parseReply('data: {"choices":[{"delta":{"content":"hel"}}]}\n\ndata: {"choices":[{"delta":{"content":"lo"}}]}\n\ndata: [DONE]','text/event-stream'),'hello');
 assert.equal(parseReply('data: {"type":"text-delta","delta":"hello"}\n\n','text/event-stream'),'hello');
 assert.equal(parseReply('0:"hello"\n0:" world"','text/plain'),'hello world');
 assert.equal(parseReply('<html>login</html>','text/html'),'');
});
test('U-bot raw text stream strips status markers and preserves JSON tool plans',()=>{
 assert.equal(parseReply('[STATUS:thinking]สวัสดี[STATUS:responding]ครับ','text/plain; charset=utf-8'),'สวัสดีครับ');
 assert.equal(parseReply('[STATUS:thinking]{"tool":"assess_goal_risk","args":{}}','text/plain'),'{"tool":"assess_goal_risk","args":{}}');
 assert.throws(()=>parseReply('[DEGENERATE]broken','text/plain'),/ผิดรูปแบบ/);
 assert.equal(parseReply('<!doctype html><html>login</html>','text/plain'),'');
});
