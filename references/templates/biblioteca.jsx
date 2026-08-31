// ===== biblioteca.jsx =====
const { useState: useStateB, useMemo: useMemoB } = React;

function GameCard({ game, onSelect }) {
  const tiltRef = React.useRef(null);
  const onMove = (e) => {
    const el = tiltRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `translateY(-6px) rotateX(${-py * 6}deg) rotateY(${px * 8}deg)`;
  };
  const onLeave = () => {
    const el = tiltRef.current; if (!el) return;
    el.style.transform = "";
  };
  return (
    <div
      ref={tiltRef}
      className="card"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={() => onSelect(game)}
    >
      <div className="cover">
        <div className={"cover-bg " + game.cover}></div>
        <div className="label">{game.cat}</div>
      </div>
      <div className="meta">
        <div className="title">{game.title}</div>
        <div className="desc">{game.short}</div>
        <div className="row">
          <div className="score-badge">
            <span>MEJOR PUNTUACIÓN</span>
            <b>{game.best.toLocaleString("es-ES")}</b>
          </div>
          <button className={"btn " + (game.color === "magenta" ? "magenta" : game.color === "yellow" ? "yellow" : "")}
            onClick={(e) => { e.stopPropagation(); onSelect(game); }}>JUGAR</button>
        </div>
      </div>
    </div>
  );
}

function Library({ navigate }) {
  const [q, setQ] = useStateB("");
  const [cat, setCat] = useStateB("TODOS");

  const filtered = useMemoB(() => {
    return GAMES.filter(g => (cat === "TODOS" || g.cat === cat) && g.title.toLowerCase().includes(q.toLowerCase()));
  }, [q, cat]);

  return (
    <div className="fade-in">
      <section className="av-hero">
        <h1 className="flicker">ARCADE VAULT</h1>
        <div className="sub">INSERTA UNA MONEDA PARA JUGAR <span className="blink">_</span></div>
      </section>

      <div className="av-filters">
        <div className="av-search">
          <span className="ico">⌕</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar un juego por nombre…"
          />
        </div>
        <div className="av-chips">
          {CATS.map(c => (
            <button key={c} className={"chip" + (cat === c ? " active" : "")} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
      </div>

      <div className="av-grid">
        {filtered.map(g => (
          <GameCard key={g.id} game={g} onSelect={(game) => navigate({ name: "detalle", id: game.id })} />
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 80, color: "var(--ink-faint)" }}>
            <div className="pixel" style={{ fontSize: 14, color: "var(--magenta)", marginBottom: 12 }}>NO HAY RESULTADOS</div>
            <div>Intenta otra búsqueda o categoría.</div>
          </div>
        )}
      </div>
    </div>
  );
}

window.Library = Library;
