import {t as tr} from './locale.mjs';
import { randomUUID } from 'node:crypto';
import { address,chain,parseUnits,formatUnits,readWallet,fresh } from './avalanche.mjs';
import {personalizedRisk} from './risk.mjs';

export function createLiveState(){return {settings:{address:'',chainId:'43114',reserveContract:'',target:'0.1',monitor:false,goal:tr('เงินสำรอง'),dueDate:new Date(Date.now()+30*86400000).toISOString().slice(0,10),horizonDays:30},snapshot:null,supply:null,mappings:{},error:null,incident:null,action:null,lastAttempt:null};}
export function validateSettings(p){
  const settings={address:address(p.address),chainId:chain(p.chainId),reserveContract:p.reserveContract?address(p.reserveContract):'',target:String(p.target),monitor:!!p.monitor};
  if(parseUnits(settings.target)<=0n)throw new Error(tr('เป้าหมายต้องมากกว่า 0'));
  settings.goal=String(p.goal||tr('เงินสำรอง')).slice(0,100);settings.dueDate=p.dueDate||new Date(Date.now()+30*86400000).toISOString().slice(0,10);settings.horizonDays=Number(p.horizonDays||30);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(settings.dueDate)||!Number.isFinite(Date.parse(settings.dueDate))||new Date(settings.dueDate).toISOString().slice(0,10)!==settings.dueDate)throw new Error(tr('วันใช้เงินไม่ถูกต้อง'));
  if(!Number.isInteger(settings.horizonDays)||settings.horizonDays<1||settings.horizonDays>90)throw new Error(tr('ช่วงติดตามต้องอยู่ระหว่าง 1–90 วัน'));
  return settings;
}
export async function refreshLive(live,key,settings=live.settings,fetcher=fetch){
  live.lastAttempt=new Date().toISOString();
  try{
    const snapshot=await readWallet(settings,key,fetcher);
    const changed=JSON.stringify(live.settings)!==JSON.stringify(settings);
    live.settings=settings;live.snapshot=snapshot;live.error=null;
    if(changed)live.incident=null;
    if(snapshot.assessment.status==='attention'&&(!live.incident||live.incident.status==='resolved'))live.incident={id:randomUUID(),status:'open',at:new Date().toISOString(),source:'Avalanche RPC',reason:'Reserve below target'};
    if(snapshot.assessment.status==='on-track'&&live.incident)live.incident.status='resolved';
    return snapshot;
  }catch(e){live.error=e.message;throw e;}
}
export function requireSnapshot(live){if(live.error||!fresh(live.snapshot))throw new Error('ข้อมูล live ยังไม่มี/เก่าเกิน 2 นาที หรือรีเฟรชล่าสุดล้มเหลว กรุณารีเฟรช wallet ก่อน');return live.snapshot;}
export function liveTools(live){return {
  get_wallet_snapshot:()=>requireSnapshot(live),
  assess_goal_risk:()=>{const s=requireSnapshot(live);return {...s.assessment,reserve:s.reserve.units,network:s.network,address:s.address,blockNumber:s.blockNumber,fetchedAt:s.fetchedAt,warnings:s.warnings,personalized:personalizedRisk(live)};},
  get_supply_events:()=>{requireSnapshot(live);if(!live.supply)return {status:'unavailable',source:'Tokenomist not configured',events:[]};if(Date.now()-Date.parse(live.supply.fetchedAt)>900000)return {status:'stale',events:[],source:'Tokenomist',note:'รีเฟรช supply ก่อน ข้อมูลเก่าเกิน 15 นาที'};return live.supply;},
  simulate_reserve_topup:({amount})=>{const s=requireSnapshot(live),n=parseUnits(String(amount),s.reserve.decimals);if(n<=0n)throw new Error(tr('จำนวนต้องมากกว่า 0'));const after=BigInt(s.reserve.rawBalance)+n,target=parseUnits(live.settings.target,s.reserve.decimals);return {amount:formatUnits(n,s.reserve.decimals),before:s.reserve.units,after:formatUnits(after,s.reserve.decimals),remaining:formatUnits(target>after?target-after:0n,s.reserve.decimals),unit:s.reserve.symbol,source:'Hypothetical calculation on live balance',executable:false,note:'ไม่ตรวจยอดกระเป๋าต้นทาง ยังไม่ใช่รายการโอน'};},
  prepare_reserve_transfer:()=>({status:'manual-review-required',source:'UI action',note:'เปิด Fuji transfer ในหน้า wallet: ผู้ใช้ต้องเลือกต้นทาง จำนวน และตรวจรายการก่อนลงนาม ไม่รองรับโอน Mainnet'}),
};}
export function liveReply(tool,result){
  if(tool==='get_supply_events')return ['Tokenomist: '+result.status,result.events?.length?result.events.slice(0,5).map(e=>`${e.symbol} · ${e.date.slice(0,10)} · ${e.amount??'ไม่ระบุจำนวน'} token · ความละเอียดวัน: ${e.precision}`).join('\n'):'ไม่พบ cliff event ในข้อมูลที่อ่านได้ ไม่ได้แปลว่าไม่มีการปล่อย supply',result.emissions?.length?'ยอด emission รวม cliff อยู่แล้ว ไม่ควรนำมาบวกซ้ำ':'',...(result.warnings||[]),'การ unlock ไม่ยืนยันว่าราคาจะลดลง'].filter(Boolean).join('\n');
  if(tool==='prepare_reserve_transfer')return 'เตรียมธุรกรรมจริงได้เฉพาะ test AVAX บน Fuji ผ่านส่วน Fuji transfer ครับ กรุณาเชื่อม wallet ต้นทาง ระบุจำนวน และตรวจปลายทางก่อนลงนาม ไม่มีการโอนจากคำสั่งแชตนี้';
  if(tool==='simulate_reserve_topup')return `หากเติม ${result.amount} ${result.unit} ยอดจะเปลี่ยนจาก ${result.before} เป็น ${result.after} และยังขาด ${result.remaining} เพื่อถึงเป้าหมาย เป็นการคำนวณสมมติบนยอดที่อ่านจริง ยังไม่ได้ตรวจยอดต้นทางหรือโอนเงิน`;
  if(tool==='get_wallet_snapshot')return `อ่าน wallet บน ${result.network} ที่ block ${result.blockNumber} แล้ว ยอดสินทรัพย์สำรองคือ ${result.reserve.units} ${result.reserve.symbol} รายการ token/history อาจไม่ครบหาก Data API มีข้อจำกัด`;
  return `ยอดสำรอง ${result.reserve} ${result.unit} เทียบเป้าหมาย ${result.target} ${result.unit} ${result.status==='attention'?'ยังขาด '+result.gap+' '+result.unit:'ถึงเป้าหมายแล้ว'} คำนวณจากยอด RPC ที่ block ${result.blockNumber} ไม่ได้ตีราคาเป็นเงินบาทหรือดอลลาร์\n${result.personalized?.reasons.filter(r=>r.type!=='reserve').map(r=>r.text).join('\n')||''}\n${result.personalized?.note||''}`.trim();
}
