# U-Guardian
<!-- impeccable:product-schema 1 -->

## Platform
Single-page web application and Node.js backend. Embedding in other applications is deferred.

## Users
English- and Thai-speaking crypto beginners who want plain-language answers, wallet explanations and selected monitoring without learning specialist vocabulary first.

## Product Purpose
Make the agentic companion the product: a mascot perched on a wallet panel opens a voice-enabled chat when clicked. Wallet status is the main page; settings open within that page.

## Stack
Vanilla JavaScript custom element with Shadow DOM, CSS geometric mascot, Node 24, U-bot web chat adapter, Avalanche RPC/Data API, Tokenomist v5, ElevenLabs STT/TTS, CoinGecko public market data and publisher RSS. Vercel private encrypted Blob sessions for the public demo; local .env and state for local development.

## Capabilities and Constraints
Three pillars: Wallet health; What changed and monitor; Advice with real information. Changes cover quantities and available observed USD unit quotes; confirmed watches include activation-price percentages and new transfer USD thresholds. Simulated in-app calls present alerts with optional user-initiated speech. Public market/project data and attributed RSS headlines support questions about assets and trends. No automatic news/sentiment monitoring, fiat FX tracking or reliable closed-page alerts. See USER-TEST-GUIDE.md for tested tasks and limits. Multi-step U-bot tool loop with validated allowlist and bounded steps. Token research includes allocation, fundraising, buyback and burn datasets when covered. Voice is push-to-talk with visible errors and text alternative, not continuous listening. No automatic trading. Health does not yet cover approvals or DeFi. No claims of buy/sell timing from tokenomics alone. Demo and live are explicit. Public Vercel monitoring runs while the page is visible; background scheduler, SMS and Web Push are not provisioned. The single-page settings dialog contains wallet/network, provider credentials and tests, voice selection, goal preferences and explicit ERC-20 identity matching. Old dashboard, phone/Fuji transaction screens, embedding example and integration transport are removed from the frontend. Legacy backend endpoints remain for compatibility and are not advertised as current UI tasks.

## Brand Commitments
U-Guardian, English first with a Thai language option. Graphite surfaces, warm orange actions and ivory text inspired by U-topia's palette, with an original shield wordmark and single-wallet composition. Manrope variable typography. The existing sage geometric robot remains perched at the wallet's top-right edge; its shape is reserved for a later redesign. Chat stays closed until requested. When opened, it centers a plain conversation with a fixed composer; suggestions, watches, read-aloud and Debug live in the options menu, while sources sit beneath each answer. Restrained panel entrances, state-linked expressions, a hovering companion and pointer-responsive decorative arcs bring motion without moving financial values. Reduced-motion preferences disable animation.

## Product Principles
Evidence before advice. Missing data remains unknown. Exact wallet quantities; no invented fiat values. Explicit confirmation before saving a watch. User-controlled voice and playback. Wallet, chat and settings share one page.
