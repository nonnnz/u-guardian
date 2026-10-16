const names = new Set(['idle', 'thinking', 'searching', 'answering']);
const base = '/assets/mascot/';

export class GuardianMascot extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.shadowRoot.innerHTML = `<link rel="stylesheet" href="${new URL('./guardian-mascot.css', import.meta.url).href}">`;
    this.state = 'idle';
    this.sequence = 0;
    this.motion = matchMedia('(prefers-reduced-motion: reduce)');
    this.onMotion = () => { this.toggleAttribute('reduced', this.motion.matches); this.show(this.state, true); };
  }
  connectedCallback() {
    this.motion.addEventListener('change', this.onMotion);
    this.onMotion();
  }
  disconnectedCallback() {
    this.motion.removeEventListener('change', this.onMotion);
    this.sequence++;
    this.shadowRoot.querySelectorAll('video').forEach(video => video.pause());
  }
  async show(requested, force = false) {
    const state = names.has(requested) ? requested : 'idle';
    if (!force && state === this.state) return;
    this.state = state;
    this.setAttribute('aria-label', `Guardian mascot ${state}`);
    const sequence = ++this.sequence;
    const old = this.shadowRoot.querySelector('img,video');
    const paths = (this.motion.matches || this.hasAttribute('poster')) ? [`${state}-poster.webp`] :
      (this.supportsWebm() ? [`${state}.webm`, `${state}.webp`, `${state}-poster.webp`] : [`${state}.webp`, `${state}-poster.webp`]);
    for (const path of paths) {
      try {
        const media = await this.load(path);
        if (sequence !== this.sequence || !this.isConnected) { media.pause?.(); return; }
        media.style.opacity = '0';
        this.shadowRoot.append(media);
        await new Promise(resolve => requestAnimationFrame(() => { media.style.opacity = '1'; if (old) old.style.opacity = '0'; resolve(); }));
        if (old && !this.motion.matches && !this.hasAttribute('poster')) await new Promise(resolve => media.addEventListener('transitionend', resolve, {once:true}));
        if (sequence !== this.sequence) return;
        this.shadowRoot.querySelectorAll('img,video').forEach(item => { if (item !== media) { item.pause?.(); item.remove(); } });
        return;
      } catch { /* The next source is the fallback. */ }
    }
    if (sequence === this.sequence && !old) this.shadowRoot.append(Object.assign(document.createElement('span'), {textContent:'Guardian'}));
  }
  supportsWebm() {
    // Alpha WebM works in Chromium. Other engines use the transparent animated WebP.
    return /Chrome|Chromium|Edg\//.test(navigator.userAgent) && !!document.createElement('video').canPlayType('video/webm; codecs="vp9"');
  }
  load(path) {
    return new Promise((resolve, reject) => {
      const video = path.endsWith('.webm');
      const media = document.createElement(video ? 'video' : 'img');
      media.setAttribute('aria-hidden', 'true');
      if (video) { media.muted = true; media.autoplay = true; media.loop = true; media.playsInline = true; media.preload = 'auto'; media.poster = base + path.replace('.webm', '-poster.webp'); }
      media.addEventListener(video ? 'loadeddata' : 'load', () => resolve(media), {once:true});
      media.addEventListener('error', () => reject(new Error(path)), {once:true});
      media.src = base + path;
      if (video) media.load();
    });
  }
}
if (!customElements.get('guardian-mascot')) customElements.define('guardian-mascot', GuardianMascot);
