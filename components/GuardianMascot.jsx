import { useEffect, useState } from 'react';

const STATES = ['idle', 'thinking', 'searching', 'answering'];
const FADE = 'opacity 180ms cubic-bezier(0.23, 1, 0.32, 1)';

/** Copy this file and assets/mascot into any React app. React is the only dependency. */
export default function GuardianMascot({ state = 'idle', size = 160, loop = true, basePath = '/assets/mascot' }) {
  const requested = STATES.includes(state) ? state : 'idle';
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [shown, setShown] = useState(requested);
  const [incoming, setIncoming] = useState(null);
  const [outgoing, setOutgoing] = useState(null);
  const [failed, setFailed] = useState({});
  const path = (name, ext) => `${basePath}/${name}.${ext}`;

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (reduced) { setShown(requested); setIncoming(null); setOutgoing(null); }
    else setIncoming(requested === shown ? null : requested);
  }, [requested, reduced]);
  useEffect(() => {
    const images = STATES.flatMap(name => [path(`${name}-poster`, 'webp'), path(name, 'webp')]);
    images.forEach(src => { const image = new Image(); image.src = src; });
  }, [basePath]);
  useEffect(() => {
    if (!outgoing) return;
    const timeout = setTimeout(() => setOutgoing(null), 180);
    return () => clearTimeout(timeout);
  }, [outgoing, shown]);

  function ready(name) {
    if (name !== incoming) return;
    setOutgoing(shown);
    setShown(name);
    setIncoming(null);
  }
  function fail(name) {
    setFailed(previous => ({ ...previous, [name]: Math.min((previous[name] || 0) + 1, 3) }));
  }
  useEffect(() => {
    if (incoming && failed[incoming] >= 3) ready(incoming);
  }, [incoming, failed]);
  function layer(name) {
    const level = Math.max(reduced ? 2 : 0, failed[name] || 0);
    const style = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', opacity: name === shown ? 1 : 0, transition: reduced ? 'none' : FADE };
    if (level >= 3) return <span key={name} role="img" aria-label="Guardian mascot unavailable" style={{ ...style, display: 'grid', placeItems: 'center', fontSize: 12 }}>Mascot unavailable</span>;
    if (level >= 1) return <img key={name} src={level === 1 && loop ? path(name, 'webp') : path(`${name}-poster`, 'webp')} alt="" style={style} onLoad={() => ready(name)} onError={() => fail(name)} />;
    return <video key={name} src={path(name, 'webm')} poster={path(`${name}-poster`, 'webp')} autoPlay muted playsInline loop={loop} preload={name === shown ? 'auto' : 'metadata'} aria-hidden="true" style={style} onLoadedData={() => ready(name)} onError={() => fail(name)} />;
  }

  const layers = reduced ? [shown] : [...new Set([outgoing, shown, incoming].filter(Boolean))];
  return <span role="img" aria-label={`Guardian mascot ${requested}`} style={{ position: 'relative', display: 'inline-block', width: size, height: size, flex: 'none' }}>{layers.map(layer)}</span>;
}
