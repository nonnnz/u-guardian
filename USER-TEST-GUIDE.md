# U-Guardian: three-pillar acceptance guide

The current app is a hackathon POC with English as default and Thai as an option. “Ready to test” means the scenarios below have automated coverage and selected live provider checks, not guaranteed answers for every wording or uninterrupted monitoring.

## 1. Wallet health

| Ask | Current capability | Boundary |
| --- | --- | --- |
| “Check my wallet health. Which asset dominates my holdings?” | Reads Avalanche C-Chain balances and available USD values; explains concentration when coverage is complete. | No approvals/security audit, DeFi positions, or other-chain wallet inventory. |
| “How much AVAX do I hold, and how does it fit my goal?” | Exact quantities plus the goal saved in Settings; evidence-based suitability discussion. | Suitability is an explanation, not a guarantee of safety or a regulated suitability determination. |
| “What is AVAX, and what should I be careful about?” | CoinGecko project description and market metrics; Tokenomist research can add supply, allocation, fundraising, buyback and burn evidence. | Dataset availability varies. Symbols alone do not verify a wallet contract. |

Useful additional questions: “What data is missing from this health check?” and “Is my wallet too concentrated for money I need in six months?” Save purpose, horizon and risk preferences first.

## 2. What changed and monitor

| Ask / action | Current capability | Boundary |
| --- | --- | --- |
| “What changed since my last briefing?” | Compares quantities, newly observed transfers and available USD unit-price estimates with the last acknowledged briefing. | Not realized profit/loss, a full transaction investigation, or USD/THB foreign exchange. Indexer history is bounded. |
| Reopen the app after a previous briefing | Refreshes and shows a simulated call card if observed quantities or quotes changed; existing unseen watch alerts also appear. | Does not automatically fetch news or assign good/bad sentiment. Accepting/dismissing a card does not advance the briefing baseline; use “Tell me what’s new” to review/acknowledge it. |
| “Alert me when AVAX price drops 10% from the price when I confirm.” | Drafts a rule for the exact wallet asset. Confirmation captures the current observed USD unit quote. Alerts once per crossing, rearming after recovery. | Not a rolling 24-hour return, all-time-high decline, portfolio-value decline, or intraminute price feed. Requires a usable quote; unavailable prices do not become zero. |
| “Alert me about outgoing transfers over $20.” | Watches new successful indexed transfers involving the wallet, estimates USD from the latest observed asset quote, and checks the strict threshold. Incoming/any directions also work. | All priced wallet assets; no per-token, counterparty or suspiciousness filters. Current estimated value is not historical execution value. This is not fraud detection. |
| “Watch for quantity changes across my wallet.” | Confirmed whole-wallet quantity-change alerts. | Not a selected-token price rule. |
| “Monitor supply events for my wallet holdings.” | Tokenomist events for verified/mapped holdings within the supported horizon. | Coverage/permissions matter; no price prediction from unlocks. |
| “Remind me to review my wallet on YYYY-MM-DD.” | Explicit future-date review rule. | Evaluated when the app checks watches. |

On Vercel, checks run approximately every minute while the page is visible, when no conflicting request is running. Closing chat is fine; hiding/closing the page is not background monitoring. Price/transfer events between checks can be missed. Recent history is limited to 20 native and 20 ERC-20 transfers per read; unpriced or unconfirmed transfers are skipped. Browser timers, quotas and provider outages can delay checks.

The **simulated in-app call** has Answer and Dismiss actions. Answer opens chat; configured ElevenLabs can read the message aloud. No real phone call, SMS, push subscription or telephone charge is involved. It is an alert card, not a continuous duplex voice call. The switch under Your watches disables these cards.

### Repeatable demo: no purchase or funded wallet needed

1. In Settings choose **Demo** wallet data. Use either local demo answers or configured U-bot Professional.
2. Open the mascot and select **Tell me what’s new** to establish a baseline.
3. Send **“Alert me when AVAX price drops 10%.”** Review the proposed asset, direction, percentage and scope; click **Confirm watch**.
4. Close chat. In Settings click **Simulate AVAX price −12%**, then close Settings. The simulated call should report the price change. Click **Answer** to view it; configure ElevenLabs for speech.
5. Send **“Alert me about outgoing transfers over $20.”** Confirm, then use **Simulate 25 USDC leaving** in Settings. A transfer alert should appear.
6. Dismiss the alert and reload. A separate briefing-change card can appear because the acknowledged baseline is older. Dismiss that card too; the same unchanged event should not repeatedly reappear.
7. Ask what changed, inspect evidence, and stop test rules under **Your watches** when finished.

Demo buttons only mutate synthetic balances/prices. They do not control Fuji or any real chain. Fuji supports balance/history checks but has no real USD valuation, so USD price/transfer watches are rejected there. Use Demo for a predictable price-alert presentation.

Negative tests: “Alert me if my portfolio value drops 10%”, “Alert me if AVAX price falls 10% in 24 hours”, “Only monitor USDC transfers over $20”, and “Text me when AVAX price drops 10% while the app is closed”. These must explain the missing capability or return a tool validation error, without silently activating a substitute rule.

## 3. Advice with real information

Requires configured U-bot for conversational research. Public market/news sources need no additional key, but their availability is not guaranteed.

| Ask | Evidence used | What the answer should not claim |
| --- | --- | --- |
| “Which coins are trending and which are declining today?” | CoinGecko search-interest list plus 24h gainers/decliners in a top-50 market-cap sample. | Search interest equals buying pressure; a price decline proves loss of popularity; these are the best investments. |
| “Explain Avalanche AVAX and its main risks using current information.” | Search project identity → project description, price, market cap, volume and recent returns. | The description is an audit, or all risks have been checked. |
| “Compare AVAX and BTC for a two-year investment. I can tolerate large price swings and this is not emergency savings.” | Separate project/market evidence for each candidate, subject to tool/time budget. | Guaranteed profit, an exact sell date, or comparisons of metrics that were not retrieved. |
| “I need this money in six months. Is crypto suitable for my savings goal?” | Goal clarification and available asset evidence. | Crypto guarantees principal or is equivalent to cash savings. |
| “Research AVAX allocation and fundraising using Tokenomist.” | Tokenomist dataset results and explicit unavailable coverage. | Allocation categories equal current holders; buyback equals burn. |
| “What recent news about Avalanche AVAX can you find?” | Matching headlines from CoinDesk and Cointelegraph RSS, with publisher/date/link. | Full-article reading, exhaustive search, verified sentiment, or no news merely because no match was found. |

For short-term speculation, ask about observed price moves, liquidity and downside risks. For long-term holding, ask about utility, supply structure and uncertainties. The agent helps compare evidence; it does not know which coin will make money or when to sell. Broad “what should I buy?” questions may first ask about horizon, cash needs or risk tolerance.

Market/news evidence and Tokenomist project research (when its key is configured) can be live while the **wallet** is in Demo. Demo wallet supply-event fixtures remain synthetic. The wallet label does not turn real market data into synthetic data. Public feeds are cached for up to five minutes, may be delayed/rate limited and may return partial results. News covers recent feed items with matching titles in the last seven days, not a complete seven-day archive. “No matching headline” is a coverage statement.

## Provider roles and remaining work

- **U-bot Professional:** chooses validated JSON tools and explains evidence; it does not execute generated code.
- **Avalanche:** wallet balances, indexed transfer history and available USD valuation estimates.
- **Tokenomist:** supply events and tokenomics datasets, subject to account permissions and identity mapping.
- **ElevenLabs:** push-to-talk transcription and spoken responses/alerts.
- **CoinGecko + publisher RSS:** additional real market/project/headline sources needed for the expanded questions. Sponsor APIs alone did not supply all those facts.

Still outside the implemented scope: automatic news/sentiment monitoring; exhaustive trend prediction; fiat FX monitoring; 24h/peak or whole-portfolio price rules; reliable always-on notifications; scam/anomaly classification; trading/signing; guaranteed buy/sell recommendations. All live natural-language flows remain subject to model errors, token expiry and provider limits. Debug shows tool choices, results and failures for each completed request.
