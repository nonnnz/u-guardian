# U-Guardian

A Thai voice companion for understanding a crypto wallet. The app has one page: wallet status, a mascot perched on its edge, and a Settings button. Click the mascot to open chat; closing it returns to the wallet without discarding the conversation.

Live app: https://u-guardian.vercel.app

## What works

- Wallet health: Avalanche C-Chain balances, available recent transfers, concentration when priced coverage is complete, and goal-aware explanations.
- Research: U-bot chooses tools in a bounded multi-step loop. Tokenomist supplies token identity, allocation, fundraising, buyback, burn and mapped wallet supply evidence when available.
- Changes: compare quantities with the last acknowledged briefing. This is not price P&L or a complete transaction-cause investigation.
- Tracking: draft a wallet-change, supply-event or review-date rule, then explicitly confirm it. View notifications and stop rules in chat.
- Voice: push-to-talk through ElevenLabs transcription, with optional spoken replies. Typing remains available.

## Set up from the main page

Open **ตั้งค่า**. Settings stay in a dialog on the same page.

1. Under **การเชื่อมต่อ**, enter U-bot Bearer token, Avalanche Data API key, Tokenomist API key and ElevenLabs key. Blank credential fields retain the saved value.
2. Click **Connect U-bot** to verify its saved or newly supplied token and activate the U-bot agent. Test other providers, load/select an ElevenLabs voice, then save.
3. Under **กระเป๋า**, choose Live, paste a public C-Chain address beginning with 0x, choose Mainnet or Fuji, then save. This reads public data; no private key or signature is needed.
4. Optionally save your goals. For ERC-20 supply monitoring, use **จับคู่เหรียญกับ Tokenomist**, verify the project's contract yourself and confirm the match. Native Mainnet AVAX is mapped automatically.
5. Close Settings and click the mascot. Ask for wallet health, what changed, or a watch.

Demo uses explicit synthetic data and local example answers unless U-bot mode is selected. The demo event button lives inside Settings.

**Connect U-bot is a saved-credential connection check, not OAuth.** It switches to the real agent only after a successful request; failed authentication leaves the prior configuration intact. The Open U-bot link opens the provider's site and does not import its browser session. An expired token must still be replaced under manual token settings. No documented third-party OAuth integration was found in the supplied guide or the public frontend/discovery documents inspected on 2026-10-15.

U-bot's Casual mode maps to `fast`, Professional to `professional`; the supplied guide describes a reply-style difference. A small live evaluation on 2026-10-15 accepted valid JSON and an appropriate first tool for all four prompts in each mode (wallet health, changes, token research, watch draft). This is a smoke evaluation, not a general accuracy guarantee.

For a full live Avalanche token research sequence, Casual completed `search_tokens → research_token → answer` in 21.5 seconds. Professional timed out on the third U-bot request in two attempts under the current per-request timeout. The default remains Casual. Allocations, fundraising and burns were available for the tested token; buybacks were unavailable. No transactions or notifications were sent during these evaluations.

## Boundaries

The public Vercel app checks active watch rules every minute while the page is visible. Closing chat does not stop those checks; closing the page does. There is no provisioned background scheduler, SMS or Web Push. Voice is not continuous listening. The app does not trade, audit approvals, analyze DeFi positions, verify scam safety or predict buy/sell timing.

The old dashboard and separate Settings page have been removed. Old /settings.html and /embed-example.html links redirect home. Embedding examples, transport API and embedding documentation are removed from the current scope. The custom element is an internal UI module, not a released integration SDK. Legacy phone/Fuji/backend routes remain for compatibility, but their old screens are no longer part of the app.

## Debug the agent

Open the mascot chat and enable **Debug** in its header. The adjacent **แชต / Debug** tabs switch between the conversation and diagnostics. Send a message, request a briefing or use voice in the chat tab, then inspect each expandable event in Debug.

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
