import {elevenApi} from './phone.mjs';

export async function connectTwilio(env,fetcher=fetch){
 const sid=env.TWILIO_ACCOUNT_SID,token=env.TWILIO_AUTH_TOKEN,number=env.TWILIO_FROM_NUMBER;
 if(!/^AC[0-9a-f]{32}$/i.test(sid||'')||!token||!/^\+[1-9]\d{7,14}$/.test(number||''))throw new Error('ตั้ง TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN และ TWILIO_FROM_NUMBER ใน .env ก่อน');
 if(!env.ELEVENLABS_API_KEY)throw new Error('ตั้ง ELEVENLABS_API_KEY ใน .env ก่อน');
 const root=`https://api.twilio.com/2010-04-01/Accounts/${sid}`;
 async function twilio(path){
  let r;try{r=await fetcher(root+path,{headers:{Authorization:'Basic '+Buffer.from(sid+':'+token).toString('base64')},redirect:'error',signal:AbortSignal.timeout(20000)});}catch{throw new Error('ติดต่อ Twilio ไม่สำเร็จ ลองตรวจเครือข่าย');}
  if(!r.ok)throw new Error(`Twilio HTTP ${r.status} · ตรวจ Account SID และ Auth Token ใน .env`);
  return r.json();
 }
 const account=await twilio('.json');
 if(account.status!=='active')throw new Error('บัญชี Twilio ยังไม่ active');
 const owned=await twilio('/IncomingPhoneNumbers.json?PhoneNumber='+encodeURIComponent(number)+'&PageSize=100');
 const caller=owned.incoming_phone_numbers?.find(n=>n.phone_number===number);
 if(!caller)throw new Error('ไม่พบ TWILIO_FROM_NUMBER ใน Active numbers ของบัญชีนี้ เบอร์จาก Try out Voice อาจเป็นเบอร์ trial แยกต่างหาก ตรวจเบอร์ Voice ที่ซื้อและ credentials ให้ตรงบัญชีก่อนรันใหม่ (ยังไม่มีการโทร)');
 if(!caller.capabilities?.voice)throw new Error('เบอร์ Twilio นี้ไม่รองรับ Voice');
 // Reuse an existing import. Never replace another number or rotate its credentials implicitly.
 const result=await elevenApi(env.ELEVENLABS_API_KEY,'/v2/phone-numbers?page_size=100',undefined,fetcher);
 const existing=result.phone_numbers?.find(n=>n.provider==='twilio'&&n.phone_number===number);
 if(!existing&&result.has_more)throw new Error('รายการ ElevenLabs มีหลายหน้า กรุณานำเข้า/เลือกเบอร์ผ่าน ElevenLabs และหน้า Phone alerts เพื่อป้องกันนำเข้าซ้ำ');
 const imported=existing||await elevenApi(env.ELEVENLABS_API_KEY,'/phone-numbers',{phone_number:number,label:'U-Guardian outbound',provider:'twilio',sid,token,enable_sms:false,supports_inbound:false,supports_outbound:true},fetcher);
 if(!imported.phone_number_id)throw new Error('ElevenLabs ไม่คืน phone number ID ตรวจหน้า Phone Numbers ก่อนลองใหม่');
 return {phoneNumberId:imported.phone_number_id,provider:'twilio',accountType:account.type,reused:!!existing};
}
