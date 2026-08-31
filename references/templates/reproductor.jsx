// ===== reproductor.jsx =====
const { useState: useStateP, useEffect: useEffectP } = React;

function GamePlayer({ id, user, navigate, onSaveScore }) {
  const game = GAMES.find(g => g.id === id);
  const [score, setScore] = useStateP(0);
  const [lives, setLives] = useStateP(3);
  const [level, setLevel] = useStateP(1);
  const [paused, setPaused] = useStateP(false);
  const [over, setOver] = useStateP(false);
  const [name, setName] = useStateP(user ? user.name : "INVITADO");
  const [saved, setSaved] = useStateP(false);

  useEffectP(() => {
    if (over || paused) return;
    const t = setInterval(() => setScore(s => s + Math.floor(10 + Math.random() * 90)), 220);
    return () => clearInterval(t);
  }, [over, paused]);

  useEffectP(() => {
    if (score > 0 && score % 2500 < 100) setLevel(l => l + 1);
  }, [score]);

  const endGame = () => setOver(true);
  const restart = () => { setScore(0); setLives(3); setLevel(1); setPaused(false); setOver(false); setSaved(false); };

  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div className="hud-stat"><div className="l">Jugador</div><div className="v" style={{ color: "var(--ink)" }}>{name}</div></div>
          <div className="hud-stat"><div className="l">Puntuación</div><div className="v">{score.toLocaleString("es-ES")}</div></div>
          <div className="hud-stat lives"><div className="l">Vidas</div><div className="v">{"♥ ".repeat(lives).trim() || "—"}</div></div>
          <div className="hud-stat level"><div className="l">Nivel</div><div className="v">{String(level).padStart(2, "0")}</div></div>
        </div>
        <div className="hud-actions">
          <button className="btn yellow" onClick={() => setPaused(p => !p)}>{paused ? "REANUDAR" : "PAUSA"}</button>
          <button className="btn magenta" onClick={endGame}>FIN</button>
          <button className="btn ghost" onClick={() => navigate({ name: "detalle", id: game.id })}>SALIR</button>
        </div>
      </div>

      <div className="crt">
        <div className="crt-screen">
          <div className="game-arena">
            <div className="grid-floor"></div>
            <div className="enemy e1"></div>
            <div className="enemy e2"></div>
            <div className="enemy e3"></div>
            <div className="player-ship"></div>
          </div>
          {paused && (
            <div className="crt-content" style={{ background: "rgba(0,0,0,0.6)", zIndex: 5 }}>
              <div>
                <div className="pixel neon-yellow" style={{ fontSize: 22 }}>EN PAUSA</div>
                <div className="mono" style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 10, letterSpacing: "0.16em" }}>PULSA REANUDAR PARA CONTINUAR</div>
              </div>
            </div>
          )}
        </div>
        <div className="crt-bottom">
          <span className="led">SEÑAL OK</span>
          <span>{game.title} · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>

      {over && (
        <div className="modal-bd" onClick={() => {}}>
          <div className="modal">
            <h2>FIN DEL JUEGO</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{score.toLocaleString("es-ES")}</div>
            {!saved ? (
              <React.Fragment>
                <div className="input-row">
                  <input value={name} onChange={(e) => setName(e.target.value.toUpperCase().slice(0, 10))} placeholder="TUS INICIALES" />
                  <button className="btn yellow" onClick={() => { onSaveScore && onSaveScore({ game: game.id, score, name }); setSaved(true); }}>GUARDAR PUNTUACIÓN</button>
                </div>
              </React.Fragment>
            ) : (
              <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
            )}
            <div className="actions">
              <button className="btn" onClick={restart}>JUGAR DE NUEVO</button>
              <button className="btn magenta" onClick={() => navigate({ name: "biblioteca" })}>VOLVER AL VAULT</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.GamePlayer = GamePlayer;
