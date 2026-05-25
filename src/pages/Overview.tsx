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

  const seoTitle = "Overview Bugetar Romania | Bugetul României";
  const seoDescription =
    "Vezi evoluția veniturilor, cheltuielilor și deficitului bugetar din România, cu comparații anuale și top variații pe ministere.";
  const seoPath = "/overview";

  if (!latestYear || !latest) {
    return (
      <section className="panel">
        <Seo
          title="Overview indisponibil | Bugetul României"
          description="Datele pentru pagina de overview bugetar nu sunt disponibile momentan."
          path={seoPath}
          noIndex
        />
        <h2 className="panel-title">Overview indisponibil</h2>
        <p>Nu există date suficiente pentru a afișa evoluția bugetară.</p>
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
    name: "Overview Bugetar Romania",
    inLanguage: "ro-RO",
    url: toAbsoluteSiteUrl(seoPath),
    description: seoDescription,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Acasa", item: toAbsoluteSiteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Overview", item: toAbsoluteSiteUrl(seoPath) },
      ],
    },
  };

  const selectedGuvData = selectedGuvern ? guverne.find((g) => g.id === selectedGuvern) : null;

  return (
    <section className="page-grid">
      <Seo title={seoTitle} description={seoDescription} path={seoPath} jsonLd={seoJsonLd} />

      <section className="panel overview-hero reveal-on-load">
        <p className="ministere-kicker">Panorama bugetara</p>
        <h2 className="ministere-title">Overview {years[0]}-{latestYear}</h2>
        <p className="landing-copy">
          Evoluție multi-an pentru venituri, cheltuieli și deficit, cu focalizare pe anul curent.
        </p>
      </section>

      <section className="cards-grid">
        <article className={`number-card overview-kpi-card overview-kpi-${venituriTone} reveal-on-load`}>
          <p className="number-card-title">Venituri {latestYear}</p>
          <p className="number-card-value">{formatMldValuta(venituriLatest, moneda)}</p>
          <p className="number-card-subtitle overview-kpi-subtitle">
            {growthEmoji(venituriGrowthPct)} vs {previousYear ?? "an precedent"}: {formatPct(venituriGrowthPct)}
          </p>
        </article>

        <article className={`number-card overview-kpi-card overview-kpi-${cheltuieliTone} reveal-on-load`}>
          <p className="number-card-title">Cheltuieli {latestYear}</p>
          <p className="number-card-value">{formatMldValuta(cheltuieliLatest, moneda)}</p>
          <p className="number-card-subtitle overview-kpi-subtitle">
            {growthEmoji(cheltuieliGrowthPct)} vs {previousYear ?? "an precedent"}: {formatPct(cheltuieliGrowthPct)}
          </p>
        </article>

        <article className={`number-card overview-kpi-card overview-kpi-${deficitTone} reveal-on-load`}>
          <p className="number-card-title">Deficit {latestYear}</p>
          <p className="number-card-value">{formatMldValuta(deficitLatest, moneda)}</p>
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
            {deficitPctPib === null ? "➖" : "📉"} PIB {latestYear}: {formatMldValuta(pibLatest, moneda)}
          </p>
        </article>
      </section>

      {/* Filtru guvern + toggle moneda */}
      <section className="panel">
        <div className="chart-controls-row">
          <div className="chart-controls-group">
            <span className="chart-controls-label">Guvern:</span>
            <div className="guvern-chips">
              <button
                type="button"
                className={`guvern-chip ${!selectedGuvern ? "guvern-chip--active" : ""}`}
                onClick={() => setSelectedGuvern(null)}
              >
                Toate
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
            <span className="chart-controls-label">Moneda:</span>
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
          Trend venituri vs cheltuieli
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
                tickFormatter={(v) => formatAxisValuta(v, moneda)}
              />
              <Tooltip
                labelFormatter={(label) => {
                  const gov = getGovForYear(String(label));
                  return gov ? `${label} — ${gov}` : String(label);
                }}
                formatter={(value) => [formatMldValuta(Number(value), moneda)]}
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
                name="Venituri"
                stroke="#2ec4b6"
                strokeWidth={3}
                dot={{ r: 3, fill: "#dcfce7", strokeWidth: 0 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="cheltuieli"
                name="Cheltuieli"
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
                tickFormatter={(v) => formatAxisValuta(v, moneda)}
              />
              <Tooltip
                labelFormatter={(label) => {
                  const gov = getGovForYear(String(label));
                  return gov ? `${label} — ${gov}` : String(label);
                }}
                formatter={(value) => [formatMldValuta(Number(value), moneda)]}
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
              <Bar dataKey="deficit" name="Deficit" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel">
        <h2 className="panel-title">Deficit ca % din PIB</h2>
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
                formatter={(value) => [`${Math.abs(Number(value)).toFixed(2)}%`, "Deficit / PIB"]}
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
              <ReferenceArea y1={-3} y2={0} fill="#ef4444" fillOpacity={0.08} label={{ value: "Maastricht -3%", position: "insideBottomRight", fill: "#ef4444", fontSize: 10 }} />
              <Line
                type="monotone"
                dataKey="deficit_pct"
                name="Deficit / PIB"
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ r: 4, fill: "#fca5a5", strokeWidth: 0 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="chart-footnote">
          PIB-ul este calculat in RON; raportul este independent de moneda selectata.
          Sursa PIB: INS (estimari pentru 2025-2026).
        </p>
      </section>

      <section className="panel dual-list-panel">
        <h2 className="panel-title">Câștigători și Pierzători {latestYear}</h2>
        <div className="dual-list">
          <div>
            <h3 className="list-title positive">Top 5 creșteri</h3>
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
            <h3 className="list-title negative">Top 5 scăderi</h3>
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
