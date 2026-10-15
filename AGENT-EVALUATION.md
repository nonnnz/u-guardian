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


## English-first release — 2026-10-16 (Asia/Bangkok)

English live smoke tests used Professional throughout. Wallet scenarios used synthetic demo data; token research called the configured Tokenomist service. These observations establish the tested flows, not general accuracy or timing guarantees.

| English request | Observed behavior | U-bot requests | Elapsed |
| --- | --- | ---: | ---: |
| Check my wallet health | assess_wallet; English answer with evidence-backed 57% AVAX | 2 | 10.5 s |
| What changed since my last briefing? | investigate_changes; English answer identifying USDC 1,500 → 1,475 | 2 | 9.9 s |
| Watch for quantity changes across my wallet | propose_watch; English draft and explicit Confirm watch instruction | 2 | 9.2 s |
| Alert when AVAX price drops 10% | English capability limitation; no tool or draft | 0 | <0.1 s |
| Research AVAX allocations and fundraising | search_tokens → research_token; English explanation with unavailable buyback coverage disclosed | 3 | 23.0 s |

Actual ElevenLabs TTS generated “Check my wallet health and tell me what changed.” The STT endpoint returned the same English words (without the final punctuation), in a 2.7-second combined roundtrip. No physical microphone was used in that provider test. Separate browser tests used a synthetic microphone and mocked voice responses to verify English and Thai recording → transcription → agent → playback and released microphone tracks.

The first English watch explanation unnecessarily spoke its internal draft ID, and the changes explanation speculated about possible causes without transfer evidence. Prompt guidance was tightened to omit internal IDs, point directly to UI confirmation and avoid unsupported causal guesses. Token research still produced longer prose than the suggested 1,200-character target; that target is prompt guidance, not a guaranteed hard limit.

English browser acceptance covers default language, saved preference, English/Thai switching, wallet health, briefing/change comparison, confirmed watches, unsupported price alerts, goals preserved across languages, localized errors, Debug, and desktop/mobile overflow. Raw evidence and historical user-supplied values retain their original language.


Final checks: 75 unit/integration tests and build passed. English/Thai browser voice tests, the bilingual acceptance test, and existing Thai UI/Debug regressions passed with no page errors. A targeted live rerun after prompt changes explained the USDC change without inventing a cause (9.1 s). The watch rerun omitted the internal ID and retained its draft; the model attempted to repeat the tool call, which the guard blocked and surfaced as a partial-completion warning (13.7 s). This reinforces that valid English flow is tested, not that model behavior is infallible.
