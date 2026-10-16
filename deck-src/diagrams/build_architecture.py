"""Builds deck-src/diagrams/architecture.html (diagram-design skill, dark, slide-16x9)."""
import base64, pathlib
root = pathlib.Path(__file__).resolve().parents[2]
def uri(p, mime): return f"data:{mime};base64," + base64.b64encode((root/p).read_bytes()).decode()
IMG = dict(
  guardian=uri('deck/assets/logo.jpg','image/jpeg'),
  ubot=uri('deck/assets/sponsors/u-topia-mark.png','image/png'),
  avax=uri('deck/assets/sponsors/avalanche.png','image/png'),
  tok=uri('deck/assets/sponsors/tokenomist.png','image/png'),
  el=uri('deck/assets/sponsors/elevenlabs.svg','image/svg+xml'),
  cg=uri('deck/assets/sponsors/coingecko.png','image/png'),
)
# tokens (U-Guardian dark palette, DESIGN.md)
PAPER='#111318'; PAPER2='#1c1e25'; INK='#f5f1e9'; MUTED='#afb0b7'; SOFT='#9a9ca4'
ACC='#ff994d'; ACCT='rgba(255,153,77,0.12)'; LEAF='#d8e8b3'; LEAFT='rgba(216,232,179,0.07)'
NAME="Manrope,'Geist',system-ui,sans-serif"; MONO="'Geist Mono',ui-monospace,monospace"
S='arch'
out=[]; a=out.append
def mask(x,y,w,t,color=SOFT):  # arrow label on opaque mask; (x,y)=mask top-left, 12 tall
    a(f'<rect x="{x}" y="{y}" width="{w}" height="12" rx="2" fill="{PAPER}"/>')
    a(f'<text x="{x+w/2}" y="{y+9.5}" fill="{color}" font-size="12" font-family="{MONO}" text-anchor="middle" letter-spacing="0.06em">{t}</text>')
def node(x,y,w,name,sub,kind,icon=None,glyph=None,tag=None):
    fill,stroke,dash = dict(
      focal=(ACCT,ACC,''), core=(PAPER2,MUTED,''), ext=(LEAFT,'rgba(216,232,179,0.65)',''),
      store=('rgba(245,241,233,0.05)',MUTED,''), user=('rgba(175,176,183,0.10)',SOFT,'')
    )[kind]
    h=80
    a(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="{PAPER}"/>')
    a(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="{fill}" stroke="{stroke}" stroke-width="1"/>')
    ix=x+16; iy=y+24
    if icon=='el': a(f'<rect x="{ix}" y="{iy}" width="32" height="32" rx="8" fill="#ffffff"/>')
    if icon: a(f'<clipPath id="{S}-c{x}{y}"><rect x="{ix}" y="{iy}" width="32" height="32" rx="{16 if icon=="guardian" else 8}"/></clipPath><image href="{IMG[icon]}" x="{ix}" y="{iy}" width="32" height="32" clip-path="url(#{S}-c{x}{y})" preserveAspectRatio="xMidYMid slice"/>')
    if glyph: a(f'<g transform="translate({ix+4},{iy+4})" fill="none" stroke="{stroke}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">{glyph}</g>')
    a(f'<text x="{x+60}" y="{y+37}" fill="{INK}" font-size="16" font-weight="600" font-family="{NAME}">{name}</text>')
    a(f'<text x="{x+60}" y="{y+57}" fill="{MUTED}" font-size="12" font-family="{MONO}">{sub}</text>')
GL_USER='<circle cx="12" cy="8" r="4.5"/><path d="M3.5 22c1-5 4.5-7 8.5-7s7.5 2 8.5 7"/>'
GL_SERVER='<rect x="2" y="3" width="20" height="7" rx="2"/><rect x="2" y="14" width="20" height="7" rx="2"/><path d="M6 6.5h.01M6 17.5h.01"/>'
GL_WATCH='<path d="M5 17V11a7 7 0 0 1 14 0v6l1.5 2h-17z"/><path d="M10 22h4"/>'

# --- geometry (viewBox 1280x720, slide-16x9) ---
C1,C2,C3,C4=40,280,616,968; W1,W2,W3,W4=164,224,224,256
T,M,B=104,296,488   # row tops (h=80)
a(f'<title id="{S}-title">U-Guardian architecture at a glance</title>')
a(f'<desc id="{S}-desc">A user talks to the Guardian web app; a Node.js backend validates each U-bot tool request and calls Avalanche, Tokenomist and CoinGecko, while ElevenLabs handles voice and confirmed watches raise alerts.</desc>')
a('<defs>'
  f'<marker id="{S}-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="{MUTED}"/></marker>'
  f'<marker id="{S}-arrow-accent" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="{ACC}"/></marker>'
  f'<marker id="{S}-arrow-link" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="{LEAF}"/></marker>'
  '</defs>')
a(f'<rect width="100%" height="100%" fill="{PAPER}"/>')
# zone: sponsor data APIs
a(f'<rect x="952" y="72" width="288" height="528" rx="8" fill="rgba(245,241,233,0.02)" stroke="rgba(245,241,233,0.12)" stroke-width="0.8"/>')
a(f'<rect x="1000" y="76" width="192" height="12" rx="2" fill="{PAPER}"/><text x="1096" y="85" fill="{SOFT}" font-size="8" font-family="{MONO}" text-anchor="middle" letter-spacing="0.14em">SPONSOR DATA APIS</text>')

def path(d,color=MUTED,mk='arrow',dash=None,w=1.2):
    da=f' stroke-dasharray="{dash}"' if dash else ''
    a(f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{w}"{da} marker-end="url(#{S}-{mk})"/>')
# arrows first
path('M204,336 H280',ACC,'arrow-accent',w=1.4)                               # user -> web
path('M504,336 H616',ACC,'arrow-accent',w=1.4)                               # web -> backend
path('M688,296 V184',ACC,'arrow-accent',w=1.4)                               # backend -> ubot (prompt)
path('M768,184 V296',ACC,'arrow-accent',w=1.4)                               # ubot -> backend (tool call)
path('M840,316 H868 Q876,316 876,308 V152 Q876,144 884,144 H968',LEAF,'arrow-link')   # -> avalanche
path('M840,336 H968',LEAF,'arrow-link')                                      # -> tokenomist
path('M840,356 H868 Q876,356 876,364 V520 Q876,528 884,528 H968',LEAF,'arrow-link')   # -> coingecko
path('M392,296 V184',LEAF,'arrow-link','4,3',w=1)                             # web -> elevenlabs (voice)
path('M728,376 V488',MUTED,'arrow')                                          # backend -> watches
path('M616,528 H396 Q388,528 388,520 V376',MUTED,'arrow','4,3',w=1)          # watches -> web (alert)
# labels (opaque masks, 8-10px clear of the stroke, clear of later nodes)
mask(225,316,34,'ASK'); mask(528,316,64,'REQUEST')
mask(621,234,57,'PROMPT'); mask(778,234,79,'TOOL CALL')
mask(898,124,57,'WALLET'); mask(902,316,57,'SUPPLY'); mask(898,508,57,'MARKET')
mask(402,234,79,'STT / TTS',LEAF); mask(738,426,86,'SAVE WATCH'); mask(481,508,49,'ALERT')
# nodes
node(C1,M,W1,'You','wallet owner','user',glyph=GL_USER)
node(C2,M,W2,'Guardian web app','mascot chat · voice','focal',icon='guardian')
node(C3,M,W3,'Backend','Node.js · allowlist','core',glyph=GL_SERVER)
node(C3,T,W3,'U-bot agent','plan → explain','focal',icon='ubot')
node(C3,B,W3,'Watches','you confirm first','store',glyph=GL_WATCH)
node(C2,T,W2,'ElevenLabs','speech in / out','ext',icon='el')
node(C4,T,W4,'Avalanche','wallet · transfers','ext',icon='avax')
node(C4,M,W4,'Tokenomist','supply · unlocks','ext',icon='tok')
node(C4,B,W4,'CoinGecko + RSS','market · news','ext',icon='cg')
# legend strip
a(f'<line x1="40" y1="640" x2="1240" y2="640" stroke="rgba(245,241,233,0.12)" stroke-width="0.8"/>')
a(f'<text x="40" y="664" fill="{MUTED}" font-size="8" font-family="{MONO}" letter-spacing="0.14em">LEGEND</text>')
items=[('sw',ACCT,ACC,'Our product'),('sw',PAPER2,MUTED,'Core service'),('sw',LEAFT,'rgba(216,232,179,0.65)','Sponsor API'),
       ('sw','rgba(245,241,233,0.05)',MUTED,'State'),('sw','rgba(175,176,183,0.10)',SOFT,'User'),
       ('ln',ACC,'','Agent loop'),('ln',LEAF,'','API call'),('ln',MUTED,'4,3','Async / alert'),('ln',LEAF,'4,3','Voice')]
x=40; y=686
for kind,c1,c2,label in items:
    if kind=='sw':
        a(f'<rect x="{x}" y="{y-9}" width="18" height="12" rx="3" fill="{c1}" stroke="{c2}" stroke-width="1"/>'); tx=x+26
    else:
        da=f' stroke-dasharray="{c2}"' if c2 else ''
        a(f'<line x1="{x}" y1="{y-3}" x2="{x+22}" y2="{y-3}" stroke="{c1}" stroke-width="1.4"{da}/><polygon points="{x+22},{y-6} {x+28},{y-3} {x+22},{y}" fill="{c1}"/>'); tx=x+36
    a(f'<text x="{tx}" y="{y}" fill="{INK}" font-size="11" font-family="{NAME}">{label}</text>')
    x+= 132 if kind=='sw' else 140
svg='\n        '.join(out)
html=f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>U-Guardian architecture at a glance</title>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700&family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
    :root {{
      --color-paper:{PAPER}; --color-ink:{INK}; --color-muted:{MUTED}; --color-accent:{ACC};
      --font-sans:{NAME}; --font-mono:{MONO};
    }}
    body {{ font-family: var(--font-sans); background: var(--color-paper); color: var(--color-ink);
      min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 3rem 2rem; }}
    .frame {{ max-width: 1320px; width: 100%; }}
    .diagram-container {{ width: 100%; overflow-x: auto; }}
    .eyebrow {{ font-family: var(--font-mono); font-size: 0.66rem; font-weight: 500; letter-spacing: 0.18em;
      text-transform: uppercase; color: var(--color-muted); margin-bottom: 0.5rem; }}
    h1 {{ font-family: var(--font-sans); font-size: clamp(1.5rem, 2.4vw + 0.75rem, 2.1rem); font-weight: 600;
      letter-spacing: -0.03em; line-height: 1.15; margin-bottom: 1.5rem; }}
    h1 em {{ font-style: normal; color: var(--color-accent); }}
    svg {{ width: 100%; min-width: 1280px; display: block; }}
    @media print {{ .diagram-container {{ overflow-x: visible; }} svg {{ min-width: 0; }} }}
  </style>
</head>
<body>
  <div class="frame">
    <p class="eyebrow">Architecture · high-level overview</p>
    <h1>U-Guardian at a glance: <em>one conversation, named tools.</em></h1>
    <div class="diagram-container">
      <svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="{S}-title {S}-desc">
        {svg}
      </svg>
    </div>
  </div>
</body>
</html>
'''
(root/'deck-src/diagrams/architecture.html').write_text(html)
print('ok',len(html)//1024,'KB')
