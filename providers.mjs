import { randomUUID } from 'node:crypto';
const integrationGuard = 'IMPORTANT U-GUARDIAN CONTRACT: When asked for a tool plan, return ONLY the requested JSON. When asked for an explanation, use concise Thai WITHOUT NUMBERS OR CURRENCY NAMES. The UI shows verified tool numbers separately. coverage is a percentage; remaining is the shortfall to goal, not wallet balance. Respect the evidence data mode: simulated or live read-only. Never call simulated data live, or live data simulated. Only a prepared action draft needs UI confirmation; assessment and simulation do not execute actions. Never claim a real transfer.\n';
const guardedPrompt = integrationGuard + '\n{{prompt}}\n\nTool plan = JSON only. Explanation = Thai, no numbers, no currency names; respect data provenance.';
export const defaultTemplate = JSON.stringify({ mode: 'fast', sessionId: '{{sessionId}}', messages: [{ role: 'user', content: guardedPrompt }], userText: guardedPrompt });

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
  if (body.includes('[DEGENERATE]')) throw new Error('U-bot แจ้งว่าคำตอบผิดรูปแบบ กรุณาลองอีกครั้ง');
  body = body.replace(/\[STATUS:\w+\]/g, '').trim();
  if (contentType.includes('text/html') || /^\s*<!doctype html|^\s*<html/i.test(body)) return '';
  if (contentType.includes('json') && !contentType.includes('event-stream')) return textFrom(JSON.parse(body));
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
export async function ubot(config, prompt, timeout=60000) {
  if (!config.ubotToken) throw new Error('ยังไม่ได้ตั้ง U-bot Bearer token');
  let template;
  try { template = JSON.parse(config.ubotTemplate); } catch { throw new Error('U-bot payload template ไม่ใช่ JSON'); }
  if (!config.ubotTemplate.includes('{{prompt}}')) throw new Error('Payload ต้องมี {{prompt}} ในตำแหน่งข้อความ');
  const res = await fetch('https://u.bot/api/chat', { method: 'POST', redirect: 'error',
    headers: { Authorization: `Bearer ${config.ubotToken}`, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    body: JSON.stringify(fill(template, prompt, randomUUID())), signal: AbortSignal.timeout(timeout) });
  if (!res.ok) throw new Error(`U-bot HTTP ${res.status}: ตรวจ token และ payload จากเว็บอีกครั้ง`);
  const text = parseReply(await res.text(), res.headers.get('content-type') || '');
  if (!text.trim()) throw new Error('ยังอ่าน response ของ U-bot รูปแบบนี้ไม่ได้ ต้องปรับ adapter ตาม response จริง');
  return text.slice(0, 12000);
}
async function eleven(config, path, options = {}) {
  if (!config.elevenKey) throw new Error('ยังไม่ได้ตั้ง ElevenLabs API key');
  const res = await fetch(`https://api.elevenlabs.io${path}`, { ...options, redirect: 'error', headers: { ...options.headers, 'xi-api-key': config.elevenKey }, signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`ElevenLabs HTTP ${res.status}: ตรวจ API key, สิทธิ์, voice/model และเครดิต`);
  return res;
}
export async function voices(config) {
  const res = await eleven(config, '/v2/voices?page_size=30');
  const data = await res.json();
  return (data.voices || []).map(v => ({ id: v.voice_id, name: v.name }));
}
export async function speech(config, text) {
  if (!config.voiceId) throw new Error('เลือก ElevenLabs voice ก่อน');
  const res = await eleven(config, `/v1/text-to-speech/${encodeURIComponent(config.voiceId)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ text: text.slice(0, 2500), model_id: config.ttsModel }) });
  return Buffer.from(await res.arrayBuffer());
}
export async function transcribe(config, bytes, mime) {
  const form = new FormData();
  form.append('model_id', config.sttModel);
  form.append('file', new Blob([bytes], { type: mime }), mime.includes('mp4') ? 'voice.mp4' : 'voice.webm');
  const res = await eleven(config, '/v1/speech-to-text', { method: 'POST', body: form });
  return (await res.json()).text;
}
