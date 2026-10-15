import {t as tr,language} from './locale.mjs';
import {withinBudget} from './agent-budget.mjs';
import {planningPrompt,answerPrompt} from './agent-prompts.mjs';
import {debugEvent,debugStep} from './debug.mjs';
import {randomUUID} from 'node:crypto';
import {ubot} from './providers.mjs';
import {formatUnits} from './avalanche.mjs';

export const AGENT_TOOLS={
 get_wallet:'Read current wallet balances and recent transfers. Refreshes live data.',
 assess_wallet:'Check concentration and coverage, with personal goal context. Not a security audit.',
 investigate_changes:'Compare current quantities and transactions to the last acknowledged briefing. Does not infer price movement.',
 search_tokens:'Find Tokenomist identities. args.query is a name or symbol, required.',
 research_token:'Read allocations, fundraising, buybacks, burns. args.tokenId must come from search_tokens or known wallet mapping.',
 get_supply_events:'Read upcoming supply events of mapped wallet holdings.',
 propose_watch:'DRAFT ONLY. args.kind: wallet_change, supply_event, review_date. args.label required; args.date YYYY-MM-DD required for review_date. Requires explicit UI confirmation.',
 list_watches:'Read saved watch rules and their monitoring scope.'
};
export function createAgentState(){return {history:[],baseline:null,rules:[],proposals:[],notifications:[],seenEvents:[],goal:{purpose:tr('ยังไม่ได้ระบุ'),horizon:tr('ยังไม่ได้ระบุ'),risk:tr('ยังไม่ได้ระบุ')},lastChecked:null};}
export function walletChanges(before,after){
 if(!after)return {status:'unavailable',changes:[],transfers:[],note:tr('ยังไม่ได้เชื่อมกระเป๋า')};
 if(!before||before.address!==after.address||before.chainId!==after.chainId)return {status:'baseline-needed',changes:[],transfers:[],note:tr('นี่เป็นการตรวจครั้งแรก ยังไม่มีข้อมูลก่อนหน้าให้เปรียบเทียบ')};
 const changes=[];
 for(const a of after.assets||[]){const old=before.assets?.find(b=>b.address===a.address);if(!old){changes.push({symbol:a.symbol,after:a.units,note:tr('เพิ่งอ่านพบสินทรัพย์นี้ ไม่ยืนยันว่าเพิ่งได้รับ')});continue;}
  if(old.decimals!==a.decimals)continue;
  const delta=BigInt(a.rawBalance)-BigInt(old.rawBalance);
  if(delta!==0n)changes.push({symbol:a.symbol,before:old.units,after:a.units,delta:(delta<0n?'-':'+')+formatUnits(delta<0n?-delta:delta,a.decimals)});
 }
 const hashes=new Set((before.transfers||[]).map(t=>t.hash));
 return {status:'compared',from:before.fetchedAt,to:after.fetchedAt,changes,transfers:(after.transfers||[]).filter(t=>!hashes.has(t.hash)).slice(0,15),note:tr('เปรียบเทียบจำนวนเหรียญ ไม่ใช่กำไรขาดทุน รายการที่เพิ่งอ่านพบอาจเป็นรายการเก่าจาก indexer; สินทรัพย์ที่อ่านไม่พบไม่ถือว่ายอดเป็นศูนย์')};
}
export function assessWallet(wallet,goal){
 if(!wallet)return {status:'unavailable',note:tr('ยังไม่ได้เชื่อมกระเป๋า'),goal};
 const held=wallet.assets.filter(a=>BigInt(a.rawBalance)>0n),complete=held.length>0&&wallet.indexerStatus==='ok'&&!wallet.tokensTruncated&&held.every(a=>a.usdValue!=null);
 const total=complete?held.reduce((s,a)=>s+a.usdValue,0):null;
 const largest=total>0?[...held].sort((a,b)=>b.usdValue-a.usdValue)[0]:null;
 return {goal,network:wallet.network,fetchedAt:wallet.fetchedAt,assetCount:held.length,concentration:largest?{symbol:largest.symbol,percent:Math.round(largest.usdValue/total*100)}:null,coverage:complete?'priced holdings available':tr('partial: ไม่สรุปสัดส่วนเมื่อมูลค่าหรือรายการไม่ครบ'),warnings:wallet.warnings||[],note:tr('ไม่ได้ตรวจ approvals หรือ DeFi positions และไม่รับรองความปลอดภัย; เป้าหมายเก็บออมอาจไม่เหมาะกับคริปโตที่ผันผวน')};
}
export function proposeWatch(agent,args,scope){
 args=validateToolArgs('propose_watch',args);
 const p={id:randomUUID(),kind:args.kind,label:args.label.trim(),date:args.kind==='review_date'?args.date:null,scope,createdAt:Date.now(),status:'draft'};
 agent.proposals=[p,...agent.proposals.filter(x=>x.status==='draft'&&Date.now()-x.createdAt<600000)].slice(0,8);return p;
}
export function confirmWatch(agent,id,scope){
 const p=agent.proposals.find(x=>x.id===id);
 if(!p||p.status!=='draft'||Date.now()-p.createdAt>600000)throw new Error(tr('ข้อเสนอหมดอายุหรือบันทึกไปแล้ว กรุณาสั่งใหม่'));
 if(p.scope!==scope)throw new Error(tr('กระเป๋าหรือโหมดเปลี่ยนแล้ว กรุณาสร้างเงื่อนไขใหม่'));
 if(agent.rules.filter(x=>x.active).length>=12)throw new Error(tr('รองรับเงื่อนไขที่เปิดอยู่ไม่เกิน 12 รายการ'));
 p.status='confirmed';const rule={...p,active:true,createdAt:new Date().toISOString(),baseline:null,seen:[]};agent.rules.push(rule);return rule;
}
export function evaluateWatches(agent,wallet,supply,scope,now=Date.now()){
 const additions=[];
 for(const rule of agent.rules.filter(r=>r.active&&r.scope===scope)){
  let events=[];
  if(rule.kind==='wallet_change'&&wallet){const d=walletChanges(rule.baseline,wallet);if(d.status==='compared'&&d.changes.length)events=[{key:wallet.fetchedAt,text:d.changes.map(c=>`${c.symbol}: ${c.before??'—'} → ${c.after}`).join(' · ')}];rule.baseline=structuredClone(wallet);}
  if(rule.kind==='supply_event'&&supply&&['ok','partial'].includes(supply.status))events=(supply.events||[]).map(e=>({key:e.id,messageKey:'{0} · กำหนดปลดล็อก {1} · ไม่ใช่การคาดการณ์ราคา',messageValues:[e.symbol,e.date.slice(0,10)]}));
  if(rule.kind==='review_date'&&now>=Date.parse(rule.date))events=[{key:rule.date,messageKey:'ถึงวันทบทวน: {0}',messageValues:[rule.label]}];
  rule.seen??=[];
  for(const event of events){if(rule.seen.includes(event.key))continue;rule.seen.push(event.key);additions.push({id:randomUUID(),ruleId:rule.id,label:rule.label,text:event.messageKey?tr(event.messageKey,...event.messageValues):event.text,...(event.messageKey?{messageKey:event.messageKey,messageValues:event.messageValues}:{}),at:new Date(now).toISOString(),scope});}
  rule.seen=rule.seen.slice(-150);
 }
 agent.notifications=[...additions,...agent.notifications].slice(0,60);agent.lastChecked=new Date(now).toISOString();return additions;
}
export class AgentPlanError extends Error {}
const invalid=message=>{throw new AgentPlanError(message);};
const plain=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
function fields(value,allowed){if(Object.keys(value).some(k=>!allowed.includes(k)))invalid('Unexpected JSON fields');}
export function validateToolArgs(tool,args){
 if(!Object.hasOwn(AGENT_TOOLS,tool)||!plain(args))invalid('Unknown tool or invalid args object');
 const allowed=tool==='search_tokens'?['query']:tool==='research_token'?['tokenId']:tool==='propose_watch'?['kind','label','date']:[];
 fields(args,allowed);
 if(tool==='search_tokens'){if(typeof args.query!=='string'||!args.query.trim()||args.query.length>120)invalid('query must be 1–120 characters');return {query:args.query.trim()};}
 if(tool==='research_token'){if(typeof args.tokenId!=='string'||! /^[a-zA-Z0-9_-]{1,120}$/.test(args.tokenId))invalid('tokenId must be an ID from search results');return {tokenId:args.tokenId};}
 if(tool==='propose_watch'){
  if(!['wallet_change','supply_event','review_date'].includes(args.kind))invalid('Unsupported watch kind');
  if(typeof args.label!=='string'||!args.label.trim()||args.label.length>160)invalid('Watch label must be 1–160 characters');
  if(args.kind==='review_date'){
   const date=args.date;if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date||Date.parse(date+'T00:00:00+07:00')+86400000<=Date.now())invalid('Review date must be a current/future YYYY-MM-DD date (Asia/Bangkok)');
  }else if(Object.hasOwn(args,'date'))invalid('date applies only to review_date');
  return {kind:args.kind,label:args.label.trim(),...(args.kind==='review_date'?{date:args.date}:{})};
 }
 return {};
}
const wantsWatch=text=>/ติดตาม|แจ้งเตือน|เตือน|watch|track|alert|notify|remind|monitor|text me/i.test(text);
export function unsupportedWatchReason(message){
 if(typeof message!=='string'||!wantsWatch(message))return null;
 if(/ราคา|กำไร|ขาดทุน|มูลค่า|price|profit|loss|valuation|portfolio value|worth|market.?cap|\b(?:below|above|over|under|at least|at most|more than|less than)\b|\d\s*%|เปอร์เซ็นต์|percent|threshold|เกิน|ต่ำกว่า|สูงกว่า|อย่างน้อย/i.test(message))return tr('ตอนนี้ยังติดตามราคา มูลค่าพอร์ต หรือเงื่อนไขตัวเลขไม่ได้ครับ จึงยังไม่ได้สร้างกฎให้ รองรับการเปลี่ยนจำนวนเหรียญทั้งกระเป๋า เหตุการณ์อุปทานของสินทรัพย์ที่จับคู่ไว้ และวันทบทวนเท่านั้น คุณต้องการติดตามแบบไหนครับ?');
 if(/sms|โทร|phone|call\b|email|อีเมล|line\b|telegram|push|ปิด(?:หน้า)?(?:เว็บ|แอป)|background|offline|(?:close[ds]?|shut).*?(?:page|app|browser)|text me|(?:app|page|browser).*?(?:closed|shut)/i.test(message))return tr('ตอนนี้กฎติดตามแจ้งในเว็บขณะเปิดหน้าไว้เท่านั้นครับ ยังส่ง SMS โทร อีเมล หรือแจ้งตอนปิดเว็บไม่ได้ จึงยังไม่ได้สร้างกฎแทนคำขอนี้');
 return null;
}
export function validateWatchIntent(args,message){
 const unsupported=unsupportedWatchReason(message)||unsupportedWatchReason('watch '+args.label);if(unsupported)throw new Error(unsupported);
 if(!wantsWatch(message)||/(?:ไม่ต้อง|อย่า|ไม่อยาก|do not|don.t|never)\s*(?:ช่วย|ให้|create|set|ติดตาม|เตือน|watch|track|notify|remind|alert|monitor)/i.test(message))throw new Error(tr('ยังไม่มีคำขอให้สร้างการติดตามอย่างชัดเจน กรุณาถามผู้ใช้ก่อน'));
 if((/เฉพาะ|เท่านั้น|เหรียญนี้|ตัวนี้|only|just|\b[A-Z][A-Z0-9]{1,9}\b/.test(message)||/\d/.test(message))&&args.kind!=='review_date')throw new Error(tr('กฎนี้ติดตามทั้งกระเป๋าหรือทุกสินทรัพย์ที่จับคู่ ยังจำกัดเฉพาะเหรียญหรือกรองเหตุการณ์ไม่ได้ กรุณายืนยันขอบเขตก่อน'));
 if(args.kind==='wallet_change'&&!/ยอด|จำนวน|กระเป๋า|สินทรัพย์|wallet|balance|holdings|assets/i.test(message))throw new Error(tr('กรุณาระบุว่าต้องการติดตามจำนวนเหรียญทั้งกระเป๋า'));
 if(args.kind==='wallet_change'&&/ปลดล็อก|อุปทาน|unlock|supply|emission/i.test(message))throw new Error(tr('เงื่อนไขอุปทานไม่ใช่เงื่อนไขยอดกระเป๋าเปลี่ยน'));
 if(args.kind==='supply_event'&&!/ปลดล็อก|อุปทาน|unlock|supply|emission/i.test(message))throw new Error(tr('ผู้ใช้ยังไม่ได้ขอติดตามเหตุการณ์อุปทาน'));
 if(args.kind==='review_date'){
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const tomorrow=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(Date.now()+86400000));
  if(!message.includes(args.date)&&!(/พรุ่งนี้|tomorrow/i.test(message)&&args.date===tomorrow)&&!(/วันนี้|today/i.test(message)&&args.date===today))throw new Error(tr('กรุณาระบุวันที่ทบทวน YYYY-MM-DD หรือวันนี้/พรุ่งนี้ให้ชัดเจนก่อนสร้างกฎ'));
 }
}
export function parseAgentStep(raw){
 if(typeof raw!=='string')invalid('Reply must be text containing JSON');
 const terminal=raw.trim().match(/^\{\s*"type"\s*:\s*"answer"\s*\}\s*([^{}][\s\S]*)$/);
 if(terminal)return {type:'answer',text:terminal[1].trim().slice(0,3500)};
 let step;try{step=JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,''));}catch{invalid('Invalid JSON');}
 if(!plain(step))invalid('Reply must be a JSON object');
 if(step.type==='answer'){fields(step,['type','text']);if(step.text!==undefined&&typeof step.text!=='string')invalid('Answer text must be a string');return {type:'answer',text:(step.text||'').trim().slice(0,3500)};}
 fields(step,['type','tool','args','finishAfterTool']);
 if(step.type!=='tool'||typeof step.tool!=='string')invalid('Expected tool or answer');
 if(step.finishAfterTool!==undefined&&typeof step.finishAfterTool!=='boolean')invalid('finishAfterTool must be boolean');
 return {type:'tool',tool:step.tool,args:validateToolArgs(step.tool,step.args),finishAfterTool:step.finishAfterTool===true};
}
function narrative(raw){
 const text=String(raw||'').trim();if(!text)throw new Error('Empty explanation');
 if(/^(?:```|\{)/.test(text)){const answer=parseAgentStep(text);if(answer.type!=='answer'||!answer.text)throw new Error('Explanation returned a tool plan');return answer.text;}
 return text.slice(0,4000);
}
export async function runAgent({message,config,agent,tools,context,call=ubot,maxSteps=5,budgetMs=170000,planningTimeoutMs=40000,answerTimeoutMs=55000}){
 if(typeof message!=='string'||!message.trim()||message.length>2000)throw new Error(tr('ข้อความต้องมี 1–2,000 ตัวอักษร'));
 const deadline=Date.now()+budgetMs,trace=[],evidence=[],proposals=[],warnings=[],seen=new Set();let text='',needsExplanation=false;
 const answerReserve=Math.min(answerTimeoutMs,Math.floor(budgetMs/3));
 const plannerDeadline=deadline-answerReserve;
 const ctx={...context,language:language(),today:new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()),timeZone:'Asia/Bangkok'};
 const warn=(message)=>{warnings.push(message);debugEvent('agent.warning','Partial completion',{message});};
 return withinBudget(deadline,async()=>{
  debugEvent('agent.start','Professional agent loop',{context:ctx,maxSteps,budgetMs,answerReserveMs:answerReserve});
  const unsupported=unsupportedWatchReason(message);
  if(unsupported){text=unsupported;debugEvent('agent.guard','Unsupported watch condition',{message});}
  for(let i=0;!text&&i<maxSteps;i++){
   if(Date.now()>plannerDeadline-1000){warn(tr('ถึงเวลาที่กันไว้สำหรับสรุปผล จึงหยุดค้นข้อมูลเพิ่ม'));needsExplanation=true;break;}
   let step,repair;
   for(let attempt=0;attempt<2;attempt++){
    const prompt=planningPrompt({message,context:ctx,history:agent.history,evidence,stepsLeft:maxSteps-i,repair});
    try{
     const raw=await withinBudget(plannerDeadline,()=>debugStep('model','U-bot Professional · choose next step',{step:i+1,attempt:attempt+1,prompt},()=>call(config,prompt,Math.max(1,Math.min(planningTimeoutMs,plannerDeadline-Date.now())))));
     step=parseAgentStep(raw);debugEvent('agent.decision','Validated JSON decision',{step:i+1,decision:step});break;
    }catch(e){
     const retry=e instanceof AgentPlanError&&attempt===0&&Date.now()<plannerDeadline-1000;
     debugEvent('agent.validation','Decision failed',{step:i+1,attempt:attempt+1,error:e.message,retry});
     if(retry){repair=e.message;continue;}
     if(!evidence.length)throw e;
     warn(tr('เลือกขั้นตอนต่อไม่สำเร็จ: ')+e.message);needsExplanation=true;break;
    }
   }
   if(!step)break;
   if(step.type==='answer'){if(!evidence.length&&step.text)text=step.text;else needsExplanation=true;break;}
   const signature=JSON.stringify([step.tool,step.args]);
   if(seen.has(signature)){debugEvent('agent.guard','Repeated tool call blocked',{tool:step.tool,args:step.args});warn(tr('หยุดเรียกเครื่องมือซ้ำ ใช้หลักฐานที่อ่านได้แล้ว'));needsExplanation=true;break;}seen.add(signature);
   if(Date.now()>=plannerDeadline){warn(tr('หมดเวลาสำหรับเรียกเครื่องมือเพิ่ม'));needsExplanation=true;break;}
   let result;
   try{
    if(step.tool==='propose_watch')validateWatchIntent(step.args,message);
    result=await withinBudget(plannerDeadline,()=>debugStep('tool',step.tool,step.args,()=>tools[step.tool](step.args)));
    if(step.tool==='propose_watch')proposals.push(result);
   }catch(e){result={status:'unavailable',error:e.message};debugEvent('agent.tool-error','Tool unavailable',{tool:step.tool,error:e.message});}
   evidence.push({tool:step.tool,result});trace.push({name:step.tool,source:context.dataMode==='demo'?tr('ข้อมูลจำลอง'):tr('ข้อมูลจากเครื่องมือ'),detail:JSON.stringify(result)});
   if(step.finishAfterTool&&step.tool!=='search_tokens'){needsExplanation=true;break;}
   if(i===maxSteps-1){warn(tr('ถึงจำนวนขั้นตอนสูงสุดของรอบนี้'));needsExplanation=true;}
  }
  if(!text&&(needsExplanation||evidence.length)){
   const prompt=answerPrompt({message,context:{...ctx,warnings},history:agent.history,evidence});
   try{if(Date.now()>=deadline)throw new Error(tr('หมดเวลาประมวลผล'));text=narrative(await debugStep('model','U-bot Professional · final explanation',{prompt},()=>call(config,prompt,Math.max(1,Math.min(answerTimeoutMs,deadline-Date.now())))));}
   catch(e){warn(tr('สรุปด้วย U-bot ไม่สำเร็จ: ')+e.message);}
  }
  if(!text)text=tr('ยังสรุปคำตอบให้ครบไม่ได้ในรอบนี้ครับ ดูผลที่อ่านได้ในหลักฐานด้านล่าง แล้วลองถามประเด็นที่ต้องการต่อได้ ไม่มีการโอน ซื้อขาย หรือเปิดกฎติดตามอัตโนมัติ');
  if(proposals.length)text+=tr('\n\nรายการติดตามนี้ยังเป็นร่างครับ ต้องกด “ยืนยันการติดตาม” ในแชตก่อนจึงจะเริ่มทำงาน');
  debugEvent('agent.answer','Final answer',{text,toolCount:evidence.length,warnings});
  agent.history.push({role:'user',text:message},{role:'assistant',text});agent.history=agent.history.slice(-12);
  return {text,trace,evidence,proposals,warnings,mode:'ubot',dataMode:context.dataMode};
 });
}
