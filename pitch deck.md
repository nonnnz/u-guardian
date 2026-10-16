# U-Guardian — Pitch Deck Content

**Team:** Tuidui

**Format:** 9 slides, about 4–5 minutes plus live demo and Q&A

**Slide language:** English, including speaker notes

**Status:** Hackathon MVP. Features marked “next” are proposals, not current product behavior.

---

## 1. Title — Meet U-Guardian

**On slide**

> **Your wallet shows what you own. U-Guardian explains what matters.**

An AI companion that explains your crypto wallet, investigates relevant changes, and speaks up when a watch you chose is triggered.

**Team Tuidui** · AI agent orchestration · Web3 data · voice experience

**Visual:** U-Guardian wordmark and the mascot perched on the wallet card. Use the project's orange and graphite palette. Add team members' names and individual roles before presenting.

**Speaker note:** We are building an AI companion for the wallet people already use. U-Guardian turns complex wallet data into clear explanations and gives users a simple way to follow what matters to them.

---

## 2. Problem — A balance is not an answer

**On slide**

- A wallet can show **how much** you hold. It rarely explains **what changed, why it matters to your goal, or what to watch next**.
- A new user may have to piece together wallet activity, token supply, market context, and news across several products.
- This matters when the same money is intended for a future expense, savings, or everyday use.

**Evidence:** In the FCA's 2025 UK survey, **13%** of cryptoasset users thought they would have financial protection when purchasing cryptoassets, while **9%** said they used a credit card or existing credit facility to obtain cryptoassets. These are UK survey findings, **not** measured behavior of U-topia users. [FCA 2025 consumer research](https://www.fca.org.uk/publications/research-notes/cryptoassets-consumer-research-2025) · [FCA 2025 report, risk understanding](https://www.fca.org.uk/publication/research-notes/cryptoasset-consumer-research-2025-wave-6.pdf)

**Speaker note:** Imagine someone holding AVAX and a stablecoin for an expense six months from now. They can see the token balances, but they may not know whether the wallet is too concentrated, how a price move affects that goal, or whether a supply event deserves attention. The UK survey gives us a signal that clearer risk information matters; it does not measure U-topia users.

---

## 3. Solution — One companion, three jobs

**On slide**

| Pillar | What the user asks | What Guardian does |
| --- | --- | --- |
| **Wallet health** | “Is my wallet too concentrated for a six-month goal?” | Reads the public Avalanche wallet and explains holdings, coverage, and concentration in the context of a saved goal. |
| **What changed & monitor** | “What changed?” / “Alert me if AVAX drops 10%.” | Compares the latest observations with a prior briefing; drafts a specific watch for user confirmation. |
| **Advice with real information** | “What is AVAX, and what should I watch out for?” | Uses retrieved project, market, tokenomics, and available headline evidence to explain trade-offs and uncertainty. |

**Product idea:** The mascot is the agent interface. Text, voice, status animations, sources, and watch confirmations are all in one conversation.

**Speaker note:** People should be able to ask a useful question without learning Web3 terminology first. U-bot selects the relevant tools, then explains their results in plain language. Users can inspect the evidence, and every watch must be reviewed and confirmed before it becomes active.

---

## 4. Demo — From a question to a useful alert

**On slide**

**Live sequence (about 60 seconds):**

1. Open the single-page wallet; click the mascot. Ask: **“Check my wallet health.”** Show the answer and **Sources & details**.
2. Ask: **“Alert me when AVAX price drops 10% from the price when I confirm.”** Review the exact threshold and **Confirm watch**.
3. In **Demo** wallet mode, simulate **AVAX price −12%**. Show the **simulated in-app call**; answer it and let ElevenLabs read the alert.
4. Ask: **“What changed since my last briefing?”** Show how the agent investigates the new state. Open **Debug** briefly to reveal the actual tool path.

**What judges should notice:** The mascot changes between **idle, thinking, search, and answer** as the agent works. The user sees both a plain-language answer and its evidence.

**Backup clip (30–60 seconds):** Record the four moments above with captions. Keep the same demo wallet and confirmed watch so the alert is repeatable. The price movement is **synthetic**; the clip must label it “Demo data.”

**Speaker note:** Start with the sample wallet so the alert is repeatable. If time allows, show a real public Avalanche wallet and a Tokenomist research question afterward. The incoming-call card in this demo is simulated inside the website; it does not place a telephone call.

---

## 5. Technology — Agent decisions backed by named tools

**On slide**

```text
User text / voice
        ↓  ElevenLabs speech-to-text
U-bot Professional: choose a validated tool → read result → explain
        ↓
Avalanche        Tokenomist       CoinGecko + publisher RSS
Wallet/transfer  Supply/token     Market/project/news context
        ↓
Evidence + watch proposal → user confirmation → alert + ElevenLabs voice
```

**Built with:** Node.js backend; a single-page JavaScript web UI; Vercel and private session storage for the hosted MVP. The server validates U-bot's JSON tool request against an allowlist and executes the selected function. The model does **not** run arbitrary generated code.

**Why this matters:** Wallet data personalizes the answer. Tokenomist adds supply and project evidence. Public market/news sources fill gaps those sponsor APIs do not cover. ElevenLabs makes the agent accessible by voice. Debug shows each tool choice, result, and failure for review.

**Speaker note:** The agent does more than answer from one prompt. U-bot can choose tools over several steps. Our backend validates each tool name and its arguments before calling an API, then returns the result to U-bot for an explanation. When a source lacks coverage, the answer should say what is missing rather than invent a number.

---

## 6. Impact & business model — Make crypto easier to understand inside an existing app

**On slide**

**Value to users:** Fewer tabs to interpret a wallet; clearer risk context tied to a personal goal; user-chosen alerts with an explanation of what triggered them.

**Value to a platform:** A companion that can sit beside an existing wallet experience and make its data more useful without asking the platform to replace its wallet.

**Proposed model:** **B2B licensing / white-label companion** for wallet and financial apps, with a platform fee and usage-based pricing for agent and voice calls. This is a **business hypothesis**, not launched pricing.

**Pilot measures:** Time to understand a wallet change; percentage of users who correctly understand an alert; watch activation and retention; source-detail views; voice use; provider cost per useful answer. These are **metrics to measure**, not claimed results.

**Speaker note:** For U-topia, the opportunity is to put this companion inside an app people already use. The current product is a working, single-page web MVP. Embedding it in another app is the next product step, not a feature we claim to have shipped today.

---

## 7. Market & advantage — Context that a balance screen misses

**On slide**

**Initial users:** English- and Thai-speaking crypto holders who want plain-language help with a wallet, goals, and selected monitoring. **Initial buyer hypothesis:** Wallet, exchange, or consumer-finance platforms that already serve these users.

| Common alternative | What users still need to do | U-Guardian MVP |
| --- | --- | --- |
| Wallet balance/history view | Interpret events and their relevance themselves | Explains the observed wallet and compares it with a saved goal or briefing |
| General-purpose chatbot | Supply their own current wallet and token evidence | Retrieves named sources and keeps evidence inspectable |
| Separate alert service | Set a rule in a different interface | Drafts a watch conversationally and asks for confirmation |

**Market evidence, not TAM:** The FCA's 2025 UK survey reports **8% adult ownership** and **91% awareness**. We would validate demand with an in-app pilot before estimating U-topia-specific adoption or revenue. [FCA 2025](https://www.fca.org.uk/publications/research-notes/cryptoassets-consumer-research-2025)

**Speaker note:** Other wallets and assistants already do useful things. What we can demonstrate is a single conversation that combines a person's wallet context, several named data sources, tool selection, and voice. We would use a pilot to learn how many U-topia users actually want that experience.

---

## 8. Roadmap — From hackathon MVP to in-app companion

**On slide**

**Built during the hackathon**

- Three working conversation pillars with validated U-bot tool calls, source details, Debug flow, and English/Thai UI.
- Avalanche wallet reading; Tokenomist tokenomics research; market and headline tools; ElevenLabs push-to-talk and spoken answers.
- Confirmed watch rules for wallet quantity, supply events, review dates, activation-price moves, and transfer-value thresholds; simulated in-app alerts.

**Next 3 months:** Pilot inside a host app; improve the shared U-bot account connection and validate answer quality, alert comprehension, and provider cost.

**Next 6 months:** Background watch evaluation and real delivery channels; stronger wallet coverage and explicit freshness/coverage reporting.

**Next 12 months:** Reusable integration kit, production-grade consent and account controls, broader asset coverage, and measured platform rollout.

**Speaker note:** Today, the website checks watches while the page is visible and presents alerts as simulated in-app calls. Background monitoring and delivery to a user after they leave the app are future work. Moving checks to a background service is a priority if the pilot shows that users value these alerts.

---

## 9. Team & close — Give every wallet a guide

**On slide**

**Team Tuidui** built and tested a working agent journey across AI orchestration, wallet data, tokenomics, voice, and a usable consumer interface.

> **Crypto should come with context, not just a balance.**

**Our ask:** Pilot U-Guardian as a companion inside U-topia's existing app, measure whether users understand their assets and alerts better, then build the integration together.

**Q&A** · [Add team member names, roles, and contact/QR before presenting]

**Speaker note:** Picture opening your wallet and hearing Guardian explain what changed since your last visit. You can ask a follow-up by voice and choose what it should watch next. For consequential answers, you can always inspect the information Guardian used. We would like to test that experience with U-topia users.

---

## Presenter checklist (not a slide)

- Use the latest local build for the merged chat and animated mascot, or deploy that version before using the public Vercel URL.
- For a no-credential judge demo, set the server-side variables in [VERCEL_DEMO_CONFIG.md](VERCEL_DEMO_CONFIG.md), click Connect U-Bot, and verify Avalanche, Tokenomist, and ElevenLabs in a fresh browser profile.
- Rehearse the Demo-wallet scenario and record a 30–60 second backup clip. Clearly mark simulated prices, transfers, and in-app calls.
- If demonstrating a real wallet, use a **public Avalanche address**. A funded wallet, private key, or real transaction is not required for the main pitch.
- Replace the team/contact placeholders; do not claim measured user impact, background alerts, SMS, live telephone calls, trading, or an embeddable SDK as current features.
