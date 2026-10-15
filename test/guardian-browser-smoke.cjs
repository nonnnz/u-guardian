const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.BASE_URL||'http://127.0.0.1:4176');await page.getByText('พร้อมช่วยคุณ',{exact:true}).waitFor();
 fs.mkdirSync('.impeccable/review',{recursive:true});await page.screenshot({path:'.impeccable/review/desktop.png',fullPage:true});
 await page.getByRole('button',{name:'เล่าให้ฟังว่ามีอะไรใหม่'}).click();await page.locator('u-guardian .assistant').waitFor();
 await page.getByRole('button',{name:'ฝากติดตาม',exact:true}).click();await page.getByRole('button',{name:'ยืนยันการติดตาม',exact:true}).click();await page.getByRole('button',{name:'บันทึกแล้ว',exact:true}).waitFor();
 await page.getByRole('button',{name:'จำลอง USDC ออก 25 เหรียญ'}).click();await page.getByRole('button',{name:'มีอะไรเปลี่ยนไป',exact:true}).click();await page.locator('u-guardian .assistant').last().getByText('สิ่งที่เปลี่ยนไป',{exact:true}).waitFor();
 const evidence=await page.locator('u-guardian .assistant').last().textContent();assert.match(evidence,/-25/);
 await page.getByRole('button',{name:'กดเพื่อพูด',exact:true}).click();await page.getByRole('alert').filter({hasText:'ตั้งค่า ElevenLabs'}).waitFor();
 await page.setViewportSize({width:390,height:844});await page.reload();await page.getByText('พร้อมช่วยคุณ',{exact:true}).waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:'.impeccable/review/mobile.png',fullPage:true});
 await page.goto((process.env.BASE_URL||'http://127.0.0.1:4176')+'/embed-example.html');await page.getByRole('button',{name:'เรียก Guardian'}).click();await page.getByRole('button',{name:'ตรวจสุขภาพกระเป๋า'}).click();await page.locator('u-guardian .assistant').waitFor();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.getByRole('link',{name:'การเชื่อมต่อ',exact:true}).click();await page.getByRole('link',{name:'กลับไปคุยกับ Guardian'}).waitFor();
 assert.deepEqual(errors,[]);console.log('PASS: brief, watch confirmation, delta evidence, voice setup error, mobile, embedded widget, settings; zero browser errors');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
