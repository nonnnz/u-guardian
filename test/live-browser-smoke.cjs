const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1100}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const base=process.env.BASE_URL||'http://127.0.0.1:4174';await page.goto(base);await page.waitForSelector('#holdings-body tr');
  await page.locator('#nav-settings').click();await page.waitForSelector('#settings-dialog[open]');assert.equal(await page.locator('#avalanche-key').getAttribute('type'),'password');await page.locator('[data-close="settings-dialog"]').click();
  await page.locator('#wallet-settings').click();
  await page.locator('#wallet-address').fill('0x71C7656EC7ab88b098defB751B7401B5f6d8976F');
  await page.locator('#wallet-target').fill('100');await page.locator('#load-wallet').click();await page.waitForFunction(()=>!document.getElementById('wallet-dialog').open,{},{timeout:60000});
  assert.equal(await page.locator('#data-mode').inputValue(),'live');assert.ok(!(await page.locator('#reserve-value').textContent()).includes('620'));
  assert.equal(await page.locator('.demo-notice').isVisible(),false);assert.equal(await page.locator('.watch-section .event-row').isVisible(),false);
  await page.locator('#ask-reserve').click();await page.waitForSelector('.message.assistant .trace');
  assert.match(await page.locator('.message.assistant').last().innerText(),/block/);
  const response=await page.request.post(base+'/api/trigger',{headers:{'X-Guardian-Client':'local-poc'},data:{}});assert.equal(response.status(),400);
  const blocked=await page.request.post(base+'/api/fuji/prepare',{headers:{'X-Guardian-Client':'local-poc'},data:{from:'0x'+'1'.repeat(40),amount:'0.01'}});assert.equal(blocked.status(),400);
  await page.locator('[data-prompt="จำลองเติม 0.1"]').click();await page.waitForSelector('.simulation-result');assert.match(await page.locator('.simulation-result').innerText(),/AVAX/);assert.equal(await page.locator('.simulation-result button').count(),0);
  await page.screenshot({path:'artifacts/live-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'artifacts/live-mobile.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.locator('#wallet-settings').click();await page.locator('#wallet-chain').selectOption('43113');await page.locator('#load-wallet').click();await page.waitForFunction(()=>!document.getElementById('wallet-dialog').open,{},{timeout:60000});assert.equal(await page.locator('#fuji-panel').isVisible(),true);
  await page.locator('#connect-signer').click();await page.waitForFunction(()=>document.getElementById('toast').textContent.includes('ติดตั้ง wallet'));
  assert.deepEqual(errors,[]);
  const snapshot=await (await page.request.get(base+'/api/state')).json();console.log(JSON.stringify({liveRead:'passed',network:snapshot.live.snapshot.network,reserve:snapshot.live.snapshot.reserve.units,block:snapshot.live.snapshot.blockNumber,browserErrors:errors,mobileOverflow:false,mainnetTransferBlocked:true,tokenomist:'excluded'}));
  await page.locator('#data-mode').selectOption('demo');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
