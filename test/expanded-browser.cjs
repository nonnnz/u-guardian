// Requires an isolated Demo server. Exercises real app routes; no provider keys/calls.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.BASE_URL||'http://127.0.0.1:4186');
 await page.waitForFunction(()=>document.querySelector('u-guardian').state&&!document.querySelector('u-guardian').busy);
 await page.evaluate(async()=>{const w=document.querySelector('u-guardian');for(const r of w.guardian.rules.filter(r=>r.active))await w.request('agent/watch/remove',{id:r.id});w.acceptState(await w.request('reset',{}));await w.request('agent/brief',{});await w.request('agent/ack',{});w.dismissAlerts();});
 const send=async text=>{await page.locator('u-guardian #input').fill(text);await page.locator('u-guardian #send').click();await page.waitForFunction(()=>!document.querySelector('u-guardian').busy);};
 await page.locator('u-guardian #launcher').click();
 await send('Alert me when AVAX price drops 10%.');
 assert.match(await page.locator('u-guardian .proposal').last().innerText(),/10%.*down/);
 await page.getByRole('button',{name:'Confirm watch',exact:true}).click();await page.getByRole('button',{name:'Saved',exact:true}).waitFor();
 await page.keyboard.press('Escape');await page.getByRole('button',{name:'Settings',exact:true}).click();
 await page.getByRole('button',{name:'Simulate AVAX price −12%',exact:true}).click();await page.locator('#wallet-status').filter({hasText:'Price drop simulated'}).waitFor();await page.keyboard.press('Escape');
 await page.locator('u-guardian #incoming-call').waitFor({state:'visible'});
 assert.match(await page.locator('u-guardian #call-preview').innerText(),/-12.00%/);
 fs.mkdirSync('.impeccable/review',{recursive:true});await page.screenshot({path:'.impeccable/review/expanded-call-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'.impeccable/review/expanded-call-mobile.png',fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.locator('u-guardian #answer-call').click();assert.equal(await page.locator('u-guardian #chat-dialog').evaluate(e=>e.open),true);assert.match(await page.locator('u-guardian .assistant').last().innerText(),/-12.00%/);
 await page.getByRole('button',{name:'Tell me what’s new',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('u-guardian').busy);
 await send('Alert me about outgoing transfers over $20.');await page.getByRole('button',{name:'Confirm watch',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('u-guardian').busy);
 await page.keyboard.press('Escape');await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('button',{name:'Simulate 25 USDC leaving',exact:true}).click();await page.locator('#wallet-status').filter({hasText:'Balance change simulated'}).waitFor();await page.keyboard.press('Escape');
 await page.locator('u-guardian #incoming-call').waitFor({state:'visible'});assert.match(await page.locator('u-guardian #call-preview').innerText(),/exceeds \$20/);await page.locator('u-guardian #dismiss-call').click();
 // Reopening detects a change since briefing, separately from an already dismissed watch.
 await page.reload();await page.waitForFunction(()=>document.querySelector('u-guardian').state&&!document.querySelector('u-guardian').busy);await page.locator('u-guardian #incoming-call').waitFor({state:'visible'});assert.match(await page.locator('u-guardian #call-preview').innerText(),/change/);await page.locator('u-guardian #dismiss-call').click();
 await page.reload();await page.waitForFunction(()=>document.querySelector('u-guardian').state&&!document.querySelector('u-guardian').busy);assert.equal(await page.locator('u-guardian #incoming-call').isVisible(),false);
 assert.deepEqual(errors,[]);console.log('PASS expanded browser: price + transfer confirmation, demo triggers, simulated call answer/dismiss, reopen delta, dedupe, desktop/mobile');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
