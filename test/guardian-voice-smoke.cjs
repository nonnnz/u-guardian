// Browser control-flow test: synthetic microphone stream and mocked voice API.
// Provider TTS/STT is verified separately; no physical microphone is used here.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({headless:true,channel:'msedge'});try{
 const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{navigator.mediaDevices.getUserMedia=async()=>{const context=new AudioContext(),destination=context.createMediaStreamDestination(),oscillator=context.createOscillator();oscillator.connect(destination);oscillator.start();window.testStream=destination.stream;return destination.stream;};});
 await p.route('**/api/state',async r=>{const response=await r.fetch();const data=await response.json();data.integration.elevenConfigured=true;data.integration.voiceId='test';await r.fulfill({response,json:data});});
 await p.route('**/api/transcribe',r=>r.fulfill({json:{text:'ช่วยตรวจสุขภาพกระเป๋าให้หน่อย'}}));
 await p.route('**/api/agent/chat',async r=>{const response=await r.fetch();const data=await response.json();data.state.integration.elevenConfigured=true;data.state.integration.voiceId='test';await r.fulfill({response,json:data});});
 const wav=Buffer.alloc(1644);wav.write('RIFF');wav.writeUInt32LE(1636,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(8000,24);wav.writeUInt32LE(16000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(1600,40);
 let spoken=0;await p.route('**/api/speech',r=>{spoken++;return r.fulfill({contentType:'audio/wav',body:wav});});
 await p.goto(process.env.BASE_URL||'http://127.0.0.1:4180');await p.getByRole('button',{name:'เปิดแชตกับ Guardian',exact:true}).click();await p.getByText('พร้อมช่วยคุณ',{exact:true}).waitFor();await p.getByRole('button',{name:'กดเพื่อพูด',exact:true}).click();await p.getByRole('button',{name:'หยุดและส่งเสียง',exact:true}).click();await p.locator('u-guardian .assistant').waitFor();await p.waitForFunction(()=>document.querySelector('u-guardian').busy===false);assert.equal(spoken,1);assert.equal(await p.evaluate(()=>window.testStream.getTracks().every(t=>t.readyState==='ended')),true);assert.deepEqual(errors,[]);console.log('PASS: synthetic microphone -> STT -> agent wallet tool -> TTS playback; microphone tracks released');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1);});
