# เปิดการโทรจริงของ U-Guardian

เบอร์ True ของคุณเป็น **เบอร์รับสาย** ได้ตามเดิม Twilio เป็นบริการที่ให้ซอฟต์แวร์โทรผ่านเครือข่ายโทรศัพท์ ส่วน ElevenLabs สร้างเสียงและจัดการบทสนทนา คุณไม่ต้องเปลี่ยนซิมหรือใช้ SIP trunk สำหรับเส้นทาง Twilio นี้

## สิ่งที่เตรียมไว้แล้ว

- สร้าง `U-Guardian · Risk phone assistant` ภาษาไทยในบัญชี ElevenLabs แล้ว
- ใส่เบอร์ปลายทางที่คุณให้ไว้ใน local settings แล้ว ไม่ฝังไว้ในซอร์สโค้ด
- ตั้งค่าการโทรอัตโนมัติเป็น **ปิด** และยังไม่มีการโทรจริง
- เตรียมปุ่มโหลดเบอร์, ตรวจรายการก่อนโทร, ตรวจสถานะสาย, เวลางดโทร และการป้องกันโทรซ้ำ

## 1. เตรียมเบอร์ผู้โทรออก

ตรวจล่าสุด: credentials ที่ให้มาใช้เรียก Twilio API ได้ บัญชีเป็น Trial แต่ API `IncomingPhoneNumbers` และ `OutgoingCallerIds` คืนรายการว่าง จึงยังไม่ได้นำเข้าเบอร์ไป ElevenLabs และยังไม่ได้โทรจริง ข้อมูลนี้ไม่ยืนยันว่าไม่มีเบอร์ทดลองหรือผู้รับที่ยืนยันในหน้า Try out Voice: Trial รุ่นปัจจุบันใช้เบอร์ทดลองที่แยกจากเบอร์ที่ซื้อหลังอัปเกรด เบอร์ใน curl จึงอาจเป็นเบอร์ทดลองดังกล่าว ต้องตรวจหน้าที่แสดงเบอร์เพื่อยืนยัน

1. สมัคร/เปิดบัญชี [Twilio](https://www.twilio.com/) และตั้งค่า Voice ตามหน้า Console
2. จัดหาเบอร์ Twilio ที่รองรับ Voice และการโทรไปประเทศไทย ตรวจสิทธิ์ปลายทางใน Voice Dialing Geographic Permissions
3. Trial รุ่นปัจจุบันบล็อก `<Stream>` และ `<ConversationRelay>` ตามเอกสาร Twilio จึงใช้เส้นทางสนทนา ElevenLabs ผ่าน Media Streams ไม่ได้ในข้อจำกัดนี้ ต้องใช้บัญชีที่เปิดความสามารถดังกล่าวก่อน ส่วนการทดสอบ Twilio template เป็นอีกเส้นทางและไม่ได้ทดสอบ Guardian
4. ตรวจค่าเบอร์และค่าโทรตามบัญชีก่อนซื้อ/อัปเกรด

Account SID, Auth Token และเบอร์ผู้โทรออกเก็บใน `guardian-poc/.env` ด้วยชื่อ `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` แล้ว เมื่อมีเบอร์ Voice ในบัญชี เปิด U-Guardian server แล้วรันจากโฟลเดอร์ `guardian-poc`:

```powershell
npm run phone:connect
```

คำสั่งจะตรวจเบอร์ในบัญชี นำเข้า ElevenLabs (หรือใช้รายการเดิม) และบันทึกเบอร์ที่เลือกใน Guardian โดยไม่โทร ไม่เปิดการโทรอัตโนมัติ และไม่เปลี่ยน SMS routing หากหมุน Auth Token ต้องอัปเดตทั้ง `.env` และ credentials ของเบอร์ที่นำเข้าไว้ใน ElevenLabs

หมายเหตุ: ตัวอย่าง curl ที่ใช้ `voice_speech_recognition` เป็น Twilio template ยังไม่ใช่บทสนทนา Guardian ให้ใช้ปุ่มโทรทดสอบใน Guardian หลังเชื่อมเสร็จ เบอร์ไทยแบบ E.164 ต้องตัด 0 หน้าเบอร์ออกเมื่อเติม +66

เอกสาร: [เริ่ม Twilio Voice](https://www.twilio.com/docs/usage/trials/try-out-voice), [ข้อจำกัด trial](https://www.twilio.com/docs/usage/tutorials/how-to-use-your-free-trial-account), [Voice geographic permissions](https://www.twilio.com/docs/voice/api/dialing-permissions-resources)

ElevenLabs รองรับทั้งเบอร์ที่ซื้อผ่าน Twilio และ Verified Caller ID สำหรับ outbound ตามเอกสาร แต่เส้นทางที่แนะนำสำหรับการโทรกลับเข้ามือถือของคุณคือใช้เบอร์ผู้โทรออกแยกต่างหากตามสิทธิ์บัญชี

## 2. นำเข้าเบอร์ใน ElevenLabs

1. เปิด ElevenLabs → Agents → Phone Numbers → Import Twilio number
2. ใส่ label, เบอร์ Twilio, SID และ token/secret ของ Twilio ตามแบบฟอร์ม ใส่ใน ElevenLabs โดยตรง ไม่ต้องส่งในแชต
3. ตรวจว่าเบอร์มี outbound capability
4. กลับ U-Guardian → **ตั้งค่าการโทรจริง** → **โหลดเบอร์และ Agents จาก ElevenLabs** แล้วเลือกเบอร์นั้น
5. Agent ID ของ Guardian ที่สร้างแล้วจะอยู่ในหน้าเดียวกัน ตรวจเบอร์รับสายและยืนยันการยินยอมรับสาย จากนั้นบันทึก

ดู [คู่มือเชื่อม Twilio อย่างเป็นทางการของ ElevenLabs](https://elevenlabs.io/docs/eleven-agents/phone-numbers/twilio-integration/native-integration/)

## 3. ทดสอบโทรแบบ snapshot

1. ตั้งค่า Live wallet และรีเฟรชให้ได้ snapshot ล่าสุด
2. กด **ทบทวนการโทรทดสอบ** ตรวจเบอร์และบริบท แล้วกด **ยืนยันโทรทดสอบจริง**
3. `submitted` หมายถึง provider รับคำขอ ยังไม่ใช่การยืนยันว่ารับสาย กดตรวจสถานะ และดู conversation ใน ElevenLabs
4. ถ้าเป็น `unknown` อย่าส่งซ้ำทันที ให้ตรวจ log ของ provider ก่อน ระบบบันทึก intent ไว้เพื่อป้องกันสายซ้ำ

แม้ยังไม่มี callback URL Agent ก็อธิบาย snapshot ที่ส่งไปตอนเริ่มสายได้ แต่จะบอกให้กลับมาที่เว็บหากต้องการข้อมูลใหม่หรือ action

## 4. ให้คุยโทรศัพท์แล้วเรียก U-bot/tools ได้

ElevenLabs ต้องเข้าถึง callback จากอินเทอร์เน็ต ในเครื่องนี้ callback แยกที่ **127.0.0.1:4175** และเปิดเฉพาะ `/phone/tool` ที่ตรวจ secret กับ session ของสายนั้น

1. ใช้ HTTPS reverse proxy/tunnel ที่คุณมี ให้ชี้ไป `http://127.0.0.1:4175` เท่านั้น ห้ามชี้ไป dashboard `4173`
2. ใส่ HTTPS origin ที่ได้ เช่น `https://your-callback.example.com` ใน Phone alerts → เชื่อม tools ระหว่างคุยโทรศัพท์ → Public callback origin
3. กด **สร้าง / อัปเดต Guardian agent** ระบบจะสร้าง authenticated webhook tool และผูกเข้ากับ Guardian agent ที่ระบบสร้างไว้ โดยไม่เขียนทับ Agent อื่น
4. เปิด server และ tunnel ค้างไว้ ทดลองโทรแล้วถามเรื่องความเสี่ยงหรือจำลองเติมเงิน ตรวจ tool trace ใน ElevenLabs และข้อเสนอให้ทบทวนในเว็บ
5. หาก tunnel เปลี่ยน URL ให้เปลี่ยน origin และอัปเดต agent อีกครั้ง

การรับคำสั่งเสียงไม่ใช่การอนุมัติธุรกรรม Agent เตรียมข้อเสนอให้ทบทวนได้ แต่การโอน test AVAX ยังต้องเปิดเว็บ ตรวจรายการ และลงนามใน wallet ด้วยตัวเอง

## 5. เปิดติดตามอัตโนมัติ

เปิด Live monitoring และการโทรอัตโนมัติหลังทดสอบสำเร็จ ค่าเริ่มต้น: พัก 60 นาทีระหว่างสาย, สูงสุด 2 ครั้ง/วัน, งดโทร 22:00–08:00 เวลาไทย ระบบโทรเมื่อยอดสำรองต่ำกว่าเกณฑ์ ไม่โทรจาก supply event เพียงอย่างเดียว และไม่ส่งซ้ำใน reserve incident เดิม

นี่เป็นระบบ local: ปิดเครื่อง/server แล้วจะไม่ตรวจยอดหรือโทร ส่วนการตั้งค่าและบันทึกคำขอเดิมยังเก็บไว้หลังรีสตาร์ต
