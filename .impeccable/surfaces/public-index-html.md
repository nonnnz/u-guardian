---
version: 1
slug: "public-index-html"
primary_target: "public/index.html"
related_targets: ["public/shell.css", "public/shell.js", "public/guardian-widget.js", "public/guardian-widget.css"]
---

# Wallet status with a perched companion

Mode: Operate. Audience: English- and Thai-speaking crypto beginners who want wallet explanations and selected monitoring.

## Direction and authority

The user authorized a full orange U-topia-inspired redesign. The local implementation uses graphite surfaces, warm orange actions with dark text, ivory copy, self-hosted Manrope and an original shield wordmark. The existing sage CSS mascot remains intact for a later character redesign. This is code-led new work from a user-pinned reference, with no approved image comp or generated assets. DESIGN.md records reusable decisions; PRODUCT.md owns capability boundaries.

## First view and responsive composition

One centered wallet card is the main surface, with language and Settings controls in the header. It shows written DEMO/LIVE status, network, public address or demo disclosure, exact asset quantities, freshness, errors and refresh. Decorative first-letter asset monograms are hidden from assistive technology. Chat starts closed. The original shield and `u—guardian` wordmark identify the app.

The wallet container is (900px) maximum width with (32px) desktop side padding and a (116px) top margin, increasing to (150px) on viewports at least (1600px). Wallet padding is (40px 44px 28px). The mascot host is (150px) wide at top (-111px), right (22px); the launcher is (152px) high with its label beginning at (128px). Two decorative circular outlines frame the character; only the outer outline responds subtly to a fine pointer.

At the (620px) shell breakpoint, the container uses (16px) side padding and (104px) top margin. The wallet uses (58px 22px 24px) padding and (20px) corners; the mascot moves to right (6px). The title/status row wraps and reserves (65px) on its right. The extra top padding reserves room for the mascot label, including the taller Thai heading. Freshness and refresh stack, with refresh full width. Exact quantities can wrap rather than clip. The composition remains one wallet on mobile.

## Chat and interaction

The revised chat follows the user's request for a conventional conversation-first view inspired by the supplied U-bot example. Clicking the mascot opens a native dialog, normally focusing the composer. A centered retained mascot and “What’s on your mind?” greeting occupy the empty state; the entire greeting stage disappears once any conversation exists. The fixed header shows Guardian, written status, an ellipsis options control and close. User messages are right-aligned warm bubbles, while assistant responses use plain text blocks.

The bottom composer contains the text field, icon microphone, optional stop control and circular orange send button. Suggestions, briefing, watches, read-aloud, Debug and provider provenance are tucked into the native details options menu. Suggested questions have their own disclosure. Your watches opens a separate scrolling panel with Back to chat; focus moves to that button and back to the composer on return. Every answer groups evidence and trace beneath one Sources & details disclosure and places a speaker icon beside it. Watch proposals remain visible for explicit confirmation.

Chat uses maximum width (720px), total viewport gutters (32px), height min(740px, 90dvh), and inner padding (0 28px 24px). At (520px), height becomes (92dvh) and padding (0 18px 18px). The dialog itself does not scroll: the conversation, watch panel or Debug panel fills remaining space and scrolls independently. Header and composer remain available around the conversation. Background page scrolling is locked. The options popover has maximum height (65dvh) and width min(280px, 100vw - 76px).

Voice remains user initiated; errors preserve text entry. The shared error alert is outside the mutually exclusive panels, so watch-removal errors stay visible while viewing watches. Retrying removal clears the alert; successful removal restores idle status. Escape closes an open options menu first and focuses its summary; otherwise it closes chat. Close stops voice, retains conversation and returns focus to the launcher. Reopening focuses the composer, active Debug panel or Back to chat according to the retained view.

## Settings and language

Settings is a native dialog on the same page with maximum width (680px), maximum height (88dvh), and padding (0 32px 32px). Its heading, close action and section shortcuts are sticky. Wallet, Connections, Your goals and Asset matching shortcuts scroll within the dialog and open the target disclosure when applicable; active navigation follows scroll position with `aria-current`. These are section shortcuts, not separate tab panels. Mobile uses maximum height (92dvh), padding (0 20px 24px), and horizontal shortcut scrolling.

Settings contains wallet/network and data mode, provider credentials and tests, voice selection, goals and explicit ERC-20 matching. Blank credential fields retain saved values. Closing clears credential inputs and restores focus to Settings. Demo price and transfer controls remain here. Conflicting operations are blocked while work is running.

English is the first-visit default; the accessible English / ไทย selector remembers the preference. Changing language checks active work, stops voice and reloads while retaining saved configuration and watch rules. Thai headings remove negative tracking and use taller line height; compact Thai controls receive larger text. User-authored labels, goal identifiers, token IDs and raw provider evidence retain their original values.

## Debug and alerts

Debug is opt-in from the chat options menu and reveals keyboard-operated Chat / Debug tabs within the existing dialog. The orange underline identifies the selected tab. Expandable requests and timestamped events use wrapped monospace JSON and visible pending/error/empty states. The panel keeps the latest four requests in browser memory and exposes logs after requests complete; disabling Debug clears logs and returns to Chat.

A non-modal simulated-call card appears bottom right, using the same graphite/orange palette, (20px) corners and a bounded (65dvh) scrolling area. Its width is at most (360px), with (24px) desktop and (16px) mobile right/bottom offsets. Answer opens Chat and may read the alert with configured ElevenLabs voice; arrival does not autoplay. Dismissed IDs persist locally, and calls can be disabled under Your watches. Native chat/settings dialogs retain modal focus priority. Copy explicitly distinguishes simulated calls from real telephone calls.

## Motion and boundaries

Wallet entrance is (650ms), rows (450ms) with capped (55ms) stagger increments, Settings (360ms), chat/call entrance (400ms), and messages (300ms). The companion floats over (5s), waves on hover and changes expression with state. Pointer drift is limited to decorative arcs, with financial values unaffected by pointer motion. Reduced-motion CSS disables animation, transitions and smooth scrolling; pointer drift is gated by both motion preference and fine-pointer support.

The public demo discloses monitoring while the page is visible. Closing chat does not stop checks while the page remains visible; closing the page does. Do not imply background scheduling, SMS, Web Push, automatic trading or unimplemented wallet-health coverage. The custom element remains an internal module; embedding is deferred.

## Review record

The implementation agent reports 86 tests and build passing, plus bilingual, monitoring, simulated-call, synthetic English/Thai voice, Debug, options-menu, recovery and browser acceptance checks. Orange review captures are in `.impeccable/review/orange-*.png`. The fresh visual reviewer found one P2 collision between the Thai mobile heading/status and launcher label. The final (58px) wallet top padding resolves it; rechecks at (390px) and (320px) passed in English and Thai. The reviewer accepted that wallet correction at its finding scope. The subsequent simplified-chat review visually accepted the reduced clutter and found one hidden watch-error issue. The error was moved above the mutually exclusive panels and the targeted failure/retry check passed; the final reviewer confirmed the hidden watch-error issue resolved, with no further material fixes or recapture needed.

The detector ran once in degraded regex mode because parser dependencies were missing. Most findings reflected palette/typography drift against the replaced ivory/forest documentation; the side-tab finding was removed. Its advisory output is not a comprehensive accessibility certification. This documentation pass inspected the local sources and did not run tests, servers or another detector.

This record describes local implementation, not a deployed production release. The user has withheld commit, push, deploy, pull and merge until the team is ready for separate automatic U-bot connection and mascot additions. No such operations were performed by the documenter.
