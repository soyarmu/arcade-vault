'use client';

import { useEffect, useState } from 'react';

type FormState = { name: string; email: string; msg: string };
type Status = 'idle' | 'sending' | 'success' | 'error';

const HeartSVG = (
  <svg
    className="hl-icon"
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g fill="currentColor">
      <rect x="2" y="3" width="4" height="2" />
      <rect x="10" y="3" width="4" height="2" />
      <rect x="1" y="4" width="2" height="4" />
      <rect x="13" y="4" width="2" height="4" />
      <rect x="2" y="8" width="2" height="2" />
      <rect x="12" y="8" width="2" height="2" />
      <rect x="3" y="9" width="10" height="2" />
      <rect x="4" y="11" width="8" height="2" />
      <rect x="5" y="12" width="6" height="2" />
      <rect x="6" y="13" width="4" height="1" />
      <rect x="7" y="14" width="2" height="1" />
    </g>
  </svg>
);

const BrowserSVG = (
  <svg
    className="hl-icon"
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g fill="currentColor">
      <rect
        x="1"
        y="2"
        width="14"
        height="12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <rect x="1" y="2" width="14" height="3" />
      <rect x="3" y="3" width="1" height="1" fill="#0a0a0f" />
      <rect x="5" y="3" width="1" height="1" fill="#0a0a0f" />
      <rect x="7" y="3" width="1" height="1" fill="#0a0a0f" />
      <rect x="3" y="7" width="4" height="1" />
      <rect x="3" y="9" width="6" height="1" />
      <rect x="3" y="11" width="3" height="1" />
    </g>
  </svg>
);

const PlantSVG = (
  <svg
    className="hl-icon"
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g fill="currentColor">
      <rect x="7" y="2" width="2" height="10" />
      <rect x="4" y="4" width="3" height="2" />
      <rect x="9" y="6" width="3" height="2" />
      <rect x="3" y="3" width="2" height="2" />
      <rect x="11" y="5" width="2" height="2" />
      <rect x="3" y="12" width="10" height="2" />
      <rect x="4" y="14" width="8" height="1" />
    </g>
  </svg>
);

const DIVIDER_COUNT = 24;

function TerminalSuccess({
  name,
  onReset,
}: {
  name: string;
  onReset: () => void;
}) {
  return (
    <div className="terminal-success">
      <div className="term-bar">
        <span className="dot r" />
        <span className="dot y" />
        <span className="dot g" />
        <span className="term-title">VAULT-OS // TERMINAL</span>
      </div>
      <div className="term-body">
        <p className="term-line term-d0">
          <span className="prompt">▶</span>
          <span className="dim">INICIALIZANDO PROTOCOLO DE CONTACTO…</span>
        </p>
        <p className="term-line term-d1">
          <span className="prompt">▶</span>
          <span className="dim">IDENTIFICANDO OPERADOR: </span>
          <span className="line">{name.toUpperCase()}</span>
        </p>
        <p className="term-line term-d2">
          <span className="prompt">▶</span>
          <span className="dim">CIFRANDO MENSAJE…</span>
        </p>
        <p className="term-line term-d3">
          <span className="prompt">▶</span>
          <span className="dim">TRANSMITIENDO A ARCADE HQ…</span>
        </p>
        <p className="term-line term-d4">
          <span className="prompt">▶</span>
          <span className="dim">MENSAJE ENTREGADO. </span>
          <span className="line">✓ OK</span>
        </p>
        <p className="term-line term-d5 success pixel">
          ▸ MISIÓN CUMPLIDA, OPERADOR.
        </p>
      </div>
      <div style={{ padding: '0 18px 18px' }}>
        <button
          className="btn press"
          style={{ width: '100%' }}
          onClick={onReset}
        >
          ENVIAR OTRO MENSAJE
        </button>
      </div>
    </div>
  );
}

export default function AboutPage() {
  const [form, setForm] = useState<FormState>({ name: '', email: '', msg: '' });
  const [status, setStatus] = useState<Status>('idle');
  const [shake, setShake] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.reveal');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.msg) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus('success');
      } else {
        setErrorMsg(data.error ?? 'Error al enviar.');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Error de red. Intenta de nuevo.');
      setStatus('error');
    }
  }

  function reset() {
    setForm({ name: '', email: '', msg: '' });
    setStatus('idle');
    setErrorMsg('');
  }

  return (
    <div className="about fade-in">
      {/* ── Sección Acerca De ── */}
      <section className="about-hero">
        <div className="kicker pixel neon-yellow">▸ ACERCA DE</div>
        <h1 className="about-title">ACERCA DE ARCADE VAULT</h1>
        <p className="about-mission">
          ARCADE VAULT nació del amor por los videojuegos clásicos. Nuestra
          misión es preservar y celebrar los arcades que definieron una
          generación, haciéndolos accesibles para todos, en cualquier lugar y
          sin costo.
        </p>
        <div className="highlight-row">
          <div className="highlight magenta" style={{ transitionDelay: '0ms' }}>
            {HeartSVG}
            <div className="hl-text pixel">HECHO CON ❤️ PARA JUGADORES</div>
          </div>
          <div className="highlight cyan" style={{ transitionDelay: '80ms' }}>
            {BrowserSVG}
            <div className="hl-text pixel">
              JUEGOS EN HTML — CORREN EN CUALQUIER NAVEGADOR
            </div>
          </div>
          <div className="highlight green" style={{ transitionDelay: '160ms' }}>
            {PlantSVG}
            <div className="hl-text pixel">
              PROYECTO EN CONSTANTE CRECIMIENTO
            </div>
          </div>
        </div>
      </section>

      {/* ── Divider animado ── */}
      <div className="about-divider reveal" aria-hidden="true">
        <div className="div-bar" />
        <div className="div-pixels">
          {Array.from({ length: DIVIDER_COUNT }).map((_, i) => (
            <span key={i} style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
        <div className="div-bar" />
      </div>

      {/* ── Sección Contacto ── */}
      <section className="about-contact reveal">
        <div className="contact-grid">
          {/* Panel informativo */}
          <div className="contact-intro">
            <div className="kicker pixel neon-cyan">▸ CONTACTO</div>
            <h2 className="contact-title">CONTÁCTANOS</h2>
            <p className="contact-sub">
              ¿Tienes alguna sugerencia, quieres proponer un juego, o
              simplemente quieres saludar? Escríbenos.
            </p>
            <div className="contact-tips">
              <div className="tip">
                <span className="tip-led" />
                RESPUESTA EN 24-48H
              </div>
              <div className="tip">
                <span className="tip-led y" />
                SUGERENCIAS BIENVENIDAS
              </div>
              <div className="tip">
                <span className="tip-led m" />
                SIN SPAM, JAMÁS
              </div>
            </div>
          </div>

          {/* Formulario / Terminal éxito */}
          {status === 'success' ? (
            <TerminalSuccess name={form.name} onReset={reset} />
          ) : (
            <form
              className={`contact-form${shake ? ' shake' : ''}`}
              onSubmit={onSubmit}
              noValidate
            >
              <div className="field">
                <label>NOMBRE</label>
                <input
                  type="text"
                  placeholder="px_kai"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="field">
                <label>CORREO ELECTRÓNICO</label>
                <input
                  type="email"
                  placeholder="jugador@vault.gg"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="field">
                <label>MENSAJE</label>
                <textarea
                  rows={5}
                  placeholder="Cuéntanos qué tienes en mente…"
                  value={form.msg}
                  onChange={(e) => setForm({ ...form, msg: e.target.value })}
                />
              </div>
              {status === 'error' && (
                <p className="form-err pixel">⚠ {errorMsg}</p>
              )}
              <button
                type="submit"
                className="btn xl press"
                disabled={status === 'sending'}
                style={{ width: '100%' }}
              >
                {status === 'sending' ? (
                  <>
                    <span className="spinner" /> ENVIANDO…
                  </>
                ) : (
                  '▶  ENVIAR MENSAJE'
                )}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
