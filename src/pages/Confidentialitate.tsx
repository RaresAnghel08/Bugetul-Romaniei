import { Seo } from "../components/Seo";
import { useLocale } from "../i18n/LocaleContext";

export const ConfidentialitatePage = () => {
  const { t, path } = useLocale();

  return (
    <section className="page-grid">
      <Seo
        title={t.confidentialitate.seoTitle}
        description={t.confidentialitate.seoDescription}
        path={path("/confidentialitate")}
        noIndex
      />

      <section className="panel legal-hero reveal-on-load">
        <p className="ministere-kicker">{t.confidentialitate.kicker}</p>
        <h2 className="ministere-title">{t.confidentialitate.title}</h2>
        <p className="landing-copy">{t.confidentialitate.lead}</p>
      </section>

      <section className="panel legal-content">
        <h3 className="panel-title">{t.confidentialitate.s1Title}</h3>
        <p>{t.confidentialitate.s1P}</p>

        <h3 className="panel-title">{t.confidentialitate.s2Title}</h3>
        <p>{t.confidentialitate.s2P}</p>

        <h3 className="panel-title">{t.confidentialitate.s3Title}</h3>
        <p>{t.confidentialitate.s3P}</p>

        <h3 className="panel-title">{t.confidentialitate.s4Title}</h3>
        <p>{t.confidentialitate.s4P}</p>
      </section>
    </section>
  );
};
