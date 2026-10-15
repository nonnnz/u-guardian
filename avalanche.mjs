import {t as tr} from './locale.mjs';
import {providerSignal} from './agent-budget.mjs';
import {debugStep} from './debug.mjs';
import { randomUUID } from 'node:crypto';

export const CHAINS = {
  '43114': { name: 'Avalanche C-Chain', rpc: 'https://api.avax.network/ext/bc/C/rpc', explorer: 'https://explorer.avax.network/c-chain' },
  '43113': { name: 'Avalanche Fuji', rpc: 'https://api.avax-test.network/ext/bc/C/rpc', explorer: 'https://explorer-test.avax.network/c-chain' },
};
export function address(value) {
  if (typeof value !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(value) || /^0x0{40}$/i.test(value)) throw new Error(tr('ใส่ public address 0x ตามด้วย 40 ตัวอักษร hex และไม่ใช่ zero address'));
  return value.toLowerCase();
}
export function chain(value) { const id=String(value); if (!CHAINS[id]) throw new Error(tr('รองรับเฉพาะ Avalanche C-Chain และ Fuji')); return id; }
export function parseUnits(value, decimals=18) {
  const text=String(value);
  if (!Number.isInteger(decimals) || decimals<0 || decimals>36 || !/^\d+(\.\d+)?$/.test(text) || text.length>80) throw new Error(tr('จำนวน token ไม่ถูกต้อง'));
  const [whole,fraction='']=text.split('.');
  if (fraction.length>decimals) throw new Error(tr('สินทรัพย์นี้รองรับทศนิยมไม่เกิน {0} ตำแหน่ง',decimals));
  return BigInt(whole)*10n**BigInt(decimals)+BigInt(fraction.padEnd(decimals,'0')||'0');
}
export function formatUnits(value, decimals=18) {
  const raw=BigInt(value); const base=10n**BigInt(decimals);
  const frac=(raw%base).toString().padStart(decimals,'0').replace(/0+$/,'');
  return `${raw/base}${frac?'.'+frac:''}`;
}
export async function rpc(chainId,method,params=[],fetcher=fetch){return debugStep('provider','Avalanche RPC',{chainId,method,params},()=>readRpc(chainId,method,params,fetcher));}
async function readRpc(chainId, method, params, fetcher) {
  const id=chain(chainId);
  const res=await fetcher(CHAINS[id].rpc,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:providerSignal(15000),redirect:'error'});
  if(!res.ok)throw new Error(`Avalanche RPC HTTP ${res.status}`);
  const data=await res.json();
  if(data.error || data.result===undefined)throw new Error(tr('Avalanche RPC {0} ไม่สำเร็จ{1}',method,data.error?.code?' ('+data.error.code+')':''));
  return data.result;
}
export async function dataApi(key,path,fetcher=fetch){return debugStep('provider','Avalanche Data API',{method:'GET',path},()=>readDataApi(key,path,fetcher));}
async function readDataApi(key,path,fetcher) {
  if(!key)throw new Error(tr('ยังไม่มี Avalanche Data API key'));
  const res=await fetcher('https://data-api.avax.network'+path,{headers:{Accept:'application/json','x-glacier-api-key':key},signal:providerSignal(15000),redirect:'error'});
  if(!res.ok)throw new Error(`Avalanche Data API HTTP ${res.status}${res.status===429?tr(' — เกิน quota ให้รอก่อนรีเฟรช'):''}`);
  return res.json();
}
export async function testDataKey(key,fetcher=fetch) {
  const value=await dataApi(key,'/v1/chains/43114',fetcher);
  return {ok:true,chainId:String(value.chainId || '43114'),scope:'chain metadata endpoint',note:tr('ยืนยัน endpoint นี้เท่านั้น; balances/history ตรวจเมื่ออ่าน wallet')};
}
function abiText(hex) {
  if(typeof hex!=='string' || !/^0x[0-9a-f]*$/i.test(hex))return 'ERC-20';
  try {
    const raw=hex.slice(2);let bytes;
    if(raw.length===64) bytes=Buffer.from(raw,'hex');
    else {const offset=Number(BigInt('0x'+raw.slice(0,64)))*2;const len=Number(BigInt('0x'+raw.slice(offset,offset+64)));if(len>100)return 'ERC-20';bytes=Buffer.from(raw.slice(offset+64,offset+64+len*2),'hex');}
    return bytes.toString('utf8').replace(/\0/g,'').replace(/[\x00-\x1f]/g,'').slice(0,32)||'ERC-20';
  } catch {return 'ERC-20';}
}
export function normalizeToken(t) {
  const decimals=Number(t.decimals);
  if(!Number.isInteger(decimals)||decimals<0||decimals>36||!/^\d{1,80}$/.test(String(t.balance)))throw new Error('Invalid token balance/decimals');
  const units=formatUnits(t.balance,decimals);
  const value=t.balanceValue?.currencyCode?.toLowerCase()==='usd'?Number(t.balanceValue.value):NaN;
  return {address:address(t.address),name:String(t.name||'Token').slice(0,100),symbol:String(t.symbol||'TOKEN').slice(0,32),decimals,rawBalance:String(t.balance),units,
    usdValue:Number.isFinite(value)&&value>=0?value:null,priceSource:'Avalanche Data API indexed estimate',reputation:t.tokenReputation||'Unknown'};
}
export function normalizeTransfer(t,kind) {
  const native=t.nativeTransaction || t;
  const hash=t.txHash || native.txHash || t.transactionHash;
  if(!/^0x[0-9a-f]{64}$/i.test(hash||''))return null;
  const decimals=kind==='native'?18:Number(t.erc20Token?.decimals ?? t.token?.decimals ?? 18);
  let amount=null;try{amount=formatUnits(t.value || native.value || '0',decimals);}catch{}
  return {hash,from:t.from?.address||native.from?.address||t.from||native.from,to:t.to?.address||native.to?.address||t.to||native.to,amount,symbol:kind==='native'?'AVAX':String(t.erc20Token?.symbol || t.token?.symbol || 'ERC-20').slice(0,32),kind, status:native.txStatus??null,
    timestamp:t.blockTimestamp||native.blockTimestamp||null};
}
export async function readWallet(settings,key,fetcher=fetch) {
  const chainId=chain(settings.chainId),wallet=address(settings.address);
  const reserveContract=settings.reserveContract?address(settings.reserveContract):null;
  const block=await rpc(chainId,'eth_blockNumber',[],fetcher);
  const nativeRaw=await rpc(chainId,'eth_getBalance',[wallet,block],fetcher);
  let reserve={symbol:'AVAX',decimals:18,rawBalance:BigInt(nativeRaw).toString(),units:formatUnits(nativeRaw),contract:null};
  if(reserveContract){
    const [decimalsHex,balanceHex,symbolHex]=await Promise.all([
      rpc(chainId,'eth_call',[{to:reserveContract,data:'0x313ce567'},block],fetcher),
      rpc(chainId,'eth_call',[{to:reserveContract,data:'0x70a08231'+wallet.slice(2).padStart(64,'0')},block],fetcher),
      rpc(chainId,'eth_call',[{to:reserveContract,data:'0x95d89b41'},block],fetcher).catch(()=>null),
    ]);
    const decimals=Number(BigInt(decimalsHex));if(decimals>36)throw new Error(tr('ERC-20 decimals ไม่อยู่ในช่วงที่รองรับ'));
    reserve={symbol:abiText(symbolHex),decimals,rawBalance:BigInt(balanceHex).toString(),units:formatUnits(balanceHex,decimals),contract:reserveContract};
  }
  const warnings=[],tokens=[],transfers=[];let tokensTruncated=false,historyTruncated=false,indexerStatus='not-configured';
  let nativeValue=null;
  if(key){
    const root=`/v1/chains/${chainId}/addresses/${wallet}`;
    const results=await Promise.allSettled([
      (async()=>{let pageToken;for(let page=0;page<3;page++){
        const data=await dataApi(key,root+'/balances:listErc20?pageSize=100&filterSpamTokens=true&currency=usd'+(pageToken?'&pageToken='+encodeURIComponent(pageToken):''),fetcher);
        if(!Array.isArray(data.erc20TokenBalances))throw new Error(tr('รูปแบบ balances ของ Data API ไม่ตรงกับที่รองรับ'));
        for(const t of data.erc20TokenBalances){try{tokens.push(normalizeToken(t));}catch{warnings.push(tr('มี token metadata ที่อ่านไม่ได้ จึงไม่รวมรายการนั้น'));}}
        if(data.nativeTokenBalance?.balanceValue?.currencyCode?.toLowerCase()==='usd') {const v=Number(data.nativeTokenBalance.balanceValue.value);if(Number.isFinite(v)&&v>=0)nativeValue=v;}
        pageToken=data.nextPageToken;if(!pageToken)break;
      }tokensTruncated=!!pageToken;})(),
      ...['Native','Erc20'].map(kind=>(async()=>{
        const data=await dataApi(key,root+`/transactions:list${kind}?pageSize=20`,fetcher);
        const list=data.transactions;
        if(!Array.isArray(list))throw new Error(tr('รูปแบบประวัติ {0} ไม่ตรงกับที่รองรับ',kind));
        transfers.push(...list.map(t=>normalizeTransfer(t,kind==='Native'?'native':'erc20')).filter(Boolean));
        historyTruncated ||= !!data.nextPageToken;
      })()),
    ]);
    results.forEach((r,i)=>{if(r.status==='rejected')warnings.push(`${['Token list','Native history','ERC-20 history'][i]}: ${r.reason.message}`);});
    indexerStatus=results.every(r=>r.status==='fulfilled')?'ok':results.every(r=>r.status==='rejected')?'error':'partial';
  }else warnings.push(tr('ยังไม่มี Data API key: อ่าน AVAX/สินทรัพย์สำรองผ่าน RPC ได้ แต่ไม่มีรายการ token และประวัติจาก indexer'));
  const assets=[{address:'native',symbol:'AVAX',name:'Avalanche',decimals:18,rawBalance:BigInt(nativeRaw).toString(),units:formatUnits(nativeRaw),usdValue:chainId==='43113'?null:nativeValue,source:'RPC'},...tokens.map(t=>({...t,usdValue:chainId==='43113'?null:t.usdValue,source:'Data API'}))];
  if(reserveContract){const at=assets.findIndex(t=>t.address===reserveContract);const item={...(at>=0?assets[at]:{}),address:reserveContract,name:reserve.symbol,...reserve,source:'RPC'};if(at>=0)assets[at]=item;else assets.push(item);}
  const target=parseUnits(settings.target,reserve.decimals);if(target<=0n)throw new Error(tr('เป้าหมายต้องมากกว่า 0'));
  const balance=BigInt(reserve.rawBalance),gap=target>balance?target-balance:0n;
  return {chainId,network:CHAINS[chainId].name,address:wallet,blockNumber:BigInt(block).toString(),fetchedAt:new Date().toISOString(),source:'Avalanche live',reserve,
    assessment:{target:String(settings.target),gap:formatUnits(gap,reserve.decimals),coverage:Number(balance*10000n/target)/100,status:gap?'attention':'on-track',unit:reserve.symbol,source:'RPC exact token units',valuation:'Token units only; not fiat'},
    assets,transfers:transfers.sort((a,b)=>timeValue(b.timestamp)-timeValue(a.timestamp)),tokensTruncated,historyTruncated,indexerStatus,warnings};
}
function timeValue(value){return Number.isFinite(Number(value))?Number(value):Date.parse(value)||0;}
export function fresh(snapshot) {return !!snapshot && Date.now()-Date.parse(snapshot.fetchedAt)<120000;}
export async function prepareFuji(from,to,amount,fetcher=fetch) {
  from=address(from);to=address(to);if(from===to)throw new Error('กระเป๋าต้นทางและปลายทางต้องต่างกัน');
  const value=parseUnits(amount);if(value<=0n)throw new Error(tr('จำนวนต้องมากกว่า 0'));
  if(await rpc('43113','eth_getCode',[to,'latest'],fetcher)!=='0x')throw new Error('POC รองรับส่ง test AVAX ไปกระเป๋าธรรมดาเท่านั้น ไม่ส่งไป contract');
  const tx={from,to,value:'0x'+value.toString(16),data:'0x'};
  const [gas,gasPrice,balance,nonce]=await Promise.all([rpc('43113','eth_estimateGas',[tx],fetcher),rpc('43113','eth_gasPrice',[],fetcher),rpc('43113','eth_getBalance',[from,'latest'],fetcher),rpc('43113','eth_getTransactionCount',[from,'pending'],fetcher)]);
  const gasLimit=(BigInt(gas)*120n+99n)/100n,fee=gasLimit*BigInt(gasPrice);
  if(value+fee>BigInt(balance))throw new Error('test AVAX ต้นทางไม่พอสำหรับจำนวนโอนและ gas โดยประมาณ');
  return {id:randomUUID(),status:'draft',chainId:'43113',amount:String(amount),feeEstimate:formatUnits(fee),createdAt:Date.now(),expiresAt:Date.now()+300000,tx:{...tx,nonce,chainId:'0xa869',gas:'0x'+gasLimit.toString(16)},source:'Fuji unsigned transaction'};
}
export function matchesDraft(tx,draft) {
  return tx?.from?.toLowerCase()===draft.tx.from && tx?.to?.toLowerCase()===draft.tx.to && BigInt(tx.value)===BigInt(draft.tx.value) && tx.nonce!=null && BigInt(tx.nonce)===BigInt(draft.tx.nonce) && (!tx.input || tx.input==='0x') && (!tx.chainId || BigInt(tx.chainId)===43113n);
}
export async function verifyFuji(draft,hash,fetcher=fetch) {
  if(!draft || !/^0x[0-9a-f]{64}$/i.test(hash||''))throw new Error('ไม่มี draft หรือ transaction hash ไม่ถูกต้อง');
  if(draft.hash && draft.hash.toLowerCase()!==hash.toLowerCase())throw new Error('รายการนี้ผูกกับ transaction อื่นแล้ว');
  const tx=await rpc('43113','eth_getTransactionByHash',[hash],fetcher);
  if(!tx)return {...draft,status:'pending',hash};
  if(!matchesDraft(tx,draft))throw new Error('ธุรกรรมไม่ตรงกับต้นทาง ปลายทาง จำนวน หรือ chain ของ draft');
  const receipt=await rpc('43113','eth_getTransactionReceipt',[hash],fetcher);
  return {...draft,hash,status:!receipt?'pending':BigInt(receipt.status)===1n?'confirmed':'reverted',blockNumber:receipt?.blockNumber?BigInt(receipt.blockNumber).toString():null};
}
