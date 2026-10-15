import {language} from './locale.mjs';
export const say=(en,th)=>language()==='th'?th:en;
export const extendedWatchKinds=['price_change','transfer_value'];
export const unitPrice=asset=>Number.isFinite(asset?.priceUsd)&&asset.priceUsd>0?asset.priceUsd:null;
export function validateExtendedWatch(args){
 const allowed=args.kind==='price_change'?['kind','label','assetId','percent','direction']:['kind','label','usd','direction'];
 if(Object.keys(args).some(k=>!allowed.includes(k)))throw new Error('Unexpected watch arguments');
 if(typeof args.label!=='string'||!args.label.trim()||args.label.length>160)throw new Error('Watch label must be 1–160 characters');
 if(args.kind==='price_change'){
  if(typeof args.assetId!=='string'||! /^(native|AVAX|USDC|0x[0-9a-fA-F]{40})$/.test(args.assetId))throw new Error('assetId must come from get_wallet');
  if(!Number.isFinite(args.percent)||args.percent<=0||args.percent>100||!['up','down'].includes(args.direction))throw new Error('Price percent must be >0 and <=100, direction up/down');
 }else if(!Number.isFinite(args.usd)||args.usd<=0||args.usd>1e12||!['incoming','outgoing','any'].includes(args.direction))throw new Error('Transfer USD threshold must be positive, direction incoming/outgoing/any');
 return {...args,label:args.label.trim()};
}
export function validateExtendedIntent(args,message){
 if(args.kind==='price_change'&&/24\s*h|24\s*ชั่วโมง|daily|yesterday|peak|\bhigh\b|since.*(?:yesterday|week)|วันก่อน|จุดสูงสุด/i.test(message))throw new Error(say('Price watches compare with the quote at activation, not a rolling 24-hour or peak price. Please confirm that basis.','กฎราคาเทียบกับราคาตอนยืนยันเริ่มติดตาม ยังไม่ใช่ราคา 24 ชั่วโมงหรือจุดสูงสุด กรุณายืนยันฐานที่ต้องการ'));
 if(args.kind==='price_change'){
  const match=message.match(/(\d+(?:\.\d+)?)\s*(?:%|percent|เปอร์เซ็นต์)/i);
  if(!match||Number(match[1])!==args.percent||!/price|ราคา/i.test(message))throw new Error('Specify the exact price percentage in your request.');
  const down=/drop|fall|decreas|down|ลด|ตก/i.test(message),up=/ris(?:e|es)|increas|up|ขึ้น|เพิ่ม/i.test(message);
  if((args.direction==='down'&&!down)||(args.direction==='up'&&!up)||(down&&up))throw new Error('Specify one direction: price rises or falls.');
 }else{
  const match=message.match(/\$\s*([\d,]+(?:\.\d+)?)/)||message.match(/([\d,]+(?:\.\d+)?)\s*(?:USD|dollars?|ดอลลาร์)/i);
  if(!match||Number(match[1].replaceAll(',',''))!==args.usd||!/transfer|transaction|โอน|ธุรกรรม/i.test(message))throw new Error('Specify a transfer threshold in USD, for example $100.');
  if(/below|under|less than|at least|at most|ต่ำกว่า|น้อยกว่า|อย่างน้อย|ไม่เกิน/i.test(message)||!/over|above|exceed|greater than|more than|เกิน|มากกว่า/i.test(message))throw new Error(say('Transfer watches currently support amounts strictly over a USD threshold.','กฎธุรกรรมรองรับเฉพาะมูลค่ามากกว่าเกณฑ์ USD'));
  if(/only|except|excluding|contract|0x[a-f0-9]{40}|เฉพาะ|ยกเว้น/i.test(message))throw new Error(say('Token, address and exception filters are not supported for transfer watches. This rule covers all priced wallet assets.','กฎธุรกรรมยังไม่รองรับการกรองเหรียญ ที่อยู่ หรือข้อยกเว้น กฎนี้ครอบคลุมสินทรัพย์ในกระเป๋าที่มีราคา'));
  const out=/outgoing|sent|send|โอนออก/i.test(message),inc=/incoming|received|receive|โอนเข้า/i.test(message);
  if((out&&!inc&&args.direction!=='outgoing')||(inc&&!out&&args.direction!=='incoming')||(!out&&!inc&&args.direction!=='any'))throw new Error('Transfer direction must match the request.');
 }
}
export function validateWatchWallet(args,wallet,message=''){
 if(!wallet||wallet.chainId==='43113')throw new Error(say('USD price/transfer watches require a priced Mainnet wallet or Demo data. Fuji has no real USD valuation.','กฎราคาและมูลค่า USD ต้องใช้ Mainnet ที่มีราคา หรือ Demo เท่านั้น Fuji ไม่มีมูลค่าเงินจริง'));
 if(args.kind==='price_change'){
  const asset=wallet.assets.find(a=>a.address===args.assetId);
  if(!asset||unitPrice(asset)===null)throw new Error(say('No usable USD quote for that exact wallet asset.','ไม่มีราคา USD ที่ใช้ได้สำหรับสินทรัพย์นี้ในกระเป๋า'));
  if(message){const text=message.toLowerCase();if(![asset.address,asset.symbol,asset.name].filter(Boolean).some(x=>text.includes(x.toLowerCase())))throw new Error('Name the wallet asset explicitly before creating its price watch.');}
  return {symbol:asset.symbol,quote:unitPrice(asset),basis:say('USD unit-price estimate at confirmation; not a 24h change. One alert per threshold crossing.','ราคา USD ต่อเหรียญตอนกดยืนยัน ไม่ใช่การเปลี่ยนแปลง 24 ชั่วโมง แจ้งเมื่อข้ามเกณฑ์')};
 }
 if(message&&(wallet.assets||[]).some(a=>[a.symbol,a.name].filter(x=>typeof x==='string'&&x.length>=3).some(x=>new RegExp('(^|[^a-z0-9])'+x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'([^a-z0-9]|$)','i').test(message))))throw new Error(say('Transfer watches cover all priced wallet assets; a coin-specific filter is not supported.','กฎธุรกรรมครอบคลุมทุกสินทรัพย์ในกระเป๋าที่มีราคา ยังไม่รองรับการกรองเหรียญ'));
 return {basis:say('New successful indexed transfers, estimated at the latest observed unit price, not historical execution value or a fraud verdict.','รายการโอนสำเร็จใหม่ที่อ่านพบ ประเมินด้วยราคาล่าสุด ไม่ใช่มูลค่าตอนโอนหรือคำตัดสินว่าโกง')};
}
export const transferKey=x=>[x.hash,x.assetId||x.symbol,x.logIndex??'',x.from,x.to,x.amount].join(':');
export function timestampMs(value){if(value==null)return null;const n=Number(value);const ms=Number.isFinite(n)?(n<1e12?n*1000:n):Date.parse(value);return Number.isFinite(ms)?ms:null;}
export function extendedEvents(rule,wallet,now=Date.now()){
 const fetched=Date.parse(wallet?.fetchedAt);
 if(!wallet||wallet.chainId==='43113'||!Number.isFinite(fetched)||now-fetched>120000||fetched>now+60000)return [];
 if(rule.kind==='price_change'){
  const price=unitPrice(wallet.assets.find(a=>a.address===rule.assetId));if(price===null||!rule.referencePrice)return [];
  const delta=(price/rule.referencePrice-1)*100,hit=rule.direction==='down'?delta<=-rule.percent+1e-9:delta>=rule.percent-1e-9;
  if(!hit){rule.breached=false;return [];}if(rule.breached)return [];rule.breached=true;
  return [{key:'price:'+wallet.fetchedAt,text:say(`${rule.symbol}: estimated USD price changed ${delta.toFixed(2)}% from $${rule.referencePrice} to $${price}.`,`${rule.symbol}: ราคา USD โดยประมาณเปลี่ยน ${delta.toFixed(2)}% จาก $${rule.referencePrice} เป็น $${price}`)}];
 }
 const seen=new Set(rule.observedTransfers||[]),all=wallet.transfers||[];
 const events=all.flatMap(x=>{
  if(seen.has(transferKey(x)))return [];
  const at=timestampMs(x.timestamp);if(at===null||at<Date.parse(rule.createdAt)||at>now+60000||!['1','0x1','success','successful'].includes(String(x.status).toLowerCase()))return [];
  const from=String(x.from).toLowerCase(),to=String(x.to).toLowerCase(),owner=wallet.address.toLowerCase();
  if(from===to||!([from,to].includes(owner))||(rule.direction==='outgoing'&&from!==owner)||(rule.direction==='incoming'&&to!==owner))return [];
  const asset=wallet.assets.find(a=>a.address===x.assetId),price=unitPrice(asset),amount=Number(x.amount),value=price*amount;
  if(price===null||!Number.isFinite(amount)||amount<=0||!Number.isFinite(value))return [];
  // A pending or unpriced observation must not consume the eventual successful event.
  // Once valued, even a below-threshold transfer is consumed: later price rises cannot turn it into a new transfer.
  seen.add(transferKey(x));if(value<=rule.usd)return [];
  return [{key:transferKey(x),text:say(`Transfer ${x.amount} ${asset.symbol} exceeds $${rule.usd}: approximately $${value.toFixed(2)} at the current observed price. Review transaction ${x.hash}. This is a threshold alert, not a fraud finding.`,`รายการโอน ${x.amount} ${asset.symbol} เกิน $${rule.usd}: ประมาณ $${value.toFixed(2)} ตามราคาที่อ่านล่าสุด ตรวจธุรกรรม ${x.hash} นี่เป็นการแจ้งเกณฑ์ ไม่ใช่ข้อสรุปว่าโกง`)}];
 });
 rule.observedTransfers=[...seen].slice(-300);return events;
}
export function priceChanges(before,after){
 if(!before||!after||before.address!==after.address||before.chainId!==after.chainId)return [];
 return after.assets.flatMap(a=>{const old=before.assets.find(b=>b.address===a.address),p=unitPrice(a),q=unitPrice(old);return p!==null&&q!==null&&Math.abs(p/q-1)>0.000001?[{assetId:a.address,symbol:a.symbol,beforeUsd:q,afterUsd:p,percent:(p/q-1)*100,source:a.priceSource||'Demo unit price'}]:[];});
}
