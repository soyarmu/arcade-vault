'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { GameRow, ScoreRow } from '@/lib/supabase/types';

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function EmptyState() {
  return (
    <div
      style={{
        padding: '60px 0',
        textAlign: 'center',
        color: 'var(--ink-faint)',
      }}
    >
      <div
        className="pixel"
        style={{ fontSize: 12, color: 'var(--cyan)', marginBottom: 10 }}
      >
        SIN REGISTROS
      </div>
      <div style={{ fontSize: 14 }}>
        Sé el primero en entrar al salón de la fama
      </div>
    </div>
  );
}

export default function HallOfFameClient({
  games,
  initialScores,
  initialTab,
}: {
  games: GameRow[];
  initialScores: ScoreRow[];
  initialTab: string;
}) {
  const [tab, setTab] = useState(initialTab);
  const [scores, setScores] = useState(initialScores);
  const [isPending, startTransition] = useTransition();

  async function changeTab(gameId: string) {
    setTab(gameId);
    startTransition(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('scores')
        .select('*')
        .eq('game_id', gameId)
        .order('score', { ascending: false })
        .limit(12);
      setScores((data as ScoreRow[]) ?? []);
    });
  }

  return (
    <div className="av-hall fade-in">
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p className="pixel" style={{ fontSize: 10 }}>
          LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA
        </p>
      </div>

      <div className="hall-tabs">
        {games.map((g) => (
          <button
            key={g.id}
            className={`chip${tab === g.id ? ' active' : ''}`}
            onClick={() => changeTab(g.id)}
          >
            {g.title}
          </button>
        ))}
      </div>

      {isPending ? (
        <div
          style={{
            padding: '80px 0',
            textAlign: 'center',
            color: 'var(--ink-faint)',
          }}
        >
          <div
            className="pixel"
            style={{ fontSize: 12, letterSpacing: '0.2em' }}
          >
            CARGANDO<span className="blink">_</span>
          </div>
        </div>
      ) : scores.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {scores.length >= 3 && (
            <div className="podium">
              <div className="podium-slot silver">
                <div className="rank-num">02</div>
                <div className="name">{scores[1].player_name}</div>
                <div className="score">
                  {scores[1].score.toLocaleString('es-ES')}
                </div>
                <div className="date">{formatDate(scores[1].created_at)}</div>
              </div>
              <div className="podium-slot gold">
                <div
                  className="pixel"
                  style={{
                    fontSize: 9,
                    color: 'var(--gold)',
                    letterSpacing: '0.18em',
                  }}
                >
                  CAMPEÓN
                </div>
                <div
                  className="rank-num"
                  style={{ fontSize: 36, marginTop: 4 }}
                >
                  01
                </div>
                <div className="name">{scores[0].player_name}</div>
                <div className="score" style={{ fontSize: 20 }}>
                  {scores[0].score.toLocaleString('es-ES')}
                </div>
                <div className="date">{formatDate(scores[0].created_at)}</div>
              </div>
              <div className="podium-slot bronze">
                <div className="rank-num">03</div>
                <div className="name">{scores[2].player_name}</div>
                <div className="score">
                  {scores[2].score.toLocaleString('es-ES')}
                </div>
                <div className="date">{formatDate(scores[2].created_at)}</div>
              </div>
            </div>
          )}

          <div className="hall-table">
            <div className="th">
              <div>RANGO</div>
              <div>JUGADOR</div>
              <div>PUNTUACIÓN</div>
              <div>FECHA</div>
            </div>
            {scores.map((r, i) => (
              <div
                key={r.id}
                className={`tr${i === 0 ? ' top1' : i === 1 ? ' top2' : i === 2 ? ' top3' : ''}`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="rk">#{String(i + 1).padStart(2, '0')}</div>
                <div className="pl">{r.player_name}</div>
                <div className="sc">{r.score.toLocaleString('es-ES')}</div>
                <div className="dt">{formatDate(r.created_at)}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <Link href="/games" className="btn lg">
          VOLVER A LA BIBLIOTECA
        </Link>
      </div>
    </div>
  );
}
