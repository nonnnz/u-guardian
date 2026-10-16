# Guardian mascot integration

The main U-Guardian chat uses `public/guardian-mascot.js` and `public/guardian-mascot.css`. The widget passes normalized lifecycle events through the copied `public/guardian-mascot-state.js`: request start → thinking, actual response received → answering, response rendered → idle. Cancel, failure and disconnect reset to idle. The current buffered U-Bot API sends no live tool events, so searching remains available but is never inferred.

Production assets are the original 448×448, 18 FPS transparent files in `public/assets/mascot/`: four animated WebP, four alpha WebM, four still posters, plus `manifest.json`. Chromium uses VP9 alpha WebM; other browsers use animated WebP. Reduced motion uses posters. Only the displayed state is loaded; the media component pauses and removes obsolete layers.

The portable React source remains at `components/GuardianMascot.jsx` for a future React app. It is independent of the current vanilla JavaScript widget. Copy that file and `public/assets/mascot/` to a React project to use `<GuardianMascot state="thinking" size={160} loop />` (React is its only dependency). The source animation videos remain outside production assets in the PoC workspace.

Local preview: `http://127.0.0.1:4189/` while `PORT=4189 PHONE_PORT=4190 npm start` runs with the local ignored `.env`. No credential file is committed.
