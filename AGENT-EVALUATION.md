# Professional agent verification — 2026-10-16 (Asia/Bangkok)

U-bot was called with the updated local credential and `mode: professional`. Wallet cases used synthetic demo data; token research used the configured Tokenomist API. Each case used fresh in-memory agent state. No watch was activated and no transaction, phone call or external notification was sent.

| Scenario | Observed tool sequence | U-bot requests | Elapsed |
| --- | --- | ---: | ---: |
| Wallet health | assess_wallet → explanation | 2 | 6.7 s |
| Quantity changes after a baseline | investigate_changes → explanation | 2 | 13.0 s |
| Explicit wallet quantity watch | propose_watch → explanation; draft only | 3 | 17.3 s |
| Price falls 10% alert | Capability guard; no draft/tool/provider request | 0 | <0.1 s |
| Avalanche allocations/fundraising | search_tokens → research_token → explanation | 3 | 27.1 s |

The changes explanation correctly identified the supplied demo USDC decrease from 1,500 to 1,475 as a quantity change. The health answer used the tool's 57% AVAX concentration. Token research exercised actual provider data and disclosed unavailable buyback coverage. Its initial answer used a long table; the explanation prompt was tightened and that case rerun, producing plain Thai paragraphs. These are smoke observations, not a statistical comparison with Casual or a guarantee that every generated claim or formatting instruction is correct.

An initial authentication attempt returned HTTP 401. After the credential was updated, the above runs completed. Tokens and raw provider payloads are excluded from this report.

Automated checks: 66 unit/integration tests passed, plus build syntax checks and browser regressions for wallet/settings/chat, explicit watch confirmation, synthetic microphone → STT → agent → TTS, and Debug logs. New coverage includes argument allowlists, date validation, unsupported watch conditions, evidence compaction, stored-template migration, prompt-injection action guards, provider budgets, explicit draft wording and partial-answer preservation. Browser voice tests use mocked speech APIs, not a physical microphone.

Operational limits remain: five planning steps, one schema repair attempt per step, no automatic switch to Casual, and no trading or signing tools in the agent. Draft guardrails combine deterministic checks with model instructions and cannot prove correct interpretation of every possible natural-language request.
