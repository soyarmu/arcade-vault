import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { GameRow, ScoreRow } from '@/lib/supabase/types';

export default async function GameDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: game }, { data: scores }] = await Promise.all([
    supabase.from('games').select('*').eq('id', id).single(),
    supabase
      .from('scores')
      .select('*')
      .eq('game_id', id)
      .order('score', { ascending: false })
      .limit(10),
  ]);

  if (!game) notFound();

  const typedGame = game as GameRow;
  const typedScores = (scores ?? []) as ScoreRow[];
  const best = typedScores[0]?.score ?? 0;

  function formatDate(iso: string) {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  return (
    <div className="av-detail fade-in">
      <div>
        <div className="detail-cover">
          <div className={`cover-bg ${typedGame.cover}`} />
        </div>
        <div style={{ marginTop: 20 }} className="detail-info">
          <div className="detail-tags">
            <span>{typedGame.cat}</span>
            <span>1 JUGADOR</span>
            <span>TECLADO / TÁCTIL</span>
            <span>RETRO 1985</span>
          </div>
          <h2 className="neon-cyan">{typedGame.title}</h2>
          <p>{typedGame.long}</p>
          <div className="stat-strip">
            <div>
              <div className="l">Partidas</div>
              <div className="v">
                {typedScores.length > 0 ? typedScores.length : '-'}
              </div>
            </div>
            <div>
              <div className="l">Mejor global</div>
              <div
                className="v"
                style={{
                  color: 'var(--magenta)',
                  textShadow: '0 0 6px rgba(255,0,110,0.5)',
                }}
              >
                {best > 0 ? best.toLocaleString('es-ES') : '-'}
              </div>
            </div>
            <div>
              <div className="l">Dificultad</div>
              <div
                className="v"
                style={{
                  color: 'var(--yellow)',
                  textShadow: '0 0 6px rgba(245,255,0,0.5)',
                }}
              >
                ★ ★ ★ ☆ ☆
              </div>
            </div>
          </div>
          <div className="detail-actions">
            <Link href={`/games/${id}/play`} className="btn xl pulse">
              ▶ JUGAR AHORA
            </Link>
            <Link href="/games" className="btn ghost lg">
              VOLVER AL VAULT
            </Link>
          </div>
        </div>
      </div>

      <aside>
        <div className="leaderboard">
          <h3>MEJORES PUNTUACIONES</h3>
          {typedScores.length === 0 ? (
            <div
              style={{
                padding: '40px 0',
                textAlign: 'center',
                color: 'var(--ink-faint)',
              }}
            >
              <div
                className="pixel"
                style={{ fontSize: 12, color: 'var(--cyan)', marginBottom: 8 }}
              >
                SIN REGISTROS
              </div>
              <div style={{ fontSize: 13 }}>
                Sé el primero en entrar al salón de la fama
              </div>
            </div>
          ) : (
            typedScores.map((r, i) => (
              <div
                key={r.id}
                className={`lb-row${i === 0 ? ' top1' : i === 1 ? ' top2' : i === 2 ? ' top3' : ''}`}
              >
                <div className="rk">#{String(i + 1).padStart(2, '0')}</div>
                <div className="pl">
                  {r.player_name}
                  <div
                    style={{
                      fontSize: 10,
                      color: 'var(--ink-faint)',
                      letterSpacing: '0.1em',
                    }}
                  >
                    {formatDate(r.created_at)}
                  </div>
                </div>
                <div className="sc">{r.score.toLocaleString('es-ES')}</div>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
