import test from 'node:test';
import assert from 'node:assert/strict';
import {connectTwilio} from '../twilio.mjs';

const env={TWILIO_ACCOUNT_SID:'AC'+'1'.repeat(32),TWILIO_AUTH_TOKEN:'fixture-secret',TWILIO_FROM_NUMBER:'+12025550123',ELEVENLABS_API_KEY:'fixture-eleven'};
const ok=value=>({ok:true,json:async()=>value});
function fixture({owned=true,existing=false}={}){
 const requests=[];
 return {requests,fetcher:async(url,options)=>{
  requests.push({url,options});
  if(url.includes('api.twilio.com')){
   assert.equal(options.headers.Authorization,'Basic '+Buffer.from(env.TWILIO_ACCOUNT_SID+':'+env.TWILIO_AUTH_TOKEN).toString('base64'));
   if(url.includes('IncomingPhoneNumbers'))return ok({incoming_phone_numbers:owned?[{phone_number:env.TWILIO_FROM_NUMBER,capabilities:{voice:true}}]:[]});
   return ok({type:'Trial',status:'active'});
  }
  assert.equal(options.headers['xi-api-key'],env.ELEVENLABS_API_KEY);
  if(options.method==='GET')return ok({phone_numbers:existing?[{provider:'twilio',phone_number:env.TWILIO_FROM_NUMBER,phone_number_id:'existing-id'}]:[],has_more:false});
  assert.ok(url.endsWith('/phone-numbers'));
  const body=JSON.parse(options.body);assert.equal(body.enable_sms,false);assert.equal(body.sid,env.TWILIO_ACCOUNT_SID);assert.equal(body.token,env.TWILIO_AUTH_TOKEN);
  return ok({phone_number_id:'new-id'});
 }};
}
test('Twilio setup stops before ElevenLabs when caller is absent',async()=>{
 const f=fixture({owned:false});await assert.rejects(connectTwilio(env,f.fetcher),/Active numbers/);assert.equal(f.requests.length,2);
});
test('Twilio setup imports owned voice number without placing any call',async()=>{
 const f=fixture();const result=await connectTwilio(env,f.fetcher);assert.equal(result.phoneNumberId,'new-id');assert.equal(result.reused,false);assert.equal(f.requests.length,4);assert.ok(f.requests.every(r=>!r.url.includes('/Calls')&&!r.url.includes('outbound-call')));
});
test('Twilio setup reuses existing import without mutating it',async()=>{
 const f=fixture({existing:true});const result=await connectTwilio(env,f.fetcher);assert.equal(result.phoneNumberId,'existing-id');assert.equal(result.reused,true);assert.ok(f.requests.every(r=>r.options.method!=='POST'));
});
