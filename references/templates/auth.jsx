// ===== auth.jsx =====
const { useState: useStateA } = React;

function Auth({ navigate, onLogin }) {
  const [tab, setTab] = useStateA("in");
  const [user, setUser] = useStateA("");
  const [pass, setPass] = useStateA("");
  const [email, setEmail] = useStateA("");

  const submit = (e) => {
    e.preventDefault();
    onLogin({ name: (user || "PLAYER1").toUpperCase().slice(0, 10) });
    navigate({ name: "biblioteca" });
  };

  return (
    <div className="av-auth-wrap fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <div className="mark"></div>
          <h2 className="neon-cyan">ARCADE VAULT</h2>
          <div className="mono" style={{ fontSize: 11, color: "var(--ink-faint)", letterSpacing: "0.16em", marginTop: 6 }}>ACCESO AL SISTEMA · v2.6</div>
        </div>

        <div className="auth-tabs">
          <button className={tab === "in" ? "on" : ""} onClick={() => setTab("in")}>INICIAR SESIÓN</button>
          <button className={tab === "up" ? "on" : ""} onClick={() => setTab("up")}>CREAR CUENTA</button>
        </div>

        <form onSubmit={submit}>
          <div className="field">
            <label>Usuario</label>
            <input value={user} onChange={(e) => setUser(e.target.value)} placeholder="px_kai" />
          </div>
          {tab === "up" && (
            <div className="field slide-in">
              <label>Correo electrónico</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jugador@vault.gg" />
            </div>
          )}
          <div className="field">
            <label>Contraseña</label>
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" />
          </div>

          <button className="btn lg" type="submit" style={{ width: "100%", marginTop: 8 }}>
            {tab === "in" ? "ENTRAR AL VAULT" : "CREAR Y JUGAR"}
          </button>
        </form>

        <button className="btn ghost" style={{ width: "100%", marginTop: 10 }} onClick={() => { onLogin(null); navigate({ name: "biblioteca" }); }}>
          JUGAR COMO INVITADO
        </button>

        <div className="auth-divider">O CONTINÚA CON</div>
        <div className="social">
          <button className="btn ghost" type="button">◆  GOOGLE</button>
          <button className="btn ghost" type="button">▣  GITHUB</button>
        </div>

        <div style={{ marginTop: 18, textAlign: "center", fontSize: 11, color: "var(--ink-faint)", letterSpacing: "0.1em" }}>
          AL ENTRAR ACEPTAS LOS TÉRMINOS DEL SALÓN ARCADE
        </div>
      </div>
    </div>
  );
}

window.Auth = Auth;
