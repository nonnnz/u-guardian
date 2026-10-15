import {setupSystem,renderSystem} from './system-ui.js';
import {setupLive,renderLive,openWallet,liveCallSummary} from './live-ui.js';
const icons = {
  shield:'<path d="M12 3 4.5 6v5c0 4.8 3.4 8.2 7.5 10 4.1-1.8 7.5-5.2 7.5-10V6L12 3Z"/><path d="m8.5 11.5 2.5 2.5 4.5-5"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  activity:'<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  plug:'<path d="m8 3 0 5m8-5v5M6 8h12v3a6 6 0 0 1-12 0V8Zm6 9v4"/>',
  leaf:'<path d="M20 3C8 2 2 8 5 15s16 5 15-12ZM5 20l10-11"/>',
  settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="16" cy="17" r="3"/>',
  arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
  'arrow-up':'<path d="M12 20V4m-6 6 6-6 6 6"/>',
  flask:'<path d="M9 3h6m-5 0v7L4 20h16l-6-10V3M8 15h8"/>',
  refresh:'<path d="M20 10a8 8 0 1 0-1 7M20 4v6h-6"/>',
  flag:'<path d="M5 21V3m0 1c5-3 9 3 14 0v10c-5 3-9-3-14 0"/>',
  alert:'<path d="m12 3 10 18H2L12 3Zm0 6v5m0 3v.5"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
  lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
  mic:'<rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"/>',
  close:'<path d="m6 6 12 12M6 18 18 6"/>',
  phone:'<path d="m5 3 4 1 1 5-3 2a15 15 0 0 0 6 6l2-3 5 1 1 4c-1 6-11 1-15-3S0 3 5 3Z"/>',
  speaker:'<path d="M3 9h4l5-4v14l-5-4H3V9Zm13-2a7 7 0 0 1 0 10m3-13a11 11 0 0 1 0 16"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
};
function svg(name) { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.info}</svg>`; }
document.querySelectorAll('[data-icon]').forEach(el => el.innerHTML = svg(el.dataset.icon));
const $ = id => document.getElementById(id);
const escape = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = n => new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(n);
let state, busy=false, recorder, recordStream, recordTimeout, audio, audioUrl, speaking=false;
let toastTimeout;
function toast(text) { $('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$('toast').hidden=true,5500); }
async function api(path,payload={},raw=false) {
  const res=await fetch('/api/'+path,{method:'POST',headers:{'Content-Type':raw?(payload.type || 'audio/webm'):'application/json','X-Guardian-Client':'local-poc'},body:raw?payload:JSON.stringify(payload)});
  if (!res.ok) { const data=await res.json().catch(()=>({error:'Server ตอบกลับไม่ถูกต้อง'})); throw new Error(data.error); }
  return path==='speech'?res.blob():res.json();
}
async function refresh(){const res=await fetch('/api/state');if(!res.ok)throw new Error('ไม่สามารถอ่านสถานะ server');state=await res.json();render();}
function date(value){return new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Bangkok'}).format(new Date(value));}
function render(){
  const a=state.assessment;
  const cloud=state.integration.deployment==='vercel';
  let storageNote=$('storage-note');if(!storageNote){storageNote=document.createElement('p');storageNote.id='storage-note';storageNote.className='helper';$('settings-dialog').querySelector('.dialog-heading').after(storageNote);}
  storageNote.textContent=cloud?'ตั้งค่า API ของคุณได้โดยไม่ต้อง login · เก็บแบบเข้ารหัสใน private storage และผูกกับ browser นี้ · ล้าง cookies แล้วต้องตั้งค่าใหม่':'API keys บันทึกใน .env ของเครื่องนี้';
  $('reserve-value').textContent=fmt(state.reserve);$('target-label').textContent=fmt(state.profile.target);$('goal-name').textContent=state.profile.goal;
  $('reserve-summary').textContent=a.gap?`ยังขาดอีก ${fmt(a.gap)} เพื่อถึงเป้าหมายของคุณ`:`มากกว่าเป้าหมาย ${fmt(state.reserve-state.profile.target)} demo USDC`;
  $('reserve-status').className='status-pill '+(a.gap?'attention':'good');$('reserve-status').textContent=a.gap?'Needs attention':'On track';
  $('reserve-fill').style.transform=`scaleX(${Math.min(a.coverage,100)/100})`;$('reserve-fill').parentElement.classList.toggle('warning',!!a.gap);$('reserve-fill').parentElement.setAttribute('aria-valuenow',Math.min(a.coverage,100));
  $('due-label').textContent=date(state.profile.due);$('guardian-observation').textContent=a.gap?'มีเรื่องที่ควรทบทวนก่อนถึงวันใช้เงิน':'เงินสำรองถึงเป้าหมายตามกติกาที่คุณตั้งไว้';
  $('holdings-body').innerHTML=state.assets.map((asset,i)=>`<tr><td><div class="asset-name"><span class="asset-icon ${asset.symbol.toLowerCase()}">${i===0?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m12 4-8 15h9l-4-7m8 2-3 5h6l-3-5Z"/></svg>':'$'}</span><div><strong>${escape(asset.symbol)}</strong><small>${escape(asset.name)}</small></div></div></td><td>${fmt(asset.units)}<small>${escape(asset.symbol)}</small></td><td>$${fmt(asset.units*asset.price)}</td><td>${Math.round(asset.units*asset.price/a.total*100)}%</td></tr>`).join('');
  $('incident-panel').hidden=!a.gap;
  $('incident-copy').textContent=`ขาด ${fmt(a.gap)} demo USDC สำหรับ ${state.profile.goal} · กติกาเงินสำรองของคุณ`;
  $('agent-mode-label').textContent=state.integration.mode==='ubot'?'U-bot API · ข้อมูล wallet จำลอง':'Demo agent · พร้อมช่วยคุณ';
  $('trigger-event').disabled=!!a.gap;$('trigger-event').innerHTML=(a.gap?'เหตุการณ์กำลังเปิดอยู่':'จำลองเหตุการณ์')+' '+svg('arrow');
  $('activity-list').innerHTML=state.history.length?state.history.map(h=>`<div class="activity-row">${svg(h.kind==='transfer'?'check':'alert')}<span>${escape(h.text)}</span><span>${new Date(h.at).toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})}</span></div>`).join(''):'<p class="empty-note">ยังไม่มีเหตุการณ์ ลองสร้างสถานการณ์ด้านล่าง</p>';
  renderLive(state);
  renderSystem(state);
}
function openDialog(id){if(!$(id).open)$(id).showModal();}
document.querySelectorAll('[data-close]').forEach(el=>el.addEventListener('click',()=>$(el.dataset.close).close()));
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
function openGoal(){if(!state)return;if(state.dataMode==='live')return openWallet();$('goal-input').value=state.profile.goal;$('target-input').value=state.profile.target;$('due-input').value=state.profile.due;$('call-input').checked=state.profile.callEnabled;openDialog('goal-dialog');}
['edit-goal','nav-goal'].forEach(id=>$(id).onclick=openGoal);
$('goal-form').onsubmit=async e=>{e.preventDefault();try{state=await api('profile',{goal:$('goal-input').value,target:Number($('target-input').value),due:$('due-input').value,callEnabled:$('call-input').checked});render();$('goal-dialog').close();toast('บันทึกเป้าหมายและประเมินกติกาใหม่แล้ว');}catch(e){toast(e.message);}};
$('nav-overview').onclick=()=>window.scrollTo({top:0,behavior:'smooth'});
$('nav-activity').onclick=()=>$('activity-section').scrollIntoView({behavior:'smooth',block:'center'});
function connectionLabel(configured,test){return !configured?'Not configured':test==='verified'?'API tested':test==='error'?'Test failed':'Configured · untested';}
async function openSettings(){try{await refresh();const c=state.integration;$('ubot-template').value=c.ubotTemplate;$('voice-id').value=c.voiceId;$('tts-model').value=c.ttsModel;$('stt-model').value=c.sttModel;$('agent-mode').value=c.mode;$('ubot-status').textContent=connectionLabel(c.ubotConfigured,c.ubotStatus);$('eleven-status').textContent=connectionLabel(c.elevenConfigured,c.elevenStatus);$('tokenomist-status').textContent=connectionLabel(c.tokenomistConfigured,c.tokenomistStatus);$ ('avalanche-status').textContent=connectionLabel(c.avalancheConfigured,c.avalancheStatus);openDialog('settings-dialog');}catch(e){toast(e.message);}}
['nav-settings','settings-top','footer-connections'].forEach(id=>$(id).onclick=openSettings);
function configPayload(){return {tokenomistKey:$('tokenomist-key').value,avalancheKey:$('avalanche-key').value,ubotToken:$('ubot-token').value,ubotTemplate:$('ubot-template').value,elevenKey:$('eleven-key').value,voiceId:$('voice-id').value,ttsModel:$('tts-model').value,sttModel:$('stt-model').value,mode:$('agent-mode').value};}
async function saveConfig(){const result=await api('integrations',configPayload());$('ubot-token').value='';$('eleven-key').value='';$('avalanche-key').value='';$('tokenomist-key').value='';return result;}
$('save-settings').onclick=async()=>{try{await saveConfig();await refresh();$('settings-dialog').close();toast(state.integration.deployment==='vercel'?'บันทึกการเชื่อมต่อสำหรับ browser นี้แล้ว':'บันทึกการเชื่อมต่อใน .env แล้ว');}catch(e){toast(e.message);}};
async function testConnection(provider){const button=$(provider==='ubot'?'test-ubot':'test-eleven');const output=$(provider==='ubot'?'ubot-result':'eleven-result');button.disabled=true;output.textContent='กำลังทดสอบ…';output.className='test-output';try{await saveConfig();const result=await api('test/'+provider);if(provider==='ubot'){output.textContent=result.text;$('ubot-status').textContent='API tested';}else{$('eleven-status').textContent='API tested';output.textContent=`อ่านรายการเสียงสำเร็จ ${result.voices.length} เสียง · STT/TTS จะทดสอบเมื่อใช้งาน`;$('voice-select').innerHTML='<option value="">เลือกเสียง</option>'+result.voices.map(v=>`<option value="${escape(v.id)}">${escape(v.name)}</option>`).join('');$('voice-select-label').hidden=false;}output.classList.add('success');await refresh();}catch(e){output.textContent=e.message;output.classList.add('error');$(provider==='ubot'?'ubot-status':'eleven-status').textContent='Test failed';}finally{button.disabled=false;}}
$('test-ubot').onclick=()=>testConnection('ubot');$('test-eleven').onclick=()=>testConnection('elevenlabs');$('voice-select').onchange=()=>{$('voice-id').value=$('voice-select').value;};
$('disconnect').onclick=async()=>{try{await api('disconnect');$('ubot-token').value='';$('eleven-key').value='';$('avalanche-key').value='';$('tokenomist-key').value='';await openSettings();toast('ล้าง API keys ที่บันทึกไว้แล้ว');}catch(e){toast(e.message);}};
function addMessage(role,text,metadata={}){
  const el=document.createElement('div');el.className='message '+role;
  const label=document.createElement('span');label.className='message-label';label.textContent=role==='user'?'YOU':'GUARDIAN';el.append(label);
  const p=document.createElement('p');p.textContent=text;el.append(p);
  if(role==='assistant'){
    const source=document.createElement('span');source.className='message-source';source.textContent=(metadata.mode==='ubot'?'U-bot workflow':'Local rules')+(metadata.dataMode==='live'?' · live wallet tools':' · ข้อมูลจำลอง');el.append(source);
    const read=document.createElement('button');read.className='read-message';read.innerHTML=svg('speaker')+' ฟังคำตอบ';read.onclick=()=>speak(text);el.append(read);
  }
  if(metadata.trace?.length){const details=document.createElement('details');details.className='trace';const summary=document.createElement('summary');summary.textContent=`ดูหลักฐานและ tools (${metadata.trace.length})`;details.append(summary);for(const t of metadata.trace){const row=document.createElement('div');row.className='trace-line';const title=document.createElement('strong');title.textContent=t.name;const source=document.createElement('span');source.textContent=t.source;const pre=document.createElement('pre');pre.textContent=t.detail;row.append(title,source,pre);details.append(row);}el.append(details);}
  if(metadata.verifiedSummary&&metadata.verifiedSummary!==text){const evidence=document.createElement('p');evidence.className='verified-summary';evidence.textContent='ข้อมูลจากเครื่องมือ: '+metadata.verifiedSummary;el.append(evidence);}
  if(metadata.simulation&&metadata.dataMode==='live'){const b=document.createElement('p');b.className='simulation-result';const s=metadata.simulation;b.textContent=`${s.before} → ${s.after} ${s.unit} · คำนวณสมมติ ยังไม่มีการโอน`;el.append(b);}
  if(metadata.simulation&&metadata.dataMode!=='live'){const s=metadata.simulation;const block=document.createElement('div');block.className='simulation-result';block.innerHTML=`<small>เงินสำรอง · demo USDC</small><div class="simulation-numbers"><span>${fmt(s.before)}</span>${svg('arrow')}<span>${fmt(s.after)}</span></div><small>${s.remaining?'ยังขาด '+fmt(s.remaining):'ถึงเป้าหมายแล้ว'} · ไม่มีการโอนเงิน</small>`;const b=document.createElement('button');b.className='button outline';b.textContent=`เตรียมเติม ${fmt(s.amount)} demo USDC`;b.onclick=()=>prepareAction(s.amount);block.append(b);el.append(block);}
  $('conversation').append(el);$('conversation').scrollTop=$('conversation').scrollHeight;return el;
}
function setBusy(value){busy=value;$('chat-input').disabled=value;document.querySelector('#chat-form button[type="submit"]').disabled=value;$('mic-button').disabled=value;}
async function sendMessage(message){if(busy||!message.trim())return;setBusy(true);addMessage('user',message);$('chat-input').value='';const thinking=document.createElement('div');thinking.className='thinking';thinking.textContent=state.integration.mode==='ubot'?'U-bot กำลังเลือก tool และตรวจข้อมูล…':(state.dataMode==='live'?'กำลังตรวจข้อมูล wallet จริง…':'กำลังตรวจข้อมูลจำลอง…');$('conversation').append(thinking);$('conversation').scrollTop=$('conversation').scrollHeight;try{const result=await api('chat',{message});state=result.state;render();addMessage('assistant',result.text,result);if(state.dataMode==='demo'&&state.action?.status==='draft'&&result.trace.some(t=>t.name==='prepare_reserve_transfer'))showAction();}catch(e){addMessage('assistant',`ยังทำรายการนี้ไม่ได้: ${e.message}`);toast(e.message);}finally{thinking.remove();setBusy(false);}}
$('chat-form').onsubmit=e=>{e.preventDefault();sendMessage($('chat-input').value);};$('chat-input').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage($('chat-input').value);}};
document.querySelectorAll('[data-prompt]').forEach(b=>b.onclick=()=>sendMessage(b.dataset.prompt));
$('ask-reserve').onclick=()=>sendMessage('ช่วยตรวจความเสี่ยงเงินสำรองให้หน่อย');$('ask-unlock').onclick=()=>sendMessage('อธิบาย token unlock');$('explain-incident').onclick=()=>{sendMessage('เกิดอะไรขึ้นกับเงินสำรองของฉัน');document.querySelector('.assistant-panel').scrollIntoView({behavior:'smooth',block:'center'});};
function showCall(){const a=state.assessment;$('call-summary').textContent=`เงินสำรองเหลือ ${fmt(state.reserve)} จากเป้าหมาย ${fmt(state.profile.target)} demo USDC${a.gap?' · ขาดอีก '+fmt(a.gap):''}`;if(state.dataMode==='live')$('call-summary').textContent=liveCallSummary(state);$('call-provider-label').textContent=state.integration.elevenConfigured?'ใช้ ElevenLabs ฟังคำตอบและส่งเสียงได้หลังเปิดบทสนทนา':'ยังไม่เชื่อม ElevenLabs · ใช้ข้อความ หรือเสียงของ browser ที่มีให้';openDialog('call-dialog');}
$('open-call').onclick=showCall;
$('trigger-event').onclick=async()=>{try{const result=await api('trigger');state=result.state;render();if(result.shouldCall)showCall();else toast(result.repeated?'เหตุการณ์นี้แจ้งแล้ว ไม่สร้างซ้ำ':'สร้างเหตุการณ์แล้ว ตรวจรายละเอียดใน dashboard');}catch(e){toast(e.message);}};
$('answer-call').onclick=()=>{$('call-dialog').close();document.querySelector('.assistant-panel').scrollIntoView({behavior:'smooth',block:'center'});sendMessage('เกิดอะไรขึ้นกับเงินสำรองของฉัน');};
async function prepareAction(amount){if(busy)return;try{state=await api('prepare',{amount});render();showAction();}catch(e){toast(e.message);}}
function showAction(){const a=state.action;if(!a||a.status!=='draft')return;$('action-details').innerHTML=[['จำนวน',`${fmt(a.amount)} ${a.asset}`],['จาก','Available demo balance'],['ไปที่',a.destination],['เครือข่าย',a.network],['เงินสำรองหลังรายการ',`${fmt(a.after)} demo USDC`]].map(([k,v])=>`<div><dt>${escape(k)}</dt><dd>${escape(v)}</dd></div>`).join('');openDialog('action-dialog');}
$('confirm-action').onclick=async()=>{const b=$('confirm-action');b.disabled=true;try{state=await api('confirm',{id:state.action.id});render();$('action-dialog').close();addMessage('assistant',`ยืนยันการโอนจำลอง ${fmt(state.action.amount)} demo USDC แล้ว เงินสำรองใหม่ ${fmt(state.reserve)} · อ้างอิง ${state.action.receipt}\nไม่มีธุรกรรมบน blockchain จริง`,{trace:[{name:'confirm_demo_transfer',source:'Local simulation',detail:JSON.stringify(state.action)}]});toast('อัปเดตเงินสำรองจำลองแล้ว');}catch(e){toast(e.message);}finally{b.disabled=false;}};
$('reset-demo').onclick=async()=>{if(busy)return;try{stopAudio();state=await api('reset');render();$('conversation').replaceChildren();addMessage('assistant','เริ่มสถานการณ์ใหม่แล้วครับ เงินสำรองกลับมาเป็น 620 demo USDC ลองตั้งเป้าหมายหรือสร้างเหตุการณ์ได้เลย');toast('รีเซ็ตข้อมูลจำลองแล้ว การเชื่อมต่อยังคงเดิม');}catch(e){toast(e.message);}};
function stopAudio(){if(audio){audio.pause();audio=null;}if(audioUrl){URL.revokeObjectURL(audioUrl);audioUrl=null;}window.speechSynthesis?.cancel();}
async function speak(text){if(speaking)return;speaking=true;stopAudio();try{if(state.integration.elevenConfigured){toast('กำลังสร้างเสียงด้วย ElevenLabs…');const blob=await api('speech',{text});audioUrl=URL.createObjectURL(blob);audio=new Audio(audioUrl);await audio.play();toast('กำลังเล่นเสียง ElevenLabs');}else if('speechSynthesis'in window){toast('ใช้เสียงของ browser · ยังไม่ใช่ ElevenLabs');const utterance=new SpeechSynthesisUtterance(text);utterance.lang='th-TH';speechSynthesis.speak(utterance);}else toast('browser นี้ไม่มีเสียงสำรอง กรุณาเชื่อม ElevenLabs');}catch(e){toast(e.message);}finally{speaking=false;}}
$('mic-button').onclick=async()=>{
  if(recorder?.state==='recording'){recorder.stop();return;}
  if(!state.integration.elevenConfigured){toast('เชื่อม ElevenLabs เพื่อถอดเสียง หรือพิมพ์คำถามได้เลย');await openSettings();return;}
  if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){toast('browser นี้ไม่รองรับการอัดเสียง ลอง Chrome หรือ Edge');return;}
  try{stopAudio();recordStream=await navigator.mediaDevices.getUserMedia({audio:true});const chunks=[];const mime=['audio/webm;codecs=opus','audio/mp4'].find(m=>MediaRecorder.isTypeSupported(m));recorder=new MediaRecorder(recordStream,mime?{mimeType:mime}:undefined);recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onstop=async()=>{clearTimeout(recordTimeout);recordStream.getTracks().forEach(t=>t.stop());$('mic-button').classList.remove('recording');$('mic-label').textContent='พูดกับ Guardian';setBusy(true);try{toast('กำลังถอดเสียงด้วย ElevenLabs…');const result=await api('transcribe',new Blob(chunks,{type:recorder.mimeType}),true);$('chat-input').value=result.text||'';toast('ถอดเสียงแล้ว ตรวจข้อความและกดส่ง');$('chat-input').focus();}catch(e){toast(e.message);}finally{setBusy(false);}};recorder.start();$('mic-button').classList.add('recording');$('mic-label').textContent='หยุดอัดเสียง';toast('กำลังอัดเสียง · กดอีกครั้งเพื่อหยุด (สูงสุด 45 วินาที)');recordTimeout=setTimeout(()=>{if(recorder.state==='recording')recorder.stop();},45000);}catch(e){recordStream?.getTracks().forEach(t=>t.stop());toast('เปิดไมโครโฟนไม่ได้ กรุณาอนุญาตหรือใช้ข้อความ');}
};
window.addEventListener('beforeunload',()=>{recordStream?.getTracks().forEach(t=>t.stop());stopAudio();});
setupLive({api,refresh,render,toast,getState:()=>state,setState:value=>{state=value;}});
setupSystem({api,refresh,render,toast,saveConfig,getState:()=>state,setState:value=>{state=value;}});
$('test-avalanche').onclick=async()=>{const b=$('test-avalanche'),o=$('avalanche-result');b.disabled=true;o.textContent='กำลังทดสอบ…';try{await saveConfig();const r=await api('test/avalanche');o.textContent='เรียก Data API สำเร็จ · '+r.note;$('avalanche-status').textContent='Endpoint tested';await refresh();}catch(e){o.textContent=e.message;$('avalanche-status').textContent='Test failed';}finally{b.disabled=false;}};
refresh().catch(e=>toast(e.message));
