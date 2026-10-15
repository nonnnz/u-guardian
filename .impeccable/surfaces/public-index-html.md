---
version: 1
slug: "public-index-html"
primary_target: "public/index.html"
related_targets: ["public/shell.css","public/shell.js","public/guardian-widget.js","public/guardian-widget.css"]
---

# Wallet status with a perched companion

Mode: Operate. Audience: English- and Thai-speaking crypto beginners who want wallet explanations and selected monitoring.

The shipped page has one centered wallet card and a Settings button in the header. Its first view shows written DEMO/LIVE status, network, public address or demo disclosure, exact asset quantities, freshness and refresh. The established geometric mascot perches at the card's top-right edge on desktop and mobile. Chat starts closed. The launcher has a readable label beneath the feet; its final label offset is 128px and its button height is 152px. The host positions the 150px-wide element 106px above the card edge, 22px from the right on desktop and 10px on mobile. These are surface geometry, not general system tokens.

Clicking the mascot opens a native chat dialog and focuses the text composer. The compact mascot inside chat reports written operational state; clicking it or the report action requests a briefing. Four prompts expose wallet health, changes, watch setup and market/advice questions. Watch proposals require confirmation. Evidence and monitoring limits remain expandable. Voice starts on user action, and errors preserve text entry. Close or Escape stops voice, retains the conversation, restores launcher focus and returns to the wallet. Chat locks background scrolling and keeps its close header sticky.

Settings opens a second native dialog on this same page, with a sticky heading and close action. It contains wallet/network and data mode, provider credentials and tests, voice selection, goals and explicit ERC-20 identity matching. Credential fields may remain blank to retain saved values. Closing restores focus to Settings. Demo event controls are inside Settings. Existing operations block conflicting configuration changes.

The desktop container is 740px maximum width; mobile keeps the same card-first composition with vertically stacked freshness and refresh controls. The mascot remains perched, rather than becoming a separate panel. Chat and Settings use bounded heights and scrolling content to stay usable on small screens.

The public demo discloses page-visible monitoring. Closing chat does not stop checks while the page remains visible; closing the page does. Do not promise a provisioned background scheduler, SMS, Web Push, automatic trading or unimplemented health coverage. PRODUCT.md owns capability boundaries; DESIGN.md owns reusable visual decisions.

The old dashboard and separate Settings page are removed. Old Settings and embed-example URLs redirect home. Embedding is deferred; the custom element is an internal module, with no released embedding example or transport API in the current frontend scope.

Build path: code-led refinement of the existing warm ivory/forest/sage identity. No approved image comp or generated assets. Review artifacts live in `.impeccable/review/` as desktop.png, mobile.png, chat-desktop.png, chat-mobile.png and settings-mobile.png. The implementation agent refreshed these captures after the final corrections and reports passing browser and voice smoke tests, plus 43 unit tests. Coverage includes focus and Escape, chat/watch flow, persisted configuration and goals, wallet/mapping fixtures and mobile layout. The design detector used its degraded regex path because HTML parser dependencies were missing; its advisory output is not full contrast or accessibility certification. No tests or servers were run by the documenter.

The final implementation corrections separate the launcher label from its feet, keep the Settings heading sticky, and lock page scrolling while chat is open. No unresolved visual direction decisions remain for this documentation pass.


Debug is an opt-in checkbox in the chat header. Enabling it reveals adjacent Chat / Debug tabs within the same dialog, keeping the incumbent colors, typography and spacing. The diagnostic panel uses expandable requests and timestamped events, with wrapped monospace JSON, visible pending/error/empty states and a clear action. It retains the latest four requests only in browser memory and presents logs after each request completes. Tabs support arrow keys, Home/End and explicit selected state. Disabling Debug clears its logs and returns to Chat. Desktop/mobile captures are debug-desktop.png and debug-mobile.png under the ignored review directory; the browser test covers timing, errors, keyboard navigation, safe text rendering and overflow.


The header now includes an accessible English / ไทย selector beside Settings. English is the first-visit default; the browser remembers the selection. Changing language reloads the page after checking that no task is running, retaining saved wallet/provider settings and watch rules. UI copy, briefings, agent instructions, guard responses and STT language hints use that preference. User-authored labels, saved goal identifiers, token IDs and raw provider evidence keep their original values. Both languages retain the same layout and mascot. English desktop/mobile captures use the english- prefix in the ignored review directory.


Expanded monitoring adds a non-modal simulated-call card at the viewport bottom right, with Answer and Dismiss, readable conditions, and no autoplay. Existing chat/settings dialogs retain modal focus priority. Answer opens the chat tab and optionally reads the alert with ElevenLabs. The card is opt-out under Your watches; dismissed event IDs persist in browser storage. Demo price and transfer triggers remain in Settings. Desktop/mobile reviewed captures: expanded-call-desktop.png and expanded-call-mobile.png.
