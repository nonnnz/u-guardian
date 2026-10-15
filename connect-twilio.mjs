import {loadEnv} from './storage.mjs';
import {connectTwilio} from './twilio.mjs';

// Imports a caller number only. It never initiates a phone call or enables automatic calls.
try{
 const env={...await loadEnv(new URL('./.env',import.meta.url)),...process.env};
 const connected=await connectTwilio(env);
 const base=`http://127.0.0.1:${Number(env.PORT||4173)}`;
 const r=await fetch(base+'/api/phone/settings',{method:'POST',headers:{'Content-Type':'application/json','X-Guardian-Client':'local-poc'},body:JSON.stringify({phoneNumberId:connected.phoneNumberId,provider:'twilio'}),signal:AbortSignal.timeout(10000)});
 if(!r.ok)throw new Error('นำเข้าเบอร์แล้ว แต่บันทึก local settings ไม่สำเร็จ เปิด Phone alerts → โหลดเบอร์ แล้วเลือกเบอร์ Twilio');
 console.log(`เชื่อม Twilio → ElevenLabs → U-Guardian แล้ว (${connected.accountType}) · ยังไม่มีการโทร`);
 if(connected.accountType==='Trial')console.log('บัญชี Trial: รุ่นปัจจุบันบล็อก Media Streams ที่ ElevenLabs ใช้ ตรวจสิทธิ์บัญชีและเอกสาร PHONE-SETUP.md ก่อนทดสอบ');
}catch(e){console.error(e instanceof TypeError?'เชื่อมต่อไม่สำเร็จ ตรวจว่า U-Guardian server เปิดอยู่ แล้วโหลดเบอร์ใน Phone alerts':e.message);process.exitCode=1;}
