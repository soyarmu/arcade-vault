/* ===== ARCADE VAULT — theme ===== */
:root {
  --bg: #0a0a0f;
  --bg-2: #0f0f18;
  --bg-3: #15151f;
  --ink: #e6e9ff;
  --ink-dim: #8a8fb5;
  --ink-faint: #4a4f70;
  --cyan: #00f5ff;
  --magenta: #ff006e;
  --yellow: #f5ff00;
  --green: #00ff88;
  --gold: #ffcf3a;
  --silver: #c7d0e0;
  --bronze: #d97a3a;
  --line: rgba(0, 245, 255, 0.18);
  --line-2: rgba(255, 255, 255, 0.06);
  --pixel: "Press Start 2P", system-ui, monospace;
  --mono: "JetBrains Mono", "Courier Prime", "Courier New", monospace;
}

* { box-sizing: border-box; }

html, body, #root {
  height: 100%;
  margin: 0;
}

body {
  background: var(--bg);
  color: var(--ink);
  font-family: var(--mono);
  font-size: 14px;
  line-height: 1.5;
  letter-spacing: 0.01em;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

button, input, select { font: inherit; color: inherit; }

a { color: inherit; text-decoration: none; }

/* ===== background: perspective grid + scanlines + vignette ===== */
.av-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(120% 80% at 50% 0%, rgba(255, 0, 110, 0.08), transparent 60%),
    radial-gradient(120% 80% at 50% 100%, rgba(0, 245, 255, 0.10), transparent 60%),
    var(--bg);
}
.av-bg::before {
  /* perspective floor grid */
  content: "";
  position: absolute;
  left: -10%;
  right: -10%;
  bottom: -10%;
  height: 70%;
  background:
    linear-gradient(to right, rgba(0, 245, 255, 0.22) 1px, transparent 1px) 0 0 / 60px 60px,
    linear-gradient(to bottom, rgba(0, 245, 255, 0.22) 1px, transparent 1px) 0 0 / 60px 60px;
  transform: perspective(600px) rotateX(60deg);
  transform-origin: center bottom;
  mask-image: linear-gradient(to top, black 0%, transparent 90%);
  animation: gridscroll 8s linear infinite;
  opacity: 0.55;
}
@keyframes gridscroll {
  to { background-position: 0 60px, 0 60px; }
}
.av-bg::after {
  /* scanlines */
  content: "";
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.03) 0 1px,
    transparent 1px 3px
  );
  mix-blend-mode: overlay;
  opacity: 0.6;
}

.av-noise {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1   0 0 0 0 1   0 0 0 0 1   0 0 0 0.08 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
  opacity: 0.35;
}

/* ===== app frame ===== */
#root { position: relative; z-index: 2; display: flex; flex-direction: column; min-height: 100%; }
.av-main { flex: 1; }

/* ===== pixel + neon text ===== */
.pixel { font-family: var(--pixel); letter-spacing: 0.04em; line-height: 1.25; text-transform: uppercase; }
.mono { font-family: var(--mono); }

.neon-cyan { color: var(--cyan); text-shadow: 0 0 6px rgba(0, 245, 255, 0.65), 0 0 16px rgba(0, 245, 255, 0.45); }
.neon-magenta { color: var(--magenta); text-shadow: 0 0 6px rgba(255, 0, 110, 0.65), 0 0 16px rgba(255, 0, 110, 0.45); }
.neon-yellow { color: var(--yellow); text-shadow: 0 0 6px rgba(245, 255, 0, 0.7), 0 0 16px rgba(245, 255, 0, 0.4); }
.neon-green { color: var(--green); text-shadow: 0 0 6px rgba(0, 255, 136, 0.6), 0 0 16px rgba(0, 255, 136, 0.35); }

.flicker {
  animation: flicker 5s infinite steps(1, end);
}
@keyframes flicker {
  0%, 18%, 22%, 25%, 53%, 57%, 100% { opacity: 1; }
  20%, 24%, 55% { opacity: 0.35; }
}

/* ===== navbar ===== */
.av-nav {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 14px 32px;
  background: linear-gradient(180deg, rgba(10,10,15,0.92), rgba(10,10,15,0.78));
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--line);
}
.av-nav .logo {
  display: flex; align-items: center; gap: 10px;
  cursor: pointer;
}
.av-nav .logo-mark {
  width: 28px; height: 28px;
  background:
    linear-gradient(45deg, var(--magenta) 0 50%, transparent 50%),
    linear-gradient(-45deg, var(--cyan) 0 50%, transparent 50%);
  background-blend-mode: screen;
  box-shadow: 0 0 12px rgba(0,245,255,0.55), inset 0 0 6px rgba(255,0,110,0.5);
  border: 1px solid rgba(255,255,255,0.18);
}
.av-nav .logo-text { font-family: var(--pixel); font-size: 12px; letter-spacing: 0.12em; }
.av-nav .links { display: flex; gap: 4px; margin-left: 32px; }
.av-nav .links a {
  position: relative;
  padding: 10px 14px;
  font-family: var(--pixel);
  font-size: 9px;
  letter-spacing: 0.16em;
  color: var(--ink-dim);
  cursor: pointer;
  transition: color 120ms;
}
.av-nav .links a:hover { color: var(--ink); }
.av-nav .links a.active { color: var(--cyan); text-shadow: 0 0 8px rgba(0,245,255,0.65); }
.av-nav .links a.active::after {
  content: "";
  position: absolute;
  left: 14px; right: 14px; bottom: 4px;
  height: 2px;
  background: var(--cyan);
  box-shadow: 0 0 8px var(--cyan), 0 0 16px var(--cyan);
}
.av-nav .spacer { flex: 1; }
.av-nav .coin-counter { display: flex; align-items: center; gap: 8px; font-family: var(--pixel); font-size: 9px; color: var(--yellow); }
.av-nav .coin-counter .coin { width: 14px; height: 14px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #fff8b0, #f5ff00 60%, #b0b800); box-shadow: 0 0 8px var(--yellow); }
.av-nav .auth-btn { margin-left: 16px; }
.av-nav .hamburger { display: none; }

@media (max-width: 840px) {
  .av-nav { padding: 12px 16px; }
  .av-nav .links { display: none; }
  .av-nav .coin-counter { display: none; }
  .av-nav .hamburger { display: inline-flex; }
}

.av-mobile-panel {
  position: fixed;
  inset: 0 0 0 auto;
  width: min(320px, 86vw);
  background: var(--bg-2);
  border-left: 1px solid var(--line);
  z-index: 60;
  padding: 24px 20px;
  transform: translateX(100%);
  transition: transform 220ms ease;
  display: flex; flex-direction: column; gap: 8px;
}
.av-mobile-panel.open { transform: translateX(0); }
.av-mobile-panel a {
  padding: 14px 12px;
  font-family: var(--pixel);
  font-size: 11px;
  color: var(--ink-dim);
  border-bottom: 1px dashed var(--line-2);
}
.av-mobile-panel a.active { color: var(--cyan); }
.av-mobile-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 55;
  opacity: 0; pointer-events: none; transition: opacity 180ms;
}
.av-mobile-backdrop.open { opacity: 1; pointer-events: auto; }

/* ===== generic neon button ===== */
.btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px 20px;
  font-family: var(--pixel);
  font-size: 10px;
  letter-spacing: 0.16em;
  background: transparent;
  color: var(--ink);
  border: 1px solid var(--cyan);
  box-shadow: 0 0 0 transparent, inset 0 0 0 transparent;
  cursor: pointer;
  transition: transform 80ms ease, box-shadow 160ms ease, color 160ms;
  clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
}
.btn::before {
  content: ""; position: absolute; inset: 3px;
  border: 1px solid rgba(0,245,255,0.25);
  pointer-events: none;
  clip-path: inherit;
}
.btn:hover {
  color: var(--cyan);
  box-shadow: 0 0 14px rgba(0,245,255,0.55), inset 0 0 8px rgba(0,245,255,0.35);
}
.btn:active { transform: translateY(1px) scale(0.98); }

.btn.magenta { border-color: var(--magenta); }
.btn.magenta:hover { color: var(--magenta); box-shadow: 0 0 14px rgba(255,0,110,0.55), inset 0 0 8px rgba(255,0,110,0.35); }
.btn.yellow { border-color: var(--yellow); }
.btn.yellow:hover { color: var(--yellow); box-shadow: 0 0 14px rgba(245,255,0,0.6), inset 0 0 8px rgba(245,255,0,0.35); }
.btn.ghost { border-color: var(--ink-faint); color: var(--ink-dim); }
.btn.ghost:hover { color: var(--ink); border-color: var(--ink-dim); box-shadow: none; }
.btn.lg { padding: 16px 28px; font-size: 12px; }
.btn.xl { padding: 20px 36px; font-size: 14px; letter-spacing: 0.2em; }
.btn.pulse { animation: pulse 1.6s ease-in-out infinite; }
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 transparent, inset 0 0 0 transparent; }
  50% { box-shadow: 0 0 20px var(--cyan), inset 0 0 12px rgba(0,245,255,0.45); }
}

/* ===== hero / library ===== */
.av-hero {
  padding: 64px 32px 32px;
  max-width: 1320px;
  margin: 0 auto;
  text-align: center;
}
.av-hero h1 {
  font-family: var(--pixel);
  font-size: clamp(28px, 6vw, 64px);
  letter-spacing: 0.06em;
  margin: 0;
  background: linear-gradient(180deg, #fff 0%, var(--cyan) 60%, var(--magenta) 110%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 0 12px rgba(0,245,255,0.4));
}
.av-hero .sub {
  margin-top: 18px;
  font-family: var(--pixel);
  font-size: clamp(10px, 1.6vw, 14px);
  letter-spacing: 0.2em;
  color: var(--yellow);
}
.av-hero .sub .blink { animation: blink 1.2s steps(1,end) infinite; }
@keyframes blink { 50% { opacity: 0; } }

.av-filters {
  display: flex;
  gap: 12px;
  max-width: 1320px;
  margin: 32px auto 0;
  padding: 0 32px;
  flex-wrap: wrap;
}
.av-search {
  flex: 1; min-width: 220px;
  display: flex; align-items: center; gap: 10px;
  padding: 0 16px;
  height: 48px;
  background: var(--bg-2);
  border: 1px solid var(--line);
  font-family: var(--mono);
  position: relative;
}
.av-search:focus-within { border-color: var(--cyan); box-shadow: 0 0 12px rgba(0,245,255,0.35); }
.av-search input {
  flex: 1; background: transparent; border: 0; outline: 0;
  color: var(--ink); font-size: 13px; letter-spacing: 0.04em;
}
.av-search input::placeholder { color: var(--ink-faint); }
.av-search .ico { color: var(--cyan); font-family: var(--pixel); font-size: 11px; }

.av-chips { display: flex; gap: 8px; flex-wrap: wrap; }
.chip {
  padding: 12px 14px;
  font-family: var(--pixel);
  font-size: 9px;
  letter-spacing: 0.12em;
  background: var(--bg-2);
  border: 1px solid var(--line);
  color: var(--ink-dim);
  cursor: pointer;
}
.chip.active { color: var(--magenta); border-color: var(--magenta); box-shadow: 0 0 10px rgba(255,0,110,0.35); }
.chip:hover:not(.active) { color: var(--ink); }

/* ===== grid + cards ===== */
.av-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 22px;
  max-width: 1320px;
  margin: 32px auto 80px;
  padding: 0 32px;
}

.card {
  position: relative;
  background: linear-gradient(180deg, var(--bg-2), var(--bg-3));
  border: 1px solid var(--line);
  padding: 14px;
  display: flex; flex-direction: column; gap: 14px;
  cursor: pointer;
  transition: transform 180ms ease, box-shadow 220ms ease, border-color 220ms ease;
  transform-style: preserve-3d;
  will-change: transform;
}
.card::before {
  content: "";
  position: absolute; inset: -1px;
  background: linear-gradient(135deg, transparent 60%, rgba(0,245,255,0.4));
  opacity: 0; transition: opacity 180ms;
  pointer-events: none;
}
.card:hover {
  transform: translateY(-6px) rotateX(2deg) rotateY(-2deg);
  border-color: var(--cyan);
  box-shadow: 0 18px 40px -10px rgba(0,245,255,0.4), 0 0 0 1px rgba(0,245,255,0.3);
}
.card:hover::before { opacity: 0.5; }

.card .cover {
  aspect-ratio: 4 / 3;
  position: relative;
  overflow: hidden;
  border: 1px solid var(--line-2);
}
.card .cover .label {
  position: absolute; left: 8px; bottom: 8px;
  font-family: var(--pixel); font-size: 8px;
  padding: 4px 6px;
  background: rgba(0,0,0,0.6);
  color: var(--cyan);
  border: 1px solid var(--line);
  z-index: 2;
}
.card .meta { display: flex; flex-direction: column; gap: 6px; }
.card .title {
  font-family: var(--pixel);
  font-size: 13px;
  letter-spacing: 0.06em;
  color: var(--ink);
}
.card .desc { font-size: 12px; color: var(--ink-dim); min-height: 36px; }

.card .row { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 4px; }
.score-badge {
  display: flex; flex-direction: column;
  font-family: var(--mono); font-size: 10px;
  color: var(--ink-faint);
  text-transform: uppercase; letter-spacing: 0.08em;
}
.score-badge b {
  font-family: var(--pixel);
  font-size: 12px;
  color: var(--yellow);
  letter-spacing: 0.06em;
  text-shadow: 0 0 6px rgba(245,255,0,0.6);
}

/* ===== Cover art generators (pure CSS) ===== */
.cover-bg { position: absolute; inset: 0; }

.cover-bricks { background:
  repeating-linear-gradient(90deg, #ff006e 0 32px, #ffae00 32px 64px, #00f5ff 64px 96px, #00ff88 96px 128px) 0 0/100% 32px,
  #15151f; }
.cover-bricks::after {
  content: ""; position: absolute; inset: 0;
  background: repeating-linear-gradient(0deg, transparent 0 32px, rgba(0,0,0,0.4) 32px 33px);
}

.cover-tetro { background: radial-gradient(circle at 50% 100%, #2a004a, #0a0a18); }
.cover-tetro::after {
  content: "";
  position: absolute;
  inset: 20% 30% 0 30%;
  background:
    linear-gradient(#00f5ff,#00f5ff) 0 0/25% 33%,
    linear-gradient(#ff006e,#ff006e) 25% 0/25% 33%,
    linear-gradient(#f5ff00,#f5ff00) 50% 33%/25% 33%,
    linear-gradient(#00ff88,#00ff88) 25% 66%/25% 33%,
    linear-gradient(#ff7700,#ff7700) 50% 66%/25% 33%,
    linear-gradient(#aa00ff,#aa00ff) 75% 33%/25% 33%;
  background-repeat: no-repeat;
  filter: drop-shadow(0 0 8px rgba(0,245,255,0.4));
  image-rendering: pixelated;
}

.cover-snake { background: linear-gradient(135deg,#003a2a,#0a0a18); }
.cover-snake::after {
  content: "";
  position: absolute; inset: 0;
  background-image:
    radial-gradient(circle at 70% 50%, var(--magenta) 0 6px, transparent 7px),
    linear-gradient(90deg, var(--green) 0 40px, transparent 40px) 20% 50% / 200px 12px no-repeat,
    linear-gradient(90deg, var(--green) 0 12px, transparent 12px) calc(20% + 40px) calc(50% - 12px)/12px 12px no-repeat,
    linear-gradient(90deg, var(--green) 0 12px, transparent 12px) calc(20% + 28px) calc(50% - 12px)/12px 12px no-repeat;
  filter: drop-shadow(0 0 6px rgba(0,255,136,0.6));
}

.cover-glot { background: radial-gradient(circle at 50% 50%, #1a002a, #0a0a18); }
.cover-glot::after {
  content: "";
  position: absolute; inset: 0;
  background:
    radial-gradient(circle at 30% 50%, var(--yellow) 0 38px, transparent 39px),
    radial-gradient(circle at 30% 50%, transparent 0 0, transparent 28px),
    radial-gradient(circle at 70% 50%, var(--magenta) 0 6px, transparent 7px),
    radial-gradient(circle at 82% 50%, var(--cyan) 0 6px, transparent 7px);
  clip-path: polygon(0 0, 30% 0, 30% 50%, 100% 30%, 100% 70%, 30% 50%, 30% 100%, 0 100%);
  filter: drop-shadow(0 0 8px rgba(245,255,0,0.5));
}
.cover-glot::before {
  content: "•••";
  position: absolute; left: 55%; top: 47%;
  color: var(--cyan); letter-spacing: 6px; font-size: 18px;
  text-shadow: 0 0 6px var(--cyan);
}

.cover-invaders { background: linear-gradient(180deg,#001a3a,#0a0a18); }
.cover-invaders::after {
  content: "";
  position: absolute; inset: 0;
  background:
    radial-gradient(circle at 20% 30%, var(--green) 0 5px, transparent 6px),
    radial-gradient(circle at 40% 30%, var(--green) 0 5px, transparent 6px),
    radial-gradient(circle at 60% 30%, var(--green) 0 5px, transparent 6px),
    radial-gradient(circle at 80% 30%, var(--green) 0 5px, transparent 6px),
    radial-gradient(circle at 20% 50%, var(--magenta) 0 5px, transparent 6px),
    radial-gradient(circle at 40% 50%, var(--magenta) 0 5px, transparent 6px),
    radial-gradient(circle at 60% 50%, var(--magenta) 0 5px, transparent 6px),
    radial-gradient(circle at 80% 50%, var(--magenta) 0 5px, transparent 6px),
    radial-gradient(circle at 50% 80%, var(--cyan) 0 8px, transparent 9px);
  filter: drop-shadow(0 0 6px rgba(0,255,136,0.6));
}

.cover-rocas { background: radial-gradient(circle at 50% 50%, #0a0a30, #000); }
.cover-rocas::after {
  content: "";
  position: absolute; inset: 0;
  background:
    radial-gradient(circle at 22% 30%, #888 0 18px, transparent 19px),
    radial-gradient(circle at 75% 60%, #aaa 0 26px, transparent 27px),
    radial-gradient(circle at 50% 80%, #777 0 14px, transparent 15px),
    radial-gradient(circle at 88% 22%, var(--cyan) 0 2px, transparent 3px),
    radial-gradient(circle at 12% 70%, var(--cyan) 0 2px, transparent 3px),
    radial-gradient(circle at 60% 20%, var(--cyan) 0 2px, transparent 3px);
}
.cover-rocas::before {
  content: "▲";
  position: absolute; left: 48%; top: 44%;
  color: var(--yellow); font-size: 22px;
  text-shadow: 0 0 8px var(--yellow);
}

.cover-rana { background: linear-gradient(180deg,#001f2a,#0a0a18); }
.cover-rana::after {
  content: "";
  position: absolute; inset: 0;
  background:
    repeating-linear-gradient(0deg, rgba(0,245,255,0.18) 0 20px, transparent 20px 40px),
    radial-gradient(circle at 50% 55%, var(--green) 0 14px, transparent 15px);
  filter: drop-shadow(0 0 8px rgba(0,255,136,0.5));
}

.cover-duelo { background: #0a0a18; }
.cover-duelo::after {
  content: "";
  position: absolute; inset: 0;
  background:
    repeating-linear-gradient(0deg, var(--ink) 0 10px, transparent 10px 20px) 50% 0/2px 100% no-repeat,
    linear-gradient(var(--cyan), var(--cyan)) 6% 35%/6px 30% no-repeat,
    linear-gradient(var(--magenta), var(--magenta)) 88% 35%/6px 30% no-repeat,
    radial-gradient(circle at 60% 60%, var(--yellow) 0 5px, transparent 6px);
  filter: drop-shadow(0 0 6px rgba(0,245,255,0.4));
}

/* ===== detail screen ===== */
.av-detail {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 32px;
  max-width: 1320px;
  margin: 48px auto;
  padding: 0 32px;
}
@media (max-width: 900px) { .av-detail { grid-template-columns: 1fr; } }
.detail-cover {
  aspect-ratio: 16 / 10;
  position: relative;
  border: 1px solid var(--line);
  overflow: hidden;
}
.detail-info { display: flex; flex-direction: column; gap: 16px; }
.detail-info h2 {
  margin: 0;
  font-family: var(--pixel);
  font-size: clamp(20px, 3vw, 32px);
  letter-spacing: 0.06em;
}
.detail-tags { display: flex; gap: 8px; flex-wrap: wrap; }
.detail-tags span {
  font-family: var(--pixel); font-size: 9px; letter-spacing: 0.12em;
  padding: 6px 10px;
  border: 1px solid var(--line); color: var(--ink-dim);
}
.detail-info p { color: var(--ink-dim); font-size: 14px; line-height: 1.7; margin: 0; }
.stat-strip {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 1px; background: var(--line);
  border: 1px solid var(--line);
  margin-top: 8px;
}
.stat-strip > div { padding: 14px; background: var(--bg-2); }
.stat-strip .l { font-family: var(--mono); font-size: 10px; color: var(--ink-faint); text-transform: uppercase; letter-spacing: 0.12em; }
.stat-strip .v { font-family: var(--pixel); font-size: 16px; color: var(--cyan); margin-top: 6px; text-shadow: 0 0 6px rgba(0,245,255,0.5); }
.detail-actions { display: flex; gap: 12px; margin-top: 16px; flex-wrap: wrap; }

.leaderboard {
  border: 1px solid var(--line);
  background: var(--bg-2);
}
.leaderboard h3 {
  margin: 0;
  padding: 14px 16px;
  font-family: var(--pixel);
  font-size: 11px;
  color: var(--magenta);
  text-shadow: 0 0 8px rgba(255,0,110,0.5);
  border-bottom: 1px solid var(--line);
  letter-spacing: 0.14em;
}
.lb-row {
  display: grid;
  grid-template-columns: 36px 1fr 110px;
  gap: 10px;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid var(--line-2);
  font-family: var(--mono);
  font-size: 13px;
}
.lb-row .rk { font-family: var(--pixel); font-size: 11px; color: var(--ink-faint); }
.lb-row .pl { color: var(--ink); }
.lb-row .sc { text-align: right; font-family: var(--pixel); font-size: 12px; color: var(--cyan); }
.lb-row.top1 .rk, .lb-row.top1 .sc { color: var(--gold); text-shadow: 0 0 6px rgba(255,207,58,0.6); }
.lb-row.top2 .rk, .lb-row.top2 .sc { color: var(--silver); text-shadow: 0 0 6px rgba(199,208,224,0.5); }
.lb-row.top3 .rk, .lb-row.top3 .sc { color: var(--bronze); text-shadow: 0 0 6px rgba(217,122,58,0.5); }

/* ===== player ===== */
.av-player {
  max-width: 1100px;
  margin: 32px auto;
  padding: 0 24px 64px;
}
.player-hud {
  display: flex; gap: 16px; align-items: center; justify-content: space-between;
  padding: 14px 18px;
  border: 1px solid var(--line);
  background: var(--bg-2);
  margin-bottom: 18px;
  flex-wrap: wrap;
}
.hud-stat { display: flex; flex-direction: column; gap: 4px; }
.hud-stat .l { font-family: var(--mono); font-size: 10px; color: var(--ink-faint); letter-spacing: 0.14em; text-transform: uppercase; }
.hud-stat .v { font-family: var(--pixel); font-size: 16px; color: var(--cyan); text-shadow: 0 0 6px rgba(0,245,255,0.5); }
.hud-stat.lives .v { color: var(--magenta); text-shadow: 0 0 6px rgba(255,0,110,0.5); }
.hud-stat.level .v { color: var(--yellow); text-shadow: 0 0 6px rgba(245,255,0,0.5); }
.hud-actions { display: flex; gap: 10px; }

.crt {
  position: relative;
  border-radius: 28px;
  background: #050507;
  padding: 24px;
  box-shadow:
    0 0 0 6px #1b1b22,
    0 0 0 7px #2a2a35,
    0 30px 80px -20px rgba(0,245,255,0.35);
  overflow: hidden;
}
.crt::before {
  content: "";
  position: absolute; inset: 0;
  background: radial-gradient(120% 80% at 50% 30%, rgba(0,245,255,0.05), transparent 60%);
  pointer-events: none;
}
.crt-screen {
  position: relative;
  aspect-ratio: 4 / 3;
  background: #000;
  border-radius: 12px / 28px;
  overflow: hidden;
  box-shadow: inset 0 0 60px rgba(0,0,0,0.9), inset 0 0 20px rgba(0,245,255,0.15);
}
.crt-screen::after {
  content: "";
  position: absolute; inset: 0;
  background: repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0 2px, transparent 2px 4px);
  pointer-events: none;
  mix-blend-mode: multiply;
}
.crt-screen::before {
  content: "";
  position: absolute; inset: 0;
  background: radial-gradient(120% 90% at 50% 50%, transparent 60%, rgba(0,0,0,0.65));
  pointer-events: none;
}
.crt-content {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  color: var(--cyan);
  font-family: var(--pixel);
  font-size: 12px;
  text-align: center;
}
.crt-bottom {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 14px;
  padding: 0 8px;
  font-family: var(--pixel);
  font-size: 8px;
  color: var(--ink-faint);
  letter-spacing: 0.16em;
}
.crt-bottom .led {
  display: inline-flex; align-items: center; gap: 6px;
}
.crt-bottom .led::before {
  content: ""; width: 8px; height: 8px; border-radius: 50%;
  background: var(--green); box-shadow: 0 0 6px var(--green);
}

/* fake in-screen game */
.game-arena {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  background:
    radial-gradient(circle at 50% 50%, #0a0030 0%, #000 70%),
    #000;
}
.game-arena .grid-floor {
  position: absolute; inset: 50% 0 0 0;
  background:
    linear-gradient(to right, rgba(0,245,255,0.4) 1px, transparent 1px) 0 0/40px 40px,
    linear-gradient(to bottom, rgba(0,245,255,0.4) 1px, transparent 1px) 0 0/40px 40px;
  transform: perspective(300px) rotateX(70deg);
  transform-origin: top;
  animation: gridscroll 4s linear infinite;
  opacity: 0.7;
}
.game-arena .player-ship {
  position: absolute;
  bottom: 14%;
  left: 50%;
  width: 0; height: 0;
  border-left: 14px solid transparent;
  border-right: 14px solid transparent;
  border-bottom: 22px solid var(--cyan);
  filter: drop-shadow(0 0 8px var(--cyan));
  transform: translateX(-50%);
  animation: bob 2s ease-in-out infinite;
}
@keyframes bob { 50% { transform: translateX(-50%) translateY(-6px); } }
.game-arena .enemy {
  position: absolute;
  width: 12px; height: 12px;
  background: var(--magenta);
  box-shadow: 0 0 8px var(--magenta);
}
.game-arena .e1 { top: 18%; left: 22%; animation: drift 3s ease-in-out infinite; }
.game-arena .e2 { top: 26%; left: 70%; animation: drift 3.2s ease-in-out infinite reverse; }
.game-arena .e3 { top: 14%; left: 50%; background: var(--yellow); box-shadow: 0 0 8px var(--yellow); animation: drift 2.8s ease-in-out infinite; }
@keyframes drift {
  50% { transform: translate(20px, 10px); }
}

/* game over modal */
.modal-bd {
  position: fixed; inset: 0; z-index: 80;
  background: rgba(0,0,0,0.7);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.modal {
  width: min(480px, 96vw);
  background: var(--bg-2);
  border: 1px solid var(--magenta);
  box-shadow: 0 0 30px rgba(255,0,110,0.4), inset 0 0 16px rgba(255,0,110,0.18);
  padding: 32px;
  text-align: center;
  position: relative;
}
.modal::before {
  content: ""; position: absolute; inset: 4px;
  border: 1px dashed rgba(255,0,110,0.4);
  pointer-events: none;
}
.modal h2 {
  margin: 0 0 18px;
  font-family: var(--pixel);
  color: var(--magenta);
  font-size: 22px;
  text-shadow: 0 0 12px rgba(255,0,110,0.7);
  letter-spacing: 0.12em;
}
.modal .final {
  font-family: var(--pixel);
  font-size: 36px;
  color: var(--yellow);
  text-shadow: 0 0 16px rgba(245,255,0,0.6);
  margin: 16px 0 6px;
}
.modal .final-label { font-family: var(--mono); font-size: 11px; letter-spacing: 0.2em; color: var(--ink-faint); text-transform: uppercase; }
.modal .input-row {
  display: flex; gap: 8px; margin: 22px 0 12px;
}
.modal .input-row input {
  flex: 1;
  height: 44px;
  padding: 0 12px;
  background: var(--bg);
  border: 1px solid var(--line);
  outline: 0;
  font-family: var(--mono);
}
.modal .input-row input:focus { border-color: var(--cyan); box-shadow: 0 0 10px rgba(0,245,255,0.35); }
.modal .actions { display: flex; gap: 10px; justify-content: center; margin-top: 18px; flex-wrap: wrap; }
.toast-saved {
  font-family: var(--pixel);
  font-size: 11px;
  color: var(--green);
  text-shadow: 0 0 8px var(--green);
  margin-top: 14px;
  white-space: nowrap;
  overflow: hidden;
  display: inline-block;
  border-right: 2px solid var(--green);
  animation: typewriter 1.6s steps(22) forwards, caret 0.8s steps(1) infinite;
  width: 0;
}
@keyframes typewriter { to { width: 22ch; } }
@keyframes caret { 50% { border-color: transparent; } }

/* ===== auth ===== */
.av-auth-wrap {
  display: flex; align-items: center; justify-content: center;
  padding: 60px 20px;
}
.auth-card {
  width: min(440px, 100%);
  background: var(--bg-2);
  border: 1px solid var(--line);
  padding: 28px;
  position: relative;
  box-shadow: 0 0 30px rgba(0,245,255,0.18);
}
.auth-card::before {
  content: ""; position: absolute; inset: 4px; pointer-events: none;
  border: 1px dashed rgba(0,245,255,0.18);
}
.auth-header { text-align: center; margin-bottom: 18px; }
.auth-header .mark {
  width: 56px; height: 56px;
  margin: 0 auto 12px;
  background:
    linear-gradient(45deg, var(--magenta) 0 50%, transparent 50%),
    linear-gradient(-45deg, var(--cyan) 0 50%, transparent 50%);
  background-blend-mode: screen;
  box-shadow: 0 0 16px rgba(0,245,255,0.55), inset 0 0 8px rgba(255,0,110,0.5);
  border: 1px solid rgba(255,255,255,0.18);
}
.auth-header h2 { margin: 4px 0 0; font-family: var(--pixel); font-size: 16px; letter-spacing: 0.1em; }
.auth-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 0; margin: 18px 0; border: 1px solid var(--line); }
.auth-tabs button {
  padding: 12px; font-family: var(--pixel); font-size: 9px; letter-spacing: 0.14em;
  background: transparent; border: 0; color: var(--ink-dim); cursor: pointer;
}
.auth-tabs button.on { background: rgba(0,245,255,0.08); color: var(--cyan); text-shadow: 0 0 6px rgba(0,245,255,0.5); }
.field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
.field label { font-family: var(--mono); font-size: 10px; color: var(--ink-faint); text-transform: uppercase; letter-spacing: 0.16em; }
.field input {
  height: 44px;
  background: var(--bg);
  border: 1px solid var(--line);
  padding: 0 12px;
  outline: 0;
  font-family: var(--mono);
  transition: border-color 140ms, box-shadow 140ms;
}
.field input:focus { border-color: var(--cyan); box-shadow: 0 0 12px rgba(0,245,255,0.35); }
.auth-divider {
  display: flex; align-items: center; gap: 12px;
  margin: 16px 0;
  font-family: var(--pixel); font-size: 8px; color: var(--ink-faint); letter-spacing: 0.16em;
}
.auth-divider::before, .auth-divider::after { content: ""; flex: 1; height: 1px; background: var(--line); }
.social { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.social .btn { padding: 12px; font-size: 9px; }

/* ===== salón ===== */
.av-hall {
  max-width: 1200px;
  margin: 32px auto 80px;
  padding: 0 32px;
}
.hall-head { text-align: center; margin-bottom: 28px; }
.hall-head h1 {
  font-family: var(--pixel);
  font-size: clamp(24px, 4.5vw, 44px);
  letter-spacing: 0.08em;
  margin: 0;
  background: linear-gradient(180deg, var(--yellow), var(--magenta));
  -webkit-background-clip: text; background-clip: text; color: transparent;
  filter: drop-shadow(0 0 14px rgba(245,255,0,0.4));
}
.hall-head p { color: var(--ink-dim); margin: 12px 0 0; letter-spacing: 0.1em; }

.hall-tabs { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; margin-bottom: 22px; }
.podium {
  display: grid;
  grid-template-columns: 1fr 1.2fr 1fr;
  gap: 14px;
  margin-bottom: 24px;
  align-items: end;
}
@media (max-width: 720px) { .podium { grid-template-columns: 1fr; } }
.podium-slot {
  position: relative;
  border: 1px solid var(--line);
  background: var(--bg-2);
  padding: 18px 14px 16px;
  text-align: center;
}
.podium-slot.gold { border-color: var(--gold); box-shadow: 0 0 22px rgba(255,207,58,0.35); }
.podium-slot.silver { border-color: var(--silver); }
.podium-slot.bronze { border-color: var(--bronze); }
.podium-slot .rank-num {
  font-family: var(--pixel); font-size: 28px;
  text-shadow: 0 0 12px currentColor;
}
.podium-slot.gold .rank-num { color: var(--gold); }
.podium-slot.silver .rank-num { color: var(--silver); }
.podium-slot.bronze .rank-num { color: var(--bronze); }
.podium-slot .name { font-family: var(--pixel); font-size: 12px; margin-top: 8px; letter-spacing: 0.06em; }
.podium-slot .score { font-family: var(--pixel); font-size: 16px; color: var(--cyan); margin-top: 8px; text-shadow: 0 0 8px rgba(0,245,255,0.5); }
.podium-slot .date { font-family: var(--mono); font-size: 11px; color: var(--ink-faint); margin-top: 6px; letter-spacing: 0.12em; }

.hall-table {
  border: 1px solid var(--line);
  background: var(--bg-2);
}
.hall-table .th, .hall-table .tr {
  display: grid;
  grid-template-columns: 70px 1fr 1fr 140px;
  align-items: center;
  padding: 12px 18px;
  font-family: var(--mono);
  font-size: 13px;
  gap: 10px;
}
.hall-table .th {
  font-family: var(--pixel); font-size: 10px;
  color: var(--ink-faint); letter-spacing: 0.16em;
  border-bottom: 1px solid var(--line);
}
.hall-table .tr { border-bottom: 1px solid var(--line-2); opacity: 0; animation: rise 360ms ease-out forwards; }
.hall-table .tr.you { background: rgba(245,255,0,0.05); border-left: 3px solid var(--yellow); padding-left: 15px; }
.hall-table .tr .rk { font-family: var(--pixel); font-size: 11px; color: var(--ink-dim); }
.hall-table .tr .pl { color: var(--ink); }
.hall-table .tr .sc { font-family: var(--pixel); font-size: 12px; color: var(--cyan); text-shadow: 0 0 6px rgba(0,245,255,0.4); }
.hall-table .tr .dt { color: var(--ink-faint); }
.hall-table .tr.top1 .rk, .hall-table .tr.top1 .sc { color: var(--gold); text-shadow: 0 0 6px rgba(255,207,58,0.6); }
.hall-table .tr.top2 .rk, .hall-table .tr.top2 .sc { color: var(--silver); }
.hall-table .tr.top3 .rk, .hall-table .tr.top3 .sc { color: var(--bronze); }
.hall-table .tr.you-label {
  display: grid; grid-template-columns: 1fr;
  padding: 8px 18px; font-family: var(--pixel); font-size: 9px;
  color: var(--yellow); letter-spacing: 0.16em; background: rgba(245,255,0,0.04);
  border-bottom: 1px solid var(--line-2);
}
@keyframes rise {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 720px) {
  .hall-table .th, .hall-table .tr { grid-template-columns: 50px 1fr 90px 90px; font-size: 12px; padding: 10px 12px; }
  .av-grid { padding: 0 16px; }
  .av-hero { padding: 36px 16px 16px; }
  .av-filters { padding: 0 16px; }
  .av-hall { padding: 0 16px; }
  .av-detail { padding: 0 16px; margin: 24px auto; }
  .av-player { padding: 0 16px 32px; }
}

/* misc */
.divider { height: 1px; background: var(--line); margin: 8px 0; }
.fade-in { animation: fadeIn 240ms ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
.slide-in { animation: slideIn 260ms ease-out; }
@keyframes slideIn { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: none; } }

/* tweaks */
.tw-section { margin-bottom: 14px; }
.tw-label { font-family: var(--pixel); font-size: 9px; color: var(--ink-faint); letter-spacing: 0.14em; margin-bottom: 8px; }

/* spinner */
.spinner {
  display: inline-block;
  width: 16px; height: 16px;
  background: var(--cyan);
  box-shadow: 0 0 8px var(--cyan);
  animation: spinpix 0.6s steps(8) infinite;
  clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
}
@keyframes spinpix { to { transform: rotate(360deg); } }
