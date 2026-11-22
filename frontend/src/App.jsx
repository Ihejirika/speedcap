import { useEffect, useState } from "react";
import { Logo } from "./components/ui.jsx";
import Home from "./pages/Home.jsx";
import Results from "./pages/Results.jsx";
import SpeedTest from "./pages/SpeedTest.jsx";
import Areas from "./pages/Areas.jsx";
import About from "./pages/About.jsx";

const PAGES = {
  home: { label: "Home", Comp: Home },
  results: { label: "Near me", Comp: Results },
  test: { label: "Speed test", Comp: SpeedTest },
  areas: { label: "Areas", Comp: Areas },
  about: { label: "About", Comp: About },
};

// Hash routing keeps the site working on GitHub Pages without server rewrites.
const readHash = () => {
  const h = window.location.hash.replace("#", "");
  return PAGES[h] ? h : "home";
};

function loadPlace() {
  try {
    return JSON.parse(sessionStorage.getItem("speedcap-place")) || null;
  } catch {
    return null;
  }
}

export default function App() {
  const [page, setPage] = useState(readHash);
  const [place, setPlace] = useState(loadPlace);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onHash = () => {
      setPage(readHash());
      setMenuOpen(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = (p) => {
    if (window.location.hash === "#" + p) setPage(p);
    else window.location.hash = p;
  };

  const pick = (p) => {
    setPlace(p);
    try {
      sessionStorage.setItem("speedcap-place", JSON.stringify(p));
    } catch {
      /* storage unavailable */
    }
    if (page !== "test") go("results");
  };

  const { Comp } = PAGES[page];

  return (
    <div className="app">
      <header className="nav">
        <a href="#home" className="nav-logo" aria-label="SpeedCap home">
          <Logo />
        </a>
        <button className="nav-toggle" aria-expanded={menuOpen} aria-controls="nav-links" onClick={() => setMenuOpen((o) => !o)}>
          <span className="sr-only">Menu</span>
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            <path d={menuOpen ? "M6 6l12 12M18 6 6 18" : "M4 7h16M4 12h16M4 17h16"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <nav id="nav-links" className={"nav-links" + (menuOpen ? " is-open" : "")}>
          {Object.entries(PAGES)
            .filter(([id]) => id !== "home")
            .map(([id, p]) => (
              <a key={id} href={"#" + id} className={"nav-link" + (page === id ? " is-on" : "") + (id === "test" ? " nav-link-cta" : "")} aria-current={page === id ? "page" : undefined}>
                {p.label}
              </a>
            ))}
        </nav>
      </header>

      <main key={page}>
        <Comp place={place} onPick={pick} go={go} />
      </main>

      <footer className="footer">
        <Logo />
        <p className="muted small">
          Network rankings from community speed tests. SpeedCap isn't affiliated with any mobile network.
        </p>
      </footer>
    </div>
  );
}
