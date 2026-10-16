// Builds deck/index.html: inlines fonts, logo, screenshots, mascot posters, avatars, QR and live data (no external hosting needed).
import {readFileSync as r,writeFileSync as w} from 'node:fs';
const d=new URL('../deck/',import.meta.url),s=new URL('./',import.meta.url);
const b64=(p,t)=>`data:${t};base64,${r(new URL(p,d)).toString('base64')}`;
let h=r(new URL('template.html',s),'utf8');
const rep={
  '/*FONTS*/':r(new URL('fonts.css',s),'utf8'),
  '{{LOGO}}':b64('assets/logo.jpg','image/jpeg'),
  '{{P_answering}}':b64('assets/mascot/answering-poster.webp','image/webp'),
  '{{A_wayu}}':b64('assets/team/Wayu650610806.png','image/jpeg'),
  '{{A_nonnnz}}':b64('assets/team/nonnnz.jpg','image/jpeg'),
  '{{SP_utopia}}':b64('assets/sponsors/u-topia.png','image/png'),
  '{{SP_avax}}':b64('assets/sponsors/avalanche.png','image/png'),
  '{{SP_tok}}':b64('assets/sponsors/tokenomist.png','image/png'),
  '{{SP_el}}':b64('assets/sponsors/elevenlabs.svg','image/svg+xml'),
  '{{QR}}':r(new URL('qr.svg',s),'utf8'),
  '{{LIVE}}':r(new URL('live-data.js',d),'utf8').replace(/^window\.LIVE_DATA=|;\s*$/g,''),
};
const arch=r(new URL('diagrams/architecture.html',s),'utf8').match(/<svg[\s\S]*<\/svg>/)[0]
  .replace(/<rect width="100%" height="100%" fill="#111318"\/>/,'')
  .replace('viewBox="0 0 1280 720"','viewBox="32 64 1216 656"')
  .replace(/'Geist Mono',ui-monospace/g,"'Geist Mono','JetBrains Mono',ui-monospace");
rep['{{ARCH_SVG}}']=arch;
for(const n of ['home','health','watch','call','debug'])rep[`{{S_${n}}}`]=b64(`assets/shots/${n}.jpg`,'image/jpeg');
for(const [k,v] of Object.entries(rep))h=h.split(k).join(v);
w(new URL('index.html',d),h);console.log('deck/index.html',(h.length/1024).toFixed(0)+'KB');
