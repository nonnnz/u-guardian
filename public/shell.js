import './guardian-widget.js';
const widget=document.querySelector('u-guardian');
const $=id=>document.getElementById(id);
const node=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;return e;};
function render(s){if(!$('assets'))return;
 const live=s.dataMode==='live',wallet=s.live.snapshot;
 $('mode').textContent=live?'LIVE':'DEMO';$('network').textContent=live?(wallet?.network||'ยังไม่เชื่อมกระเป๋า'):'กระเป๋าตัวอย่าง · ข้อมูลจำลอง';$('address').textContent=live?s.live.settings.address:'ไม่มีการใช้เงินจริง';
 $('assets').replaceChildren();const assets=live?(wallet?.assets||[]):s.assets;
 for(const a of assets.slice(0,8)){const row=node('div','');row.className='asset';const name=node('div','');name.append(node('strong',a.symbol),node('small',a.name));const amount=node('span',String(a.units));amount.className='amount';row.append(name,amount);$('assets').append(row);}
 if(!assets.length)$('assets').append(node('p','เชื่อม public wallet ในหน้าการเชื่อมต่อเพื่อเริ่มตรวจข้อมูลจริง'));
 $('freshness').textContent=live?(wallet?`อ่านเมื่อ ${new Date(wallet.fetchedAt).toLocaleString('th-TH')}${s.live.stale?' · ข้อมูลเก่า กรุณารีเฟรช':''}`:'ยังไม่มีข้อมูล'):'ยอดและราคาเป็นข้อมูลตัวอย่าง';$('wallet-error').textContent=live?(s.live.error||wallet?.warnings?.join(' · ')||''):'';$('demo-controls').hidden=live;
 const goal=s.guardian?.goal;if(goal)for(const [k,v]of Object.entries(goal)){const field=$('goal').elements.namedItem(k);if(field&&[...field.options].some(o=>o.value===v))field.value=v;}
}
widget.addEventListener('guardian:state',e=>render(e.detail));
if($('refresh'))$('refresh').onclick=async()=>{const b=$('refresh');b.disabled=true;try{await widget.request('agent/check',{});const s=await widget.request('state');widget.acceptState(s);}catch(e){$('wallet-error').textContent=e.message;}finally{b.disabled=false;}};
if($('goal'))$('goal').onsubmit=async e=>{e.preventDefault();try{widget.updateWatches(await widget.request('agent/goal',Object.fromEntries(new FormData(e.target))));$('goal-status').textContent='บันทึกแล้ว Guardian จะใช้เป้าหมายนี้ประกอบคำตอบ';}catch(e){$('goal-status').textContent=e.message;}};
if($('demo-event'))$('demo-event').onclick=async()=>{const b=$('demo-event');b.disabled=true;try{widget.acceptState(await widget.request('agent/demo-event',{}));}catch(e){$('wallet-error').textContent=e.message;}finally{b.disabled=false;}};
// The demonstration host listens to public widget events without reaching into its Shadow DOM.
if($('embed-events'))for(const name of ['ready','phase','watch-confirmed','notification'])widget.addEventListener('guardian:'+name,e=>{$('embed-events').textContent=`guardian:${name}\n${JSON.stringify(e.detail,null,2)}`;});
