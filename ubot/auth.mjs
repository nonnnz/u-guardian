import { ProviderError } from './ubot.mjs';

const DEFAULT_URL = 'https://jspyarovtaqokysihujr.supabase.co';
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

export function authConfig(env) {
  const key = env.UBOT_SUPABASE_ANON_KEY || env.UBOT_SUPABASE_PUBLISHABLE_KEY;
  if (!key || !env.UBOT_EMAIL || !env.UBOT_PASSWORD) throw new ProviderError('config', 'Demo authentication is not configured on the server.', 503);
  const url = env.UBOT_SUPABASE_URL || DEFAULT_URL;
  if (!/^https:\/\//.test(url)) throw new ProviderError('config', 'The Supabase URL must use HTTPS.', 503);
  return { url: url.replace(/\/$/, ''), key, email: env.UBOT_EMAIL, password: env.UBOT_PASSWORD };
}

// Fresh password login per request works across Vercel instances and never stores a rotating refresh token.
export async function login({ env = process.env, fetcher = fetch, signal } = {}) {
  const { url, key, email, password } = authConfig(env);
  const endpoint = `${url}/auth/v1/token?grant_type=password`;
  for (let attempt = 0; attempt < 3; attempt++) {
    let response;
    try {
      response = await fetcher(endpoint, {
        method: 'POST', redirect: 'error',
        headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` },
        body: JSON.stringify({ email, password, gotrue_meta_security: {} }),
        signal: AbortSignal.any([signal ?? new AbortController().signal, AbortSignal.timeout(15000)]),
      });
    } catch (error) {
      if (signal?.aborted) throw error;
      if (attempt < 2) { await pause(250 * 2 ** attempt); continue; }
      throw new ProviderError('network', 'Demo login could not reach U-Bot authentication.', 502);
    }
    if ((response.status === 429 || response.status >= 500) && attempt < 2) { await response.body?.cancel(); await pause(250 * 2 ** attempt); continue; }
    if (response.status === 429) throw new ProviderError('rate-limit', 'U-Bot authentication is rate limited. Try again shortly.', 429);
    if (response.status >= 500) throw new ProviderError('provider', 'U-Bot authentication is unavailable. Try again.', 502);
    if (!response.ok) throw new ProviderError('auth', 'Demo account sign-in failed. Check the server credentials.', 401);
    const data = await response.json().catch(() => null);
    if (typeof data?.access_token !== 'string' || !data.access_token) throw new ProviderError('format', 'Authentication returned no usable access token.');
    return data.access_token;
  }
  throw new ProviderError('auth', 'Demo account sign-in failed.', 502);
}
