import { useState } from "react";
import { Link, NavLink, Route, Routes } from "react-router-dom";
import { LandingPage } from "./pages/Landing";
import { OverviewPage } from "./pages/Overview";
import { MinisterePage } from "./pages/Ministere";
import { MinisterPage } from "./pages/Minister";
import { InvestitiiPage } from "./pages/Investitii";
import { JocPage } from "./pages/Joc";
import { TermeniPage } from "./pages/Termeni";
import { ConfidentialitatePage } from "./pages/Confidentialitate";
import { ComparatorPage } from "./pages/Comparator";
import { DesprePage } from "./pages/Despre";
import { NotFoundPage } from "./pages/NotFound";

const navItems = [
  { to: "/", label: "Acasa" },
  { to: "/overview", label: "Overview" },
  { to: "/ministere", label: "Ministere" },
  { to: "/comparator", label: "Compară ministere" },
  { to: "/investitii", label: "Investitii" },
  { to: "/joc", label: "🎮 Joc" },
];

function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <p className="brand-kicker">bugetul-romaniei.com</p>
          <h1 className="brand-title">Bugetul României</h1>
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

        <button
          type="button"
          className="hamburger-btn"
          aria-label={menuOpen ? "Închide meniu" : "Deschide meniu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        {menuOpen && (
          <nav className="mobile-menu" aria-label="Meniu mobil">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  isActive ? "mobile-menu-link mobile-menu-link--active" : "mobile-menu-link"
                }
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="page-wrap">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/ministere" element={<MinisterePage />} />
          <Route path="/minister/:cod" element={<MinisterPage />} />
          <Route path="/investitii" element={<InvestitiiPage />} />
          <Route path="/joc" element={<JocPage />} />
          <Route path="/termeni" element={<TermeniPage />} />
          <Route path="/confidentialitate" element={<ConfidentialitatePage />} />
          <Route path="/comparator" element={<ComparatorPage />} />
          <Route path="/despre" element={<DesprePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <footer className="site-footer panel">
        <div className="site-footer-grid">
          <div>
            <p className="site-footer-brand">bugetul-romaniei.com</p>
            <p className="landing-copy">
              Proiect civic independent care transformă fișierele XML bugetare oficiale în
              vizualizări clare pentru comparații rapide între ani, ministere și investiții.
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
                  href="https://mfinante.gov.ro/domenii/buget"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Surse XML
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="site-footer-title">Despre</p>
            <ul className="site-footer-list">
              <li>Proiect civic</li>
              <li>
                <a className="site-footer-link" href="https://mfinante.gov.ro/" target="_blank" rel="noreferrer noopener">
                  Ministerul Finantelor
                </a>
              </li>
              <li>
                <a
                  className="site-footer-link"
                  href="https://www.linkedin.com/in/raresanghel/"
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
          <span className="site-footer-separator">|</span>
          <Link className="site-footer-link" to="/despre">
            Despre proiect
          </Link>
        </div>

        <p className="site-footer-disclaimer">
          Bugetul României este un proiect civic independent, neafiliat cu ANAF sau Ministerul
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
