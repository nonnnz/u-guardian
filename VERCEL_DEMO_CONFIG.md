# Demo deployment configuration

The deployment can supply provider credentials for every visitor. Set these as **Vercel Environment Variables** for the target environment, then redeploy:

| Name | Purpose |
| --- | --- |
| `GUARDIAN_USE_SERVER_KEYS=1` | Enables organizer managed connections. |
| `UBOT_SUPABASE_ANON_KEY` (or `UBOT_SUPABASE_PUBLISHABLE_KEY`) | Server-side U-bot login key. |
| `UBOT_EMAIL`, `UBOT_PASSWORD` | Shared demo account for U-bot. |
| `UBOT_SUPABASE_URL` | Optional Supabase auth URL. |
| `UBOT_CHAT_URL` | Optional U-bot chat endpoint override. |
| `AVALANCHE_DATA_API_KEY` | Avalanche Data API access. |
| `TOKENOMIST_API_KEY` | Tokenomist access. |
| `ELEVENLABS_API_KEY` | Voice service access. |
| `ELEVENLABS_VOICE_ID` | Voice to use for read aloud. |
| `ELEVENLABS_TTS_MODEL` | Optional; defaults to `eleven_v3`. |
| `ELEVENLABS_STT_MODEL` | Optional; defaults to `scribe_v2`. |

Keep the existing `BLOB_READ_WRITE_TOKEN` setting. No key values belong in the repository or browser. In managed mode, Settings displays connection status instead of credential fields. Visitors may still choose a wallet address, goals and watches; those stay in each browser's private session. Credential fields from old visitor sessions are ignored and cleared on their next write.

U-bot uses server-side login. A visitor clicks **Connect U-Bot** once in Settings; no bearer token is entered or stored in their session. Enabling managed connections does not connect a wallet automatically. Judges can use the sample wallet or paste a public Avalanche address.

Before the demo, load the deployment in a fresh browser profile. Confirm Settings lists all four connections, ask Guardian for wallet health, check that Debug shows the relevant tool, and test voice output. If a provider key is absent or expired, that provider's live call will fail and the app will show an error. Server managed keys only take effect after the deployment receives these environment variables and is redeployed.

The chat stream sends phase names only: `idle`, `thinking`, `search`, `answer`. The `search` phase is emitted when a tool starts, and the final answer arrives as one result event after session persistence. The animated mascot maps those phases to its idle, thinking, searching, and answering assets.
