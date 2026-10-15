# U-Guardian embedded agent

The product is the companion, not the host dashboard. `/` is a minimal wallet host; `/embed-example.html` demonstrates the same widget in another page. `/settings.html` preserves the original connections, wallet setup, identity mapping, and test-transaction tools.

## Same-origin integration

Copy `guardian-widget.js` and `guardian-widget.css` together to the host's static assets. The module resolves its stylesheet relative to itself. No framework or build step is required.

```html
<script type="module" src="/guardian/guardian-widget.js"></script>
<u-guardian api-base="/api/" collapsed></u-guardian>
```

Remove `collapsed` for the open companion. Methods: `open()`, `close()`, `send(text)`, `brief()`, `stopVoice()`. Disconnecting the element stops recording/audio, clears the polling timer and aborts default-transport requests. Reconnecting initializes the component again. Voice uses ElevenLabs STT/TTS, with a 25-second recording cap and 4 MB upload cap. Playback requires a browser gesture; blocked playback shows a retryable error. There is no continuous listening.

CSS variables: `--guardian-accent`, `--guardian-ink`, `--guardian-surface`. Internal styling is isolated by Shadow DOM. The outer panel exposes `part="panel"`.

## Host-owned transport and identity

For a different host, set `transport` **before mounting**. Do not send provider keys to the browser or reuse an anonymous public-demo cookie as production authentication. The host backend must authenticate users, isolate their state, allowlist routes, enforce CSRF/rate limits, and hold provider keys. This release is an integration prototype, not a multi-tenant authentication service.

```js
import '/guardian/guardian-widget.js';
const guardian = document.createElement('u-guardian');
guardian.transport = async (route, body, options = {}) => {
  const allowed = new Set([
    'state', 'agent/chat', 'agent/brief', 'agent/ack', 'agent/check',
    'agent/watch/confirm', 'agent/watch/remove', 'speech', 'transcribe'
  ]);
  if (!allowed.has(route)) throw new Error('Unsupported route');
  const response = await fetch('/my-authenticated-guardian/' + route, {
    method: body === undefined ? 'GET' : 'POST',
    credentials: 'same-origin',
    headers: body === undefined ? {} : {
      'Content-Type': options.raw ? options.mime : 'application/json'
      // Add the host's CSRF header here.
    },
    body: body === undefined ? undefined : options.raw ? body : JSON.stringify(body)
  });
  if (!response.ok) throw new Error('Guardian request failed');
  return options.audio ? response.blob() : response.json();
};
document.querySelector('#assistant-slot').append(guardian);
```

Custom transports own cancellation/timeouts. Avoid broad CORS or weakening iframe restrictions; this is a web component, not a cross-origin iframe. In a native app, use a microphone-enabled WebView or build a native view against the backend contract. This is not yet an iOS/Android SDK.

## Events

All events bubble and cross the Shadow DOM boundary:

| Event | Detail |
| --- | --- |
| `guardian:ready` | `{dataMode}` |
| `guardian:phase` | `{phase}`: idle, thinking, listening, transcribing, loading, speaking, error |
| `guardian:state` | Redacted application state |
| `guardian:result` | Answer, evidence, proposed watch rules, tool trace |
| `guardian:watch-confirmed` | `{id}` |
| `guardian:notification` | Newly detected notifications (not the full history) |
| `guardian:error` | `{message}` |

Use notification events to show host UI. Browser events cannot deliver notifications when the application is closed.

## Backend contract

`createApplication()` retains the existing server boundary and persistence. `createGuardian()` in `guardian-service.mjs` contains the provider integration and scoped state; `runAgent()` in `agent.mjs` is the bounded U-bot tool loop. Reuse these modules behind a host-authenticated adapter rather than proxying public-demo sessions.

| Route | Input / effect |
| --- | --- |
| `GET /api/state` | Wallet, integration availability, goal, rules, notifications; no provider secrets |
| `POST /api/agent/chat` | `{message}`; next tool chosen after each result, up to five planning steps |
| `POST /api/agent/brief` | `{}`; refresh and compare with acknowledged briefing |
| `POST /api/agent/ack` | `{}`; acknowledge the returned briefing snapshot |
| `POST /api/agent/goal` | `{purpose,horizon,risk}`; saves user-entered preferences |
| `POST /api/agent/watch/confirm` | `{id}`; confirms a ten-minute, wallet-and-mode-bound draft |
| `POST /api/agent/watch/remove` | `{id}`; stops that rule |
| `POST /api/agent/check` | `{}`; refreshes and evaluates active rules; returns `newNotifications` |

The three supported rule kinds are wallet quantity changes, supply events in the configured mapped-wallet horizon, and a review date (UTC date boundary). A draft's descriptive label never changes its displayed machine criterion. No price threshold, trade, transfer, SMS, or phone call is performed by these agent tools.

## Monitoring and delivery boundaries

- Local server: evaluates live rules every minute while the process is running.
- Public Vercel demo: the widget checks once a minute while visible. It does not monitor continuously after the browser closes.
- Production embedding: the host must schedule `guardian.check()` for each authenticated workspace and/or invoke it after a verified Avalanche webhook. Route returned notifications into the host's push/SMS service, with consent and delivery deduplication. This release does **not** provision webhooks, a scheduler, SMS or Web Push subscriptions.

Watch rules, snapshot baselines, short conversation history and notifications persist in the existing encrypted cloud session store (or local state file). Rule confirmation is explicit; AI text alone cannot activate one. Cross-wallet and demo/live scopes do not share rules. Absence of a token from incomplete indexed results is never interpreted as a zero balance. Wallet changes are quantities, not profit/loss. Health currently covers balances/concentration/coverage, not approvals or DeFi positions. Token research covers documented datasets when the API key has access; missing data is not evidence of safety. Short-term timing needs additional market/liquidity evidence.

## Verification

`npm test` covers agent branching, tool errors, allowlists, exact deltas, watch scope/confirmation/deduplication, and cloud recreation, alongside existing tests. `test/guardian-browser-smoke.cjs` exercises the three pillars, mobile and embedding using synthetic balances. Set `PLAYWRIGHT_MODULE` to an installed Playwright package and `BASE_URL` to an isolated local demo server. Never point that synthetic mutation test at a real user's live workspace.
