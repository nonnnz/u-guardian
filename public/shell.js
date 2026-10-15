import {t as tr,language,locale,localize} from './i18n.js';
import './guardian-widget.js';
const widget=document.querySelector('u-guardian');
const $=id=>document.getElementById(id);
document.documentElement.lang=language;
localize(document);
$('language').value=language;
$('language').onchange=()=>{
 if(widget.busy||widget.settingsBusy||settingsBusy){$('language').value=language;status('home-status',tr('มีงานกำลังทำอยู่ รอสักครู่แล้วลองอีกครั้ง'));return;}
 try{localStorage.setItem('guardian-language',$('language').value);}
 catch{$('language').value=language;status('home-status',language==='th'?'เบราว์เซอร์ไม่อนุญาตให้บันทึกภาษา กรุณาเปิด local storage':'Your browser cannot save this preference. Enable local storage.',true);return;}
 widget.stopVoice();location.reload();
};
const node=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;return e;};
let state,catalog=[],settingsBusy=false;
function status(id,text,error=false){$(id).textContent=text;$(id).dataset.error=String(error);}
function render(s){
 state=s;const live=s.dataMode==='live',wallet=s.live.snapshot;
 $('mode').textContent=live?'LIVE':'DEMO';
 $('network').textContent=live?(wallet?.network||tr('ยังไม่เชื่อมกระเป๋า')):tr('กระเป๋าตัวอย่าง · ข้อมูลจำลอง');
 $('address').textContent=live?s.live.settings.address:tr('ไม่มีการใช้เงินจริง');
 $('assets').replaceChildren();const assets=live?(wallet?.assets||[]):s.assets;
 for(const a of assets){const row=node('div','');row.className='asset';const name=node('div','');name.append(node('strong',a.symbol),node('small',a.name||''));const amount=node('span',String(a.units));amount.className='amount';row.append(name,amount);$('assets').append(row);}
 if(!assets.length)$('assets').append(node('p',wallet?tr('ยังไม่พบสินทรัพย์ในข้อมูลที่อ่านได้'):tr('เปิดตั้งค่าแล้วเพิ่ม public wallet เพื่อเริ่มอ่านข้อมูลจริง')));
 $('freshness').textContent=live?(wallet?tr('อ่านเมื่อ ')+new Date(wallet.fetchedAt).toLocaleString(locale)+(s.live.stale?tr(' · ข้อมูลเก่า กรุณารีเฟรช'):''):tr('ยังไม่มีข้อมูล')):tr('ยอดนี้เป็นข้อมูลตัวอย่าง');
 $('wallet-error').textContent=live?[s.live.error,...(wallet?.warnings||[])].filter(Boolean).join(' · '):'';
 $('demo-controls').hidden=live;
 if(!$('settings').open)fillSettings();
}
function toggleLive(){const live=$('data-mode').value==='live';$('live-fields').hidden=!live;for(const id of ['wallet-address','wallet-chain','horizon-days'])$(id).disabled=!live;$('wallet-address').required=live;}
function fillSettings(){
 if(!state)return;const c=state.integration,w=state.live.settings;
 $('data-mode').value=state.dataMode;$('wallet-address').value=w.address;$('wallet-chain').value=w.chainId;$('horizon-days').value=w.horizonDays;toggleLive();
 $('agent-mode').value=c.mode;
 for(const [id,key] of [['ubot-template','ubotTemplate'],['voice-id','voiceId'],['tts-model','ttsModel'],['stt-model','sttModel']])$(id).value=c[key]||'';
 renderProviders(c);
 $('storage-note').textContent=c.deployment==='vercel'?tr('บันทึกสำหรับเซสชันของเบราว์เซอร์นี้ เก็บ API keys ฝั่งเซิร์ฟเวอร์'):tr('บันทึก API keys ลง .env ของเครื่องนี้');
 for(const [k,v]of Object.entries(state.guardian?.goal||{})){const field=$('goal').elements.namedItem(k);if(field&&[...field.options].some(o=>o.value===v))field.value=v;}
 fillMapping();
}
function renderProviders(c){for(const name of ['ubot','eleven','avalanche','tokenomist'])$(name+'-status').textContent=!c[name+'Configured']?tr('ยังไม่ตั้งค่า'):c[name+'Status']==='verified'?tr('ทดสอบแล้ว'):tr('บันทึก key แล้ว');}
function fillMapping(){
 const assets=state.live.snapshot?.chainId==='43114'?state.live.snapshot.assets.filter(a=>a.address!=='native'):[];
 const selected=$('mapping-asset').value;$('mapping-asset').replaceChildren(new Option(tr('เลือกเหรียญในกระเป๋า'),''));
 for(const a of assets)$('mapping-asset').add(new Option(a.symbol+' · '+a.address,a.address));
 if(assets.some(a=>a.address===selected))$('mapping-asset').value=selected;
 $('mapping-current').textContent=assets.length?assets.map(a=>a.symbol+' → '+(state.live.mappings['43114:'+a.address]||tr('ยังไม่ได้จับคู่'))).join('\n'):tr('ต้องมีกระเป๋า Mainnet และอ่านพบ ERC-20 ก่อนจับคู่');
}
async function reload(){widget.acceptState(await widget.request('state'));}
async function operation(output,fn){
 if(settingsBusy||widget.settingsBusy||widget.busy){status(output,tr('มีงานกำลังทำอยู่ รอสักครู่แล้วลองอีกครั้ง'),true);return;}
 settingsBusy=true;widget.settingsBusy=true;
 const controls=[...$('settings').querySelectorAll('input,select,textarea,button')].filter(e=>e.id!=='close-settings');
 const previous=controls.map(e=>e.disabled);controls.forEach(e=>e.disabled=true);$('refresh').disabled=true;
 status(output,tr('กำลังทำงาน…'));
 try{await widget.pollPromise;await fn();}
 catch(e){status(output,e.message,true);}
 finally{controls.forEach((e,i)=>e.disabled=previous[i]);$('refresh').disabled=false;settingsBusy=false;widget.settingsBusy=false;}
}
const credentialIds=['ubot-token','eleven-key','avalanche-key','tokenomist-key'];
function clearCredentialInputs(){credentialIds.forEach(id=>$(id).value='');}
function configPayload(){return {ubotToken:$('ubot-token').value,elevenKey:$('eleven-key').value,avalancheKey:$('avalanche-key').value,tokenomistKey:$('tokenomist-key').value,ubotTemplate:$('ubot-template').value,voiceId:$('voice-id').value,ttsModel:$('tts-model').value,sttModel:$('stt-model').value,mode:$('agent-mode').value};}
async function saveConfig(payload){const c=await widget.request('integrations',payload);clearCredentialInputs();state.integration=c;renderProviders(c);await reload();}
widget.addEventListener('guardian:state',e=>render(e.detail));
widget.addEventListener('guardian:notification',e=>status('home-status',tr('มีเรื่องอัปเดต {0} รายการ กดที่ Guardian เพื่อดู',e.detail.length)));
widget.addEventListener('guardian:error',e=>{if(!widget.$('chat-dialog').open)status('home-status',e.detail.message,true);});
$('open-settings').onclick=async()=>{if(settingsBusy||widget.settingsBusy||widget.busy){status('home-status',tr('Guardian กำลังทำงาน รอสักครู่ก่อนเปลี่ยนการตั้งค่า'));return;}widget.stopVoice();if(!state){try{await reload();}catch(e){status('home-status',e.message,true);return;}}fillSettings();$('settings').showModal();};
$('close-settings').onclick=()=>$('settings').close();
$('settings').addEventListener('close',()=>{clearCredentialInputs();$('open-settings').focus();});
$('data-mode').onchange=toggleLive;
$('wallet-form').onsubmit=e=>{e.preventDefault();const mode=$('data-mode').value,payload={...state.live.settings,reserveContract:'',target:'0.1',monitor:false,address:$('wallet-address').value.trim(),chainId:$('wallet-chain').value,horizonDays:Number($('horizon-days').value)};
 operation('wallet-status',async()=>{widget.acceptState(await widget.request(mode==='live'?'wallet/connect':'data-mode',mode==='live'?payload:{mode}));fillMapping();status('wallet-status',mode==='live'?tr('อ่านกระเป๋าจริงแล้ว กลับไปคุยกับ Guardian ได้เลย'):tr('ใช้กระเป๋าตัวอย่างแล้ว'));});};
$('integration-form').onsubmit=e=>{e.preventDefault();const payload=configPayload();operation('integration-status',async()=>{await saveConfig(payload);status('integration-status',tr('บันทึกการเชื่อมต่อแล้ว'));});};
$('connect-ubot').onclick=()=>{const payload={ubotToken:$('ubot-token').value,ubotTemplate:$('ubot-template').value};operation('ubot-result',async()=>{await widget.request('ubot/connect',payload);$('ubot-token').value='';await reload();$('agent-mode').value=state.integration.mode;renderProviders(state.integration);status('ubot-result',tr('เชื่อมต่อแล้ว · เปิดใช้ U-bot agent แล้ว'));});};
document.querySelectorAll('[data-test]').forEach(b=>b.onclick=()=>{const provider=b.dataset.test,out=(provider==='elevenlabs'?'eleven':provider)+'-result',payload=configPayload();operation(out,async()=>{
 await saveConfig(payload);const r=await widget.request('test/'+provider,{});
 if(provider==='elevenlabs'){$('voice-select').replaceChildren(new Option(tr('เลือกเสียง'),''));for(const v of r.voices)$('voice-select').add(new Option(v.name,v.id));$('voice-options').hidden=false;status(out,tr('โหลดได้ {0} เสียง เลือกเสียงแล้วกดบันทึกการเชื่อมต่อ',r.voices.length));}
 else if(provider==='tokenomist'){catalog=r.tokens;filterCatalog();status(out,tr('อ่านรายชื่อได้ {0} เหรียญ',r.count));}
 else status(out,provider==='ubot'?r.text:tr('เชื่อมต่อ Avalanche สำเร็จ'));
 await reload();renderProviders(state.integration);
 });});
$('voice-select').onchange=()=>{if($('voice-select').value)$('voice-id').value=$('voice-select').value;};
$('disconnect').onclick=()=>operation('integration-status',async()=>{await widget.request('disconnect',{});clearCredentialInputs();catalog=[];filterCatalog();await reload();$('agent-mode').value=state.integration.mode;renderProviders(state.integration);status('integration-status',tr('ล้าง API keys แล้ว'));});
$('goal').onsubmit=e=>{e.preventDefault();const payload=Object.fromEntries(new FormData(e.target));operation('goal-status',async()=>{widget.updateWatches(await widget.request('agent/goal',payload));await reload();status('goal-status',tr('บันทึกเป้าหมายแล้ว'));});};
$('demo-event').onclick=()=>operation('wallet-status',async()=>{widget.acceptState(await widget.request('agent/demo-event',{}));status('wallet-status',tr('จำลองยอดลดแล้ว ปิดตั้งค่าและถาม Guardian ว่า “มีอะไรเปลี่ยนไป”'));});
function filterCatalog(){const q=$('mapping-search').value.trim().toLowerCase();$('mapping-token').replaceChildren(new Option(tr('เลือกโครงการ'),''));for(const t of catalog.filter(t=>(t.name+' '+t.symbol+' '+t.id).toLowerCase().includes(q)).slice(0,100))$('mapping-token').add(new Option(t.name+' ('+t.symbol+') · '+t.id,t.id));$('mapping-confirm').checked=false;}
$('load-catalog').onclick=()=>operation('mapping-status',async()=>{catalog=(await widget.request('tokenomist/catalog',{})).tokens;filterCatalog();status('mapping-status',tr('โหลดรายชื่อแล้ว ค้นหาเหรียญที่ต้องการจับคู่'));});
$('mapping-search').oninput=filterCatalog;
for(const id of ['mapping-token','mapping-asset'])$(id).onchange=()=>$('mapping-confirm').checked=false;
$('mapping-form').onsubmit=e=>{e.preventDefault();const payload={contract:$('mapping-asset').value,tokenId:$('mapping-token').value};operation('mapping-status',async()=>{widget.acceptState(await widget.request('tokenomist/mapping',payload));fillMapping();$('mapping-confirm').checked=false;status('mapping-status',tr('บันทึกการจับคู่และอัปเดตข้อมูลอุปทานแล้ว'));});};
$('remove-mapping').onclick=()=>{const contract=$('mapping-asset').value;if(!contract){status('mapping-status',tr('เลือกเหรียญก่อน'),true);return;}operation('mapping-status',async()=>{widget.acceptState(await widget.request('tokenomist/mapping',{contract,tokenId:''}));fillMapping();status('mapping-status',tr('ยกเลิกการจับคู่แล้ว'));});};
$('refresh').onclick=async()=>{if(widget.busy||settingsBusy){status('home-status',tr('มีงานกำลังทำอยู่ รอสักครู่แล้วลองอีกครั้ง'));return;}const b=$('refresh');b.disabled=true;widget.settingsBusy=true;try{await widget.pollPromise;await widget.request('agent/check',{});await reload();status('home-status',tr('อัปเดตสถานะกระเป๋าแล้ว'));}catch(e){status('wallet-error',e.message,true);}finally{b.disabled=false;widget.settingsBusy=false;}};

$('demo-price').onclick=()=>operation('wallet-status',async()=>{widget.acceptState(await widget.request('agent/demo-price',{}));status('wallet-status',tr('จำลองราคาลดแล้ว ตรวจการแจ้งเตือนจาก Guardian'));});
