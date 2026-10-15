import {createAgentState,walletChanges,assessWallet,proposeWatch,confirmWatch,evaluateWatches,runAgent} from './agent.mjs';
import {tokenCatalog,tokenApi} from './tokenomist.mjs';
import {parseUnits} from './avalanche.mjs';

const now=()=>new Date().toISOString();
export function createGuardian({saved,config,live,getDemo,getMode,refresh,persist,cloud,call}){
 const agent=Object.assign(createAgentState(),saved||{});
 const scope=()=>getMode()==='demo'?'demo':`${live.settings.chainId}:${live.settings.address}`;
 const monitoring=()=>cloud?'ตรวจเมื่อเปิดแอปหรือเมื่อแอปเจ้าบ้านเรียก check; ยังไม่ส่ง SMS/Push ตอนปิดเว็บ':'ตรวจทุกนาทีเมื่อ local server ทำงาน; แจ้งเตือนในแอป';
 function demoWallet(){const s=getDemo();return {address:'demo',chainId:'demo',network:'กระเป๋าจำลอง',fetchedAt:now(),indexerStatus:'ok',warnings:['ข้อมูลจำลองทั้งหมด ไม่ใช่ตลาดจริง'],assets:s.assets.map(a=>({address:a.symbol,symbol:a.symbol,name:a.name,decimals:6,units:String(a.units),rawBalance:parseUnits(String(a.units),6).toString(),usdValue:a.units*a.price})),transfers:s.history.filter(x=>x.kind==='agent-demo').map(x=>({hash:x.id,from:'demo',to:'demo-recipient',amount:'25',symbol:'USDC',timestamp:x.at}))};}
 const current=()=>getMode()==='demo'?demoWallet():live.snapshot;
 const summary=()=>({goal:agent.goal,rules:agent.rules.filter(r=>r.scope===scope()),notifications:agent.notifications.filter(n=>n.scope===scope()),lastChecked:agent.lastChecked,monitoring:monitoring(),history:agent.history,baselineAt:agent.baseline?.address===current()?.address?agent.baseline?.fetchedAt:null});
 async function check({refreshWallet=true}={}){
  if(getMode()==='live'&&refreshWallet){if(!live.settings.address)throw new Error('เชื่อม public wallet ในการตั้งค่าก่อน');await refresh();}
  const newNotifications=evaluateWatches(agent,current(),getMode()==='live'?live.supply:null,scope());await persist();return {...summary(),newNotifications};
 }
 async function brief(){await check();const wallet=current(),changes=walletChanges(agent.baseline,wallet);const health=assessWallet(wallet,agent.goal);
  const text=changes.status==='baseline-needed'?'ยินดีที่ได้รู้จักครับ นี่คือข้อมูลกระเป๋าที่อ่านได้ครั้งแรก เริ่มจากตรวจสุขภาพ ถามเรื่องเหรียญที่สนใจ หรือฝากผมติดตามได้เลย':changes.changes.length?`พบจำนวนเหรียญเปลี่ยนไป ${changes.changes.length} รายการครับ เปิดดูหลักฐานด้านล่าง หรือถามผมให้เจาะรายการที่สนใจได้เลย`:'จากสินทรัพย์ที่อ่านได้ จำนวนเหรียญยังเท่าเดิมเมื่อเทียบกับรายงานครั้งก่อนครับ ถ้าต้องการดูรายละเอียด ถามผมต่อได้เลย';
  const result={text:(getMode()==='demo'?'นี่เป็นการสาธิตด้วยข้อมูลจำลองครับ ':'')+text,evidence:[{tool:'investigate_changes',result:changes},{tool:'assess_wallet',result:health}],proposals:[],trace:[],mode:'briefing',dataMode:getMode()};
  // Acknowledge only the snapshot actually included in this returned briefing.
  agent.pendingBrief={wallet,at:now()};await persist();return result;
 }
 async function acknowledge(){if(agent.pendingBrief){agent.baseline=agent.pendingBrief.wallet;agent.pendingBrief=null;await persist();}return summary();}
 async function message(message){
  let refreshed=false;const known=new Set(getMode()==='live'?(live.supply?.coverage||[]).map(x=>x.tokenId).filter(Boolean):['avalanche-2','usd-coin']);
  const wallet=async()=>{if(!refreshed){if(getMode()==='live'){if(!live.settings.address)throw new Error('ยังไม่ได้เชื่อม public wallet');await refresh();}refreshed=true;}return current();};
  const tools={
   get_wallet:wallet,
   assess_wallet:async()=>assessWallet(await wallet(),agent.goal),
   investigate_changes:async()=>walletChanges(agent.baseline,await wallet()),
   get_supply_events:async()=>{await wallet();return getMode()==='live'?live.supply:{status:'demo',source:'ข้อมูลจำลอง',note:'ตาราง supply ในโหมดนี้ไม่ใช่กำหนดการจริง',events:getDemo().events};},
   search_tokens:async({query})=>{if(getMode()==='demo')return {source:'Demo identities',tokens:[{id:'avalanche-2',name:'Avalanche',symbol:'AVAX'},{id:'usd-coin',name:'USD Coin',symbol:'USDC'}].filter(t=>JSON.stringify(t).toLowerCase().includes(query.toLowerCase()))};const list=await tokenCatalog(config.tokenomistKey);const matches=list.data.filter(t=>`${t.name} ${t.symbol} ${t.id}`.toLowerCase().includes(query.toLowerCase())).slice(0,10);matches.forEach(t=>known.add(t.id));return {source:'Tokenomist v5',fetchedAt:list.fetchedAt,tokens:matches,note:'ยืนยันชื่อโครงการก่อนใช้ ข้อมูลนี้ไม่ใช่ contract mapping'};},
   research_token:async({tokenId})=>{if(!known.has(tokenId))throw new Error('ค้นหาและเลือกตัวตนของเหรียญก่อน');if(getMode()==='demo')return {source:'ข้อมูลจำลอง',tokenId,note:'ตัวอย่าง: ควรพิจารณาการจัดสรร อุปทาน และความผันผวน ไม่มีข้อมูลตลาดจริงให้แนะนำซื้อขาย'};
    const paths={allocations:`/v5/allocations/${tokenId}`,fundraising:`/v5/fundraising/token/${tokenId}`,buybacks:`/v5/buyback/${tokenId}`,burns:`/v5/burn/${tokenId}`};
    const rows=await Promise.allSettled(Object.entries(paths).map(async([name,path])=>({name,...await tokenApi(config.tokenomistKey,path,fetch,300000,true)})));
    return {source:'Tokenomist v5',tokenId,sourceUrl:'https://tokenomist.ai/'+encodeURIComponent(tokenId),datasets:rows.map((r,i)=>r.status==='fulfilled'?{name:r.value.name,fetchedAt:r.value.fetchedAt,data:r.value.data}:{name:Object.keys(paths)[i],status:'unavailable',error:r.reason.message}),note:'สิทธิ์และความครอบคลุมต่างกันตามชุดข้อมูล; buyback ไม่เท่ากับ burn; allocations ไม่ใช่รายชื่อผู้ถือปัจจุบัน; ไม่มีข้อมูลตลาดเพียงพอสำหรับจังหวะซื้อขาย'};},
   propose_watch:args=>{if(getMode()==='live'&&!live.settings.address&&args.kind!=='review_date')throw new Error('เชื่อมกระเป๋าก่อนตั้งเงื่อนไขติดตามกระเป๋าหรือ supply');return {...proposeWatch(agent,args,scope()),monitoring:monitoring()};},
   list_watches:()=>summary()
  };
  let result;
  if(config.mode==='ubot')result=await runAgent({message,config,agent,tools,context:{dataMode:getMode(),goal:agent.goal,wallet:live.settings.address||null,monitoring:monitoring()},maxSteps:5,...(call?{call}:{})});
  else{
   if(typeof message!=='string'||!message.trim()||message.length>2000)throw new Error('ระบุข้อความไม่เกิน 2,000 ตัวอักษร');
   const tool=/ติดตาม|เตือน|watch/i.test(message)?'propose_watch':/เปลี่ยน|เกิดอะไร|change/i.test(message)?'investigate_changes':/ซื้อ|ขาย|เก็บออม|ถือ|ลงทุน/i.test(message)?null:'assess_wallet';
   const evidence=tool?[{tool,result:await tools[tool](tool==='propose_watch'?{kind:'wallet_change',label:'แจ้งเมื่อจำนวนสินทรัพย์ในกระเป๋าเปลี่ยน'}:{})}]:[];
   result={text:tool==='propose_watch'?'ผมเตรียมเงื่อนไขติดตามไว้แล้วครับ ตรวจขอบเขตด้านล่างก่อนกดบันทึก':tool==='investigate_changes'?'เทียบจำนวนเหรียญกับรายงานที่รับทราบครั้งก่อนแล้วครับ ดูรายการด้านล่างได้เลย':tool?'ตรวจข้อมูลที่มีให้แล้วครับ การตรวจนี้ยังไม่ครอบคลุมสิทธิ์ใช้เหรียญและสถานะ DeFi':'คุณตั้งใจถือประมาณนานแค่ไหน และเงินส่วนนี้ต้องใช้เมื่อไรครับ? เปิด U-bot ในการตั้งค่าเพื่อคุยและค้นข้อมูล Tokenomist จริง โหมดตัวอย่างนี้ไม่แนะนำเหรียญหรือจังหวะซื้อขาย',evidence,proposals:tool==='propose_watch'?[evidence[0].result]:[],trace:evidence.map(e=>({name:e.tool,source:'Local rules · '+getMode(),detail:JSON.stringify(e.result)})),mode:'demo',dataMode:getMode()};
   agent.history.push({role:'user',text:message},{role:'assistant',text:result.text});agent.history=agent.history.slice(-12);
  }
  // A failed refresh must not generate alerts from the retained, stale snapshot.
  if(getMode()==='demo'||!live.error)await check({refreshWallet:false});await persist();return result;
 }
 return {agent,summary,current,check,brief,acknowledge,message,async confirm(id){const r=confirmWatch(agent,id,scope());r.baseline=current()?structuredClone(current()):null;await persist();return summary();},async remove(id){const r=agent.rules.find(r=>r.id===id&&r.scope===scope());if(!r)throw new Error('ไม่พบเงื่อนไข');r.active=false;await persist();return summary();},async goal(p){for(const k of ['purpose','horizon','risk']){if(typeof p[k]!=='string'||p[k].length>180)throw new Error('ข้อมูลเป้าหมายไม่ถูกต้อง');}agent.goal={purpose:p.purpose,horizon:p.horizon,risk:p.risk};await persist();return summary();}};
}
