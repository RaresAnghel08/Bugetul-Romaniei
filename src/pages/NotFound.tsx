import { Link } from "react-router-dom";
import { Seo } from "../components/Seo";
import { useLocale } from "../i18n/LocaleContext";

export const NotFoundPage = () => {
  const { t, path } = useLocale();

  return (
    <section className="page-grid">
      <Seo
        title={t.notFound.seoTitle}
        description={t.notFound.seoDescription}
        path={path("/404")}
        noIndex
      />

      <section className="panel legal-hero reveal-on-load">
        <p className="ministere-kicker">{t.notFound.kicker}</p>
        <h2 className="ministere-title">{t.notFound.title}</h2>
        <p className="landing-copy">{t.notFound.lead}</p>
        <ul className="site-footer-list" style={{ marginTop: "1.25rem" }}>
          <li>
            <Link className="site-footer-link" to={path("/")}>
              {t.notFound.homeLink}
            </Link>
          </li>
          <li>
            <Link className="site-footer-link" to={path("/overview")}>
              {t.notFound.overviewLink}
            </Link>
          </li>
          <li>
            <Link className="site-footer-link" to={path("/ministere")}>
              {t.notFound.ministereLink}
            </Link>
          </li>
        </ul>
      </section>
    </section>
  );
};
