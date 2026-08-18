import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import overviewJson from "../../data/overview.json";
import ministereJson from "../../data/ministere.json";
import investitiiJson from "../../data/investitii.json";
import { Seo } from "../components/Seo";
import { formatMld } from "../lib/format";
import { SITE_NAME, toAbsoluteSiteUrl } from "../lib/seo";
import { getCount, incrementAndGetCount } from "../lib/counter";
import { useLocale } from "../i18n/LocaleContext";
import type { InvestitieRecord, MinisterRecord, OverviewData } from "../types";

const overview = overviewJson as OverviewData;
const ministere = ministereJson as MinisterRecord[];
const investitii = investitiiJson as InvestitieRecord[];

export const LandingPage = () => {
  const { t, locale, path } = useLocale();
  const [totalVisits, setTotalVisits] = useState<number | null>(null);

  useEffect(() => {
    const key = 'counter_incremented';
    if (sessionStorage.getItem(key)) {
      getCount().then(setTotalVisits);
      return;
    }
    incrementAndGetCount().then(count => {
      setTotalVisits(count);
      sessionStorage.setItem(key, '1');
    });
  }, []);

  const totalMinistere2026 = ministere.reduce((sum, row) => sum + (row["2026"] ?? 0), 0);
  const totalInvestitii2026 = investitii.reduce((sum, row) => sum + row.program_2026, 0);
  const deficit2026 = overview["2026"].deficit;
  const topMinister2026 = [...ministere]
    .sort((a, b) => (b["2026"] ?? 0) - (a["2026"] ?? 0))[0] ?? null;
  const formattedVisits = new Intl.NumberFormat(t.format.numberLocale, { maximumFractionDigits: 0 }).format(
    Math.max(0, totalVisits ?? 0)
  );

  const seoPath = path("/");

  const seoJsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `${SITE_NAME} - ${t.landing.jsonLdWebPageName}`,
      url: toAbsoluteSiteUrl(seoPath),
      inLanguage: t.common.inLanguage,
      description: t.landing.seoDescription,
      isPartOf: {
        "@type": "WebSite",
        name: SITE_NAME,
        url: toAbsoluteSiteUrl(seoPath),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: t.landing.jsonLdDatasetName,
      description: t.landing.jsonLdDatasetDescription,
      inLanguage: t.common.inLanguage,
      url: toAbsoluteSiteUrl(seoPath),
      creator: {
        "@type": "Person",
        name: "Rares Anghel",
      },
      keywords: ["buget", "ministere", "investitii", "romania", "transparenta"],
    },
  ];

  return (
    <section className="page-grid">
      <Seo
        title={t.landing.seoTitle}
        description={t.landing.seoDescription}
        path={seoPath}
        jsonLd={seoJsonLd}
      />

      <section className="landing-hero panel reveal-on-load">
        <div className="landing-hero-grid">
          <div>
            <p className="landing-kicker">{t.landing.heroKicker}</p>
            <h2 className="landing-title">{t.landing.heroTitle}</h2>
            <p className="landing-lead">{t.landing.heroLead}</p>

            <div className="landing-actions">
              <Link className="primary-btn inline-btn" to={path("/overview")}>
                {t.landing.ctaOverview}
              </Link>
              <Link className="ghost-btn inline-btn" to={path("/ministere")}>
                {t.landing.ctaMinistere}
              </Link>
              <Link className="ghost-btn inline-btn" to={path("/investitii")}>
                {t.landing.ctaInvestitii}
              </Link>
            </div>

            <div className="landing-highlight-strip">
              <div className="landing-highlight">
                <p className="muted">{t.landing.topMinisterLabel}</p>
                <p className="landing-highlight-title">
                  {topMinister2026 ? topMinister2026.nume : t.landing.dataUnavailable}
                </p>
              </div>
              <div className="landing-highlight">
                <p className="muted">{t.landing.datasetsLabel}</p>
                <p className="landing-highlight-title">{t.landing.datasetsValue}</p>
              </div>
            </div>
          </div>

          <div className="landing-hero-kpi-grid">
            <article className="landing-hero-kpi-card">
              <p className="landing-kpi-label">{t.landing.kpiTotalMinistere}</p>
              <p className="landing-hero-kpi-value">{formatMld(totalMinistere2026, locale)}</p>
            </article>

            <article className="landing-hero-kpi-card">
              <p className="landing-kpi-label">{t.landing.kpiInvestitii}</p>
              <p className="landing-hero-kpi-value">{formatMld(totalInvestitii2026, locale)}</p>
            </article>

            <article className="landing-hero-kpi-card deficit">
              <p className="landing-kpi-label">{t.landing.kpiDeficit}</p>
              <p className="landing-hero-kpi-value">{formatMld(deficit2026, locale)}</p>
            </article>

            <article className="landing-hero-kpi-card visits">
              <p className="landing-kpi-label">{t.landing.kpiVisits}</p>
              <p className="landing-hero-kpi-value">{formattedVisits}</p>
            </article>
          </div>
        </div>
      </section>

      <section className="landing-pillars-grid">
        <article className="panel landing-pillar reveal-on-load">
          <h3 className="panel-title">{t.landing.pillar1Title}</h3>
          <p className="landing-copy">{t.landing.pillar1Body}</p>
        </article>

        <article className="panel landing-pillar reveal-on-load">
          <h3 className="panel-title">{t.landing.pillar2Title}</h3>
          <p className="landing-copy">{t.landing.pillar2Body}</p>
        </article>

        <article className="panel landing-pillar reveal-on-load">
          <h3 className="panel-title">{t.landing.pillar3Title}</h3>
          <p className="landing-copy">{t.landing.pillar3Body}</p>
        </article>
      </section>

      <section className="panel landing-info">
        <h3 className="panel-title">{t.landing.infoTitle}</h3>
        <p className="landing-copy">{t.landing.infoBody1}</p>
        <p className="landing-copy">
          {t.landing.infoBody2Prefix}{" "}
          <a
            href="https://mfinante.gov.ro/domenii/buget"
            target="_blank"
            rel="noreferrer noopener"
            className="site-footer-link"
          >
            {t.landing.infoBody2LinkText}
          </a>
          .
        </p>
        <Link className="ghost-btn inline-btn" to={path("/despre")} style={{ marginTop: "0.75rem", display: "inline-block" }}>
          {t.landing.despreLink}
        </Link>
      </section>
    </section>
  );
};
