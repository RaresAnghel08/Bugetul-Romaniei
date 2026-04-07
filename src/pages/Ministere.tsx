import Fuse from "fuse.js";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import ministereJson from "../../data/ministere.json";
import { DeltaBadge } from "../components/DeltaBadge";
import { formatMld } from "../lib/format";
import { useDebouncedValue } from "../lib/useDebouncedValue";
import type { MinisterRecord } from "../types";

const ministere = ministereJson as MinisterRecord[];

type SortKey = "nume" | "2025" | "2026" | "delta_pct";
type SortDirection = "asc" | "desc";

const shortInstitutionName = (name: string): string => {
  if (name.length <= 24) {
    return name;
  }
  return `${name.slice(0, 24)}...`;
};

export const MinisterePage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 200);
  const [sortKey, setSortKey] = useState<SortKey>("2026");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const rankedByBudget = useMemo(
    () => [...ministere].sort((a, b) => (b["2026"] ?? 0) - (a["2026"] ?? 0)),
    []
  );

  const fuse = useMemo(
    () =>
      new Fuse(ministere, {
        keys: ["nume", "cod"],
        threshold: 0.3,
        ignoreLocation: true,
      }),
    []
  );

  const filtered = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return ministere;
    }
    return fuse.search(debouncedQuery).map((result) => result.item);
  }, [debouncedQuery, fuse]);

  const sorted = useMemo(() => {
    const rows = [...filtered];
    rows.sort((a, b) => {
      const mult = sortDirection === "asc" ? 1 : -1;

      if (sortKey === "nume") {
        return a.nume.localeCompare(b.nume, "ro") * mult;
      }

      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      return (av - bv) * mult;
    });
    return rows;
  }, [filtered, sortDirection, sortKey]);

  const total2025 = useMemo(
    () => ministere.reduce((sum, row) => sum + (row["2025"] ?? 0), 0),
    []
  );

  const total2026 = useMemo(
    () => ministere.reduce((sum, row) => sum + (row["2026"] ?? 0), 0),
    []
  );

  const deltaTotal = total2025 > 0 ? ((total2026 - total2025) / total2025) * 100 : null;
  const deltaTotalLabel =
    deltaTotal === null ? "-" : `${deltaTotal >= 0 ? "+" : ""}${deltaTotal.toFixed(1)}%`;
  const growthEmoji = deltaTotal === null ? "➖" : deltaTotal >= 0 ? "📈" : "📉";
  const growthTone = deltaTotal === null ? "neutral" : deltaTotal >= 0 ? "positive" : "negative";
  const topMinister = useMemo(
    () => rankedByBudget.find((row) => (row["2026"] ?? 0) > 0) ?? null,
    [rankedByBudget]
  );

  const featuredMinistries = useMemo(() => rankedByBudget.slice(0, 13), [rankedByBudget]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    for (const minister of rankedByBudget) {
      for (const yearKey of Object.keys(minister.istoric ?? {})) {
        if (/^\d{4}$/.test(yearKey)) {
          years.add(Number(yearKey));
        }
      }
    }
    return [...years].sort((a, b) => a - b);
  }, [rankedByBudget]);

  const radarData = useMemo(
    () =>
      rankedByBudget.slice(0, 8).map((row) => ({
        institutie: shortInstitutionName(row.nume),
        buget2025: (row["2025"] ?? 0) / 1_000_000_000,
        buget2026: (row["2026"] ?? 0) / 1_000_000_000,
      })),
    [rankedByBudget]
  );

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection(key === "nume" ? "asc" : "desc");
  };

  return (
    <section className="page-grid">
      <section className="panel ministere-hero ministere-hero-upgraded reveal-on-load">
        <div className="ministere-hero-grid">
          <div>
            <p className="ministere-kicker">Radar pe institutii</p>
            <h2 className="ministere-title">Ministere in prim-plan</h2>
            <p className="landing-copy">
              Panorama executiei bugetare pentru institutiile-cheie, cu evolutie istorica din
              {" "}
              {availableYears[0] ?? 2015} pana in prezent.
            </p>
            <div className="ministere-hero-chips">
              <span className="mini-chip">
                Evolutie {availableYears[0] ?? "-"}-{availableYears[availableYears.length - 1] ?? "-"}
              </span>
              <span className="mini-chip">Top {featuredMinistries.length} institutii in prim-plan</span>
            </div>
          </div>

          <div className="ministere-hero-metrics-grid">
            <article className="ministere-hero-metric ministere-total-card">
              <p className="muted">Buget total ministere 2026</p>
              <p className="ministere-total-inline">{formatMld(total2026)}</p>
            </article>

            <article className={`ministere-hero-metric ministere-growth-card ministere-growth-${growthTone}`}>
              <p className="muted">Crestere agregata vs 2025</p>
              <p className="ministere-growth-value">{growthEmoji} {deltaTotalLabel}</p>
              <p className="muted ministere-growth-old">
                de la {formatMld(total2025)} la {formatMld(total2026)}
              </p>
            </article>

            <article className="ministere-hero-metric leader-card">
              <p className="muted">Lider dupa alocare 2026</p>
              <p className="ministere-hero-leader">{topMinister ? topMinister.nume : "-"}</p>
              <p className="muted">{topMinister ? formatMld(topMinister["2026"]) : "-"}</p>
            </article>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header-row stack-mobile">
          <div>
            <h2 className="panel-title">Radar pe institutii</h2>
            <p className="muted">Top 8 institutii dupa alocarea 2026, comparativ cu 2025</p>
          </div>
        </div>
        <div className="chart-wrap tall chart-stable">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} outerRadius="72%">
              <PolarGrid stroke="rgba(255,255,255,0.18)" />
              <PolarAngleAxis dataKey="institutie" tick={{ fill: "#e5e7eb", fontSize: 11 }} />
              <PolarRadiusAxis
                tick={{ fill: "#c7cedf", fontSize: 11 }}
                tickFormatter={(value) =>
                  Number(value) >= 1
                    ? `${Number(value).toFixed(1)} mld`
                    : `${(Number(value) * 1000).toFixed(0)} mil`
                }
              />
              <Tooltip
                formatter={(value) =>
                  Number(value) >= 1
                    ? `${Number(value).toFixed(1)} mld lei`
                    : `${(Number(value) * 1000).toFixed(0)} mil lei`
                }
                contentStyle={{
                  background: "#101226",
                  border: "1px solid #3e4261",
                  borderRadius: "10px",
                  color: "#fff",
                }}
              />
              <Legend />
              <Radar
                name="2025"
                dataKey="buget2025"
                stroke="#7dd3fc"
                fill="#7dd3fc"
                fillOpacity={0.18}
              />
              <Radar
                name="2026"
                dataKey="buget2026"
                stroke="#2dd4bf"
                fill="#2dd4bf"
                fillOpacity={0.22}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="ministere-cards-grid">
        {featuredMinistries.map((minister) => (
          <article
            key={`card-${minister.cod}`}
            className="panel minister-card reveal-on-load"
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/minister/${minister.cod}`)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                navigate(`/minister/${minister.cod}`);
              }
            }}
          >
            <p className="minister-card-name">{minister.nume}</p>
            <p className="minister-card-value">{formatMld(minister["2026"] ?? null)}</p>
            <div className="minister-card-foot">
              <span className="muted">Buget 2025: {formatMld(minister["2025"] ?? null)}</span>
              <DeltaBadge delta={minister.delta_pct} />
            </div>
          </article>
        ))}
      </section>

      <section className="panel">
        <div className="panel-header-row">
          <h2 className="panel-title">Ministere 2025 vs 2026</h2>
          <input
            className="search-input"
            type="search"
            placeholder="Cauta minister..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>
                  <button className="th-btn" type="button" onClick={() => toggleSort("nume")}>
                    Minister
                  </button>
                </th>
                <th>
                  <button className="th-btn" type="button" onClick={() => toggleSort("2025")}>
                    Buget 2025
                  </button>
                </th>
                <th>
                  <button className="th-btn" type="button" onClick={() => toggleSort("2026")}>
                    Buget 2026
                  </button>
                </th>
                <th>
                  <button
                    className="th-btn"
                    type="button"
                    onClick={() => toggleSort("delta_pct")}
                  >
                    Variatie
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((minister) => (
                <tr
                  key={minister.cod}
                  className="clickable-row"
                  onClick={() => navigate(`/minister/${minister.cod}`)}
                >
                  <td>{minister.nume}</td>
                  <td>
                    <span className="table-money">{formatMld(minister["2025"] ?? null)}</span>
                  </td>
                  <td>
                    <span className="table-money">{formatMld(minister["2026"] ?? null)}</span>
                  </td>
                  <td>
                    <DeltaBadge delta={minister.delta_pct} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
};
