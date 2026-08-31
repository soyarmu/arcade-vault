// ===== app.jsx =====
const { useState: useStateApp, useEffect: useEffectApp } = React;

function App() {
  const [route, setRoute] = useStateApp(() => {
    try {
      const h = location.hash.replace(/^#/, "");
      if (h) return JSON.parse(decodeURIComponent(h));
    } catch (e) {}
    return { name: "biblioteca" };
  });
  const [user, setUser] = useStateApp(() => {
    try { return JSON.parse(localStorage.getItem("av_user") || "null"); } catch (e) { return null; }
  });

  useEffectApp(() => {
    location.hash = encodeURIComponent(JSON.stringify(route));
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [route]);

  const navigate = (r) => setRoute(r);
  const handleLogin = (u) => { setUser(u); localStorage.setItem("av_user", JSON.stringify(u)); };
  const handleSignOut = () => { setUser(null); localStorage.removeItem("av_user"); };
  const handleSaveScore = (entry) => {
    try {
      const all = JSON.parse(localStorage.getItem("av_scores") || "[]");
      all.push({ ...entry, at: Date.now() });
      localStorage.setItem("av_scores", JSON.stringify(all));
    } catch (e) {}
  };

  let screen = null;
  if (route.name === "biblioteca") screen = <Library navigate={navigate} />;
  else if (route.name === "detalle") screen = <GameDetail id={route.id} navigate={navigate} />;
  else if (route.name === "player") screen = <GamePlayer id={route.id} user={user} navigate={navigate} onSaveScore={handleSaveScore} />;
  else if (route.name === "auth") screen = <Auth navigate={navigate} onLogin={handleLogin} />;
  else if (route.name === "salon") screen = <HallOfFame user={user} navigate={navigate} />;

  return (
    <React.Fragment>
      <Nav route={route} navigate={navigate} user={user} onSignOut={handleSignOut} />
      <main className="av-main">{screen}</main>
      <footer style={{ borderTop: "1px solid var(--line)", padding: "20px 32px", textAlign: "center", color: "var(--ink-faint)", fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.16em" }}>
        © 2026 ARCADE VAULT · HECHO CON PIXELES Y NEÓN · v2.6.0
      </footer>
    </React.Fragment>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
