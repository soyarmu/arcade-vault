'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/app/context/UserContext';

type View = 'in' | 'up' | 'forgot';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

function AuthForm() {
  const { user } = useUser();
  const [tab, setTab] = useState<'in' | 'up'>('in');
  const [view, setView] = useState<View>('in');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackError = searchParams.get('error') === 'callback';

  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  function switchTab(t: 'in' | 'up') {
    setTab(t);
    setView(t);
    setError(null);
    setMessage(null);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push('/');
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!PASSWORD_REGEX.test(pass)) {
      setError(
        'La contraseña debe tener mínimo 8 caracteres e incluir mayúsculas, minúsculas, números y símbolos.',
      );
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: { username: username.trim().toUpperCase().slice(0, 10) },
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMessage('Revisa tu correo para confirmar tu cuenta.');
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMessage('Te hemos enviado un enlace de recuperación.');
  }

  async function handleOAuth(provider: 'google' | 'github') {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });
  }

  return (
    <div className="av-auth-wrap fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <div className="mark" />
          <h2 className="neon-cyan">ARCADE VAULT</h2>
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: 'var(--ink-faint)',
              letterSpacing: '0.16em',
              marginTop: 6,
            }}
          >
            ACCESO AL SISTEMA · v2.6
          </div>
        </div>

        {callbackError && (
          <div
            style={{
              color: 'var(--neon-red, #ff4444)',
              fontSize: 12,
              marginBottom: 12,
              textAlign: 'center',
            }}
          >
            El enlace de acceso ha expirado o es inválido. Inténtalo de nuevo.
          </div>
        )}

        {view === 'forgot' ? (
          <>
            <div
              style={{
                marginBottom: 16,
                fontSize: 12,
                color: 'var(--ink-faint)',
                letterSpacing: '0.1em',
              }}
            >
              RECUPERAR CONTRASEÑA
            </div>
            <form onSubmit={handleForgot}>
              <div className="field">
                <label>Correo electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jugador@vault.gg"
                  required
                />
              </div>
              {error && (
                <div
                  style={{
                    color: 'var(--neon-red, #ff4444)',
                    fontSize: 12,
                    marginBottom: 8,
                  }}
                >
                  {error}
                </div>
              )}
              {message && (
                <div
                  style={{
                    color: 'var(--neon-cyan)',
                    fontSize: 12,
                    marginBottom: 8,
                  }}
                >
                  {message}
                </div>
              )}
              <button
                className="btn lg"
                type="submit"
                disabled={loading}
                style={{ width: '100%', marginTop: 8 }}
              >
                {loading ? 'ENVIANDO...' : 'ENVIAR ENLACE'}
              </button>
            </form>
            <button
              className="btn ghost"
              style={{ width: '100%', marginTop: 10 }}
              onClick={() => {
                setView('in');
                setError(null);
                setMessage(null);
              }}
            >
              VOLVER AL LOGIN
            </button>
          </>
        ) : (
          <>
            <div className="auth-tabs">
              <button
                className={tab === 'in' ? 'on' : ''}
                onClick={() => switchTab('in')}
              >
                INICIAR SESIÓN
              </button>
              <button
                className={tab === 'up' ? 'on' : ''}
                onClick={() => switchTab('up')}
              >
                CREAR CUENTA
              </button>
            </div>

            {message ? (
              <div
                style={{
                  padding: '24px 0',
                  textAlign: 'center',
                  color: 'var(--neon-cyan)',
                  fontSize: 13,
                  letterSpacing: '0.08em',
                }}
              >
                {message}
              </div>
            ) : (
              <form onSubmit={tab === 'in' ? handleLogin : handleSignUp}>
                {tab === 'up' && (
                  <div className="field slide-in">
                    <label>Usuario</label>
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="px_kai"
                      required
                    />
                  </div>
                )}
                <div className="field">
                  <label>Correo electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jugador@vault.gg"
                    required
                  />
                </div>
                <div className="field">
                  <label>Contraseña</label>
                  <input
                    type="password"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete={
                      tab === 'in' ? 'current-password' : 'new-password'
                    }
                  />
                </div>
                {error && (
                  <div
                    style={{
                      color: 'var(--neon-red, #ff4444)',
                      fontSize: 12,
                      marginBottom: 8,
                    }}
                  >
                    {error}
                  </div>
                )}
                <button
                  className="btn lg"
                  type="submit"
                  disabled={loading}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  {loading
                    ? 'CARGANDO...'
                    : tab === 'in'
                      ? 'ENTRAR AL VAULT'
                      : 'CREAR Y JUGAR'}
                </button>
                {tab === 'in' && (
                  <button
                    type="button"
                    className="btn ghost"
                    style={{ width: '100%', marginTop: 8, fontSize: 11 }}
                    onClick={() => {
                      setView('forgot');
                      setError(null);
                      setMessage(null);
                    }}
                  >
                    OLVIDÉ MI CONTRASEÑA
                  </button>
                )}
              </form>
            )}

            <div className="auth-divider">O CONTINÚA CON</div>
            <div className="social">
              <button
                className="btn ghost"
                type="button"
                onClick={() => handleOAuth('google')}
              >
                ◆ GOOGLE
              </button>
              <button
                className="btn ghost"
                type="button"
                onClick={() => handleOAuth('github')}
              >
                ▣ GITHUB
              </button>
            </div>
          </>
        )}

        <div
          style={{
            marginTop: 18,
            textAlign: 'center',
            fontSize: 11,
            color: 'var(--ink-faint)',
            letterSpacing: '0.1em',
          }}
        >
          AL ENTRAR ACEPTAS LOS TÉRMINOS DEL SALÓN ARCADE
        </div>
      </div>
    </div>
  );
}

export default function Auth() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}
