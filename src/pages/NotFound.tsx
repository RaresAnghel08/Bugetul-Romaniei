import { Link } from "react-router-dom";
import { Seo } from "../components/Seo";

export const NotFoundPage = () => {
  return (
    <section className="page-grid">
      <Seo
        title="Pagina negăsită | Bugetul României"
        description="Pagina căutată nu există. Navighează înapoi la datele bugetare."
        path="/404"
        noIndex
      />

      <section className="panel legal-hero reveal-on-load">
        <p className="ministere-kicker">Eroare 404</p>
        <h2 className="ministere-title">Pagina nu a fost găsită</h2>
        <p className="landing-copy">
          Pagina pe care o cauți nu există sau a fost mutată. Poți naviga la una
          dintre secțiunile principale:
        </p>
        <ul className="site-footer-list" style={{ marginTop: "1.25rem" }}>
          <li>
            <Link className="site-footer-link" to="/">
              Acasă
            </Link>
          </li>
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
        </ul>
      </section>
    </section>
  );
};
