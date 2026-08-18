import Fuse from "fuse.js";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { Seo } from "../components/Seo";
import { formatMld } from "../lib/format";
import { toAbsoluteSiteUrl } from "../lib/seo";
import { useDebouncedValue } from "../lib/useDebouncedValue";
import { useLocale } from "../i18n/LocaleContext";
import type { MinisterRecord } from "../types";

const ministere = ministereJson as MinisterRecord[];

type SortKey = "nume" | "2025" | "2026" | "delta_pct";
type SortDirection = "asc" | "desc";

const VALID_SORT_KEYS: SortKey[] = ["nume", "2025", "2026", "delta_pct"];

const shortInstitutionName = (name: string): string => {
  if (name.length <= 24) return name;
  return `${name.slice(0, 24)}...`;
};

export const MinisterePage = () => {
  const { t, locale, path } = useLocale();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Initialize state from URL params
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [sortKey, setSortKey] = useState<SortKey>(() => {
    const s = searchParams.get("sort");
    return VALID_SORT_KEYS.includes(s as SortKey) ? (s as SortKey) : "2026";
  });
  const [sortDirection, setSortDirection] = useState<SortDirection>(() => {
    return searchParams.get("dir") === "asc" ? "asc" : "desc";
  });

  const debouncedQuery = useDebouncedValue(query, 200);

  // Sync filters to URL (replaceState — no history entry)
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (sortKey !== "2026") params.set("sort", sortKey);
    if (sortDirection !== "desc") params.set("dir", sortDirection);
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [query, sortKey, sortDirection]);

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
    if (!debouncedQuery.trim()) return ministere;
    return fuse.search(debouncedQuery).map((result) => result.item);
  }, [debouncedQuery, fuse]);

  const sorted = useMemo(() => {
    const rows = [...filtered];
    rows.sort((a, b) => {
      const mult = sortDirection === "asc" ? 1 : -1;
      if (sortKey === "nume") return a.nume.localeCompare(b.nume, "ro") * mult;
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
        if (/^\d{4}$/.test(yearKey)) years.add(Number(yearKey));
      }
    }
    return [...years].sort((a, b) => a - b);
  }, [rankedByBudget]);

  const [isNarrow, setIsNarrow] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 640
  );

  useEffect(() => {
    const handleResize = () => setIsNarrow(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    } else {
      setSortKey(key);
      setSortDirection(key === "nume" ? "asc" : "desc");
    }
  };

  // Task 3: CSV download from currently filtered+sorted data
  const downloadCsv = () => {
    const header = ["Cod", "Nume", "Buget 2025 (lei)", "Buget 2026 (lei)", "Variatie %"];
    const rows = sorted.map((m) => [
      m.cod,
      `"${m.nume.replace(/"/g, '""')}"`,
      m["2025"] ?? "",
      m["2026"] ?? "",
      m.delta_pct !== null ? m.delta_pct.toFixed(2) : "",
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ministere-bugetul-romaniei.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const seoPath = path("/ministere");
  const seoJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t.ministere.jsonLdName,
    inLanguage: t.common.inLanguage,
    url: toAbsoluteSiteUrl(seoPath),
    description: t.ministere.seoDescription,
    about: t.ministere.jsonLdAbout,
  };

  return (
    <section className="page-grid">
      <Seo title={t.ministere.seoTitle} description={t.ministere.seoDescription} path={seoPath} jsonLd={seoJsonLd} />

      <section className="panel ministere-hero ministere-hero-upgraded reveal-on-load">
        <div className="ministere-hero-grid">
          <div>
            <p className="ministere-kicker">{t.ministere.kicker}</p>
            <h2 className="ministere-title">{t.ministere.title}</h2>
            <p className="landing-copy">
              {t.ministere.leadPrefix}
              {" "}
              {availableYears[0] ?? 2015} {t.ministere.leadSuffix}
            </p>
            <div className="ministere-hero-chips">
              <span className="mini-chip">
                {t.ministere.chipEvolutie} {availableYears[0] ?? "-"}-{availableYears[availableYears.length - 1] ?? "-"}
              </span>
              <span className="mini-chip">{t.ministere.chipTopPrefix} {featuredMinistries.length} {t.ministere.chipTopSuffix}</span>
            </div>
          </div>

          <div className="ministere-hero-metrics-grid">
            <article className="ministere-hero-metric ministere-total-card">
              <p className="muted">{t.ministere.totalBudgetLabel}</p>
              <p className="ministere-total-inline">{formatMld(total2026, locale)}</p>
            </article>

            <article className={`ministere-hero-metric ministere-growth-card ministere-growth-${growthTone}`}>
              <p className="muted">{t.ministere.growthLabel}</p>
              <p className="ministere-growth-value">{growthEmoji} {deltaTotalLabel}</p>
              <p className="muted ministere-growth-old">
                {t.ministere.growthFromLabel} {formatMld(total2025, locale)} {t.ministere.growthToLabel} {formatMld(total2026, locale)}
              </p>
            </article>

            <article className="ministere-hero-metric leader-card">
              <p className="muted">{t.ministere.leaderLabel}</p>
              <p className="ministere-hero-leader">{topMinister ? topMinister.nume : "-"}</p>
              <p className="muted">{topMinister ? formatMld(topMinister["2026"], locale) : "-"}</p>
            </article>
          </div>
        </div>
      </section>

      <section className="panel" style={{ minWidth: 0 }}>
        <div className="panel-header-row stack-mobile">
          <div>
            <h2 className="panel-title">{t.ministere.radarTitle}</h2>
            <p className="muted">{t.ministere.radarSubtitle}</p>
          </div>
        </div>
        {isNarrow ? (
          <div className="radar-mobile-fallback">
            {radarData.map((row, i) => (
              <div key={i} className="radar-mobile-row">
                <span className="radar-mobile-name">{row.institutie}</span>
                <span className="radar-mobile-val">{row.buget2026.toFixed(1)} {t.format.mldBare}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="chart-wrap tall chart-stable" style={{ minWidth: 0, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid stroke="rgba(255,255,255,0.18)" />
                <PolarAngleAxis dataKey="institutie" tick={{ fill: "#e5e7eb", fontSize: 11 }} />
                <PolarRadiusAxis
                  tick={{ fill: "#c7cedf", fontSize: 11 }}
                  tickFormatter={(value) =>
                    Number(value) >= 1
                      ? `${Number(value).toFixed(1)} ${t.format.mldBare}`
                      : `${(Number(value) * 1000).toFixed(0)} ${t.format.milBare}`
                  }
                />
                <Tooltip
                  formatter={(value) =>
                    Number(value) >= 1
                      ? `${Number(value).toFixed(1)} ${t.format.mldSuffix}`
                      : `${(Number(value) * 1000).toFixed(0)} ${t.format.milSuffix}`
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
        )}
      </section>

      <section className="ministere-cards-grid">
        {featuredMinistries.map((minister) => (
          <article
            key={`card-${minister.cod}`}
            className="panel minister-card reveal-on-load"
            role="button"
            tabIndex={0}
            onClick={() => navigate(path(`/minister/${minister.cod}`))}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                navigate(path(`/minister/${minister.cod}`));
              }
            }}
          >
            <p className="minister-card-name">{minister.nume}</p>
            <p className="minister-card-value">{formatMld(minister["2026"] ?? null, locale)}</p>
            <div className="minister-card-foot">
              <span className="muted">{t.ministere.buget2025Label} {formatMld(minister["2025"] ?? null, locale)}</span>
              <DeltaBadge delta={minister.delta_pct} />
            </div>
          </article>
        ))}
      </section>

      <section className="panel">
        <div className="panel-header-row">
          <h2 className="panel-title">{t.ministere.tableTitle}</h2>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              className="search-input"
              type="search"
              placeholder={t.ministere.searchPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button type="button" className="ghost-btn" onClick={downloadCsv}>
              {t.ministere.csvBtn}
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>
                  <button className="th-btn" type="button" onClick={() => toggleSort("nume")}>
                    {t.ministere.colMinister}
                  </button>
                </th>
                <th>
                  <button className="th-btn" type="button" onClick={() => toggleSort("2025")}>
                    {t.ministere.colBuget2025}
                  </button>
                </th>
                <th>
                  <button className="th-btn" type="button" onClick={() => toggleSort("2026")}>
                    {t.ministere.colBuget2026}
                  </button>
                </th>
                <th>
                  <button
                    className="th-btn"
                    type="button"
                    onClick={() => toggleSort("delta_pct")}
                  >
                    {t.ministere.colVariatie}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((minister) => (
                <tr
                  key={minister.cod}
                  className="clickable-row"
                  onClick={() => navigate(path(`/minister/${minister.cod}`))}
                >
                  <td>{minister.nume}</td>
                  <td>
                    <span className="table-money">{formatMld(minister["2025"] ?? null, locale)}</span>
                  </td>
                  <td>
                    <span className="table-money">{formatMld(minister["2026"] ?? null, locale)}</span>
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
