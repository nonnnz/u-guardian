// All transaction API and injected-wallet calls are fixtures. No funds move.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const base=process.env.BASE_URL||'http://127.0.0.1:4174';
  const state=await (await fetch(base+'/api/state')).json();
  const from='0x'+'1'.repeat(40),to='0x'+'2'.repeat(40),hash='0x'+'a'.repeat(64);
  state.dataMode='live';state.live.settings={address:to,chainId:'43113',reserveContract:'',target:'1',monitor:false};
  state.live.snapshot={chainId:'43113',network:'Avalanche Fuji',address:to,blockNumber:'100',fetchedAt:new Date().toISOString(),reserve:{units:'0',symbol:'AVAX',decimals:18,rawBalance:'0'},assessment:{target:'1',gap:'1',coverage:0,status:'attention'},assets:[],transfers:[],warnings:[],indexerStatus:'not-configured'};state.live.stale=false;state.live.error=null;state.live.action=null;
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(({from,hash})=>{window.walletCalls=[];window.ethereum={request:async req=>{window.walletCalls.push(req);if(req.method==='eth_requestAccounts'||req.method==='eth_accounts')return [from];if(req.method==='eth_chainId')return '0xa869';if(req.method==='eth_sendTransaction')return hash;throw new Error('Unexpected wallet method');}};},{from,hash});
  let authorize=0,receipt=0;
  await page.route('**/api/**',async route=>{
   const path=new URL(route.request().url()).pathname;let body=state;
   if(path==='/api/fuji/prepare'){state.live.action={id:'fixture-draft',status:'draft',chainId:'43113',amount:'0.01',feeEstimate:'0.0001',expiresAt:Date.now()+300000,tx:{from,to,value:'0x2386f26fc10000',data:'0x',chainId:'0xa869',nonce:'0x5',gas:'0x6270'}};body={draft:state.live.action};}
   else if(path==='/api/fuji/authorize'){authorize++;assert.equal(state.live.action.status,'draft');state.live.action.status='signing';body={draft:state.live.action};}
   else if(path==='/api/fuji/receipt'){receipt++;assert.equal(route.request().postDataJSON().hash,hash);state.live.action={...state.live.action,status:'confirmed',hash};body={draft:state.live.action,state};}
   else if(path!=='/api/state')throw new Error('Unexpected API path '+path);
   await route.fulfill({json:body});
  });
  await page.goto(base);await page.waitForSelector('#fuji-panel:not([hidden])');await page.locator('#connect-signer').click();await page.locator('#fuji-amount').fill('0.01');await page.locator('#prepare-fuji').click();await page.waitForSelector('#fuji-dialog[open]');
  assert.equal(await page.evaluate(()=>walletCalls.filter(x=>x.method==='eth_sendTransaction').length),0);
  assert.match(await page.locator('#fuji-details').innerText(),new RegExp(to));
  await page.locator('#sign-fuji').click();await page.waitForFunction(()=>document.querySelector('#fuji-result').textContent.includes('confirmed'));
  const sends=await page.evaluate(()=>walletCalls.filter(x=>x.method==='eth_sendTransaction'));assert.equal(sends.length,1);assert.equal(sends[0].params[0].chainId,'0xa869');assert.equal(sends[0].params[0].to,to);assert.equal(authorize,1);assert.equal(receipt,1);assert.deepEqual(errors,[]);
  console.log(JSON.stringify({fixtureWallet:'passed',explicitSignature:true,sends:1,receipt:'confirmed',realTransactions:0}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
