// Opt-in live integration check. Uses only a public example wallet and never places a call.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const base=process.env.BASE_URL||'http://127.0.0.1:4174';const page=await browser.newPage({viewport:{width:1440,height:1100}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.waitForSelector('#wallet-settings');await page.locator('#wallet-settings').click();await page.locator('#wallet-address').fill('0x71C7656EC7ab88b098defB751B7401B5f6d8976F');await page.locator('#wallet-target').fill('3');await page.locator('#live-goal').fill('Public example · ค่าใช้จ่ายเดือนหน้า');await page.locator('#live-due').fill(new Date(Date.now()+30*86400000).toISOString().slice(0,10));await page.locator('#load-wallet').click();await page.waitForFunction(()=>!document.querySelector('#wallet-dialog').open,{},{timeout:90000});
  assert.equal(await page.locator('#token-live').isVisible(),true);assert.ok(await page.locator('.supply-event').count()>0);assert.match(await page.locator('#supply-events').innerText(),/AVAX/);assert.match(await page.locator('#supply-coverage').textContent(),/avalanche-2/);
  await page.locator('#ask-reserve').click();await page.waitForFunction(()=>!document.querySelector('#chat-input').disabled,{},{timeout:130000});assert.ok(await page.locator('.message.assistant .trace').count()>0);
  await page.locator('[data-prompt="อธิบาย token unlock"]').click();await page.waitForFunction(()=>!document.querySelector('#chat-input').disabled,{},{timeout:130000});const last=await page.locator('.message.assistant').last().textContent();assert.match(last,/get_supply_events/);assert.match(last,/Tokenomist/);
  await page.screenshot({path:'artifacts/system-desktop.png',fullPage:true});await page.setViewportSize({width:390,height:844});await page.locator('#toast').waitFor({state:'hidden',timeout:10000});await page.screenshot({path:'artifacts/system-mobile.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.locator('#open-phone').click();await page.locator('#phone-resources').click();await page.waitForFunction(()=>document.querySelector('#phone-setup-status').textContent.includes('เบอร์ที่โทรออกได้'),{},{timeout:30000});assert.equal(await page.locator('#phone-number option').count(),1);await page.locator('#close-phone').click();assert.equal(await page.locator('#review-call').isDisabled(),true);
  const noAuth=await fetch('http://127.0.0.1:4176/phone/tool',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"message":"risk"}'});assert.equal(noAuth.status,403);
  const state=await(await page.request.get(base+'/api/state')).json();assert.equal(state.phone.calls.length,0);assert.equal(Object.hasOwn(state.integration,'tokenomistKey'),false);assert.equal(Object.hasOwn(state.phone,'sessions'),false);assert.deepEqual(errors,[]);
  console.log(JSON.stringify({liveWallet:true,indexer:state.live.snapshot.indexerStatus,tokenomist:state.live.supply.status,events:state.live.supply.events.length,ubot:state.integration.ubotStatus,phoneSetup:'no caller number; call disabled',unauthorizedCallback:403,realCalls:0,errors,mobileOverflow:false}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
