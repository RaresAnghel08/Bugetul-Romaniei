import { Seo } from "../components/Seo";
import { useLocale } from "../i18n/LocaleContext";

export const DesprePage = () => {
  const { t, path } = useLocale();

  return (
    <section className="page-grid">
      <Seo
        title={t.despre.seoTitle}
        description={t.despre.seoDescription}
        path={path("/despre")}
      />

      <section className="panel legal-hero reveal-on-load">
        <p className="ministere-kicker">{t.despre.kicker}</p>
        <h2 className="ministere-title">{t.despre.title}</h2>
        <p className="landing-copy">{t.despre.lead}</p>
      </section>

      <section className="panel legal-content">
        <h3 className="panel-title">{t.despre.s1Title}</h3>
        <p>{t.despre.s1P1}</p>
        <p>{t.despre.s1P2}</p>

        <h3 className="panel-title">{t.despre.s2Title}</h3>
        <p>
          {t.despre.s2PPrefix}{" "}
          <a
            className="site-footer-link"
            href="https://mfinante.gov.ro/domenii/buget"
            target="_blank"
            rel="noreferrer noopener"
          >
            {t.despre.s2LinkText}
          </a>
          . {t.despre.s2PSuffix}
        </p>

        <h3 className="panel-title">{t.despre.s3Title}</h3>
        <p>{t.despre.s3P}</p>

        <h3 className="panel-title">{t.despre.s4Title}</h3>
        <p>{t.despre.s4P}</p>

        <h3 className="panel-title">{t.despre.s5Title}</h3>
        <p>
          {t.despre.s5PPrefix}{" "}
          <a
            className="site-footer-link"
            href="https://www.linkedin.com/in/raresanghel/"
            target="_blank"
            rel="noreferrer noopener"
          >
            {t.despre.s5AuthorName}
          </a>
          . {t.despre.s5PMid}{" "}
          <a
            className="site-footer-link"
            href="https://github.com/RaresAnghel08/Bugetul-Romaniei"
            target="_blank"
            rel="noreferrer noopener"
          >
            {t.despre.s5GithubText}
          </a>
          . {t.despre.s5PSuffix}
        </p>
      </section>
    </section>
  );
};
