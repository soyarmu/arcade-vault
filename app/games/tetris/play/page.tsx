'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState, useCallback, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/app/context/UserContext';
import MobileGamepad from '@/components/MobileGamepad';

const TetrisGame = dynamic(() => import('@/components/games/TetrisGame'), {
  ssr: false,
});

const SKIN_OPTIONS = [
  { key: 'retro', label: 'Retro' },
  { key: 'neon', label: 'Neon' },
  { key: 'pastel', label: 'Pastel' },
  { key: 'pixel', label: 'Pixel Art' },
];

function getSavedSkin() {
  if (typeof window === 'undefined') return 'retro';
  return localStorage.getItem('tetris-skin') ?? 'retro';
}

export default function TetrisPlay() {
  const { user, username } = useUser();
  const scoreRef = useRef(0);
  const livesRef = useRef(1);
  const levelRef = useRef(1);
  const scoreEl = useRef<HTMLSpanElement>(null);
  const livesEl = useRef<HTMLSpanElement>(null);
  const levelEl = useRef<HTMLSpanElement>(null);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [name, setName] = useState('INVITADO');
  const [saved, setSaved] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const [skinKey, setSkinKey] = useState('retro');

  useEffect(() => {
    setSkinKey(getSavedSkin());
  }, []);

  const handleScoreChange = useCallback((s: number) => {
    scoreRef.current = s;
    if (scoreEl.current)
      scoreEl.current.textContent = s.toLocaleString('es-ES');
  }, []);
  const handleLivesChange = useCallback((l: number) => {
    livesRef.current = l;
    if (livesEl.current) livesEl.current.textContent = l > 0 ? '♥' : '—';
  }, []);
  const handleLevelChange = useCallback((l: number) => {
    levelRef.current = l;
    if (levelEl.current)
      levelEl.current.textContent = String(l).padStart(2, '0');
  }, []);
  const handleGameOver = useCallback((finalScore: number) => {
    scoreRef.current = finalScore;
    if (scoreEl.current)
      scoreEl.current.textContent = finalScore.toLocaleString('es-ES');
    setOver(true);
  }, []);

  useEffect(() => {
    if (over) {
      if (username) {
        setName(username);
        return;
      }
      const saved = localStorage.getItem('av_player_name');
      if (saved) setName(saved);
    }
  }, [over, username]);

  function changeSkin(key: string) {
    setSkinKey(key);
    localStorage.setItem('tetris-skin', key);
  }

  function restart() {
    scoreRef.current = 0;
    livesRef.current = 1;
    levelRef.current = 1;
    if (scoreEl.current) scoreEl.current.textContent = '0';
    if (livesEl.current) livesEl.current.textContent = '♥';
    if (levelEl.current) levelEl.current.textContent = '01';
    setPaused(false);
    setOver(false);
    setSaved(false);
    setName(username ?? 'INVITADO');
    setGameKey((k) => k + 1);
  }

  const keyMap = {
    up: 'ArrowUp',
    down: 'ArrowDown',
    left: 'ArrowLeft',
    right: 'ArrowRight',
    a: 'ArrowUp',
    b: 'Shift',
  };

  return (
    <div className="av-player fade-in">
      <div className="hidden md:block">
        <div className="player-hud">
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div className="hud-stat">
              <div className="l">Jugador</div>
              <div className="v" style={{ color: 'var(--ink)' }}>
                {name}
              </div>
            </div>
            <div className="hud-stat">
              <div className="l">Puntuación</div>
              <div className="v">
                <span ref={scoreEl}>0</span>
              </div>
            </div>
            <div className="hud-stat lives">
              <div className="l">Vidas</div>
              <div className="v">
                <span ref={livesEl}>♥</span>
              </div>
            </div>
            <div className="hud-stat level">
              <div className="l">Nivel</div>
              <div className="v">
                <span ref={levelEl}>01</span>
              </div>
            </div>
            <div className="hud-stat">
              <div className="l">Skin</div>
              <div className="v">
                <select
                  value={skinKey}
                  onChange={(e) => changeSkin(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--ink-dim)',
                    color: 'var(--ink)',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    cursor: 'pointer',
                    padding: '2px 4px',
                  }}
                >
                  {SKIN_OPTIONS.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="hud-actions">
            <button className="btn yellow" onClick={() => setPaused((p) => !p)}>
              {paused ? 'REANUDAR' : 'PAUSA'}
            </button>
            <button className="btn magenta" onClick={() => setOver(true)}>
              FIN
            </button>
            <Link href="/games/tetris" className="btn ghost">
              SALIR
            </Link>
          </div>
        </div>
      </div>

      <div className="crt w-full max-w-[800px] mx-auto">
        <div className="crt-screen" style={{ aspectRatio: 'auto' }}>
          <div className="tetris-game-wrapper">
            <TetrisGame
              key={gameKey}
              paused={paused}
              skinKey={skinKey}
              onScoreChange={handleScoreChange}
              onLivesChange={handleLivesChange}
              onLevelChange={handleLevelChange}
              onGameOver={handleGameOver}
            />
          </div>
          {paused && (
            <div
              className="crt-content"
              style={{ background: 'rgba(0,0,0,0.6)', zIndex: 5 }}
            >
              <div>
                <div className="pixel neon-yellow" style={{ fontSize: 22 }}>
                  EN PAUSA
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: 'var(--ink-dim)',
                    marginTop: 10,
                    letterSpacing: '0.16em',
                  }}
                >
                  PULSA REANUDAR PARA CONTINUAR
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="crt-bottom">
          <span className="led">SEÑAL OK</span>
          <span>TETRIS · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>

      <MobileGamepad
        keyMap={keyMap}
        paused={paused}
        onPauseToggle={() => setPaused((p) => !p)}
        skin={skinKey}
        onSkinChange={changeSkin}
        backHref="/games/tetris"
      />

      {over && (
        <div className="modal-bd">
          <div className="modal">
            <h2>FIN DEL JUEGO</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">
              {scoreRef.current.toLocaleString('es-ES')}
            </div>
            {!saved ? (
              <div className="input-row">
                <input
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value.toUpperCase().slice(0, 10))
                  }
                  placeholder="TUS INICIALES"
                />
                <button
                  className="btn yellow"
                  onClick={async () => {
                    setSaved(true);
                    localStorage.setItem('av_player_name', name);
                    const supabase = createClient();
                    await supabase.from('scores').insert({
                      game_id: 'tetris',
                      player_name: name,
                      score: scoreRef.current,
                      user_id: user?.id ?? null,
                    });
                  }}
                >
                  GUARDAR PUNTUACIÓN
                </button>
              </div>
            ) : (
              <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
            )}
            <div className="actions">
              <button className="btn" onClick={restart}>
                JUGAR DE NUEVO
              </button>
              <Link href="/games/tetris#leaderboard" className="btn cyan">
                VER LEADERBOARD
              </Link>
              <Link href="/games" className="btn magenta">
                VOLVER AL VAULT
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
