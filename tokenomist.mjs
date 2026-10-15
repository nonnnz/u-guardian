import {t as tr} from './locale.mjs';
import {providerSignal} from './agent-budget.mjs';
import {debugStep} from './debug.mjs';
import {createHash} from 'node:crypto';
const cache=new Map();
const num=value=>value!=null&&Number.isFinite(Number(value))&&Number(value)>=0?Number(value):null;
export function clearTokenCache(){cache.clear();}
export async function tokenApi(key,path,fetcher=fetch,ttl=300000,objectData=false){return debugStep('provider','Tokenomist',{method:'GET',path},()=>readTokenApi(key,path,fetcher,ttl,objectData));}
async function readTokenApi(key,path,fetcher,ttl,objectData){
 if(!key)throw new Error(tr('ยังไม่ได้ตั้ง Tokenomist API key'));
 const id=createHash('sha256').update(key).digest('hex')+path,prior=cache.get(id);
 if(prior&&Date.now()-prior.at<ttl)return {...prior.value,cached:true};
 const res=await fetcher('https://api.tokenomist.ai'+path,{headers:{'x-api-key':key,Accept:'application/json'},redirect:'error',signal:providerSignal(20000)});
 if(!res.ok)throw new Error(`Tokenomist HTTP ${res.status}${res.status===429?tr(' · เกิน rate limit/credits'):res.status===403?tr(' · ตรวจสิทธิ์ข้อมูลในแพ็กเกจ'):''}`);
 const body=await res.json();if(body.status!==true||!(objectData?body.data&&typeof body.data==='object'&&!Array.isArray(body.data):Array.isArray(body.data)))throw new Error(tr('Tokenomist คืนข้อมูลที่ไม่ตรง schema หรือไม่มีสิทธิ์ใช้งาน'));
 const value={data:body.data,metadata:body.metadata||{},fetchedAt:new Date().toISOString(),cached:false};cache.set(id,{at:Date.now(),value});if(cache.size>150)cache.delete(cache.keys().next().value);return value;
}
export async function tokenCatalog(key,fetcher=fetch){const result=await tokenApi(key,'/v5/token/list',fetcher,3600000);return {...result,data:result.data.filter(t=>typeof t.id==='string'&&/^[a-zA-Z0-9_-]{1,120}$/.test(t.id)).map(t=>({id:t.id,name:String(t.name||t.id).slice(0,100),symbol:String(t.symbol||'').slice(0,32),circulatingSupply:num(t.circulatingSupply),listedMethod:t.listedMethod||'unknown',updatedAt:t.lastUpdatedDate||null}))};}
export async function paged(key,path,fetcher=fetch){const rows=[];let last,firstAt,truncated=false;for(let page=1;page<=3;page++){last=await tokenApi(key,path+`&page=${page}&pageSize=100`,fetcher);firstAt??=last.fetchedAt;rows.push(...last.data);const pages=Number(last.metadata.totalPages);if(!Number.isInteger(pages)||pages<1)throw new Error(tr('Tokenomist ไม่ระบุ pagination ที่รองรับ'));if(page>=pages)break;truncated=page===3;}return {data:rows,metadata:last.metadata,fetchedAt:firstAt,truncated};}
export function normalizeUnlock(row,token){
 if(!row?.cliffUnlocks||!Number.isFinite(Date.parse(row.unlockDate)))return null;
 const allocations=Array.isArray(row.cliffUnlocks.allocationBreakdown)?row.cliffUnlocks.allocationBreakdown:[];
 return {id:token.id+':'+row.unlockDate,tokenId:token.id,symbol:token.symbol,date:row.unlockDate,amount:num(row.cliffUnlocks.cliffAmount),estimatedUSD:num(row.cliffUnlocks.cliffValue),percentMarketCap:num(row.cliffUnlocks.valueToMarketCap),precision:[...new Set(allocations.map(a=>a.unlockPrecision||'unknown'))].join(', ')||'unknown',allocations:allocations.map(a=>({name:String(a.standardAllocationName||a.allocationName||'Unknown').slice(0,100),amount:num(a.cliffAmount)})),listedMethod:row.listedMethod||token.listedMethod,dataSource:String(row.dataSource||'Tokenomist').slice(0,200),updatedAt:row.latestUpdateDate||null,source:'Tokenomist v5 · cliff unlock',url:'https://tokenomist.ai/'+encodeURIComponent(token.id)};
}
export function mappedAssets(snapshot,mappings={}){
 const held=snapshot.assets.filter(a=>BigInt(a.rawBalance||'0')>0n);
 return held.map(asset=>({asset,tokenId:snapshot.chainId==='43114'?(asset.address==='native'?'avalanche-2':mappings[`${snapshot.chainId}:${asset.address.toLowerCase()}`]||null):null,mappingSource:asset.address==='native'?'Native Avalanche identity':'User-confirmed chain + contract'}));
}
export async function readSupply(snapshot,key,settings,mappings={},fetcher=fetch){
 const base={source:'Tokenomist v5',fetchedAt:new Date().toISOString(),events:[],emissions:[],coverage:[],warnings:[],status:'unavailable',windowDays:settings.horizonDays||30};
 if(!key)return {...base,warnings:[tr('ยังไม่ได้ตั้ง Tokenomist API key')]};
 if(snapshot.chainId==='43113')return {...base,status:'not-applicable',warnings:[tr('Fuji เป็น testnet จึงไม่จับคู่ token กับ supply ของ Mainnet')]};
 const catalog=await tokenCatalog(key,fetcher),byId=new Map(catalog.data.map(t=>[t.id,t]));
 const mapped=mappedAssets(snapshot,mappings);const selected=[...new Set(mapped.map(m=>m.tokenId).filter(Boolean))].slice(0,5);
 base.coverage=mapped.map(m=>({contract:m.asset.address,symbol:m.asset.symbol,tokenId:m.tokenId,mappingSource:m.mappingSource,status:!m.tokenId?'unmapped':!byId.has(m.tokenId)?'not-covered':!selected.includes(m.tokenId)?'limit':'pending'}));
 const start=new Date().toISOString().slice(0,10),end=new Date(Date.now()+base.windowDays*86400000).toISOString().slice(0,10);base.start=start;base.end=end;
 for(const tokenId of selected){
  const token=byId.get(tokenId);if(!token)continue;
  const query=`?start=${start}&end=${end}`;
  const results=await Promise.allSettled([paged(key,`/v5/unlock/events/${encodeURIComponent(tokenId)}`+query,fetcher),paged(key,`/v5/daily-emission/${encodeURIComponent(tokenId)}`+query,fetcher)]);
  const [events,emissions]=results;
  for(const c of base.coverage.filter(c=>c.tokenId===tokenId))c.status=results.every(r=>r.status==='fulfilled')?'covered':results.every(r=>r.status==='rejected')?'error':'partial';
  if(events.status==='fulfilled'){base.events.push(...events.value.data.map(r=>normalizeUnlock(r,token)).filter(Boolean).filter(e=>Date.parse(e.date)>=Date.parse(start)&&Date.parse(e.date)<Date.parse(end)+86400000));if(events.value.truncated)base.warnings.push(tr('{0}: cliff events เกิน 300 แถว แสดงบางส่วน',token.symbol));}
  else base.warnings.push(`${token.symbol} cliff events: ${events.reason.message}`);
  if(emissions.status==='fulfilled'){const rows=emissions.value.data.filter(r=>Date.parse(r.startDate)>=Date.parse(start)&&Date.parse(r.startDate)<Date.parse(end)+86400000);const amounts=rows.map(r=>num(r.unlockAmount));base.emissions.push({tokenId,symbol:token.symbol,start,end,days:rows.length,amount:amounts.every(n=>n!==null)?amounts.reduce((a,b)=>a+b,0):null,complete:!emissions.value.truncated&&rows.length>=base.windowDays,includesCliff:true,note:tr('ยอดรวม emission รวม cliff ด้วย ห้ามบวกกับ cliff ซ้ำ'),fetchedAt:emissions.value.fetchedAt});if(emissions.value.truncated)base.warnings.push(tr('{0}: emission เกิน 300 แถว',token.symbol));}
  else base.warnings.push(`${token.symbol} emissions: ${emissions.reason.message}`);
 }
 base.events.sort((a,b)=>Date.parse(a.date)-Date.parse(b.date));
 base.status=!selected.length?'unmapped':base.coverage.some(c=>c.status==='covered'||c.status==='partial')?(base.warnings.length||base.coverage.some(c=>c.status!=='covered')?'partial':'ok'):'unavailable';
 base.credit=catalog.metadata.credit||null;
 if(mapped.length>base.coverage.filter(c=>c.status==='covered').length)base.warnings.push(tr('Coverage ไม่ครบทุกสินทรัพย์ การไม่มี event ไม่ได้แปลว่าไม่มีความเสี่ยง'));
 if(snapshot.tokensTruncated||snapshot.indexerStatus!=='ok')base.warnings.push(tr('รายการสินทรัพย์จาก Avalanche อาจไม่ครบ'));
 return base;
}
