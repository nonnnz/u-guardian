# U-Guardian

An English-first, bilingual voice companion for understanding a crypto wallet. The app has one page: wallet status, a mascot perched on its edge, and a Settings button. Click the mascot to open chat; closing it returns to the wallet without discarding the conversation.

Live app: https://u-guardian.vercel.app

## What works

- Wallet health: Avalanche C-Chain balances, available recent transfers, concentration when priced coverage is complete, and goal-aware explanations.
- Research: U-bot chooses tools in a bounded multi-step loop. Tokenomist supplies token identity, allocation, fundraising, buyback, burn and mapped wallet supply evidence when available.
- Changes: compare quantities, observed USD unit quotes and available transfers with the last acknowledged briefing; check again on reopening. This is not price P&L or a complete transaction investigation.
- Tracking: explicitly confirmed wallet-change, supply-event, review-date, activation-price percentage and transfer-USD threshold rules. New alerts can appear as simulated in-app calls; Answer opens chat and can read them aloud.
- Market and advice: CoinGecko project descriptions, market metrics and search trends, plus attributed CoinDesk/Cointelegraph RSS headline matches. These are bounded sources, not forecasts or exhaustive news.
- Voice: push-to-talk through ElevenLabs transcription, with optional spoken replies. Typing remains available.

## Set up from the main page

Open **ตั้งค่า**. Settings stay in a dialog on the same page.

1. Under **การเชื่อมต่อ**, enter U-bot Bearer token, Avalanche Data API key, Tokenomist API key and ElevenLabs key. Blank credential fields retain the saved value.
2. Click **Connect U-bot** to verify its saved or newly supplied token and activate the U-bot agent. Test other providers, load/select an ElevenLabs voice, then save.
3. Under **กระเป๋า**, choose Live, paste a public C-Chain address beginning with 0x, choose Mainnet or Fuji, then save. This reads public data; no private key or signature is needed.
4. Optionally save your goals. For ERC-20 supply monitoring, use **จับคู่เหรียญกับ Tokenomist**, verify the project's contract yourself and confirm the match. Native Mainnet AVAX is mapped automatically.
5. Close Settings and click the mascot. Ask for wallet health, what changed, or a watch.

Demo wallet data and local example answers are synthetic unless U-bot mode is selected for reasoning. Public market/news tools still return real sourced evidence. Settings provides synthetic price-drop and outgoing-transfer buttons. See [USER-TEST-GUIDE.md](USER-TEST-GUIDE.md) for the current three-pillar capability matrix, English prompts, limits and repeatable demo.

**Connect U-bot is a saved-credential connection check, not OAuth.** It switches to the real agent only after a successful request; failed authentication leaves the prior configuration intact. The Open U-bot link opens the provider's site and does not import its browser session. An expired token must still be replaced under manual token settings. No documented third-party OAuth integration was found in the supplied guide or the public frontend/discovery documents inspected on 2026-10-15.

U-bot requests use **Professional** (`professional`) for both planning and explanations. Existing saved templates are normalized to Professional when loaded, saved or called, and the exact legacy no-numbers guard is removed. Other custom payload fields are retained. There is no silent fallback to Casual. This selects the requested mode; it does not establish that Professional is universally more accurate.

Planning and explanation use separate prompts. The planner returns validated JSON and allowlisted arguments. A `finishAfterTool` hint skips a redundant planning request when one tool is sufficient; token search still requires a separate research step. The explainer may use numbers, units, dates and token names supported by this turn's evidence. Large evidence is compacted into valid JSON with explicit omissions, while full tool results remain in the UI subject to Debug display limits.

The agent allows at most five planning steps, one retry per invalid plan, a 40-second planning-call timeout, a 55-second explanation timeout, and a shared 170-second provider budget with time reserved for the answer. Avalanche/Tokenomist requests inherit the remaining budget. Existing evidence is preserved and a visible warning is returned if later planning or explanation fails. A provider failure before any evidence remains an error. Backend persistence/response overhead is outside the provider budget.

Watch drafts require explicit user intent and matching supported scope. Unsupported portfolio-value, rolling-price, selected-transfer-filter and notification-channel requests return a capability explanation without creating a draft. Unknown tool arguments, impossible dates and common selected-token/threshold substitutions are rejected. This combines schema checks, conservative intent checks and prompting; it is not a guarantee of semantic accuracy for every possible wording. Confirmation is still required to activate a watch.

## Boundaries

The public Vercel app checks active watch rules every minute while the page is visible. Closing chat does not stop those checks; closing the page does. There is no provisioned background scheduler, SMS or Web Push. Voice is not continuous listening. The app does not trade, audit approvals, analyze DeFi positions, verify scam safety or predict buy/sell timing.

The old dashboard and separate Settings page have been removed. Old /settings.html and /embed-example.html links redirect home. Embedding examples, transport API and embedding documentation are removed from the current scope. The custom element is an internal UI module, not a released integration SDK. Legacy phone/Fuji/backend routes remain for compatibility, but their old screens are no longer part of the app.

## Debug the agent

Open the mascot chat and enable **Debug** in its header. The adjacent **Chat / Debug** (or **แชต / Debug** in Thai) tabs switch between the conversation and diagnostics. Send a message, request a briefing or use voice in the chat tab, then inspect each expandable event in Debug.

Each request records timestamps and duration, the input, U-bot prompts and expanded payload (including the selected mode), raw provider response, validated JSON decision, tool arguments/results, provider calls/cache results, retries, errors, session saves and final answer. Local demo rules and briefings are explicitly identified as not calling U-bot. Voice requests record STT text and TTS metadata, not audio bytes in the log.

Logs arrive **after each request completes**, not as a live stream. Debug retains the latest four requests in browser memory only; clearing logs, disabling Debug or reloading removes them. Logs are not written to chat history, Blob records or server console. Credentials are redacted before delivery, but messages and public wallet data remain visible. Long payloads are explicitly truncated (40,000 characters per event; bounded request total/event count). These are operational request/response logs, not the model's private reasoning. Network/platform failures before the application responds may have no backend trace.

## Run locally

Requires Node.js 24.

```powershell
npm ci
npm start
```

Open http://127.0.0.1:4173. Settings writes local provider credentials to .env; saved wallet/agent state stays in .local. Both are ignored by Git. See .env.example for environment names. Never commit credentials.

## Deployment and storage

Vercel serves public assets and a Node function. Connect a **private Vercel Blob store** using BLOB_READ_WRITE_TOKEN. Provider credentials are supplied through Settings, not bundled into the deployment.

The hosted demo has no login. A random HttpOnly/Secure/SameSite session cookie identifies one wallet and settings for each browser session. Records and credentials are encrypted with AES-256-GCM in private Blob storage; provider keys are not returned in state responses or kept in browser storage. Clearing cookies loses access to that session. The encryption key is derived from the Blob token, so rotating that token requires data migration or new sessions. This is a hackathon demo, not a multi-user financial service.

Conditional writes and a lease serialize serverless mutations; an interrupted request may temporarily block another operation. Audio uploads are capped at 4 MB. GitHub/Vercel access is separate from an app visitor's session.

## Verification

```powershell
npm test
npm run build
node test/guardian-browser-smoke.cjs
node test/guardian-voice-smoke.cjs
node test/debug-browser.cjs
```

Browser tests use Playwright with Edge; set PLAYWRIGHT_MODULE to its installed module location when needed. Run an isolated server at port 4180 (or set BASE_URL), with GUARDIAN_IGNORE_SUPPLIED_KEYS=1, a separate GUARDIAN_ENV_FILE and GUARDIAN_STATE_DIR. The settings test writes a dummy credential to that isolated environment file. Never run it against a server using your actual credentials.

The browser smoke test covers collapsed chat, focus/Escape, reports, watch confirmation, settings persistence, mobile layout, and controlled wallet/mapping fixtures. The voice smoke uses a synthetic microphone and mocked speech APIs; it does not test a physical microphone or incur provider charges.


## English and Thai

English is the default interface. Use **English / ไทย** in the header to switch; the preference is saved locally under `guardian-language`. Switching reloads the page and clears its temporary chat/Debug display, but keeps saved wallet/provider settings, goals and watches. It is blocked while a task is running.

The browser sends `x-guardian-language: en|th` on every API request, including audio uploads. HTTP requests default to English. Request-scoped async context keeps concurrent callers’ languages separate. Planner replies, watch labels, evidence explanations, local briefings, capability guards and provider errors use the selected language. STT receives `eng` or `tha` as its language hint ([ElevenLabs API](https://elevenlabs.io/docs/api-reference/speech-to-text/convert)); TTS reads the resulting text with the configured voice. User text, token identities, raw evidence and saved goal option values are not machine-translated.

Authored strings live in `public/messages.js`; marked HTML uses `public/i18n.js`, and server copy uses `locale.mjs`. The Thai source keys retain compatibility with existing saved goal values. Direct legacy library calls without a request context retain Thai.

Additional browser verification (isolated test server only):

```powershell
$env:BASE_URL='http://127.0.0.1:4186'
node test/bilingual-browser.cjs
$env:TEST_LANGUAGE='en'
node test/guardian-voice-smoke.cjs
$env:TEST_LANGUAGE='th'
node test/guardian-voice-smoke.cjs
```

See [AGENT-EVALUATION.md](AGENT-EVALUATION.md) for observed live English provider results and test limitations.
