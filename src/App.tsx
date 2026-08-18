import { useState, type ReactNode } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
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
import { LocaleProvider, useLocale, swapLocaleInPath } from "./i18n/LocaleContext";
import type { Locale } from "./i18n/types";

const routeDefs: { path: string; element: ReactNode }[] = [
  { path: "", element: <LandingPage /> },
  { path: "overview", element: <OverviewPage /> },
  { path: "ministere", element: <MinisterePage /> },
  { path: "minister/:cod", element: <MinisterPage /> },
  { path: "investitii", element: <InvestitiiPage /> },
  { path: "joc", element: <JocPage /> },
  { path: "termeni", element: <TermeniPage /> },
  { path: "confidentialitate", element: <ConfidentialitatePage /> },
  { path: "comparator", element: <ComparatorPage /> },
  { path: "despre", element: <DesprePage /> },
];

const LanguageSwitcher = () => {
  const { locale } = useLocale();
  const location = useLocation();

  const targets: { code: Locale; label: string }[] = [
    { code: "ro", label: "RO" },
    { code: "en", label: "EN" },
  ];

  return (
    <div className="lang-switch" aria-label="Limba / Language">
      {targets.map((target) => (
        <Link
          key={target.code}
          to={swapLocaleInPath(location.pathname, target.code) + location.search}
          className={locale === target.code ? "topnav-link topnav-link-active" : "topnav-link"}
        >
          {target.label}
        </Link>
      ))}
    </div>
  );
};

const AppShell = () => {
  const { t, path } = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { to: path("/"), label: t.nav.home, end: true },
    { to: path("/overview"), label: t.nav.overview, end: false },
    { to: path("/ministere"), label: t.nav.ministere, end: false },
    { to: path("/comparator"), label: t.nav.comparator, end: false },
    { to: path("/investitii"), label: t.nav.investitii, end: false },
    { to: path("/joc"), label: t.nav.joc, end: false },
  ];

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <p className="brand-kicker">bugetul-romaniei.com</p>
          <h1 className="brand-title">Bugetul României</h1>
        </div>

        <nav className="topnav" aria-label={t.nav.mainNavAria}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? "topnav-link topnav-link-active" : "topnav-link"
              }
            >
              {item.label}
            </NavLink>
          ))}
          <LanguageSwitcher />
        </nav>

        <button
          type="button"
          className="hamburger-btn"
          aria-label={menuOpen ? t.nav.closeMenu : t.nav.openMenu}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        {menuOpen && (
          <nav className="mobile-menu" aria-label={t.nav.mobileNavAria}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  isActive ? "mobile-menu-link mobile-menu-link--active" : "mobile-menu-link"
                }
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
            <LanguageSwitcher />
          </nav>
        )}
      </header>

      <main className="page-wrap">
        <Routes>
          {routeDefs.map((route) => (
            <Route key={route.path || "index"} path={route.path} element={route.element} />
          ))}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <footer className="site-footer panel">
        <div className="site-footer-grid">
          <div>
            <p className="site-footer-brand">bugetul-romaniei.com</p>
            <p className="landing-copy">{t.footer.tagline}</p>
          </div>

          <div>
            <p className="site-footer-title">{t.footer.serviciiTitle}</p>
            <ul className="site-footer-list">
              <li>
                <Link className="site-footer-link" to={path("/overview")}>
                  {t.footer.overviewLink}
                </Link>
              </li>
              <li>
                <Link className="site-footer-link" to={path("/ministere")}>
                  {t.footer.ministereLink}
                </Link>
              </li>
              <li>
                <Link className="site-footer-link" to={path("/investitii")}>
                  {t.footer.investitiiLink}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="site-footer-title">{t.footer.resurseTitle}</p>
            <ul className="site-footer-list">
              <li>
                <a
                  className="site-footer-link"
                  href="https://mfinante.gov.ro/domenii/buget"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {t.footer.sourcesLink}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="site-footer-title">{t.footer.despreTitle}</p>
            <ul className="site-footer-list">
              <li>{t.footer.proiectCivic}</li>
              <li>
                <a className="site-footer-link" href="https://mfinante.gov.ro/" target="_blank" rel="noreferrer noopener">
                  {t.footer.ministerulFinantelor}
                </a>
              </li>
              <li>
                <a
                  className="site-footer-link"
                  href="https://www.linkedin.com/in/raresanghel/"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {t.footer.contact}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="site-footer-legal">
          <Link className="site-footer-link" to={path("/termeni")}>
            {t.footer.termeni}
          </Link>
          <span className="site-footer-separator">|</span>
          <Link className="site-footer-link" to={path("/confidentialitate")}>
            {t.footer.confidentialitate}
          </Link>
          <span className="site-footer-separator">|</span>
          <Link className="site-footer-link" to={path("/despre")}>
            {t.footer.despreProiect}
          </Link>
        </div>

        <p className="site-footer-disclaimer">{t.footer.disclaimer}</p>

        <p className="site-footer-credit">
          {t.footer.builtBy}{" "}
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
};

function App() {
  return (
    <Routes>
      <Route
        path="/en/*"
        element={
          <LocaleProvider locale="en">
            <AppShell />
          </LocaleProvider>
        }
      />
      <Route
        path="/*"
        element={
          <LocaleProvider locale="ro">
            <AppShell />
          </LocaleProvider>
        }
      />
    </Routes>
  );
}

export default App;
