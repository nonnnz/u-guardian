import test from 'node:test';
import assert from 'node:assert/strict';
import {parseUnits,formatUnits,readWallet,prepareFuji,verifyFuji,normalizeTransfer} from '../avalanche.mjs';
import {createLiveState,refreshLive,liveTools} from '../live-wallet.mjs';
const from='0x'+'1'.repeat(40),to='0x'+'2'.repeat(40),hash='0x'+'a'.repeat(64);
const settings={address:to,chainId:'43114',target:'0.2',reserveContract:'',monitor:true};
function fixture(overrides={}){return async(url,options={})=>{
  if(url.includes('data-api.')){if(overrides.api)return overrides.api(url,options);return {ok:true,json:async()=>url.includes('balances:')?{nativeTokenBalance:{balanceValue:{currencyCode:'usd',value:2}},erc20TokenBalances:[]}:{transactions:[{txHash:hash,from:{address:from},to:{address:to},value:'100000000000000000',blockTimestamp:123}]}};}
  const {method,params}=JSON.parse(options.body);
  const defaults={eth_blockNumber:'0x64',eth_getBalance:'0x16345785d8a0000',eth_getCode:'0x',eth_estimateGas:'0x5208',eth_gasPrice:'0x1',eth_getTransactionCount:'0x5'};
  const result=Object.hasOwn(overrides,method)?overrides[method]:defaults[method];
  return {ok:true,json:async()=>({result:typeof result==='function'?result(params):result})};
};}
test('token math preserves wei and six-decimal values; rejects exponent and excess decimals',()=>{
  assert.equal(formatUnits(parseUnits('0.000000000000000001')),'0.000000000000000001');
  assert.equal(parseUnits('123456789123456789.123456',6),123456789123456789123456n);
  assert.throws(()=>parseUnits('1e3'));assert.throws(()=>parseUnits('0.0000001',6));assert.throws(()=>parseUnits('-1'));
});
test('RPC-only snapshot has exact reserve, no invented valuation/history',async()=>{
  const s=await readWallet(settings,'',fixture());assert.equal(s.reserve.units,'0.1');assert.equal(s.assessment.gap,'0.1');assert.equal(s.blockNumber,'100');assert.equal(s.assets[0].usdValue,null);assert.equal(s.indexerStatus,'not-configured');assert.deepEqual(s.transfers,[]);
});
test('ERC20 reserve reads contract precision and balance at the same block',async()=>{
  const blocks=[];const s=await readWallet({...settings,reserveContract:from,target:'1.000001'},'',fixture({eth_call:params=>{blocks.push(params[1]);return params[0].data==='0x313ce567'?'0x6':params[0].data==='0x95d89b41'?'0x':'0xf4240';}}));
  assert.equal(s.reserve.units,'1');assert.equal(s.assessment.gap,'0.000001');assert.deepEqual(blocks,['0x64','0x64','0x64']);
});
test('API history schema uses object addresses; partial API failure preserves RPC with warning',async()=>{
  assert.equal(normalizeTransfer({txHash:hash,from:{address:from},to:{address:to},value:'1000000',erc20Token:{decimals:6,symbol:'USDC'}},'erc20').amount,'1');
  const s=await readWallet(settings,'test-fixture',fixture({api:async(url,o)=>{assert.equal(o.headers['x-glacier-api-key'],'test-fixture');if(url.includes('listErc20'))return {ok:false,status:429};return {ok:true,json:async()=>({transactions:[]})};}}));
  assert.equal(s.reserve.units,'0.1');assert.equal(s.indexerStatus,'partial');assert.ok(s.warnings.some(w=>w.includes('429')));
});
test('token paging cap and Fuji valuation are explicit',async()=>{
  let pages=0;const s=await readWallet({...settings,chainId:'43113'},'fixture',fixture({api:async url=>({ok:true,json:async()=>url.includes('balances:')?(pages++,{nativeTokenBalance:{balanceValue:{currencyCode:'usd',value:100}},erc20TokenBalances:[],nextPageToken:'more'}):{transactions:[],nextPageToken:'more'}})}));
  assert.equal(pages,3);assert.equal(s.tokensTruncated,true);assert.equal(s.historyTruncated,true);assert.equal(s.assets[0].usdValue,null);
});
test('live incidents dedupe and stale/failed refresh cannot silently use demo data',async()=>{
  const live=createLiveState();await refreshLive(live,'',settings,fixture());const id=live.incident.id;await refreshLive(live,'',settings,fixture());assert.equal(live.incident.id,id);
  assert.equal(liveTools(live).simulate_reserve_topup({amount:'0.1'}).after,'0.2');assert.equal(liveTools(live).get_supply_events().status,'unavailable');
  await assert.rejects(refreshLive(live,'',settings,async()=>{throw new Error('offline');}));assert.equal(live.snapshot.reserve.units,'0.1');assert.throws(()=>liveTools(live).assess_goal_risk());
  live.error=null;live.snapshot.fetchedAt='2000-01-01';assert.throws(()=>liveTools(live).get_wallet_snapshot());
});
test('Fuji draft checks balance, destination contract, nonce and receipt identity',async()=>{
  const d=await prepareFuji(from,to,'0.01',fixture());assert.equal(d.tx.chainId,'0xa869');assert.equal(d.tx.nonce,'0x5');
  await assert.rejects(prepareFuji(from,to,'0.1',fixture()),/ไม่พอ/);await assert.rejects(prepareFuji(from,to,'0.01',fixture({eth_getCode:'0x1234'})),/contract/);
  const tx={...d.tx,input:'0x'};
  const confirmed=await verifyFuji(d,hash,fixture({eth_getTransactionByHash:tx,eth_getTransactionReceipt:{status:'0x1',blockNumber:'0x65'}}));assert.equal(confirmed.status,'confirmed');
  await assert.rejects(verifyFuji(d,hash,fixture({eth_getTransactionByHash:{...tx,to:from}})),/ไม่ตรง/);
  await assert.rejects(verifyFuji(d,hash,fixture({eth_getTransactionByHash:{...tx,nonce:'0x4'}})),/ไม่ตรง/);
  const pending=await verifyFuji(d,hash,fixture({eth_getTransactionByHash:null}));assert.equal(pending.status,'pending');
  await assert.rejects(verifyFuji(pending,'0x'+'b'.repeat(64),fixture()),/transaction อื่น/);
});
