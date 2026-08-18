import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ministereJson from "../../data/ministere.json";
import programeJson from "../../data/programe.json";
import guverneJson from "../../data/guverne.json";
import { AISummary } from "../components/AISummary";
import { Seo } from "../components/Seo";
import { formatAxisValuta, formatMld, formatMldValuta, formatMil } from "../lib/format";
import { toAbsoluteSiteUrl } from "../lib/seo";
import { convertRON, type Moneda } from "../lib/cursValutar";
import { useLocale } from "../i18n/LocaleContext";
import type { MinisterRecord, ProgramRecord } from "../types";

interface GuvData {
  id: string;
  premier: string;
  partid: string;
  culoare: string;
  ani: string[];
}

const ministere = ministereJson as MinisterRecord[];
const programe = programeJson as ProgramRecord[];
const guverne = guverneJson as GuvData[];

export const MinisterPage = () => {
  const { t, locale, path } = useLocale();
  const { cod } = useParams();
  const [moneda, setMoneda] = useState<Moneda>("RON");
  const minister = ministere.find((item) => item.cod === cod);
  const seoPath = cod ? path(`/minister/${cod}`) : path("/minister");

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [cod]);

  if (!minister) {
    return (
      <section className="panel">
        <Seo
          title={t.minister.notFoundSeoTitle}
          description={t.minister.notFoundSeoDescription}
          path={seoPath}
          noIndex
        />
        <h2 className="panel-title">{t.minister.notFoundTitle}</h2>
        <p>{t.minister.notFoundBody}</p>
        <Link className="primary-btn inline-btn" to={path("/ministere")}>
          {t.minister.backLink}
        </Link>
      </section>
    );
  }

  // Historic data points (2015-2026)
  const lineData = Object.entries(minister.istoric ?? {})
    .filter(([year, value]) => /^\d{4}$/.test(year) && typeof value === "number" && value > 0)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([year, value]) => ({
      an: year,
      valoare: convertRON(value, year, moneda),
    }));

  const firstYear = lineData[0]?.an ?? "-";
  const lastYear = lineData[lineData.length - 1]?.an ?? "-";

  // Merge historic + estimates into a single trend series
  const estimateEntries = (
    [
      { an: "2027", raw: minister.estimari_2027 },
      { an: "2028", raw: minister.estimari_2028 },
      { an: "2029", raw: minister.estimari_2029 },
    ] as { an: string; raw: number | null }[]
  ).filter((e): e is { an: string; raw: number } => e.raw !== null);

  const hasEstimate = estimateEntries.length > 0;

  const trendData = [
    ...lineData.map((pt) => ({
      an: pt.an,
      valoare: pt.valoare as number | null,
      // Share the 2026 value with the estimates series so the dashed line
      // visually bridges from the end of the solid line with no gap.
      estimat: hasEstimate && pt.an === "2026" ? (pt.valoare as number | null) : null,
    })),
    ...estimateEntries.map((e) => ({
      an: e.an,
      valoare: null as number | null,
      estimat: convertRON(e.raw, "2026", moneda),
    })),
  ];

  const ministerDelta =
    minister.delta_pct === null
      ? "-"
      : `${minister.delta_pct >= 0 ? "+" : ""}${minister.delta_pct.toFixed(2)}%`;

  const ministerDeltaTone =
    minister.delta_pct === null || minister.delta_pct === 0
      ? "neutral"
      : minister.delta_pct > 0
        ? "positive"
        : "negative";

  const ministerDeltaEmoji =
    ministerDeltaTone === "positive"
      ? "📈"
      : ministerDeltaTone === "negative"
        ? "📉"
        : "➖";

  const ministerDeltaDisplay =
    minister.delta_pct === null ? "-" : `${ministerDeltaEmoji} ${ministerDelta}`;

  const topCapitole = [...minister.detalii_capitol]
    .sort((a, b) => b["2026"] - a["2026"])
    .slice(0, 5);

  // All capitols side-by-side 2025 vs 2026
  const chartCapitoleDual = [...minister.detalii_capitol]
    .sort((a, b) => b["2026"] - a["2026"])
    .map((cap) => ({
      capitol: cap.denumire.length > 40 ? `${cap.denumire.slice(0, 40)}...` : cap.denumire,
      buget2025: convertRON(cap["2025"], "2025", moneda),
      buget2026: convertRON(cap["2026"], "2026", moneda),
    }));

  const programeMinister = programe
    .filter((program) => program.ordonator_cod === minister.cod)
    .sort((a, b) => (b.program_2026 ?? 0) - (a.program_2026 ?? 0))
    .slice(0, 12);

  // Task 4: unique per-minister SEO
  const seoTitle = `${minister.nume} | Bugetul României 2026`;
  const seoDescription =
    minister.delta_pct !== null
      ? `${t.minister.seoDescriptionWithDeltaPrefix} ${minister.nume} ${t.minister.seoDescriptionWithDeltaMid} ${formatMld(minister["2026"], locale)}, ${t.minister.seoDescriptionWithDeltaSuffix
          .replace("{sign}", minister.delta_pct >= 0 ? "+" : "")
          .replace("{delta}", minister.delta_pct.toFixed(1))}`
      : `${t.minister.seoDescriptionNoDeltaPrefix} ${minister.nume} ${t.minister.seoDescriptionNoDeltaSuffix.replace("{buget}", formatMld(minister["2026"], locale))}`;

  const seoJsonLd = {
    "@context": "https://schema.org",
    "@type": "GovernmentOrganization",
    name: minister.nume,
    identifier: minister.cod,
    description: seoDescription,
    url: toAbsoluteSiteUrl(seoPath),
    parentOrganization: {
      "@type": "Organization",
      name: "Bugetul României",
      url: toAbsoluteSiteUrl(path("/")),
    },
  };

  const tooltipStyle = {
    background: "#101226",
    border: "1px solid #3e4261",
    borderRadius: "10px",
    color: "#fff",
  };

  const capitolChartHeight = Math.max(260, chartCapitoleDual.length * 56);

  return (
    <section className="page-grid">
      <Seo title={seoTitle} description={seoDescription} path={seoPath} jsonLd={seoJsonLd} />

      <section className="panel">
        <div className="panel-header-row">
          <div>
            <p className="muted">{t.minister.codeLabel}{minister.cod}</p>
            <h2 className="panel-title">{minister.nume}</h2>
            <p className="headline-value">
              {t.minister.totalBudgetLabel} {formatMldValuta(minister["2026"] ?? null, moneda, locale)}
            </p>
            <p className="muted">
              2025: {formatMldValuta(minister["2025"] ?? null, moneda, locale)}{" "}
              {t.minister.arrow} 2026: {formatMldValuta(minister["2026"] ?? null, moneda, locale)}
            </p>
          </div>
          <div>
            <p className="muted">{t.minister.variatieLabel}</p>
            <p className={`headline-value ${ministerDeltaTone}`}>{ministerDeltaDisplay}</p>
          </div>
        </div>
      </section>

      {/* Task 1: Evolution chart with estimates */}
      <section className="panel">
        <div className="panel-toolbar">
          <h3 className="panel-title">
            {t.minister.evolutieTitlePrefix} {firstYear}–{lastYear}
            {hasEstimate ? ` ${t.minister.evolutieEstimariSuffix}` : ""}
          </h3>
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
        <div className="chart-wrap medium">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ left: 26, right: 12, top: 12, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" />
              <XAxis dataKey="an" tick={{ fill: "#f7f7f7" }} axisLine={{ stroke: "#4e4f66" }} />
              <YAxis
                width={90}
                tickMargin={8}
                tick={{ fill: "#f7f7f7" }}
                axisLine={{ stroke: "#4e4f66" }}
                tickFormatter={(v) => formatAxisValuta(v, moneda, locale)}
              />
              <Tooltip
                formatter={(value, name) => [
                  formatMldValuta(Number(value), moneda, locale),
                  name === "valoare" ? t.minister.bugetLegend : t.minister.estimareLegend,
                ]}
                contentStyle={tooltipStyle}
              />
              <Legend
                formatter={(value) => (value === "valoare" ? t.minister.bugetLegend : t.minister.estimareLegend)}
              />
              {guverne.map((g) => (
                <ReferenceArea
                  key={g.id}
                  x1={g.ani[0]}
                  x2={g.ani[g.ani.length - 1]}
                  fill={g.culoare}
                  fillOpacity={0.07}
                  stroke={g.culoare}
                  strokeOpacity={0.2}
                />
              ))}
              <Line
                type="monotone"
                dataKey="valoare"
                stroke="var(--accent-cyan)"
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 0, fill: "#f4f4f4" }}
                connectNulls
              />
              {hasEstimate && (
                <Line
                  type="monotone"
                  dataKey="estimat"
                  stroke="var(--accent-amber)"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={{ r: 4, strokeWidth: 0, fill: "#f59e0b" }}
                  connectNulls
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Task 1: Capitol breakdown — grouped 2025 vs 2026 */}
      <section className="panel">
        <h3 className="panel-title">{t.minister.capitoleTitle}</h3>
        <div className="chart-wrap" style={{ height: capitolChartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartCapitoleDual}
              layout="vertical"
              margin={{ left: 8, right: 14, top: 10, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" />
              <XAxis
                type="number"
                tick={{ fill: "#f7f7f7" }}
                axisLine={{ stroke: "#4e4f66" }}
                tickFormatter={(v) => formatAxisValuta(v, moneda, locale)}
              />
              <YAxis
                dataKey="capitol"
                type="category"
                width={230}
                tick={{ fill: "#f7f7f7", fontSize: 11 }}
                axisLine={{ stroke: "#4e4f66" }}
              />
              <Tooltip
                formatter={(value, name) => [
                  formatMldValuta(Number(value), moneda, locale),
                  name === "buget2025" ? "2025" : "2026",
                ]}
                contentStyle={tooltipStyle}
              />
              <Legend formatter={(value) => (value === "buget2025" ? "2025" : "2026")} />
              <Bar
                dataKey="buget2025"
                name="buget2025"
                fill="var(--accent-teal)"
                radius={[0, 4, 4, 0]}
              />
              <Bar
                dataKey="buget2026"
                name="buget2026"
                fill="var(--accent-amber)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div style={{ minWidth: 0, overflow: 'hidden', wordBreak: 'break-word' }}>
        <AISummary minister={minister} topCapitole={topCapitole} year={2026} />
      </div>

      <section className="panel">
        <h3 className="panel-title">{t.minister.programeTitle}</h3>
        <div className="table-wrap">
          <table className="data-table compact programe-table">
            <thead>
              <tr>
                <th>{t.minister.colProgram}</th>
                <th>{t.minister.colExecutie2025}</th>
                <th>{t.minister.colProgram2026}</th>
              </tr>
            </thead>
            <tbody>
              {programeMinister.length === 0 ? (
                <tr>
                  <td colSpan={3}>{t.minister.noPrograms}</td>
                </tr>
              ) : (
                programeMinister.map((program) => (
                  <tr key={`${program.ordonator_cod}-${program.cod_program}`}>
                    <td>{program.program_nume || `${t.minister.programFallbackPrefix} ${program.cod_program}`}</td>
                    <td>{formatMil(program.executie_2025 ?? null, locale)}</td>
                    <td>{formatMil(program.program_2026 ?? null, locale)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
};
