export class ProviderError extends Error {
  constructor(code, message, status = 502) { super(message); this.code = code; this.status = status; }
}

function textFrom(value) {
  if (typeof value === 'string') return value;
  if (!value) return '';
  if (value.error || value.type === 'error') throw new ProviderError('provider', 'U-Bot could not finish this response. Please retry.');
  if (Array.isArray(value)) return value.map(textFrom).join('');
  if (value.type === 'text-delta') return value.delta ?? value.textDelta ?? '';
  return textFrom(value.choices?.[0]?.delta?.content ?? value.choices?.[0]?.message?.content ?? value.message?.content ?? value.response ?? value.content ?? value.text ?? value.answer ?? value.data?.content ?? value.data?.text ?? '');
}

export async function* decodeResponse(response) {
  const type = response.headers.get('content-type') || '';
  if (!/text\/plain|event-stream|application\/json|x-ndjson|x-vercel-ai-data-stream/.test(type)) {
    throw new ProviderError('format', 'U-Bot returned an unsupported response format.');
  }
  const json = type.includes('application/json');
  const events = type.includes('event-stream');
  const lines = type.includes('ndjson') || type.includes('x-vercel-ai-data-stream') || response.headers.has('x-vercel-ai-data-stream');
  const decoder = new TextDecoder();
  let buffer = '', total = 0, seen = false, finished = false;
  function* payload(raw) {
    if (!raw.trim()) return;
    if (raw.trim() === '[DONE]') { finished = true; return; }
    let value;
    try { value = JSON.parse(raw); } catch { throw new ProviderError('format', 'U-Bot returned an unreadable stream.'); }
    if (value?.type === 'finish' || value?.choices?.[0]?.finish_reason) finished = true;
    const text = textFrom(value);
    if (text) { seen = true; yield { type: 'delta', text }; }
  }
  function* drain(final = false) {
    if (json) { if (final) yield* payload(buffer); return; }
    if (events || lines) {
      const separator = events ? '\n\n' : '\n';
      let at;
      while ((at = buffer.indexOf(separator)) >= 0 || final && buffer.length) {
        if (at < 0) at = buffer.length;
        const frame = buffer.slice(0, at); buffer = buffer.slice(at + separator.length);
        if (events) {
          const data = frame.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
          if (data) yield* payload(data);
        } else if (frame.startsWith('3:')) {
          throw new ProviderError('provider', 'U-Bot could not finish this response. Please retry.');
        } else if (frame.startsWith('0:')) yield* payload(frame.slice(2));
        else if (frame.startsWith('d:')) finished = true;
        else if (frame.trim().startsWith('{')) yield* payload(frame);
      }
      return;
    }
    // Hold a possible split control marker until its closing bracket arrives.
    const bracket = buffer.lastIndexOf('[');
    const hold = !final && bracket >= 0 && !buffer.slice(bracket).includes(']') && buffer.length - bracket < 128;
    const ready = hold ? buffer.slice(0, bracket) : buffer;
    buffer = hold ? buffer.slice(bracket) : '';
    if (ready.includes('[DEGENERATE]')) throw new ProviderError('provider', 'U-Bot could not finish this response. Please retry.');
    if (/\[STATUS:\w+\]/.test(ready)) yield { type: 'status', state: 'thinking' };
    const text = ready.replace(/\[STATUS:\w+\]/g, '');
    if (text.trim()) seen = true;
    if (text) yield { type: 'delta', text };
  }
  if (!response.body) throw new ProviderError('empty', 'U-Bot returned no response.');
  for await (const chunk of response.body) {
    total += chunk.length;
    if (total > 262144) throw new ProviderError('limit', 'The response exceeded the preview limit. Try a shorter question.');
    buffer += decoder.decode(chunk, { stream: true });
    // Preserve a trailing CR so CRLF split across network chunks stays intact.
    buffer = buffer.replace(/\r\n/g, '\n');
    yield* drain();
  }
  buffer += decoder.decode();
  yield* drain(true);
  if (!seen) throw new ProviderError('empty', 'U-Bot returned no readable answer. Check the token and try again.');
  if (events && !finished) throw new ProviderError('interrupted', 'The response ended early. The partial answer is kept below.');
}

export async function* streamUbot({ token, messages, sessionId, signal, fetcher = fetch, url = 'https://u.bot/api/chat' }) {
  if (!/^https:\/\//.test(url)) throw new ProviderError('config', 'The U-Bot chat URL must use HTTPS.', 503);
  const response = await fetcher(url, {
    method: 'POST', redirect: 'error',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'text/plain, text/event-stream, application/json' },
    body: JSON.stringify({ mode: 'professional', messages, sessionId, userText: messages.at(-1).content }),
    signal: AbortSignal.any([signal ?? new AbortController().signal, AbortSignal.timeout(60000)]),
  });
  if ([401, 403].includes(response.status)) throw new ProviderError('expired', 'U-Bot rejected the demo account session. Try again.', 401);
  if (response.status === 429) throw new ProviderError('rate-limit', 'U-Bot is limiting requests. Wait a moment before trying again.', 429);
  if (!response.ok) throw new ProviderError('provider', 'U-Bot is unavailable right now. Please try again.');
  yield* decodeResponse(response);
}
