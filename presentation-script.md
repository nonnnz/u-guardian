# U-Guardian — Pitch and Live Demo Script

**Team:** Tuidui

**Language:** English

**Target time:** About 6–7 minutes, depending on provider response time

**Companion deck:** [pitch deck.md](pitch%20deck.md)

Text in quotation marks is meant to be spoken. Directions in brackets are for the presenter and demo operator.

## Before going on stage

- Open the tested build and choose the **Demo** wallet. Verify U-bot Professional, Tokenomist, Avalanche, and ElevenLabs connections if you plan to show live provider calls.
- In the mascot chat, run **Tell me what’s new** once to establish the comparison baseline. Close the chat afterward. Keep the demo wallet and its baseline for the live presentation.
- Test the exact price-watch question below. Remove the test watch and reset any simulated price change before the presentation so the same alert can trigger again.
- Keep the chat input ready for typing. Use the microphone only if it has worked on the presentation device. Check that the ElevenLabs voice plays through the room speakers.
- Keep a **30–60 second backup recording** ready. Label the sample wallet, simulated price drop, and in-app call as demo data.
- Add team member names, roles, and a contact link to the final slide. Do not put API keys on screen.

---

## Slide 1 — Title (~20 seconds)

> “Hi, we’re Team Tuidui. This is U-Guardian. A wallet can tell you what you own, but it rarely tells you what matters. U-Guardian is a voice-enabled AI companion that explains your wallet, investigates changes, and speaks up about risks you choose to follow.”

## Slide 2 — Problem (~35 seconds)

> “Imagine you hold AVAX and a stablecoin for an expense six months from now. Your wallet shows the balances. But is one asset dominating your savings? What changed since yesterday? Does a supply event affect something you hold? To answer those questions, a beginner has to connect information scattered across several products. In a 2025 UK survey, the FCA found that some crypto users expected financial protection when buying crypto, and some used credit to buy it. Those are UK findings, not statistics about U-topia users, but they underline why clear risk context matters.”

## Slide 3 — Solution (~30 seconds)

> “We designed Guardian around three jobs. First, wallet health: explain holdings in the context of a personal goal. Second, what changed and monitor: investigate new observations and let the user confirm the exact alerts they want. Third, advice with real information: explain a token using retrieved market, project, and tokenomics evidence. The mascot makes this a conversation. Users can speak naturally, and they can inspect the sources behind the answer.”

## Slide 4 — Live demo (~2 minutes; allow more time for live APIs)

> “Let me show you the actual MVP. We’re using a clearly labeled sample wallet so we can reproduce an event without moving real money.”

**Step A — Wallet health**

[Show the wallet page. Click the mascot. Type **“Check my wallet health. Which asset dominates my holdings?”** Send. While it works, point to the mascot’s thinking/search state. When the answer appears, open **Sources & details** briefly.]

> “Guardian reads the wallet context, calls the relevant tool, and explains the result in ordinary language. The source data stays available underneath the answer.”

**Step B — Set a watch**

[Type **“Alert me when AVAX price drops 10% from the price when I confirm.”** Send. Show the proposed percentage, direction, asset, and confirmation control. Click **Confirm watch**.]

> “Guardian drafts the rule, but it does not silently turn it on. I can review the threshold and confirm it myself.”

**Step C — Trigger the demo event**

[Close chat. Open Settings and click **Simulate AVAX price −12%** in Demo mode. Close Settings. Show the simulated in-app call. Click **Answer**; let the spoken alert play if voice is configured.]

> “That price change is simulated. The alert card is also an in-app simulation, not a real telephone call. What matters is that the rule we confirmed is the rule that fired, and Guardian can explain it aloud.”

**Step D — Investigate the change**

[If time permits, ask **“What changed since my last briefing?”** Open the answer’s details or the Debug tab to show the tool path.]

> “We can ask a follow-up instead of trying to decode the event ourselves. Debug shows the tool choice and result behind the explanation.”

**If a provider stalls:** Wait briefly, then say: “External APIs can be slow during a live demo. Here is the same tested flow recorded on this build.” Play the backup clip and continue to Slide 5. Do not present a recording as a live result.

## Slide 5 — Technology (~40 seconds)

> “U-bot Professional is the agent’s reasoning layer. It decides which named tool to use, reads the result, and explains it. Our Node.js backend validates every JSON tool request and its arguments before execution; we do not run code produced by the model. Avalanche provides public C-Chain wallet data. Tokenomist adds available supply and tokenomics evidence. CoinGecko and publisher feeds supply market and headline context. ElevenLabs handles speech input and output. The mascot’s states follow real agent progress, including when a tool starts.”

## Slide 6 — Impact and business model (~30 seconds)

> “For a user, Guardian can reduce the work of interpreting a wallet change and make chosen alerts easier to understand. For a platform like U-topia, the opportunity is an intelligent companion inside an app people already use. Our proposed business model is licensing that companion to wallet and finance platforms. We have not launched pricing or measured user impact yet; those are questions for a pilot.”

## Slide 7 — Market and difference (~30 seconds)

> “Wallets, chatbots, and alert services each solve part of this problem. Guardian brings wallet context, named external evidence, tool selection, and voice into one conversation. We are starting with crypto holders who want plain-language help, in English or Thai. The size of the opportunity inside U-topia is something we want to validate with its users, rather than guess from a global crypto statistic.”

## Slide 8 — Roadmap (~30 seconds)

> “The hackathon MVP already demonstrates the three conversation pillars, confirmed watches, a bilingual interface, and a voice-enabled mascot. Our next step is to pilot the companion inside a host app and measure whether people understand their wallet and alerts better. After that, we would add background watch evaluation and real delivery channels. Today, watches are checked while the web page is visible.”

## Slide 9 — Close (~20 seconds)

> “Our goal is simple: crypto should come with context, not just a balance. We would love to pilot U-Guardian with U-topia, learn from real users, and turn this working agent into a companion in the app they already trust. Thank you. We’re happy to take your questions.”

---

## Short answers for likely judge questions

**“Does Guardian trade or control the wallet?”**

“No. The current agent reads public Avalanche wallet data and proposes watch rules for confirmation. It does not hold private keys or execute trades.”

**“Is the alert a real phone call?”**

“No. This MVP displays a simulated call inside the app and can read the alert with ElevenLabs. Background delivery and telephone or push channels are future work.”

**“Are the recommendations financial advice?”**

“Guardian explains retrieved evidence and uncertainty. It does not predict a guaranteed return or tell users an exact time to buy or sell.”

**“What is actually on Avalanche?”**

“Guardian reads public balances and available transfer data on Avalanche C-Chain. We have not deployed a smart contract or a custom Avalanche L1.”

**“Can U-topia put this inside its existing app today?”**

“The current deliverable is a single-page web MVP. An integration kit and host-app pilot are our next steps.”
