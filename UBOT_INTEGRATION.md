# U-Bot integration handoff

- **Source:** `/Users/ratchanonb/code/personal/u-hack-2/ubot-connect` at `a5d04e3`.
- **Base:** freshly fetched `origin/main` at `e5fbb84`.
- **Integration:** `feat/integrate-ubot-demo` in `/Users/ratchanonb/code/personal/u-hack-2-ubot-integration`.
- **Adapted files:** `ubot/auth.mjs` and `ubot/ubot.mjs` from the PoC; `providers.mjs`, `application.mjs`, `agent.mjs`, and the existing Connections and Guardian chat UI.

The browser sends an empty Connect request through the existing U-Guardian API. The backend reads server-only `UBOT_SUPABASE_ANON_KEY`, `UBOT_EMAIL`, and `UBOT_PASSWORD`, signs in at `UBOT_SUPABASE_URL` (default `https://jspyarovtaqokysihujr.supabase.co`), and verifies with a real `POST` to `UBOT_CHAT_URL` (default `https://u.bot/api/chat`). Access tokens stay inside the server request. Each chat call signs in again, and a rejected access token gets one fresh login and retry. The existing agent sends bounded prompts and stores history per visitor. Disconnect clears only that visitor's U-Bot mode and conversation history.

On Vercel, configure the three required variables as **Secret** project environment variables. Existing private Blob storage and `BLOB_READ_WRITE_TOKEN` remain required for the main app's per-visitor state. The new code uses no persistent Function memory for authentication. Request bodies are capped by the existing API; U-Bot calls have timeouts and the PoC response-size limit. The additional 5 connect / 12 chat requests per minute limits are per Function instance; a Vercel Firewall rate rule is needed for a global public limit.

Local verification: `npm test` and `npm run build`; browser flow at `http://127.0.0.1:4188/`. The live shared account returned `Connected` on verification, a genuine English answer in Guardian chat, and a Thai answer to a Thai message. Browser Disconnect, Reconnect, and restored conversation after reload were observed. Canceling a chat aborts the upstream request and leaves stored conversation history unchanged. Demo wallet, goals, Avalanche, Tokenomist and voice paths retain the main app's implementation. No Vercel deployment was performed.

Provider status events exposed by the existing widget are `disconnected`, `connecting`, `idle`, `thinking`, `answering`, and `error`. `answering` follows a completed response; no search event is invented from U-Bot text. The existing Guardian chat does not stream partial text to the browser.
