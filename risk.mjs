import {fresh} from './avalanche.mjs';
export function personalizedRisk(live,now=Date.now()){
 const s=live.snapshot;if(!s)return {status:'unavailable',reasons:[],warnings:['ยังไม่มี wallet snapshot']};
 const reasons=[],warnings=[...s.warnings],valid=!live.error&&fresh(s);
 if(!valid)warnings.push('ยอด wallet เก่าหรืออ่านล่าสุดไม่สำเร็จ');
 const due=live.settings.dueDate?Date.parse(live.settings.dueDate+'T23:59:59+07:00'):now+30*86400000;
 if(valid&&s.assessment.status==='attention')reasons.push({type:'reserve',priority:'attention',text:`เงินสำรองขาด ${s.assessment.gap} ${s.reserve.symbol}`,source:'Avalanche RPC',fact:true});
 const supply=live.supply,usable=supply&&now-Date.parse(supply.fetchedAt)<900000&&['ok','partial'].includes(supply.status);
 const events=usable?supply.events.filter(e=>Date.parse(e.date)>=now&&Date.parse(e.date)<=due):[];
 for(const event of events)reasons.push({type:'supply',priority:'watch',text:`${event.symbol} มี cliff unlock ก่อนวันใช้เงิน (${event.date.slice(0,10)})`,eventId:event.id,precision:event.precision,source:'Tokenomist v5',fact:true});
 if(!usable)warnings.push('ยังไม่มี Tokenomist ที่สดและครอบคลุมสำหรับประเมิน supply');
 if(supply)warnings.push(...supply.warnings);
 const held=s.assets.filter(a=>BigInt(a.rawBalance||'0')>0n);
 const priced=held.filter(a=>a.usdValue!=null&&Number.isFinite(a.usdValue));const total=priced.reduce((n,a)=>n+a.usdValue,0);
 const coverageComplete=held.length>0&&priced.length===held.length&&!s.tokensTruncated&&s.indexerStatus==='ok';
 let concentration=null;if(total>0){const largest=[...priced].sort((a,b)=>b.usdValue-a.usdValue)[0];concentration={symbol:largest.symbol,share:Math.round(largest.usdValue/total*10000)/100,pricedAssets:priced.length,totalAssets:held.length,complete:coverageComplete,scope:coverageComplete?'Indexed wallet USD estimates':'Only assets with available USD estimates'};if(coverageComplete&&concentration.share>=70)reasons.push({type:'concentration',priority:'watch',text:`${largest.symbol} ประมาณ ${concentration.share}% ของมูลค่าที่ indexer รายงาน`,source:'Avalanche Data API USD estimates',fact:true});}
 return {status:!valid?'unavailable':reasons.some(r=>r.priority==='attention')?'attention':reasons.length?'watch':'no-trigger',goal:live.settings.goal||'เงินสำรอง',dueDate:live.settings.dueDate||null,reasons,warnings:[...new Set(warnings)],concentration,eventsBeforeGoal:events.length,note:'กติกาแจ้งให้ทบทวน ไม่ใช่คำทำนายราคา การ unlock ไม่ยืนยันว่าจะมีแรงขาย',source:'Deterministic personal rules',evaluatedAt:new Date(now).toISOString()};
}
