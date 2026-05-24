import { useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSearchParams } from "react-router-dom";
import ministereJson from "../../data/ministere.json";
import { Seo } from "../components/Seo";
import { formatAxisBudget, formatMld } from "../lib/format";
import { toAbsoluteSiteUrl } from "../lib/seo";
import type { MinisterRecord } from "../types";

const ministere = ministereJson as MinisterRecord[];

const HISTORIC_YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];

// One CSS var per slot — up to 4 selected ministers
const LINE_COLORS = [
  "var(--accent-cyan)",
  "var(--accent-amber)",
  "var(--accent-teal)",
  "var(--danger)",
];

const tooltipStyle = {
  background: "#101226",
  border: "1px solid #3e4261",
  borderRadius: "10px",
  color: "#fff",
};

export const ComparatorPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [comboQuery, setComboQuery] = useState("");
  const [comboOpen, setComboOpen] = useState(false);

  // URL is the single source of truth for selection
  const selectedCods = (searchParams.get("cods") ?? "")
    .split(",")
    .filter(Boolean);

  const selectedMinistere = selectedCods
    .map((cod) => ministere.find((m) => m.cod === cod))
    .filter((m): m is MinisterRecord => m !== undefined);

  const toggleMinister = (cod: string) => {
    let next: string[];
    if (selectedCods.includes(cod)) {
      next = selectedCods.filter((c) => c !== cod);
    } else if (selectedCods.length < 4) {
      next = [...selectedCods, cod];
    } else {
      return;
    }
    setSearchParams(next.length > 0 ? { cods: next.join(",") } : {}, { replace: true });
  };

  const filteredSuggestions = ministere
    .filter(
      (m) =>
        !selectedCods.includes(m.cod) &&
        m.nume.toLowerCase().includes(comboQuery.toLowerCase())
    )
    .slice(0, 10);

  // Build chart data — raw RON values per year per selected minister
  const chartData = HISTORIC_YEARS.map((year) => {
    const point: Record<string, number | string> = { an: String(year) };
    for (const m of selectedMinistere) {
      const val = m.istoric[String(year)];
      if (val !== undefined) point[m.cod] = val;
    }
    return point;
  });

  const seoPath = "/comparator";

  return (
    <section className="page-grid">
      <Seo
        title="Comparator Ministere | Bugetul României"
        description="Compară evoluția bugetară a ministerelor române între 2015 și 2026 pe același grafic."
        path={seoPath}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Comparator Ministere",
          url: toAbsoluteSiteUrl(seoPath),
          inLanguage: "ro-RO",
        }}
      />

      <section className="panel reveal-on-load">
        <p className="ministere-kicker">Analiză comparativă</p>
        <h2 className="ministere-title">Compară ministere</h2>
        <p className="landing-copy">
          Selectează 2–4 ministere pentru a le compara evoluția bugetară 2015–2026.
        </p>
      </section>

      <section className="panel">
        <h3 className="panel-title">Selectează ministere</h3>

        <div className="comparator-combobox">
          <div className="comparator-selected">
            {selectedMinistere.map((m, i) => (
              <span key={m.cod} className="comparator-chip" style={{ borderColor: LINE_COLORS[i] }}>
                <span className="comparator-chip-dot" style={{ background: LINE_COLORS[i] }} />
                {m.nume.length > 30 ? `${m.nume.slice(0, 30)}…` : m.nume}
                <button
                  type="button"
                  className="comparator-chip-remove"
                  onClick={() => toggleMinister(m.cod)}
                  aria-label={`Elimină ${m.nume}`}
                >
                  ×
                </button>
              </span>
            ))}
            {selectedCods.length < 4 && (
              <input
                type="text"
                className="comparator-search-input"
                placeholder={
                  selectedCods.length === 0
                    ? "Caută minister (ex: Apărare, Sănătate)..."
                    : "Adaugă alt minister..."
                }
                value={comboQuery}
                onChange={(e) => {
                  setComboQuery(e.target.value);
                  setComboOpen(true);
                }}
                onFocus={() => setComboOpen(true)}
                onBlur={() => setTimeout(() => setComboOpen(false), 150)}
              />
            )}
          </div>

          {comboOpen && filteredSuggestions.length > 0 && (
            <ul className="comparator-dropdown" role="listbox">
              {filteredSuggestions.map((m) => (
                <li
                  key={m.cod}
                  className="comparator-dropdown-item"
                  role="option"
                  aria-selected={false}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    toggleMinister(m.cod);
                    setComboQuery("");
                    setComboOpen(false);
                  }}
                >
                  <span className="comparator-dropdown-name">{m.nume}</span>
                  <span className="muted comparator-dropdown-amount">
                    {formatMld(m["2026"] ?? null)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selectedCods.length === 0 && (
          <p className="muted" style={{ marginTop: "12px" }}>
            Niciun minister selectat. Caută în câmpul de mai sus.
          </p>
        )}
      </section>

      {selectedMinistere.length >= 1 && (
        <section className="panel">
          <h3 className="panel-title">
            Evoluție bugetară 2015–2026
            {selectedMinistere.length < 2 && (
              <span className="muted" style={{ fontWeight: 400, fontSize: "0.85rem", marginLeft: "8px" }}>
                (selectează al 2-lea minister pentru comparație)
              </span>
            )}
          </h3>
          <div className="chart-wrap tall">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ left: 26, right: 12, top: 12, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" />
                <XAxis dataKey="an" tick={{ fill: "#f7f7f7" }} axisLine={{ stroke: "#4e4f66" }} />
                <YAxis
                  width={90}
                  tickMargin={8}
                  tick={{ fill: "#f7f7f7" }}
                  axisLine={{ stroke: "#4e4f66" }}
                  tickFormatter={(v) => formatAxisBudget(v)}
                />
                <Tooltip
                  formatter={(value, name) => {
                    const m = selectedMinistere.find((m) => m.cod === name);
                    const label = m
                      ? m.nume.length > 35
                        ? `${m.nume.slice(0, 35)}…`
                        : m.nume
                      : String(name);
                    return [formatMld(Number(value)), label];
                  }}
                  contentStyle={tooltipStyle}
                />
                <Legend
                  formatter={(value) => {
                    const m = selectedMinistere.find((m) => m.cod === value);
                    if (!m) return value;
                    return m.nume.length > 25 ? `${m.nume.slice(0, 25)}…` : m.nume;
                  }}
                />
                {selectedMinistere.map((m, i) => (
                  <Line
                    key={m.cod}
                    type="monotone"
                    dataKey={m.cod}
                    stroke={LINE_COLORS[i]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Quick-select chips for common ministries */}
      {selectedCods.length === 0 && (
        <section className="panel">
          <h3 className="panel-title">Pornește rapid</h3>
          <div className="comparator-quick-chips">
            {ministere
              .filter((m) => !m.exclude_from_ranking)
              .sort((a, b) => (b["2026"] ?? 0) - (a["2026"] ?? 0))
              .slice(0, 8)
              .map((m) => (
                <button
                  key={m.cod}
                  type="button"
                  className="ghost-btn comparator-quick-chip"
                  onClick={() => toggleMinister(m.cod)}
                >
                  {m.nume.length > 28 ? `${m.nume.slice(0, 28)}…` : m.nume}
                </button>
              ))}
          </div>
        </section>
      )}
    </section>
  );
};
