// Managed deployment settings use connection status while retaining wallet controls.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage();
  await page.route('**/api/state',async route=>{const response=await route.fetch(),state=await response.json();state.integration.managedProviders=true;for(const name of ['ubot','avalanche','tokenomist','eleven'])state.integration[name+'Configured']=true;await route.fulfill({response,json:state});});
  await page.goto(process.env.BASE_URL||'http://127.0.0.1:4186');
  await page.waitForFunction(()=>document.querySelector('u-guardian').state&&!document.querySelector('u-guardian').busy);
  await page.evaluate(()=>{const widget=document.querySelector('u-guardian'),state=widget.state;state.integration.managedProviders=true;for(const name of ['ubot','avalanche','tokenomist','eleven'])state.integration[name+'Configured']=true;widget.acceptState(state);});
  await page.locator('#open-settings').click();
  await page.locator('[data-section=connections-section]').click();
  assert.equal(await page.locator('#managed-connections').isVisible(),true);
  assert.equal(await page.locator('#integration-form').isVisible(),false);
  assert.equal(await page.locator('#clear-connections').isVisible(),false);
  await page.locator('[data-section=wallet-section]').click();
  assert.equal(await page.locator('#wallet-form').isVisible(),true);
  assert.match(await page.locator('#storage-note').textContent(),/demo organizer/);
  await page.keyboard.press('Escape');
  await page.locator('#language').selectOption('th');
  await page.waitForFunction(()=>document.documentElement.lang==='th'&&document.querySelector('u-guardian').state&&!document.querySelector('u-guardian').busy);
  await page.evaluate(()=>{const widget=document.querySelector('u-guardian'),state=widget.state;state.integration.managedProviders=true;widget.acceptState(state);});
  await page.locator('#open-settings').click();
  assert.match(await page.locator('#storage-note').textContent(),/ผู้จัดเดโม/);
  console.log('PASS managed settings: statuses visible, provider editing hidden, wallet controls usable, English/Thai copy.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
