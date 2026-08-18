import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useState } from "react";
import overviewJson from "../../data/overview.json";
import ministereJson from "../../data/ministere.json";
import guverneJson from "../../data/guverne.json";
import pibJson from "../../data/pib.json";
import { DeltaBadge } from "../components/DeltaBadge";
import { Seo } from "../components/Seo";
import { formatAxisValuta, formatMldValuta, formatPct } from "../lib/format";
import { toAbsoluteSiteUrl } from "../lib/seo";
import { convertRON, type Moneda } from "../lib/cursValutar";
import { useLocale } from "../i18n/LocaleContext";
import type { MinisterRecord, OverviewData } from "../types";

interface GuvData {
  id: string;
  premier: string;
  partid: string;
  culoare: string;
  ani: string[];
}

const overview = overviewJson as OverviewData;
const ministere = ministereJson as MinisterRecord[];
const guverne = guverneJson as GuvData[];
const pib = pibJson as unknown as Record<string, number>;

const getGovForYear = (year: string): string =>
  guverne.find((g) => g.ani.includes(year))?.premier ?? "";

export const OverviewPage = () => {
  const { t, locale, path } = useLocale();
  const [moneda, setMoneda] = useState<Moneda>("RON");
  const [selectedGuvern, setSelectedGuvern] = useState<string | null>(null);

  const years = Object.keys(overview)
    .filter((key) => /^\d{4}$/.test(key))
    .map((key) => Number(key))
    .sort((a, b) => a - b);

  const latestYear = years.at(-1);
  const previousYear = years.length > 1 ? years[years.length - 2] : undefined;

  const latest = latestYear ? overview[String(latestYear)] : undefined;
  const previous = previousYear ? overview[String(previousYear)] : undefined;

  const seoPath = path("/overview");

  if (!latestYear || !latest) {
    return (
      <section className="panel">
        <Seo
          title={t.overview.unavailableSeoTitle}
          description={t.overview.unavailableSeoDescription}
          path={seoPath}
          noIndex
        />
        <h2 className="panel-title">{t.overview.unavailableTitle}</h2>
        <p>{t.overview.unavailableBody}</p>
      </section>
    );
  }

  const venituriLatest = latest.venituri_total;
  const cheltuieliLatest = latest.cheltuieli_total;
  const deficitLatest = latest.deficit;

  const pibLatest = pib[String(latestYear)] ?? null;
  const deficitPctPib = pibLatest ? (deficitLatest / pibLatest) * 100 : null;

  const venituriGrowthPct =
    previous && previous.venituri_total > 0
      ? ((venituriLatest - previous.venituri_total) / previous.venituri_total) * 100
      : null;
  const cheltuieliGrowthPct =
    previous && previous.cheltuieli_total > 0
      ? ((cheltuieliLatest - previous.cheltuieli_total) / previous.cheltuieli_total) * 100
      : null;

  const deficitImprovementPct =
    previous && previous.deficit !== 0
      ? ((Math.abs(previous.deficit) - Math.abs(deficitLatest)) / Math.abs(previous.deficit)) * 100
      : null;

  const growthTone = (value: number | null): "positive" | "negative" | "neutral" => {
    if (value === null || Number.isNaN(value) || value === 0) return "neutral";
    return value > 0 ? "positive" : "negative";
  };

  const growthEmoji = (value: number | null): string => {
    if (value === null || Number.isNaN(value) || value === 0) return "➖";
    return value > 0 ? "📈" : "📉";
  };

  const venituriTone = growthTone(venituriGrowthPct);
  const cheltuieliTone = growthTone(cheltuieliGrowthPct);
  const deficitTone = growthTone(deficitLatest);
  const deficitPibTone = growthTone(deficitPctPib);

  // Filtrare ani dupa guvernul selectat
  const activeYears = selectedGuvern
    ? guverne.find((g) => g.id === selectedGuvern)?.ani.map(Number) ?? years
    : years;

  const chartData = activeYears.map((year) => {
    const row = overview[String(year)];
    return {
      an: String(year),
      venituri: convertRON(row.venituri_total, year, moneda),
      cheltuieli: convertRON(row.cheltuieli_total, year, moneda),
      deficit: convertRON(row.deficit, year, moneda),
    };
  });

  // Date PIB in EUR/USD per an (pentru grafic separat)
  const pibChartData = years.map((year) => {
    const pibRon = pib[String(year)] ?? null;
    return {
      an: String(year),
      pib: pibRon !== null ? convertRON(pibRon, year, moneda) : null,
      deficit_pct: pibRon ? (overview[String(year)].deficit / pibRon) * 100 : null,
    };
  });

  const eligible = ministere.filter(
    (m) => m.delta_pct !== null && !m.exclude_from_ranking
  );

  const crescatori = [...eligible]
    .sort((a, b) => (b.delta_pct ?? -999) - (a.delta_pct ?? -999))
    .slice(0, 5);

  const scaderi = [...eligible]
    .sort((a, b) => (a.delta_pct ?? 999) - (b.delta_pct ?? 999))
    .slice(0, 5);

  const seoJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: t.overview.seoTitle,
    inLanguage: t.common.inLanguage,
    url: toAbsoluteSiteUrl(seoPath),
    description: t.overview.seoDescription,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: t.overview.breadcrumbHome, item: toAbsoluteSiteUrl(path("/")) },
        { "@type": "ListItem", position: 2, name: t.overview.breadcrumbOverview, item: toAbsoluteSiteUrl(seoPath) },
      ],
    },
  };

  const selectedGuvData = selectedGuvern ? guverne.find((g) => g.id === selectedGuvern) : null;

  return (
    <section className="page-grid">
      <Seo title={t.overview.seoTitle} description={t.overview.seoDescription} path={seoPath} jsonLd={seoJsonLd} />

      <section className="panel overview-hero reveal-on-load">
        <p className="ministere-kicker">{t.overview.kicker}</p>
        <h2 className="ministere-title">{t.overview.titlePrefix} {years[0]}-{latestYear}</h2>
        <p className="landing-copy">{t.overview.lead}</p>
      </section>

      <section className="cards-grid">
        <article className={`number-card overview-kpi-card overview-kpi-${venituriTone} reveal-on-load`}>
          <p className="number-card-title">{t.overview.kpiVenituri} {latestYear}</p>
          <p className="number-card-value">{formatMldValuta(venituriLatest, moneda, locale)}</p>
          <p className="number-card-subtitle overview-kpi-subtitle">
            {growthEmoji(venituriGrowthPct)} {t.overview.vsLabel} {previousYear ?? t.common.anPrecedent}: {formatPct(venituriGrowthPct)}
          </p>
        </article>

        <article className={`number-card overview-kpi-card overview-kpi-${cheltuieliTone} reveal-on-load`}>
          <p className="number-card-title">{t.overview.kpiCheltuieli} {latestYear}</p>
          <p className="number-card-value">{formatMldValuta(cheltuieliLatest, moneda, locale)}</p>
          <p className="number-card-subtitle overview-kpi-subtitle">
            {growthEmoji(cheltuieliGrowthPct)} {t.overview.vsLabel} {previousYear ?? t.common.anPrecedent}: {formatPct(cheltuieliGrowthPct)}
          </p>
        </article>

        <article className={`number-card overview-kpi-card overview-kpi-${deficitTone} reveal-on-load`}>
          <p className="number-card-title">{t.overview.kpiDeficit} {latestYear}</p>
          <p className="number-card-value">{formatMldValuta(deficitLatest, moneda, locale)}</p>
          <p className="number-card-subtitle overview-kpi-subtitle">
            {growthEmoji(deficitLatest)} {t.overview.vsLabel} {previousYear ?? t.common.anPrecedent}: {formatPct(deficitImprovementPct)}
          </p>
        </article>

        <article className={`number-card overview-kpi-card overview-kpi-${deficitPibTone} reveal-on-load`}>
          <p className="number-card-title">{t.overview.kpiDeficitPib}</p>
          <p className="number-card-value">
            {deficitPctPib === null ? "n/a" : formatPct(deficitPctPib, 2)}
          </p>
          <p className="number-card-subtitle overview-kpi-subtitle">
            {deficitPctPib === null ? "➖" : "📉"} {t.overview.pibLabel} {latestYear}: {formatMldValuta(pibLatest, moneda, locale)}
          </p>
        </article>
      </section>

      {/* Filtru guvern + toggle moneda */}
      <section className="panel">
        <div className="chart-controls-row">
          <div className="chart-controls-group">
            <span className="chart-controls-label">{t.overview.guvernLabel}</span>
            <div className="guvern-chips">
              <button
                type="button"
                className={`guvern-chip ${!selectedGuvern ? "guvern-chip--active" : ""}`}
                onClick={() => setSelectedGuvern(null)}
              >
                {t.common.toate}
              </button>
              {guverne.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  data-id={g.id}
                  className={`guvern-chip ${selectedGuvern === g.id ? "guvern-chip--active" : ""}`}
                  onClick={() => setSelectedGuvern(selectedGuvern === g.id ? null : g.id)}
                  title={`${g.premier} (${g.partid}) — ${g.ani.join(", ")}`}
                >
                  <span className="guvern-chip-dot" />
                  {g.premier}
                </button>
              ))}
            </div>
          </div>
          <div className="chart-controls-group">
            <span className="chart-controls-label">{t.overview.monedaLabel}</span>
            <div className="moneda-toggle">
              {(["RON", "EUR", "USD"] as Moneda[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`moneda-btn ${moneda === m ? "moneda-btn--active" : ""}`}
                  onClick={() => setMoneda(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2 className="panel-title">
          {t.overview.trendTitle}
          {selectedGuvData ? ` — ${selectedGuvData.premier} (${selectedGuvData.partid})` : ""}
        </h2>
        <div className="chart-wrap tall">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ left: 26, right: 16, top: 16, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" />
              <XAxis dataKey="an" tick={{ fill: "#f7f7f7" }} axisLine={{ stroke: "#4e4f66" }} />
              <YAxis
                width={92}
                tickMargin={8}
                tick={{ fill: "#f7f7f7" }}
                axisLine={{ stroke: "#4e4f66" }}
                tickFormatter={(v) => formatAxisValuta(v, moneda, locale)}
              />
              <Tooltip
                labelFormatter={(label) => {
                  const gov = getGovForYear(String(label));
                  return gov ? `${label} — ${gov}` : String(label);
                }}
                formatter={(value) => [formatMldValuta(Number(value), moneda, locale)]}
                contentStyle={{
                  background: "#101226",
                  border: "1px solid #3e4261",
                  borderRadius: "10px",
                  color: "#fff",
                }}
              />
              {/* Benzi colorate pe guverne (vizibile doar cand nu e filtru activ) */}
              {!selectedGuvern &&
                guverne.map((g) => (
                  <ReferenceArea
                    key={g.id}
                    x1={g.ani[0]}
                    x2={g.ani[g.ani.length - 1]}
                    fill={g.culoare}
                    fillOpacity={0.07}
                    stroke={g.culoare}
                    strokeOpacity={0.25}
                    label={{
                      value: g.premier.split(" ").at(-1) ?? g.premier,
                      position: "insideTop",
                      fill: g.culoare,
                      fontSize: 10,
                      opacity: 0.8,
                    }}
                  />
                ))}
              <Line
                type="monotone"
                dataKey="venituri"
                name={t.overview.venituriLegend}
                stroke="#2ec4b6"
                strokeWidth={3}
                dot={{ r: 3, fill: "#dcfce7", strokeWidth: 0 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="cheltuieli"
                name={t.overview.cheltuieliLegend}
                stroke="#ff9f1c"
                strokeWidth={3}
                dot={{ r: 3, fill: "#ffedd5", strokeWidth: 0 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel">
        <h2 className="panel-title">{t.overview.deficitAnualTitle}</h2>
        <div className="chart-wrap medium">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ left: 26, right: 16, top: 16, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" />
              <XAxis dataKey="an" tick={{ fill: "#f7f7f7" }} axisLine={{ stroke: "#4e4f66" }} />
              <YAxis
                width={92}
                tickMargin={8}
                tick={{ fill: "#f7f7f7" }}
                axisLine={{ stroke: "#4e4f66" }}
                tickFormatter={(v) => formatAxisValuta(v, moneda, locale)}
              />
              <Tooltip
                labelFormatter={(label) => {
                  const gov = getGovForYear(String(label));
                  return gov ? `${label} — ${gov}` : String(label);
                }}
                formatter={(value) => [formatMldValuta(Number(value), moneda, locale)]}
                contentStyle={{
                  background: "#101226",
                  border: "1px solid #3e4261",
                  borderRadius: "10px",
                  color: "#fff",
                }}
              />
              {!selectedGuvern &&
                guverne.map((g) => (
                  <ReferenceArea
                    key={g.id}
                    x1={g.ani[0]}
                    x2={g.ani[g.ani.length - 1]}
                    fill={g.culoare}
                    fillOpacity={0.07}
                    stroke={g.culoare}
                    strokeOpacity={0.25}
                    label={{
                      value: g.premier.split(" ").at(-1) ?? g.premier,
                      position: "insideTop",
                      fill: g.culoare,
                      fontSize: 10,
                      opacity: 0.8,
                    }}
                  />
                ))}
              <Bar dataKey="deficit" name={t.overview.deficitLegend} fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel">
        <h2 className="panel-title">{t.overview.deficitPibTitle}</h2>
        <div className="chart-wrap medium">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={pibChartData} margin={{ left: 26, right: 16, top: 16, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" />
              <XAxis dataKey="an" tick={{ fill: "#f7f7f7" }} axisLine={{ stroke: "#4e4f66" }} />
              <YAxis
                width={60}
                tickMargin={8}
                tick={{ fill: "#f7f7f7" }}
                axisLine={{ stroke: "#4e4f66" }}
                tickFormatter={(v) => `${Math.abs(v).toFixed(1)}%`}
              />
              <Tooltip
                labelFormatter={(label) => {
                  const gov = getGovForYear(String(label));
                  return gov ? `${label} — ${gov}` : String(label);
                }}
                formatter={(value) => [`${Math.abs(Number(value)).toFixed(2)}%`, t.overview.deficitPibLegend]}
                contentStyle={{
                  background: "#101226",
                  border: "1px solid #3e4261",
                  borderRadius: "10px",
                  color: "#fff",
                }}
              />
              {!selectedGuvern &&
                guverne.map((g) => (
                  <ReferenceArea
                    key={g.id}
                    x1={g.ani[0]}
                    x2={g.ani[g.ani.length - 1]}
                    fill={g.culoare}
                    fillOpacity={0.07}
                    stroke={g.culoare}
                    strokeOpacity={0.25}
                    label={{
                      value: g.premier.split(" ").at(-1) ?? g.premier,
                      position: "insideTop",
                      fill: g.culoare,
                      fontSize: 10,
                      opacity: 0.8,
                    }}
                  />
                ))}
              <ReferenceArea y1={-3} y2={0} fill="#ef4444" fillOpacity={0.08} label={{ value: t.overview.maastrichtLabel, position: "insideBottomRight", fill: "#ef4444", fontSize: 10 }} />
              <Line
                type="monotone"
                dataKey="deficit_pct"
                name={t.overview.deficitPibLegend}
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ r: 4, fill: "#fca5a5", strokeWidth: 0 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="chart-footnote">{t.overview.footnote}</p>
      </section>

      <section className="panel dual-list-panel">
        <h2 className="panel-title">{t.overview.castigatoriPierzatoriTitle} {latestYear}</h2>
        <div className="dual-list">
          <div>
            <h3 className="list-title positive">{t.overview.top5Cresteri}</h3>
            <ul className="plain-list">
              {crescatori.map((minister) => (
                <li key={`up-${minister.cod}`} className="list-row">
                  <span>{minister.nume}</span>
                  <DeltaBadge delta={minister.delta_pct} />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="list-title negative">{t.overview.top5Scaderi}</h3>
            <ul className="plain-list">
              {scaderi.map((minister) => (
                <li key={`down-${minister.cod}`} className="list-row">
                  <span>{minister.nume}</span>
                  <DeltaBadge delta={minister.delta_pct} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </section>
  );
};
