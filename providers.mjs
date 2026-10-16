import {t as tr,language} from './locale.mjs';
import {providerSignal} from './agent-budget.mjs';
import {debugEvent,debugStep} from './debug.mjs';
import { randomUUID } from 'node:crypto';
import {login} from './ubot/auth.mjs';
import {ProviderError,streamUbot} from './ubot/ubot.mjs';
const legacyIntegrationGuard = 'IMPORTANT U-GUARDIAN CONTRACT: When asked for a tool plan, return ONLY the requested JSON. When asked for an explanation, use concise Thai WITHOUT NUMBERS OR CURRENCY NAMES. The UI shows verified tool numbers separately. coverage is a percentage; remaining is the shortfall to goal, not wallet balance. Respect the evidence data mode: simulated or live read-only. Never call simulated data live, or live data simulated. Only a prepared action draft needs UI confirmation; assessment and simulation do not execute actions. Never claim a real transfer.\n';
export const defaultTemplate = JSON.stringify({mode:'professional',sessionId:'{{sessionId}}',messages:[{role:'user',content:'{{prompt}}'}],userText:'{{prompt}}'});
export function normalizeUbotTemplate(raw=defaultTemplate){
 let value;try{value=JSON.parse(raw);}catch{return raw;}
 if(!value||typeof value!=='object'||Array.isArray(value))return raw;
 const clean=v=>typeof v==='string'?v.replaceAll(legacyIntegrationGuard,'').replaceAll('Tool plan = JSON only. Explanation = Thai, no numbers, no currency names; respect data provenance.','').trim():Array.isArray(v)?v.map(clean):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,clean(x)])):v;
 return JSON.stringify({...clean(value),mode:'professional'});
}

function fill(value, prompt, sessionId) {
  if (typeof value === 'string') return value.replaceAll('{{sessionId}}', sessionId).replaceAll('{{prompt}}', prompt);
  if (Array.isArray(value)) return value.map(v => fill(v, prompt, sessionId));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k, fill(v,prompt,sessionId)]));
  return value;
}
export function textFrom(value) {
  if (typeof value === 'string') return value;
  if (!value) return '';
  if (value.type === 'text-delta') return value.delta || value.textDelta || '';
  if (Array.isArray(value)) return value.map(textFrom).join('');
  return textFrom(value.choices?.[0]?.delta?.content ?? value.choices?.[0]?.message?.content ?? value.message?.content ?? value.response ?? value.content ?? value.text ?? value.answer ?? value.data?.content ?? value.data?.text ?? '');
}
export function parseReply(body, contentType = '') {
  if (body.includes('[DEGENERATE]')) throw new Error(tr('U-bot แจ้งว่าคำตอบผิดรูปแบบ กรุณาลองอีกครั้ง'));
  body = body.replace(/\[STATUS:\w+\]/g, '').trim();
  if (contentType.includes('text/html') || /^\s*<!doctype html|^\s*<html/i.test(body)) return '';
  if (contentType.includes('json') && !contentType.includes('event-stream')) {const value=JSON.parse(body);return ['tool','answer'].includes(value?.type)?JSON.stringify(value):textFrom(value);}
  if (/^data:/m.test(body) || /^0:/m.test(body)) {
    return body.split(/\r?\n/).map(line => {
      const value = line.startsWith('data:') ? line.slice(5).trim() : line.startsWith('0:') ? line.slice(2) : '';
      if (!value || value === '[DONE]') return '';
      try { return textFrom(JSON.parse(value)); } catch { return ''; }
    }).join('');
  }
  // The current U-bot frontend consumes raw text chunks, including JSON text
  // when prompted to produce a tool plan. Do not discard that JSON as an envelope.
  try { return textFrom(JSON.parse(body)) || (contentType.includes('text/plain') ? body : ''); }
  catch { return contentType.includes('text/plain') ? body : ''; }
}
export async function ubot(config, prompt, timeout=60000, cancellation) {
  const signal = cancellation?AbortSignal.any([providerSignal(timeout),cancellation]):providerSignal(timeout);
  const messages = [{role:'user',content:prompt}];
  const sessionId = randomUUID();
  let token = await login({signal});
  for (let attempt = 0; attempt < 2; attempt++) {
    let text = '';
    try {
      await debugStep('provider','U-bot HTTP',{url:process.env.UBOT_CHAT_URL||'https://u.bot/api/chat',method:'POST'},async()=>{
        for await (const event of streamUbot({token,messages,sessionId,signal,url:process.env.UBOT_CHAT_URL||'https://u.bot/api/chat'})) {
          if (event.type === 'delta') text += event.text;
        }
      });
      if (!text.trim()) throw new ProviderError('empty','U-Bot returned no readable answer.');
      return text.slice(0,12000);
    } catch (error) {
      if (error.code !== 'expired' || attempt) throw error;
      token = await login({signal});
    }
  }
}

// Verify the shared server account before enabling U-Bot for this visitor.
export async function verifyUbotConnection(config, input={}, call=ubot) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length) throw new Error('U-Bot connection accepts no browser credentials.');
  const text = await call(config,'Reply only with: Connected',45000);
  return {text,config:{...config,mode:'ubot',ubotStatus:'verified'}};
}
async function eleven(config, path, options = {}) {
  if (!config.elevenKey) throw new Error(tr('ยังไม่ได้ตั้ง ElevenLabs API key'));
  debugEvent('provider.request','ElevenLabs HTTP',{path,method:options.method||'GET',body:typeof options.body==='string'?options.body:options.body instanceof FormData?{model:options.body.get('model_id'),audioBytes:options.body.get('file')?.size}:undefined});
  const res = await fetch(`https://api.elevenlabs.io${path}`, { ...options, redirect: 'error', headers: { ...options.headers, 'xi-api-key': config.elevenKey }, signal: providerSignal(30000) });
  debugEvent('provider.response','ElevenLabs HTTP',{path,status:res.status});
  if (!res.ok) throw new Error(tr('ElevenLabs HTTP {0}: ตรวจ API key, สิทธิ์, voice/model และเครดิต',res.status));
  return res;
}
export async function voices(config) {
  const res = await eleven(config, '/v2/voices?page_size=30');
  const data = await res.json();
  return (data.voices || []).map(v => ({ id: v.voice_id, name: v.name }));
}
export async function speech(config, text) {
  if (!config.voiceId) throw new Error(tr('เลือก ElevenLabs voice ก่อน'));
  const res = await eleven(config, `/v1/text-to-speech/${encodeURIComponent(config.voiceId)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ text: text.slice(0, 2500), model_id: config.ttsModel,
      ...(config.ttsModel === 'eleven_v3' ? { language_code: language() } : {}) }) });
  const bytes=Buffer.from(await res.arrayBuffer());debugEvent('voice.result','Speech generated',{bytes:bytes.length,mime:'audio/mpeg'});return bytes;
}
export async function transcribe(config, bytes, mime) {
  const form = new FormData();
  form.append('model_id', config.sttModel);
  form.append('language_code', language() === 'th' ? 'tha' : 'eng');
  form.append('file', new Blob([bytes], { type: mime }), mime.includes('mp4') ? 'voice.mp4' : 'voice.webm');
  const res = await eleven(config, '/v1/speech-to-text', { method: 'POST', body: form });
  const result=await res.json();debugEvent('voice.result','Speech transcribed',result);return result.text;
}
