import { Seo } from "../components/Seo";
import { useLocale } from "../i18n/LocaleContext";

export const TermeniPage = () => {
  const { t, path } = useLocale();

  return (
    <section className="page-grid">
      <Seo
        title={t.termeni.seoTitle}
        description={t.termeni.seoDescription}
        path={path("/termeni")}
        noIndex
      />

      <section className="panel legal-hero reveal-on-load">
        <p className="ministere-kicker">{t.termeni.kicker}</p>
        <h2 className="ministere-title">{t.termeni.title}</h2>
        <p className="landing-copy">{t.termeni.lead}</p>
      </section>

      <section className="panel legal-content">
        <h3 className="panel-title">{t.termeni.s1Title}</h3>
        <p>{t.termeni.s1P}</p>

        <h3 className="panel-title">{t.termeni.s2Title}</h3>
        <p>{t.termeni.s2P}</p>

        <h3 className="panel-title">{t.termeni.s3Title}</h3>
        <p>{t.termeni.s3P}</p>

        <h3 className="panel-title">{t.termeni.s4Title}</h3>
        <p>{t.termeni.s4P}</p>
      </section>
    </section>
  );
};
