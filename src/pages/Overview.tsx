import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import overviewJson from "../../data/overview.json";
import ministereJson from "../../data/ministere.json";
import { DeltaBadge } from "../components/DeltaBadge";
import { Seo } from "../components/Seo";
import { formatAxisBudget, formatMld, formatPct } from "../lib/format";
import { toAbsoluteSiteUrl } from "../lib/seo";
import type { MinisterRecord, OverviewData } from "../types";

const overview = overviewJson as OverviewData;
const ministere = ministereJson as MinisterRecord[];
const PIB_2026 = 1_800_000_000_000;

export const OverviewPage = () => {
  const years = Object.keys(overview)
    .filter((key) => /^\d{4}$/.test(key))
    .map((key) => Number(key))
    .sort((a, b) => a - b);

  const latestYear = years.at(-1);
  const previousYear = years.length > 1 ? years[years.length - 2] : undefined;

  const latest = latestYear ? overview[String(latestYear)] : undefined;
  const previous = previousYear ? overview[String(previousYear)] : undefined;

  const seoTitle = "Overview Bugetar Romania | Bugetul Romaniei";
  const seoDescription =
    "Vezi evolutia veniturilor, cheltuielilor si deficitului bugetar din Romania, cu comparatii anuale si top variatii pe ministere.";
  const seoPath = "/overview";

  if (!latestYear || !latest) {
    return (
      <section className="panel">
        <Seo
          title="Overview indisponibil | Bugetul Romaniei"
          description="Datele pentru pagina de overview bugetar nu sunt disponibile momentan."
          path={seoPath}
          noIndex
        />
        <h2 className="panel-title">Overview indisponibil</h2>
        <p>Nu exista date suficiente pentru a afisa evolutia bugetara.</p>
      </section>
    );
  }

  const venituriLatest = latest.venituri_total;
  const cheltuieliLatest = latest.cheltuieli_total;
  const deficitLatest = latest.deficit;

  const deficitPctPib =
    latestYear === 2026 ? (deficitLatest / PIB_2026) * 100 : null;

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
    if (value === null || Number.isNaN(value) || value === 0) {
      return "neutral";
    }
    return value > 0 ? "positive" : "negative";
  };

  const growthEmoji = (value: number | null): string => {
    if (value === null || Number.isNaN(value) || value === 0) {
      return "➖";
    }
    return value > 0 ? "📈" : "📉";
  };

  const venituriTone = growthTone(venituriGrowthPct);
  const cheltuieliTone = growthTone(cheltuieliGrowthPct);
  const deficitTone = growthTone(deficitLatest);
  const deficitPibTone = growthTone(deficitPctPib);

  const chartData = years.map((year) => {
    const row = overview[String(year)];
    return {
      an: String(year),
      venituri: row.venituri_total,
      cheltuieli: row.cheltuieli_total,
      deficit: row.deficit,
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
    name: "Overview Bugetar Romania",
    inLanguage: "ro-RO",
    url: toAbsoluteSiteUrl(seoPath),
    description: seoDescription,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Acasa",
          item: toAbsoluteSiteUrl("/"),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Overview",
          item: toAbsoluteSiteUrl(seoPath),
        },
      ],
    },
  };

  return (
    <section className="page-grid">
      <Seo title={seoTitle} description={seoDescription} path={seoPath} jsonLd={seoJsonLd} />

      <section className="panel overview-hero reveal-on-load">
        <p className="ministere-kicker">Panorama bugetara</p>
        <h2 className="ministere-title">Overview {years[0]}-{latestYear}</h2>
        <p className="landing-copy">
          Evolutie multi-an pentru venituri, cheltuieli si deficit, cu focalizare pe anul curent.
        </p>
      </section>

      <section className="cards-grid">
        <article className={`number-card overview-kpi-card overview-kpi-${venituriTone} reveal-on-load`}>
          <p className="number-card-title">Venituri {latestYear}</p>
          <p className="number-card-value">{formatMld(venituriLatest)}</p>
          <p className="number-card-subtitle overview-kpi-subtitle">
            {growthEmoji(venituriGrowthPct)} vs {previousYear ?? "an precedent"}: {formatPct(venituriGrowthPct)}
          </p>
        </article>

        <article className={`number-card overview-kpi-card overview-kpi-${cheltuieliTone} reveal-on-load`}>
          <p className="number-card-title">Cheltuieli {latestYear}</p>
          <p className="number-card-value">{formatMld(cheltuieliLatest)}</p>
          <p className="number-card-subtitle overview-kpi-subtitle">
            {growthEmoji(cheltuieliGrowthPct)} vs {previousYear ?? "an precedent"}: {formatPct(cheltuieliGrowthPct)}
          </p>
        </article>

        <article className={`number-card overview-kpi-card overview-kpi-${deficitTone} reveal-on-load`}>
          <p className="number-card-title">Deficit {latestYear}</p>
          <p className="number-card-value">{formatMld(deficitLatest)}</p>
          <p className="number-card-subtitle overview-kpi-subtitle">
            {growthEmoji(deficitLatest)} vs {previousYear ?? "an precedent"}: {formatPct(deficitImprovementPct)}
          </p>
        </article>

        <article className={`number-card overview-kpi-card overview-kpi-${deficitPibTone} reveal-on-load`}>
          <p className="number-card-title">Deficit / PIB</p>
          <p className="number-card-value">
            {deficitPctPib === null ? "n/a" : formatPct(deficitPctPib, 2)}
          </p>
          <p className="number-card-subtitle overview-kpi-subtitle">
            {deficitPctPib === null ? "➖" : "📉"} {latestYear === 2026 ? "PIB estimat: 1.800 mld lei" : "Disponibil pentru 2026"}
          </p>
        </article>
      </section>

      <section className="panel">
        <h2 className="panel-title">Trend venituri vs cheltuieli</h2>
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
                tickFormatter={(v) => formatAxisBudget(v)}
              />
              <Tooltip
                formatter={(value) => formatMld(Number(value))}
                contentStyle={{
                  background: "#101226",
                  border: "1px solid #3e4261",
                  borderRadius: "10px",
                  color: "#fff",
                }}
              />
              <Line
                type="monotone"
                dataKey="venituri"
                name="Venituri"
                stroke="#2ec4b6"
                strokeWidth={3}
                dot={{ r: 3, fill: "#dcfce7", strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="cheltuieli"
                name="Cheltuieli"
                stroke="#ff9f1c"
                strokeWidth={3}
                dot={{ r: 3, fill: "#ffedd5", strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel">
        <h2 className="panel-title">Deficit anual</h2>
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
                tickFormatter={(v) => formatAxisBudget(v)}
              />
              <Tooltip
                formatter={(value) => formatMld(Number(value))}
                contentStyle={{
                  background: "#101226",
                  border: "1px solid #3e4261",
                  borderRadius: "10px",
                  color: "#fff",
                }}
              />
              <Bar dataKey="deficit" name="Deficit" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel dual-list-panel">
        <h2 className="panel-title">Castigatori si Pierzatori {latestYear}</h2>
        <div className="dual-list">
          <div>
            <h3 className="list-title positive">Top 5 cresteri</h3>
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
            <h3 className="list-title negative">Top 5 scaderi</h3>
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
