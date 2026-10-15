const sheet=new URL('./guardian-widget.css',import.meta.url).href;
const icon=(name)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${({mic:'<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"/>',send:'<path d="m5 12 7-7 7 7M12 5v15"/>',sound:'<path d="m11 5-6 5H2v4h3l6 5V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',stop:'<rect x="6" y="6" width="12" height="12" rx="2"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>'})[name]||''}</svg>`;
const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e;};
export class GuardianWidget extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});this.busy=false;this.audio=null;this.phase='idle';this.controllers=new Set();this.debugEnabled=false;this.debugRuns=[];}
 connectedCallback(){if(this.booted)return;this.booted=true;this.busy=false;this.render();this.initialize();this.timer=setInterval(()=>this.poll(),60000);}
 disconnectedCallback(){clearInterval(this.timer);this.stopVoice();this.controllers.forEach(c=>c.abort());this.booted=false;}
 async request(route,body,options={}){
  const url=new URL('/api/'+route,location.href);
  const controller=new AbortController();this.controllers.add(controller);
  const timeout=setTimeout(()=>controller.abort(),210000);
  const debug=this.debugEnabled&&body!==undefined&&(/^(agent\/(chat|brief|ack|check|watch\/confirm|watch\/remove)|transcribe|speech)$/.test(route));
  const run=debug?{route,startedAt:Date.now(),status:'pending'}:null;
  if(run){this.debugRuns.unshift(run);this.debugRuns=this.debugRuns.slice(0,4);this.renderDebug();}
  try{
   const r=await fetch(url,{method:body===undefined?'GET':'POST',credentials:'same-origin',headers:body===undefined?{}:{'x-guardian-client':'local-poc','Content-Type':options.raw?options.mime:'application/json',...(debug?{'x-guardian-debug':'1'}:{})},body:body===undefined?undefined:options.raw?body:JSON.stringify(body),signal:controller.signal});
   const isJson=(r.headers.get('content-type')||'').includes('application/json');
   const data=isJson?await r.json():null;
   if(run){run.status=r.ok?'complete':'error';run.durationMs=Date.now()-run.startedAt;run.trace=data?.debug;run.error=data?.error;this.renderDebug();}
   if(!r.ok)throw new Error(data?.error||'เชื่อมต่อไม่สำเร็จ');
   if(options.audio){if(data?.audio){const bytes=Uint8Array.from(atob(data.audio),c=>c.charCodeAt(0));return new Blob([bytes],{type:data.mime||'audio/mpeg'});}return r.blob();}
   return data??r.json();
  }catch(e){if(run){run.status='error';run.durationMs=Date.now()-run.startedAt;run.error=e.name==='AbortError'?'คำขอหมดเวลาหรือถูกยกเลิก':e.message;this.renderDebug();}throw e;}
  finally{clearTimeout(timeout);this.controllers.delete(controller);}
 }
 selectTab(name){
  for(const tab of ['chat','debug']){const active=tab===name;this.$(tab+'-tab').setAttribute('aria-selected',String(active));this.$(tab+'-tab').tabIndex=active?0:-1;this.$(tab+'-panel').hidden=!active;}
 }
 renderDebug(){
  const list=this.$('debug-log');if(!list)return;list.replaceChildren();
  const pending=this.debugRuns.some(r=>r.status==='pending');this.$('debug-status').textContent=pending?'กำลังทำงาน · log จะปรากฏเมื่อคำขอจบ':this.debugRuns.length?`แสดง ${this.debugRuns.length} คำขอล่าสุด · เก็บเฉพาะหน้านี้`:'เปิดแล้ว · ลองส่งข้อความหรือใช้เสียงในแท็บแชต';
  this.$('clear-debug').disabled=pending||!this.debugRuns.length;
  if(!this.debugRuns.length){list.append(el('p','แต่ละคำขอจะแสดง prompt, คำตอบ U-bot, tool และผลลัพธ์ตามลำดับเวลา รวมถึงข้อผิดพลาด','debug-empty'));return;}
  for(const [index,run] of this.debugRuns.entries()){
   const group=el('details',null,'debug-run');group.open=index===0;
   const state=run.status==='pending'?'กำลังทำงาน':run.status==='error'?'ผิดพลาด':'เสร็จแล้ว';
   group.dataset.status=run.status;group.append(el('summary',`${run.route} · ${state}${run.durationMs!=null?' · '+(run.durationMs/1000).toFixed(1)+'s':''}`));
   group.append(el('small',new Date(run.startedAt).toLocaleTimeString('th-TH')+(run.trace?' · '+run.trace.id:''),'debug-meta'));
   if(run.error)group.append(el('p',run.error,'error'));
   if(!run.trace)group.append(el('p',run.status==='pending'?'รอผลจากเซิร์ฟเวอร์…':'ไม่มี backend log สำหรับคำขอนี้'));
   if(run.trace?.limited)group.append(el('p','Log ยาวเกินขอบเขต จึงแสดงข้อมูลบางส่วน'));
   for(const event of run.trace?.events||[]){
    const item=el('details',null,'debug-event');item.dataset.type=event.type;
    const kind={start:'เริ่ม',result:'ผลลัพธ์',error:'ผิดพลาด',request:'ส่งคำขอ',response:'รับคำตอบ'}[event.type.split('.').at(-1)];
    item.append(el('summary',`${event.seq}. ${event.label}${kind?' · '+kind:''} · +${(event.elapsedMs/1000).toFixed(2)}s`));
    item.append(el('small',event.type+(event.truncated?' · ข้อมูลถูกตัดให้สั้นลง':''),'debug-meta'),el('pre',JSON.stringify(event.data,null,2)));
    group.append(item);
   }
   list.append(group);
  }
 }

 emit(name,detail){this.dispatchEvent(new CustomEvent('guardian:'+name,{detail,bubbles:true,composed:true}));}
 $(id){return this.shadowRoot.getElementById(id);}
 render(){this.shadowRoot.innerHTML=`<link rel="stylesheet" href="${sheet}"><dialog id="chat-dialog" aria-label="แชตกับ Guardian"><section class="guardian" aria-label="ผู้ช่วย U-Guardian">
  <header><span class="wordmark">Guardian<span class="status-dot"></span></span><label class="debug-switch"><input id="debug-enabled" type="checkbox"> Debug</label><button id="collapse" class="quiet" aria-label="ย่อผู้ช่วย">${icon('close')}</button></header>
  <div id="agent-tabs" class="agent-tabs" role="tablist" aria-label="มุมมองผู้ช่วย" hidden><button id="chat-tab" role="tab" aria-controls="chat-panel" aria-selected="true">แชต</button><button id="debug-tab" role="tab" aria-controls="debug-panel" aria-selected="false" tabindex="-1">Debug</button></div>
  <div id="chat-panel" role="tabpanel" aria-labelledby="chat-tab">
  <div class="stage" id="stage"><button class="creature" id="mascot" aria-label="ให้ Guardian รายงาน" title="ฟังรายงานของคุณ"><span class="antenna"></span><span class="body"><span class="visor"><i class="eye"></i><i class="eye"></i><span class="mouth"></span></span><span class="cheek left"></span><span class="cheek right"></span><span class="belly"></span></span><span class="hand left"></span><span class="hand right"></span><span class="foot left"></span><span class="foot right"></span></button>
  <div class="welcome"><h1>มีผมอยู่ตรงนี้ครับ</h1><p>เรื่องคริปโตที่สงสัย ถามได้เลย<br>ผมจะช่วยดูจากข้อมูลที่ตรวจสอบได้</p></div>
  <p id="phase" role="status" class="phase">กำลังเชื่อมต่อ…</p><button id="brief" class="report">เล่าให้ฟังว่ามีอะไรใหม่ <span aria-hidden="true">↗</span></button></div>
  <div id="conversation" class="conversation" aria-label="บทสนทนา"></div>
  <div class="suggestions" id="suggestions"><button data-prompt="ช่วยตรวจสุขภาพกระเป๋าให้หน่อย">ตรวจสุขภาพกระเป๋า</button><button data-prompt="ตั้งแต่รายงานครั้งก่อนมีอะไรเปลี่ยนไปบ้าง">มีอะไรเปลี่ยนไป</button><button data-prompt="ช่วยติดตามเมื่อจำนวนสินทรัพย์ในกระเป๋าเปลี่ยน">ฝากติดตาม</button></div>
  <div class="composer-area"><p id="error" class="error" role="alert" hidden></p><form id="composer"><label class="sr" for="input">ถาม Guardian</label><textarea id="input" rows="1" maxlength="2000" placeholder="ถามได้ เช่น อยากเริ่มถือระยะยาว ควรดูอะไร?"></textarea><button id="send" aria-label="ส่งข้อความ">${icon('send')}</button></form><div class="voice-row"><button id="mic" class="voice">${icon('mic')}<span>กดเพื่อพูด</span></button><button id="stop" class="quiet" hidden>${icon('stop')} หยุดเสียง</button><label class="read-setting"><input id="auto-read" type="checkbox"> อ่านคำตอบให้ฟัง</label></div><small id="provenance" class="provenance">U-bot · Avalanche · Tokenomist · ElevenLabs</small></div>
  <details class="watch-area"><summary>เรื่องที่ฝากติดตาม <span id="watch-count">0</span></summary><p id="monitoring"></p><div id="watches"></div><div id="alerts"></div></details>
  </div><section id="debug-panel" class="debug-panel" role="tabpanel" aria-labelledby="debug-tab" tabindex="0" hidden><div class="debug-toolbar"><p id="debug-status" role="status"></p><button id="clear-debug" class="text-button">ล้าง log</button></div><p class="debug-note">ซ่อน API keys และ token · log มีข้อความสนทนาและข้อมูลกระเป๋า · ไม่ใช่ความคิดภายในของโมเดล</p><div id="debug-log"></div></section>
  </section></dialog><button id="launcher" class="launcher" aria-label="เปิดแชตกับ Guardian" aria-haspopup="dialog" aria-expanded="false"><span class="perched" aria-hidden="true"></span><span class="launcher-label">คุยกับผม</span><span id="alert-dot" class="alert-dot" hidden></span></button>`;
  this.$('debug-enabled').onchange=e=>{this.debugEnabled=e.target.checked;this.$('agent-tabs').hidden=!this.debugEnabled;if(!this.debugEnabled)this.debugRuns=[];this.selectTab(this.debugEnabled?'debug':'chat');this.renderDebug();};
  this.$('clear-debug').onclick=()=>{this.debugRuns=[];this.renderDebug();};
  for(const name of ['chat','debug']){this.$(name+'-tab').onclick=()=>this.selectTab(name);this.$(name+'-tab').onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const target=e.key==='Home'?'chat':e.key==='End'?'debug':name==='chat'?'debug':'chat';this.selectTab(target);this.$(target+'-tab').focus();}};}
  const figure=this.$('mascot').cloneNode(true);figure.removeAttribute('id');figure.removeAttribute('aria-label');figure.removeAttribute('title');figure.tabIndex=-1;
  const drawing=document.createElement('span');drawing.className='creature';drawing.innerHTML=figure.innerHTML;this.shadowRoot.querySelector('.perched').append(drawing);
  this.$('composer').onsubmit=e=>{e.preventDefault();this.send(this.$('input').value);};
  this.$('input').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();this.send(e.currentTarget.value);}};
  this.$('mic').onclick=()=>this.record();this.$('stop').onclick=()=>this.stopVoice();
  this.$('brief').onclick=()=>this.brief();this.$('mascot').onclick=()=>this.brief();
  this.$('collapse').onclick=()=>this.close();this.$('launcher').onclick=()=>this.open();
  this.$('chat-dialog').addEventListener('cancel',e=>{e.preventDefault();this.close();});
  this.$('chat-dialog').addEventListener('close',()=>{this.stopVoice();this.$('launcher').setAttribute('aria-expanded','false');this.$('launcher').focus();this.removeAttribute('open');this.emit('visibility',{open:false});});
  this.addEventListener('guardian:notification',()=>{this.$('alert-dot').hidden=false;this.$('launcher').setAttribute('aria-label','เปิดแชตกับ Guardian มีเรื่องอัปเดต');});
  this.shadowRoot.querySelectorAll('[data-prompt]').forEach(b=>b.onclick=()=>this.send(b.dataset.prompt));
  this.shadowRoot.querySelector('.guardian').hidden=true;
 }
 async initialize(){try{this.acceptState(await this.request('state'));this.setPhase('idle');this.emit('ready',{dataMode:this.state.dataMode});}catch(e){this.fail(e);}}
 acceptState(s){this.state=s;this.$('provenance').textContent=`${s.dataMode==='demo'?'กระเป๋าจำลอง':'Avalanche · กระเป๋าจริง'} · ${s.integration.mode==='ubot'?'U-bot · Professional':'โหมดตัวอย่าง · ตั้งค่า U-bot เพื่อคุยจริง'}`;this.updateWatches(s.guardian);this.emit('state',s);}
 setPhase(phase){this.phase=phase;this.$('stage').dataset.phase=phase;const messages={idle:'พร้อมช่วยคุณ',thinking:'กำลังตรวจข้อมูลและเลือกขั้นตอนถัดไป…',listening:'กำลังฟัง · กดอีกครั้งเพื่อส่ง',transcribing:'กำลังถอดเสียง…',speaking:'กำลังเล่าให้ฟัง',loading:'กำลังอ่านกระเป๋าและเทียบรายงานครั้งก่อน…',error:'ยังทำงานนี้ไม่สำเร็จ'};this.$('phase').textContent=messages[phase]||phase;this.emit('phase',{phase});}
 setBusy(value){this.busy=value;for(const id of ['send','brief','mascot','mic'])this.$(id).disabled=value;this.shadowRoot.querySelectorAll('[data-prompt]').forEach(b=>b.disabled=value);this.$('input').disabled=value;}
 fail(e){this.$('error').hidden=false;this.$('error').textContent=e.name==='AbortError'?'คำขอใช้เวลานานเกินไป กรุณาลองอีกครั้ง':e.message;this.setPhase('error');this.emit('error',{message:this.$('error').textContent});}
 clearError(){this.$('error').hidden=true;}
 open(){if(this.settingsBusy)return;this.shadowRoot.querySelector('.guardian').hidden=false;if(!this.$('chat-dialog').open)this.$('chat-dialog').showModal();this.$('launcher').setAttribute('aria-expanded','true');this.$('launcher').setAttribute('aria-label','เปิดแชตกับ Guardian');this.$('alert-dot').hidden=true;(this.$('chat-panel').hidden?this.$('debug-panel'):this.$('input')).focus();this.setAttribute('open','');this.emit('visibility',{open:true});}
 close(){this.stopVoice();this.shadowRoot.querySelector('.guardian').hidden=true;this.$('chat-dialog').close();}
 addMessage(role,text){this.shadowRoot.querySelector('.guardian').classList.add('has-chat');const row=el('article',null,'message '+role);row.append(el('small',role==='user'?'คุณ':'Guardian'),el('p',text));this.$('conversation').append(row);while(this.$('conversation').children.length>24)this.$('conversation').firstChild.remove();this.$('conversation').scrollTop=this.$('conversation').scrollHeight;return row;}
 async send(text){if(this.settingsBusy||this.busy||!text?.trim())return;this.stopVoice();this.setBusy(true);this.clearError();this.addMessage('user',text.trim());this.$('input').value='';this.setPhase('thinking');try{const r=await (async()=>{await this.pollPromise;return this.request('agent/chat',{message:text.trim()});})();this.acceptState(r.state);this.showResult(r);this.setPhase('idle');if(this.$('auto-read').checked)await this.speak(r.text);}catch(e){this.fail(e);}finally{this.setBusy(false);}}
 async brief(){if(this.settingsBusy||this.busy)return;this.stopVoice();this.setBusy(true);this.clearError();this.setPhase('loading');try{const r=await (async()=>{await this.pollPromise;return this.request('agent/brief',{});})();this.acceptState(r.state);this.showResult(r);await this.request('agent/ack',{});this.setPhase('idle');if(this.$('auto-read').checked)await this.speak(r.text);}catch(e){this.fail(e);}finally{this.setBusy(false);}}
 showResult(r){const row=this.addMessage('assistant',r.text);for(const warning of r.warnings||[])row.append(el('p',warning,'error'));const read=el('button','ฟังคำตอบ','text-button');read.onclick=()=>this.speak(r.text);row.append(read);
  for(const evidence of r.evidence||[]){const details=el('details',null,'evidence');const labels={get_wallet:'สถานะกระเป๋า',assess_wallet:'ผลตรวจสุขภาพ',investigate_changes:'สิ่งที่เปลี่ยนไป',research_token:'ข้อมูลเหรียญจาก Tokenomist',search_tokens:'เหรียญที่ค้นพบ',get_supply_events:'เหตุการณ์อุปทาน',propose_watch:'ขอบเขตเงื่อนไข',list_watches:'งานติดตาม'};details.append(el('summary',labels[evidence.tool]||evidence.tool));const result=evidence.result;
   if(evidence.tool==='investigate_changes'){details.append(el('p',result.note));for(const c of result.changes||[])details.append(el('p',`${c.symbol}: ${c.before??'ไม่ทราบ'} → ${c.after}${c.delta?' ('+c.delta+')':''}`));}
   if(evidence.tool==='assess_wallet'){details.append(el('p',result.concentration?`${result.concentration.symbol} คิดเป็น ${result.concentration.percent}% ของสินทรัพย์ที่ตีราคาได้`:result.coverage||result.note));}
   const pre=el('pre',JSON.stringify(result,null,2));details.append(pre);row.append(details);
  }
  for(const p of r.proposals||[]){const review=el('div',null,'proposal');const criteria={wallet_change:'แจ้งเมื่อจำนวนสินทรัพย์ที่อ่านได้เปลี่ยน หลังเริ่มติดตาม ไม่ใช่การเปลี่ยนราคา',supply_event:'แจ้งเหตุการณ์ปลดล็อกที่อ่านพบของสินทรัพย์ที่จับคู่ไว้ ภายในช่วงติดตาม',review_date:'แจ้งเมื่อถึงวันที่ '+p.date};review.append(el('strong','ตรวจเงื่อนไขก่อนบันทึก'),el('p',p.label),el('p',criteria[p.kind]),el('small',p.monitoring));const b=el('button','ยืนยันการติดตาม','confirm');b.onclick=async()=>{if(this.busy)return;this.setBusy(true);b.disabled=true;try{this.updateWatches(await this.request('agent/watch/confirm',{id:p.id}));b.textContent='บันทึกแล้ว';this.emit('watch-confirmed',{id:p.id});}catch(e){b.disabled=false;this.fail(e);}finally{this.setBusy(false);}};review.append(b);row.append(review);}
  if(r.trace?.length)row.append(el('small',`ตรวจ ${r.trace.length} ขั้นตอน · ${r.trace.map(t=>t.name).join(' → ')}`,'tool-trace'));this.$('conversation').scrollTop=this.$('conversation').scrollHeight;this.emit('result',r);
 }
 updateWatches(g){if(!g)return;this.guardian=g;const rules=g.rules.filter(r=>r.active);this.$('watch-count').textContent=rules.length;this.$('monitoring').textContent=g.monitoring;this.$('watches').replaceChildren();if(!rules.length)this.$('watches').append(el('p','ยังไม่มีเรื่องที่ฝากติดตาม ลองพูดว่า “ติดตามกระเป๋านี้ให้หน่อย”'));
  for(const rule of rules){const line=el('div',null,'watch');line.append(el('span',rule.label));const remove=el('button','หยุดติดตาม','text-button');remove.onclick=async()=>{if(this.busy)return;this.setBusy(true);try{this.updateWatches(await this.request('agent/watch/remove',{id:rule.id}));}catch(e){this.fail(e);}finally{this.setBusy(false);}};line.append(remove);this.$('watches').append(line);}
  this.$('alerts').replaceChildren();for(const n of g.notifications.slice(0,5)){const line=el('p',n.text,'notification');line.append(el('small',new Date(n.at).toLocaleString('th-TH')));this.$('alerts').append(line);}
 }
 async poll(){if(this.settingsBusy||this.busy||this.pollPromise||!this.state||document.hidden||!this.guardian?.rules.some(r=>r.active))return;this.pollPromise=(async()=>{try{const r=await this.request('agent/check',{});this.updateWatches(r);if(r.newNotifications?.length)this.emit('notification',r.newNotifications);}catch(e){if(!this.busy)this.fail(e);}finally{this.pollPromise=null;}})();return this.pollPromise;}
 async speak(text){if(!this.$('chat-dialog').open)return;this.stopVoice();this.clearError();if(!this.state?.integration.elevenConfigured){this.fail(new Error('ตั้งค่า ElevenLabs และเลือกเสียงในตั้งค่าก่อน'));return;}const id=++this.voiceId;try{this.setPhase('loading');const blob=await this.request('speech',{text},{audio:true});if(id!==this.voiceId||!this.isConnected)return;const url=URL.createObjectURL(blob);this.audio=new Audio(url);this.audioUrl=url;this.audio.onended=()=>this.stopVoice();this.audio.onerror=()=>{this.stopVoice();this.fail(new Error('เล่นเสียงไม่สำเร็จ ลองกดฟังคำตอบอีกครั้ง'));};await this.audio.play();this.$('stop').hidden=false;this.setPhase('speaking');}catch(e){this.stopVoice();this.fail(e);}}
 stopVoice(){this.voiceId=(this.voiceId||0)+1;if(this.audio){this.audio.pause();this.audio.src='';this.audio=null;}if(this.audioUrl){URL.revokeObjectURL(this.audioUrl);this.audioUrl=null;}if(this.recorder?.state==='recording'){this.cancelRecording=true;this.recorder.stop();}this.stream?.getTracks().forEach(t=>t.stop());clearTimeout(this.recordTimer);if(this.$('stop'))this.$('stop').hidden=true;if(this.$('mic')){this.$('mic').innerHTML=icon('mic')+'<span>กดเพื่อพูด</span>';this.$('mic').setAttribute('aria-pressed','false');}if(this.$('phase')&&!this.busy)this.setPhase('idle');}
 async record(){if(this.recorder?.state==='recording'){this.recorder.stop();return;}if(this.busy)return;this.stopVoice();this.clearError();if(!this.state?.integration.elevenConfigured){this.fail(new Error('ตั้งค่า ElevenLabs ก่อนใช้เสียง หรือพิมพ์คำถามได้เลย'));return;}if(!navigator.mediaDevices?.getUserMedia||!globalThis.MediaRecorder){this.fail(new Error('เบราว์เซอร์นี้ไม่รองรับไมโครโฟน กรุณาพิมพ์คำถามแทน'));return;}
  try{this.setBusy(true);const recordingId=this.voiceId;this.stream=await navigator.mediaDevices.getUserMedia({audio:true});if(!this.isConnected||recordingId!==this.voiceId||this.shadowRoot.querySelector('.guardian').hidden){this.stopVoice();this.setBusy(false);return;}const type=['audio/webm;codecs=opus','audio/mp4'].find(t=>MediaRecorder.isTypeSupported(t));this.recorder=new MediaRecorder(this.stream,type?{mimeType:type,audioBitsPerSecond:64000}:{});const chunks=[];this.cancelRecording=false;this.recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};this.recorder.onstop=async()=>{clearTimeout(this.recordTimer);this.stream.getTracks().forEach(t=>t.stop());this.$('mic').innerHTML=icon('mic')+'<span>กดเพื่อพูด</span>';this.$('mic').setAttribute('aria-pressed','false');if(this.cancelRecording){this.setBusy(false);return;}this.setPhase('transcribing');this.setBusy(true);try{const blob=new Blob(chunks,{type:this.recorder.mimeType});if(blob.size>4000000)throw new Error('เสียงยาวเกินไป กรุณาพูดสั้นลง');const r=await this.request('transcribe',blob,{raw:true,mime:blob.type});if(recordingId!==this.voiceId||!this.$('chat-dialog').open)return;if(!r.text?.trim())throw new Error('ไม่ได้ยินข้อความ ลองพูดอีกครั้งหรือพิมพ์แทน');this.setBusy(false);this.$('auto-read').checked=true;await this.send(r.text);}catch(e){this.fail(e);}finally{this.setBusy(false);}};this.recorder.start();this.setPhase('listening');this.$('mic').disabled=false;this.$('mic').innerHTML=icon('stop')+'<span>หยุดและส่งเสียง</span>';this.$('mic').setAttribute('aria-pressed','true');this.recordTimer=setTimeout(()=>{if(this.recorder.state==='recording')this.recorder.stop();},25000);}catch(e){this.stopVoice();this.setBusy(false);this.fail(new Error(e.name==='NotAllowedError'?'ยังไม่ได้อนุญาตไมโครโฟน เปิดสิทธิ์ในเบราว์เซอร์หรือพิมพ์แทน':e.message));}
 }
}
if(!customElements.get('u-guardian'))customElements.define('u-guardian',GuardianWidget);
