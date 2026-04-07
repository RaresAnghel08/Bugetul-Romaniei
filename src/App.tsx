import { useEffect } from "react";
import { Link, NavLink, Navigate, Route, Routes } from "react-router-dom";
import { LandingPage } from "./pages/Landing";
import { OverviewPage } from "./pages/Overview";
import { MinisterePage } from "./pages/Ministere";
import { MinisterPage } from "./pages/Minister";
import { InvestitiiPage } from "./pages/Investitii";
import { TermeniPage } from "./pages/Termeni";
import { ConfidentialitatePage } from "./pages/Confidentialitate";
import { trackSiteVisit } from "./lib/visitorCounter";

const navItems = [
  { to: "/", label: "Acasa" },
  { to: "/overview", label: "Overview" },
  { to: "/ministere", label: "Ministere" },
  { to: "/investitii", label: "Investitii" },
];

function App() {
  useEffect(() => {
    void trackSiteVisit();
  }, []);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <p className="brand-kicker">bugetul-romaniei.ro</p>
          <h1 className="brand-title">Bugetul Romaniei</h1>
        </div>

        <nav className="topnav" aria-label="Navigatie principala">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                isActive ? "topnav-link topnav-link-active" : "topnav-link"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="page-wrap">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/ministere" element={<MinisterePage />} />
          <Route path="/minister/:cod" element={<MinisterPage />} />
          <Route path="/investitii" element={<InvestitiiPage />} />
          <Route path="/termeni" element={<TermeniPage />} />
          <Route path="/confidentialitate" element={<ConfidentialitatePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="site-footer panel">
        <div className="site-footer-grid">
          <div>
            <p className="site-footer-brand">bugetul-romaniei.ro</p>
            <p className="landing-copy">
              Proiect civic independent care transforma fisierele XML bugetare oficiale in
              vizualizari clare pentru comparatii rapide intre ani, ministere si investitii.
            </p>
          </div>

          <div>
            <p className="site-footer-title">Servicii</p>
            <ul className="site-footer-list">
              <li>
                <Link className="site-footer-link" to="/overview">
                  Overview bugetar
                </Link>
              </li>
              <li>
                <Link className="site-footer-link" to="/ministere">
                  Ministere
                </Link>
              </li>
              <li>
                <Link className="site-footer-link" to="/investitii">
                  Investitii
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="site-footer-title">Resurse</p>
            <ul className="site-footer-list">
              <li>
                <a
                  className="site-footer-link"
                  href="https://github.com/RaresAnghel08/Bugetul-Romaniei/tree/main/XMLs"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Surse XML
                </a>
              </li>
              <li>
                <a
                  className="site-footer-link"
                  href="https://github.com/RaresAnghel08/Bugetul-Romaniei/tree/main/data"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Date JSON generate
                </a>
              </li>
              <li>
                <a
                  className="site-footer-link"
                  href="https://docs.counterapi.dev/javascript/quick-start/"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  CounterAPI docs
                </a>
              </li>
              <li>
                <a
                  className="site-footer-link"
                  href="https://github.com/RaresAnghel08/Bugetul-Romaniei"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Cod sursa
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="site-footer-title">Despre</p>
            <ul className="site-footer-list">
              <li>Proiect civic</li>
              <li>
                <a className="site-footer-link" href="https://www.anaf.ro" target="_blank" rel="noreferrer noopener">
                  anaf.ro
                </a>
              </li>
              <li>
                <a
                  className="site-footer-link"
                  href="https://github.com/RaresAnghel08/Bugetul-Romaniei/issues"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Contact / Feedback
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="site-footer-legal">
          <Link className="site-footer-link" to="/termeni">
            Termeni si Conditii
          </Link>
          <span className="site-footer-separator">|</span>
          <Link className="site-footer-link" to="/confidentialitate">
            Confidentialitate
          </Link>
        </div>

        <p className="site-footer-disclaimer">
          Bugetul Romaniei este un proiect civic independent, neafiliat cu ANAF sau Ministerul
          Finantelor. Datele sunt preluate din surse oficiale publice (XML).
        </p>

        <p className="site-footer-credit">
          Built by{" "}
          <a
            className="site-footer-link site-footer-credit-name"
            href="https://www.linkedin.com/in/raresanghel/"
            target="_blank"
            rel="noreferrer noopener"
          >
            Rares Anghel
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
