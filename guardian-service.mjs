import {t as tr,language} from './locale.mjs';
import {debugEvent,debugStep} from './debug.mjs';
import {createAgentState,walletChanges,assessWallet,proposeWatch,confirmWatch,evaluateWatches,runAgent,unsupportedWatchReason,validateWatchIntent} from './agent.mjs';
import {tokenCatalog,tokenApi} from './tokenomist.mjs';
import {parseUnits} from './avalanche.mjs';

const now=()=>new Date().toISOString();
export function createGuardian({saved,config,live,getDemo,getMode,refresh,persist,cloud,call}){
 const agent=Object.assign(createAgentState(),saved||{});
 const scope=()=>getMode()==='demo'?'demo':`${live.settings.chainId}:${live.settings.address}`;
 const monitoring=()=>cloud?tr('ตรวจทุกนาทีขณะเปิดหน้าเว็บ; ยังไม่ส่ง SMS/Push ตอนปิดเว็บ'):tr('ตรวจทุกนาทีเมื่อ local server ทำงาน; แจ้งเตือนในแอป');
 function demoWallet(){const s=getDemo();return {address:'demo',chainId:'demo',network:tr('กระเป๋าจำลอง'),fetchedAt:now(),indexerStatus:'ok',warnings:[tr('ข้อมูลจำลองทั้งหมด ไม่ใช่ตลาดจริง')],assets:s.assets.map(a=>({address:a.symbol,symbol:a.symbol,name:a.name,decimals:6,units:String(a.units),rawBalance:parseUnits(String(a.units),6).toString(),usdValue:a.units*a.price})),transfers:s.history.filter(x=>x.kind==='agent-demo').map(x=>({hash:x.id,from:'demo',to:'demo-recipient',amount:'25',symbol:'USDC',timestamp:x.at}))};}
 const current=()=>getMode()==='demo'?demoWallet():live.snapshot;
 const summary=()=>({goal:agent.goal,rules:agent.rules.filter(r=>r.scope===scope()),notifications:agent.notifications.filter(n=>n.scope===scope()).map(n=>({...n,text:n.messageKey?tr(n.messageKey,...n.messageValues):n.text})),lastChecked:agent.lastChecked,monitoring:monitoring(),history:agent.history,baselineAt:agent.baseline?.address===current()?.address?agent.baseline?.fetchedAt:null});
 async function check({refreshWallet=true}={}){
  if(getMode()==='live'&&refreshWallet){if(!live.settings.address)throw new Error(tr('เชื่อม public wallet ในการตั้งค่าก่อน'));await debugStep('process','Refresh wallet and supply',{},refresh);}
  debugEvent('process.start','Evaluate watches',{scope:scope(),refreshWallet});
  const newNotifications=evaluateWatches(agent,current(),getMode()==='live'?live.supply:null,scope());debugEvent('process.result','Evaluate watches',{newNotifications});await debugStep('process','Save session',{},persist);return {...summary(),newNotifications};
 }
 async function brief(){debugEvent('agent.start','Local briefing (no U-bot call)',{dataMode:getMode()});await check();const wallet=current(),changes=walletChanges(agent.baseline,wallet);const health=assessWallet(wallet,agent.goal);
  const text=changes.status==='baseline-needed'?tr('ยินดีที่ได้รู้จักครับ นี่คือข้อมูลกระเป๋าที่อ่านได้ครั้งแรก เริ่มจากตรวจสุขภาพ ถามเรื่องเหรียญที่สนใจ หรือฝากผมติดตามได้เลย'):changes.changes.length?tr('พบจำนวนเหรียญเปลี่ยนไป {0} รายการครับ เปิดดูหลักฐานด้านล่าง หรือถามผมให้เจาะรายการที่สนใจได้เลย',changes.changes.length):tr('จากสินทรัพย์ที่อ่านได้ จำนวนเหรียญยังเท่าเดิมเมื่อเทียบกับรายงานครั้งก่อนครับ ถ้าต้องการดูรายละเอียด ถามผมต่อได้เลย');
  const result={text:(getMode()==='demo'?tr('นี่เป็นการสาธิตด้วยข้อมูลจำลองครับ '):'')+text,evidence:[{tool:'investigate_changes',result:changes},{tool:'assess_wallet',result:health}],proposals:[],trace:[],mode:'briefing',dataMode:getMode()};
  debugEvent('tool.result','investigate_changes',{result:changes});debugEvent('tool.result','assess_wallet',{result:health});debugEvent('agent.answer','Local briefing',{text:result.text});
  // Acknowledge only the snapshot actually included in this returned briefing.
  agent.pendingBrief={wallet,at:now()};await debugStep('process','Save session',{},persist);return result;
 }
 async function acknowledge(){if(agent.pendingBrief){agent.baseline=agent.pendingBrief.wallet;agent.pendingBrief=null;await debugStep('process','Save session',{},persist);}return summary();}
 async function message(message){
  if(typeof message!=='string'||!message.trim()||message.length>2000)throw new Error(tr('ข้อความต้องมี 1–2,000 ตัวอักษร'));
  let refreshed=false;const known=new Set(getMode()==='live'?(live.supply?.coverage||[]).map(x=>x.tokenId).filter(Boolean):['avalanche-2','usd-coin']);
  const wallet=async()=>{if(!refreshed){if(getMode()==='live'){if(!live.settings.address)throw new Error(tr('ยังไม่ได้เชื่อม public wallet'));await debugStep('process','Refresh wallet and supply',{},refresh);}refreshed=true;}return current();};
  const tools={
   get_wallet:wallet,
   assess_wallet:async()=>assessWallet(await wallet(),agent.goal),
   investigate_changes:async()=>walletChanges(agent.baseline,await wallet()),
   get_supply_events:async()=>{await wallet();return getMode()==='live'?live.supply:{status:'demo',source:tr('ข้อมูลจำลอง'),note:tr('ตาราง supply ในโหมดนี้ไม่ใช่กำหนดการจริง'),events:getDemo().events};},
   search_tokens:async({query})=>{if(getMode()==='demo')return {source:'Demo identities',tokens:[{id:'avalanche-2',name:'Avalanche',symbol:'AVAX'},{id:'usd-coin',name:'USD Coin',symbol:'USDC'}].filter(t=>JSON.stringify(t).toLowerCase().includes(query.toLowerCase()))};const list=await tokenCatalog(config.tokenomistKey);const matches=list.data.filter(t=>`${t.name} ${t.symbol} ${t.id}`.toLowerCase().includes(query.toLowerCase())).slice(0,10);matches.forEach(t=>known.add(t.id));return {source:'Tokenomist v5',fetchedAt:list.fetchedAt,tokens:matches,note:tr('ยืนยันชื่อโครงการก่อนใช้ ข้อมูลนี้ไม่ใช่ contract mapping')};},
   research_token:async({tokenId})=>{if(!known.has(tokenId))throw new Error(tr('ค้นหาและเลือกตัวตนของเหรียญก่อน'));if(getMode()==='demo')return {source:tr('ข้อมูลจำลอง'),tokenId,note:tr('ตัวอย่าง: ควรพิจารณาการจัดสรร อุปทาน และความผันผวน ไม่มีข้อมูลตลาดจริงให้แนะนำซื้อขาย')};
    const paths={allocations:`/v5/allocations/${tokenId}`,fundraising:`/v5/fundraising/token/${tokenId}`,buybacks:`/v5/buyback/${tokenId}`,burns:`/v5/burn/${tokenId}`};
    const rows=await Promise.allSettled(Object.entries(paths).map(async([name,path])=>({name,...await tokenApi(config.tokenomistKey,path,fetch,300000,true)})));
    return {source:'Tokenomist v5',tokenId,sourceUrl:'https://tokenomist.ai/'+encodeURIComponent(tokenId),datasets:rows.map((r,i)=>r.status==='fulfilled'?{name:r.value.name,fetchedAt:r.value.fetchedAt,data:r.value.data}:{name:Object.keys(paths)[i],status:'unavailable',error:r.reason.message}),note:tr('สิทธิ์และความครอบคลุมต่างกันตามชุดข้อมูล; buyback ไม่เท่ากับ burn; allocations ไม่ใช่รายชื่อผู้ถือปัจจุบัน; ไม่มีข้อมูลตลาดเพียงพอสำหรับจังหวะซื้อขาย')};},
   propose_watch:args=>{validateWatchIntent(args,message);if(getMode()==='live'&&!live.settings.address&&args.kind!=='review_date')throw new Error(tr('เชื่อมกระเป๋าก่อนตั้งเงื่อนไขติดตามกระเป๋าหรือ supply'));return {...proposeWatch(agent,args,scope()),monitoring:monitoring()};},
   list_watches:()=>summary()
  };
  let result;
  const unsupported=unsupportedWatchReason(message);
  if(unsupported){result={text:unsupported,trace:[],evidence:[],proposals:[],mode:'capability-check',dataMode:getMode()};debugEvent('agent.guard','Unsupported watch condition',{message});agent.history.push({role:'user',text:message},{role:'assistant',text:unsupported});agent.history=agent.history.slice(-12);}
  else if(config.mode==='ubot')result=await runAgent({message,config,agent,tools,context:{language:language(),dataMode:getMode(),goal:agent.goal,wallet:live.settings.address||null,monitoring:monitoring()},maxSteps:5,...(call?{call}:{})});
  else{
   if(typeof message!=='string'||!message.trim()||message.length>2000)throw new Error(tr('ระบุข้อความไม่เกิน 2,000 ตัวอักษร'));
   const tool=/ติดตาม|เตือน|watch|track|alert|notify|remind|monitor/i.test(message)?'propose_watch':/เปลี่ยน|เกิดอะไร|change/i.test(message)?'investigate_changes':/ซื้อ|ขาย|เก็บออม|ถือ|ลงทุน|buy|sell|invest|sav(?:e|ing)|hold|research|tokenomics|allocation|fundrais|buyback|burn/i.test(message)?null:'assess_wallet';
   debugEvent('agent.decision','Local demo rules (no U-bot call)',{tool,dataMode:getMode()});
   const evidence=tool?[{tool,result:await debugStep('tool',tool,tool==='propose_watch'?{kind:'wallet_change',label:tr('แจ้งเมื่อจำนวนสินทรัพย์ในกระเป๋าเปลี่ยน')}:{},()=>tools[tool](tool==='propose_watch'?{kind:'wallet_change',label:tr('แจ้งเมื่อจำนวนสินทรัพย์ในกระเป๋าเปลี่ยน')}:{}))}]:[];
   result={text:tool==='propose_watch'?tr('ผมเตรียมเงื่อนไขติดตามไว้แล้วครับ ตรวจขอบเขตด้านล่างก่อนกดบันทึก'):tool==='investigate_changes'?tr('เทียบจำนวนเหรียญกับรายงานที่รับทราบครั้งก่อนแล้วครับ ดูรายการด้านล่างได้เลย'):tool?tr('ตรวจข้อมูลที่มีให้แล้วครับ การตรวจนี้ยังไม่ครอบคลุมสิทธิ์ใช้เหรียญและสถานะ DeFi'):tr('คุณตั้งใจถือประมาณนานแค่ไหน และเงินส่วนนี้ต้องใช้เมื่อไรครับ? เปิด U-bot ในการตั้งค่าเพื่อคุยและค้นข้อมูล Tokenomist จริง โหมดตัวอย่างนี้ไม่แนะนำเหรียญหรือจังหวะซื้อขาย'),evidence,proposals:tool==='propose_watch'?[evidence[0].result]:[],trace:evidence.map(e=>({name:e.tool,source:'Local rules · '+getMode(),detail:JSON.stringify(e.result)})),mode:'demo',dataMode:getMode()};
   debugEvent('agent.answer','Local answer',{text:result.text});
   agent.history.push({role:'user',text:message},{role:'assistant',text:result.text});agent.history=agent.history.slice(-12);
  }
  // A failed refresh must not generate alerts from the retained, stale snapshot.
  if(getMode()==='demo'||!live.error)await check({refreshWallet:false});await debugStep('process','Save session',{},persist);return result;
 }
 return {agent,summary,current,check,brief,acknowledge,message,async confirm(id){const r=confirmWatch(agent,id,scope());r.baseline=current()?structuredClone(current()):null;await debugStep('process','Save session',{},persist);return summary();},async remove(id){const r=agent.rules.find(r=>r.id===id&&r.scope===scope());if(!r)throw new Error(tr('ไม่พบเงื่อนไข'));r.active=false;await debugStep('process','Save session',{},persist);return summary();},async goal(p){for(const k of ['purpose','horizon','risk']){if(typeof p[k]!=='string'||p[k].length>180)throw new Error(tr('ข้อมูลเป้าหมายไม่ถูกต้อง'));}agent.goal={purpose:p.purpose,horizon:p.horizon,risk:p.risk};await debugStep('process','Save session',{},persist);return summary();}};
}
