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
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ministereJson from "../../data/ministere.json";
import programeJson from "../../data/programe.json";
import guverneJson from "../../data/guverne.json";
import { AISummary } from "../components/AISummary";
import { Seo } from "../components/Seo";
import { formatAxisValuta, formatMldValuta, formatMil } from "../lib/format";
import { toAbsoluteSiteUrl } from "../lib/seo";
import { convertRON, type Moneda } from "../lib/cursValutar";
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
  const { cod } = useParams();
  const [moneda, setMoneda] = useState<Moneda>("RON");
  const minister = ministere.find((item) => item.cod === cod);
  const seoPath = cod ? `/minister/${cod}` : "/minister";

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [cod]);

  if (!minister) {
    return (
      <section className="panel">
        <Seo
          title="Minister inexistent | Bugetul Romaniei"
          description="Ministerul cautat nu exista in setul de date local disponibil."
          path={seoPath}
          noIndex
        />
        <h2 className="panel-title">Minister inexistent</h2>
        <p>Codul solicitat nu exista in datele locale.</p>
        <Link className="primary-btn inline-btn" to="/ministere">
          Inapoi la ministere
        </Link>
      </section>
    );
  }

  const lineData = Object.entries(minister.istoric ?? {})
    .filter(([year, value]) => /^\d{4}$/.test(year) && typeof value === "number" && value > 0)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([year, value]) => ({
      an: year,
      valoare: convertRON(value, year, moneda),
    }));

  const firstYear = lineData[0]?.an ?? "-";
  const lastYear = lineData[lineData.length - 1]?.an ?? "-";

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

  const chartCapitole = topCapitole.map((cap) => ({
    capitol: cap.denumire.length > 24 ? `${cap.denumire.slice(0, 24)}...` : cap.denumire,
    valoare: convertRON(cap["2026"], "2026", moneda),
  }));

  const programeMinister = programe
    .filter((program) => program.ordonator_cod === minister.cod)
    .sort((a, b) => (b.program_2026 ?? 0) - (a.program_2026 ?? 0))
    .slice(0, 12);

  const seoTitle = `${minister.nume} | Bugetul Romaniei`;
  const seoDescription = `Analiza bugetului pentru ${minister.nume}: evolutie istorica, top capitole bugetare si programe asociate.`;
  const seoJsonLd = {
    "@context": "https://schema.org",
    "@type": "GovernmentOrganization",
    name: minister.nume,
    identifier: minister.cod,
    description: seoDescription,
    url: toAbsoluteSiteUrl(seoPath),
    parentOrganization: {
      "@type": "Organization",
      name: "Bugetul Romaniei",
      url: toAbsoluteSiteUrl("/"),
    },
  };

  return (
    <section className="page-grid">
      <Seo title={seoTitle} description={seoDescription} path={seoPath} jsonLd={seoJsonLd} />

      <section className="panel">
        <div className="panel-header-row">
          <div>
            <p className="muted">Minister #{minister.cod}</p>
            <h2 className="panel-title">{minister.nume}</h2>
            <p className="headline-value">
              Buget total 2026: {formatMldValuta(minister["2026"] ?? null, moneda)}
            </p>
            <p className="muted">
              2025: {formatMldValuta(minister["2025"] ?? null, moneda)}{" "}
              {"->"} 2026: {formatMldValuta(minister["2026"] ?? null, moneda)}
            </p>
          </div>
          <div>
            <p className="muted">Variatie 2026 vs 2025</p>
            <p className={`headline-value ${ministerDeltaTone}`}>{ministerDeltaDisplay}</p>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-toolbar">
          <h3 className="panel-title">Evolutie {firstYear}-{lastYear}</h3>
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
            <LineChart data={lineData} margin={{ left: 26, right: 12, top: 12, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" />
              <XAxis dataKey="an" tick={{ fill: "#f7f7f7" }} axisLine={{ stroke: "#4e4f66" }} />
              <YAxis
                width={90}
                tickMargin={8}
                tick={{ fill: "#f7f7f7" }}
                axisLine={{ stroke: "#4e4f66" }}
                tickFormatter={(v) => formatAxisValuta(v, moneda)}
              />
              <Tooltip
                formatter={(value) => [formatMldValuta(Number(value), moneda)]}
                contentStyle={{
                  background: "#101226",
                  border: "1px solid #3e4261",
                  borderRadius: "10px",
                  color: "#fff",
                }}
              />
              {/* Benzi colorate pe perioade de guvernare */}
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
                stroke="#22d3ee"
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 0, fill: "#f4f4f4" }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel">
        <h3 className="panel-title">Top capitole bugetare (2026)</h3>
        <div className="chart-wrap medium">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartCapitole} layout="vertical" margin={{ left: 8, right: 14, top: 10, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" />
              <XAxis
                type="number"
                tick={{ fill: "#f7f7f7" }}
                axisLine={{ stroke: "#4e4f66" }}
                tickFormatter={(v) => formatAxisValuta(v, moneda)}
              />
              <YAxis
                dataKey="capitol"
                type="category"
                width={220}
                tick={{ fill: "#f7f7f7", fontSize: 11 }}
                axisLine={{ stroke: "#4e4f66" }}
              />
              <Tooltip
                formatter={(value) => [formatMldValuta(Number(value), moneda)]}
                contentStyle={{
                  background: "#101226",
                  border: "1px solid #3e4261",
                  borderRadius: "10px",
                  color: "#fff",
                }}
              />
              <Bar dataKey="valoare" fill="#f59e0b" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <AISummary minister={minister} topCapitole={topCapitole} year={2026} />

      <section className="panel">
        <h3 className="panel-title">Programe asociate</h3>
        <div className="table-wrap">
          <table className="data-table compact">
            <thead>
              <tr>
                <th>Program</th>
                <th>Executie 2025</th>
                <th>Program 2026</th>
              </tr>
            </thead>
            <tbody>
              {programeMinister.length === 0 ? (
                <tr>
                  <td colSpan={3}>Nu exista programe mapate pentru acest minister.</td>
                </tr>
              ) : (
                programeMinister.map((program) => (
                  <tr key={`${program.ordonator_cod}-${program.cod_program}`}>
                    <td>{program.program_nume || `Program ${program.cod_program}`}</td>
                    <td>{formatMil(program.executie_2025 ?? null)}</td>
                    <td>{formatMil(program.program_2026 ?? null)}</td>
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
