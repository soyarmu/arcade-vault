// ===== about.jsx — About + Contact =====
const { useEffect: useEffectAb, useState: useStateAb } = React;

function About({ navigate }) {
  useEffectAb(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  const [form, setForm] = useStateAb({ name: "", email: "", msg: "" });
  const [sent, setSent] = useStateAb(null);
  const [shake, setShake] = useStateAb(false);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.msg.trim()) {
      setShake(true); setTimeout(() => setShake(false), 400);
      return;
    }
    setSent(form.name.trim());
  };

  return (
    <div className="about fade-in">
      {/* ABOUT */}
      <section className="about-hero">
        <div className="kicker pixel neon-yellow">▸ ACERCA DE</div>
        <h1 className="about-title">ACERCA DE ARCADE VAULT</h1>
        <p className="about-mission">
          ARCADE VAULT nació del amor por los videojuegos clásicos. Nuestra misión es preservar y celebrar
          los arcades que definieron una generación, haciéndolos accesibles para todos, en cualquier lugar
          y sin costo.
        </p>

        <div className="highlight-row">
          {[
            { i: "HEART",  t: "HECHO CON ❤️ PARA JUGADORES", c: "magenta" },
            { i: "BROWSER",t: "JUEGOS EN HTML — CORREN EN CUALQUIER NAVEGADOR", c: "cyan" },
            { i: "PLANT",  t: "PROYECTO EN CONSTANTE CRECIMIENTO", c: "green" },
          ].map((h, i) => (
            <div key={i} className={"highlight " + h.c} style={{ transitionDelay: (i * 80) + "ms" }}>
              <HighlightIcon kind={h.i} />
              <div className="hl-text pixel">{h.t}</div>
            </div>
          ))}
        </div>
      </section>

      {/* divider banner */}
      <div className="about-divider reveal" aria-hidden="true">
        <div className="div-bar"></div>
        <div className="div-pixels">
          {Array.from({ length: 24 }).map((_, i) => <span key={i} style={{ animationDelay: (i * 80) + "ms" }}></span>)}
        </div>
        <div className="div-bar"></div>
      </div>

      {/* CONTACT */}
      <section className="about-contact reveal">
        <div className="contact-grid">
          <div className="contact-intro">
            <div className="kicker pixel neon-cyan">▸ CONTACTO</div>
            <h2 className="contact-title">CONTÁCTANOS</h2>
            <p className="contact-sub">
              ¿Tienes alguna sugerencia, quieres proponer un juego, o simplemente quieres saludar?
              Escríbenos.
            </p>
            <div className="contact-tips">
              <div className="tip"><span className="tip-led"></span>RESPUESTA EN 24-48H</div>
              <div className="tip"><span className="tip-led y"></span>SUGERENCIAS BIENVENIDAS</div>
              <div className="tip"><span className="tip-led m"></span>SIN SPAM, JAMÁS</div>
            </div>
          </div>

          <form className={"contact-form" + (shake ? " shake" : "")} onSubmit={onSubmit}>
            {!sent ? (
              <React.Fragment>
                <div className="field">
                  <label>NOMBRE</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="px_kai" />
                </div>
                <div className="field">
                  <label>CORREO ELECTRÓNICO</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jugador@vault.gg" />
                </div>
                <div className="field">
                  <label>MENSAJE</label>
                  <textarea rows="5" value={form.msg} onChange={(e) => setForm({ ...form, msg: e.target.value })} placeholder="Cuéntanos qué tienes en mente…"></textarea>
                </div>
                <button className="btn xl press" type="submit" style={{ width: "100%" }}>▶  ENVIAR MENSAJE</button>
              </React.Fragment>
            ) : (
              <div className="terminal-success">
                <div className="term-bar">
                  <span className="dot r"></span><span className="dot y"></span><span className="dot g"></span>
                  <span className="term-title">VAULT-OS // TERMINAL</span>
                </div>
                <div className="term-body">
                  <div className="line"><span className="prompt">vault@arcade:~$</span> ./send_message --to=team</div>
                  <div className="line dim">[OK] Conectando con servidor…</div>
                  <div className="line dim">[OK] Validando contenido…</div>
                  <div className="line dim">[OK] Transmitiendo paquete…</div>
                  <div className="line success">&gt; MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, {sent.toUpperCase()}.<span className="caret">_</span></div>
                  <div style={{ marginTop: 18 }}>
                    <button className="btn ghost" type="button" onClick={() => { setSent(null); setForm({ name: "", email: "", msg: "" }); }}>ENVIAR OTRO MENSAJE</button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}

function HighlightIcon({ kind }) {
  const C = "currentColor";
  if (kind === "HEART") return (
    <svg className="hl-icon" viewBox="0 0 16 16"><g fill={C}>
      <rect x="2" y="3" width="4" height="2"/><rect x="10" y="3" width="4" height="2"/>
      <rect x="1" y="4" width="2" height="4"/><rect x="13" y="4" width="2" height="4"/>
      <rect x="2" y="8" width="2" height="2"/><rect x="12" y="8" width="2" height="2"/>
      <rect x="3" y="9" width="10" height="2"/>
      <rect x="4" y="11" width="8" height="2"/>
      <rect x="5" y="12" width="6" height="2"/>
      <rect x="6" y="13" width="4" height="1"/>
      <rect x="7" y="14" width="2" height="1"/>
    </g></svg>
  );
  if (kind === "BROWSER") return (
    <svg className="hl-icon" viewBox="0 0 16 16"><g fill={C}>
      <rect x="1" y="2" width="14" height="12" fill="none" stroke={C} strokeWidth="1.4"/>
      <rect x="1" y="2" width="14" height="3"/>
      <rect x="3" y="3" width="1" height="1" fill="#0a0a0f"/>
      <rect x="5" y="3" width="1" height="1" fill="#0a0a0f"/>
      <rect x="7" y="3" width="1" height="1" fill="#0a0a0f"/>
      <rect x="3" y="7" width="4" height="1"/><rect x="3" y="9" width="6" height="1"/><rect x="3" y="11" width="3" height="1"/>
    </g></svg>
  );
  if (kind === "PLANT") return (
    <svg className="hl-icon" viewBox="0 0 16 16"><g fill={C}>
      <rect x="7" y="2" width="2" height="10"/>
      <rect x="4" y="4" width="3" height="2"/><rect x="9" y="6" width="3" height="2"/>
      <rect x="3" y="3" width="2" height="2"/><rect x="11" y="5" width="2" height="2"/>
      <rect x="3" y="12" width="10" height="2"/>
      <rect x="4" y="14" width="8" height="1"/>
    </g></svg>
  );
  return null;
}

window.About = About;
