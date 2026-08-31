<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Arcade Vault — Gamepad MK-II</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<style>
:root {
  --bg: #0a0a0f;
  --ink: #e6e9ff;
  --ink-dim: #8a8fb5;
  --ink-faint: #4a4f70;
  --cyan: #00f5ff;
  --magenta: #ff006e;
  --line: rgba(0, 245, 255, 0.18);
  --pixel: "Press Start 2P", system-ui, monospace;
  --mono: "JetBrains Mono", "Courier New", monospace;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; min-height: 100%; background: var(--bg); color: var(--ink); font-family: var(--mono); }

.page {
  min-height: 100vh;
  padding: 48px 24px 64px;
  display: flex; align-items: center; justify-content: center;
  background:
    radial-gradient(120% 80% at 50% 0%, rgba(255, 0, 110, 0.08), transparent 60%),
    radial-gradient(120% 80% at 50% 100%, rgba(0, 245, 255, 0.10), transparent 60%),
    var(--bg);
}

/* ===== Gamepad ===== */
.gp {
  position: relative;
  width: 100%;
  max-width: 760px;
  padding: 16px 22px 14px;
  background: linear-gradient(180deg, #1c1c28 0%, #0c0c14 100%);
  border: 1px solid var(--line);
  border-radius: 22px;
  box-shadow:
    0 30px 80px -30px rgba(0, 245, 255, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.02),
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    inset 0 -2px 0 rgba(0, 0, 0, 0.6);
}
.gp::before {
  content: ""; position: absolute; inset: 4px;
  border: 1px solid rgba(0, 245, 255, 0.14);
  border-radius: 18px; pointer-events: none;
}
.gp::after {
  content: ""; position: absolute; inset: 0;
  background-image: radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 8px 8px;
  border-radius: inherit; pointer-events: none; opacity: 0.6;
}

.gp-body {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 18px; align-items: center;
  padding: 24px 12px;
  position: relative; z-index: 1;
}
.gp-col { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.gp-col-right { justify-self: end; }
.gp-col-left { justify-self: start; }

/* D-PAD */
.gp-dpad { position: relative; width: 156px; height: 156px; }
.dp {
  position: absolute;
  width: 50px; height: 50px;
  background: linear-gradient(180deg, #1a1a25, #0a0a12);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  color: var(--ink-dim); cursor: pointer;
  display: flex; align-items: center; justify-content: center; padding: 0;
  box-shadow:
    0 4px 0 #050507,
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    inset 0 -2px 4px rgba(0, 0, 0, 0.6);
  transition: transform 80ms, box-shadow 140ms, color 140ms, border-color 140ms, background 140ms;
}
.dp .dp-arrow { width: 22px; height: 22px; transition: filter 140ms; }
.dp:hover { color: var(--cyan); border-color: rgba(0, 245, 255, 0.35); }
.dp.on, .dp:active {
  transform: translateY(3px);
  color: var(--cyan);
  background: linear-gradient(180deg, #08161e, #030a0e);
  border-color: var(--cyan);
  box-shadow:
    0 1px 0 #050507,
    inset 0 0 16px rgba(0, 245, 255, 0.45),
    0 0 16px rgba(0, 245, 255, 0.5);
}
.dp.on .dp-arrow, .dp:active .dp-arrow {
  filter: drop-shadow(0 0 6px var(--cyan)) drop-shadow(0 0 12px var(--cyan));
}
.dp-up    { top: 0;    left: 53px; }
.dp-down  { bottom: 0; left: 53px; }
.dp-left  { left: 0;   top: 53px; }
.dp-right { right: 0;  top: 53px; }

.dp-hub {
  position: absolute; top: 53px; left: 53px;
  width: 50px; height: 50px;
  background: radial-gradient(circle at 50% 50%, #181822 0%, #08080d 80%);
  border: 1px solid rgba(0, 245, 255, 0.15);
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: inset 0 0 12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.04);
}
.dp-hub-gem {
  width: 12px; height: 12px;
  background: var(--cyan);
  box-shadow: 0 0 10px var(--cyan), inset 0 0 4px rgba(0, 0, 0, 0.5);
  clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
  animation: pulse-led 2s ease-in-out infinite;
}
@keyframes pulse-led { 50% { opacity: 0.35; transform: scale(0.85); } }

/* A/B */
.gp-actions {
  position: relative; display: grid;
  grid-template-columns: auto auto; gap: 22px;
  justify-items: center; align-items: center;
}
.ab {
  position: relative;
  width: 74px; height: 74px;
  border-radius: 50%;
  border: 2px solid currentColor;
  background:
    radial-gradient(circle at 32% 26%, rgba(255, 255, 255, 0.25), transparent 50%),
    radial-gradient(circle at 50% 55%, var(--ab-mid), var(--ab-deep) 75%);
  padding: 0; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow:
    0 6px 0 #050507,
    0 0 22px var(--ab-glow),
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    inset 0 -4px 8px rgba(0, 0, 0, 0.4);
  transition: transform 80ms, box-shadow 140ms;
}
.ab.a { color: var(--magenta); --ab-mid: rgba(255, 0, 110, 0.7); --ab-deep: rgba(110, 0, 40, 0.95); --ab-glow: rgba(255, 0, 110, 0.4); }
.ab.b { color: var(--cyan);    --ab-mid: rgba(0, 200, 230, 0.7); --ab-deep: rgba(0, 50, 70, 0.95); --ab-glow: rgba(0, 245, 255, 0.4); }
.ab .ab-letter {
  font-family: var(--pixel); font-size: 22px;
  color: #fff; letter-spacing: 0.02em;
  text-shadow: 0 0 8px currentColor, 0 0 18px currentColor, 0 1px 0 rgba(0, 0, 0, 0.6);
  position: relative; z-index: 2;
}
.ab.a .ab-letter { text-shadow: 0 0 8px var(--magenta), 0 0 18px var(--magenta), 0 1px 0 rgba(0, 0, 0, 0.6); }
.ab.b .ab-letter { text-shadow: 0 0 8px var(--cyan),    0 0 18px var(--cyan),    0 1px 0 rgba(0, 0, 0, 0.6); }
.ab .ab-ring {
  position: absolute; inset: -8px;
  border-radius: 50%;
  border: 1px dashed currentColor;
  opacity: 0; transition: opacity 140ms, transform 200ms;
}
.ab:hover .ab-ring { opacity: 0.45; }
.ab.on, .ab:active {
  transform: translateY(4px) scale(0.97);
  box-shadow: 0 1px 0 #050507, 0 0 36px var(--ab-glow), inset 0 0 18px rgba(0, 0, 0, 0.5);
}
.ab.on .ab-ring, .ab:active .ab-ring { opacity: 1; transform: scale(1.08); }

/* Mobile */
@media (max-width: 620px) {
  .gp { padding: 12px 14px 10px; border-radius: 16px; }
  .gp-body { gap: 14px; padding: 18px 6px; }
  .gp-dpad { width: 144px; height: 144px; }
  .dp { width: 46px; height: 46px; border-radius: 8px; }
  .dp-up { left: 49px; } .dp-down { left: 49px; } .dp-left { top: 49px; } .dp-right { top: 49px; }
  .dp-hub { top: 49px; left: 49px; width: 46px; height: 46px; }
  .ab { width: 64px; height: 64px; }
  .gp-actions { gap: 16px; }
}
</style>
</head>
<body>
<div class="page">
  <div class="gp" id="gamepad" role="group" aria-label="Gamepad">
    <div class="gp-body">
      <div class="gp-col gp-col-left">
        <div class="gp-dpad" aria-label="D-pad">
          <button class="dp dp-up"    aria-label="up"    data-key="up"><svg class="dp-arrow" viewBox="0 0 24 24"><path d="M12 4 L20 16 L4 16 Z" fill="currentColor"/></svg></button>
          <button class="dp dp-right" aria-label="right" data-key="right"><svg class="dp-arrow" viewBox="0 0 24 24"><path d="M8 4 L20 12 L8 20 Z" fill="currentColor"/></svg></button>
          <button class="dp dp-down"  aria-label="down"  data-key="down"><svg class="dp-arrow" viewBox="0 0 24 24"><path d="M4 8 L20 8 L12 20 Z" fill="currentColor"/></svg></button>
          <button class="dp dp-left"  aria-label="left"  data-key="left"><svg class="dp-arrow" viewBox="0 0 24 24"><path d="M16 4 L16 20 L4 12 Z" fill="currentColor"/></svg></button>
          <div class="dp-hub" aria-hidden="true"><span class="dp-hub-gem"></span></div>
        </div>
      </div>
      <div class="gp-col gp-col-right">
        <div class="gp-actions">
          <button class="ab b" aria-label="B" data-key="btnB"><span class="ab-ring"></span><span class="ab-letter">B</span></button>
          <button class="ab a" aria-label="A" data-key="btnA"><span class="ab-ring"></span><span class="ab-letter">A</span></button>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
(function () {
  var keyMap = {
    ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
    w: "up", s: "down", a: "left", d: "right",
    z: "btnA", x: "btnB", j: "btnA", k: "btnB"
  };
  function btn(key) { return document.querySelector('[data-key="' + key + '"]'); }
  document.addEventListener("keydown", function (e) {
    var k = keyMap[e.key]; if (!k || e.repeat) return;
    var el = btn(k); if (el) el.classList.add("on");
  });
  document.addEventListener("keyup", function (e) {
    var k = keyMap[e.key]; if (!k) return;
    var el = btn(k); if (el) el.classList.remove("on");
  });
  document.querySelectorAll("[data-key]").forEach(function (b) {
    b.addEventListener("pointerdown", function (e) {
      try { b.setPointerCapture(e.pointerId); } catch (err) {}
      b.classList.add("on");
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach(function (ev) {
      b.addEventListener(ev, function () { b.classList.remove("on"); });
    });
  });
})();
</script>
</body>
</html>
