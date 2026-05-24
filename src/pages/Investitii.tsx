import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import investitiiJson from "../../data/investitii.json";
import { Seo } from "../components/Seo";
import { formatMldAlways, formatPct } from "../lib/format";
import { toAbsoluteSiteUrl } from "../lib/seo";
import type { InvestitieRecord } from "../types";

const investitii = investitiiJson as InvestitieRecord[];

interface InvestitiiGroup {
  ordonator: string;
  total2026: number;
  total2025: number;
  cheltuit2024: number;
  totalObiective: number;
  totalSurse: number;
  items: InvestitieRecord[];
}

export const InvestitiiPage = () => {
  const [searchParams] = useSearchParams();

  // Initialize from URL params
  const [minister, setMinister] = useState(() => searchParams.get("org") ?? "toate");
  const [sursa, setSursa] = useState(() => searchParams.get("sursa") ?? "toate");

  // Sync filters to URL (replaceState — no history entry)
  useEffect(() => {
    const params = new URLSearchParams();
    if (minister !== "toate") params.set("org", minister);
    if (sursa !== "toate") params.set("sursa", sursa);
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [minister, sursa]);

  const ministere = useMemo(
    () => ["toate", ...new Set(investitii.map((item) => item.ordonator))],
    []
  );

  const surse = useMemo(
    () => ["toate", ...new Set(investitii.map((item) => item.sursa))],
    []
  );

  const filtered = useMemo(
    () =>
      investitii.filter((item) => {
        const byMinister = minister === "toate" || item.ordonator === minister;
        const bySursa = sursa === "toate" || item.sursa === sursa;
        return byMinister && bySursa;
      }),
    [minister, sursa]
  );

  const totalProgram2026 = filtered.reduce((sum, item) => sum + item.program_2026, 0);
  const totalPreliminat2025 = filtered.reduce((sum, item) => sum + item.preliminat_2025, 0);
  const totalCheltuit2024 = filtered.reduce((sum, item) => sum + item.cheltuit_pana_2024, 0);

  const grouped = useMemo<InvestitiiGroup[]>(() => {
    const map = new Map<
      string,
      {
        ordonator: string;
        total2026: number;
        total2025: number;
        cheltuit2024: number;
        totalObiective: number;
        surse: Set<string>;
        items: InvestitieRecord[];
      }
    >();

    for (const row of filtered) {
      const existing = map.get(row.ordonator);
      if (!existing) {
        map.set(row.ordonator, {
          ordonator: row.ordonator,
          total2026: row.program_2026,
          total2025: row.preliminat_2025,
          cheltuit2024: row.cheltuit_pana_2024,
          totalObiective: 1,
          surse: new Set([row.sursa]),
          items: [row],
        });
        continue;
      }
      existing.total2026 += row.program_2026;
      existing.total2025 += row.preliminat_2025;
      existing.cheltuit2024 += row.cheltuit_pana_2024;
      existing.totalObiective += 1;
      existing.surse.add(row.sursa);
      existing.items.push(row);
    }

    return [...map.values()]
      .map((group) => ({
        ordonator: group.ordonator,
        total2026: group.total2026,
        total2025: group.total2025,
        cheltuit2024: group.cheltuit2024,
        totalObiective: group.totalObiective,
        totalSurse: group.surse.size,
        items: [...group.items].sort((a, b) => b.program_2026 - a.program_2026),
      }))
      .sort((a, b) => b.total2026 - a.total2026);
  }, [filtered]);

  const growthPct =
    totalPreliminat2025 > 0
      ? ((totalProgram2026 - totalPreliminat2025) / totalPreliminat2025) * 100
      : null;

  const toneForPct = (value: number | null): "positive" | "negative" | "neutral" => {
    if (value === null || Number.isNaN(value) || value === 0) return "neutral";
    return value > 0 ? "positive" : "negative";
  };

  const emojiForTone = (tone: "positive" | "negative" | "neutral"): string => {
    if (tone === "positive") return "📈";
    if (tone === "negative") return "📉";
    return "➖";
  };

  const growthTone = toneForPct(growthPct);
  const growthEmoji = emojiForTone(growthTone);
  const growthLabel = growthPct === null ? "-" : `${growthEmoji} ${formatPct(growthPct, 1)}`;

  // Task 3: CSV download from currently filtered data
  const downloadCsv = () => {
    const header = [
      "Ordonator",
      "Sursa",
      "Indicator",
      "Total",
      "Cheltuit pana 2024",
      "Preliminat 2025",
      "Program 2026",
    ];
    const rows = filtered.map((item) => [
      `"${item.ordonator.replace(/"/g, '""')}"`,
      `"${item.sursa.replace(/"/g, '""')}"`,
      `"${item.indicator.replace(/"/g, '""')}"`,
      item.total,
      item.cheltuit_pana_2024,
      item.preliminat_2025,
      item.program_2026,
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "investitii-bugetul-romaniei.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const seoPath = "/investitii";
  const seoTitle = "Investitii Publice | Bugetul Romaniei";
  const seoDescription =
    "Analizeaza investitiile publice pe ministere si surse de finantare, cu totaluri 2026, variatii vs 2025 si distributia obiectivelor.";
  const seoJsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Investitii publice Romania",
    inLanguage: "ro-RO",
    url: toAbsoluteSiteUrl(seoPath),
    description: seoDescription,
    variableMeasured: ["program_2026", "preliminat_2025", "cheltuit_pana_2024"],
  };

  return (
    <section className="page-grid">
      <Seo title={seoTitle} description={seoDescription} path={seoPath} jsonLd={seoJsonLd} />

      <section className="panel investitii-hero reveal-on-load">
        <div className="investitii-hero-top">
          <div className="investitii-hero-intro">
            <p className="ministere-kicker">Portofoliu de proiecte publice</p>
            <h2 className="ministere-title">Investitii grupate pe ministere</h2>
            <p className="mega-value">{formatMldAlways(totalProgram2026)}</p>
            <p className="muted">Programat pentru 2026 pe filtrul curent</p>
          </div>

          <div className="investitii-filters-card">
            <p className="muted investitii-filters-title">Filtre active</p>
            <div className="filter-row investitii-filter-row">
              <label className="filter-label">
                Minister
                <select
                  className="filter-select"
                  value={minister}
                  onChange={(event) => setMinister(event.target.value)}
                >
                  {ministere.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt === "toate" ? "Toate" : opt}
                    </option>
                  ))}
                </select>
              </label>

              <label className="filter-label">
                Sursa
                <select
                  className="filter-select"
                  value={sursa}
                  onChange={(event) => setSursa(event.target.value)}
                >
                  {surse.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt === "toate" ? "Toate" : opt}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>

        <div className="investitii-kpi-row">
          <article className="investitii-mini-kpi">
            <p className="muted">Ministere in selectie</p>
            <p className="investitii-kpi-value">{grouped.length}</p>
          </article>
          <article className="investitii-mini-kpi">
            <p className="muted">Obiective totale</p>
            <p className="investitii-kpi-value">{filtered.length}</p>
          </article>
          <article className="investitii-mini-kpi">
            <p className="muted">Cheltuit pana in 2024</p>
            <p className="investitii-kpi-value">{formatMldAlways(totalCheltuit2024)}</p>
          </article>
          <article className={`investitii-mini-kpi investitii-mini-kpi-${growthTone}`}>
            <p className="muted">Variatie vs 2025</p>
            <p className="investitii-kpi-value">{growthLabel}</p>
          </article>
        </div>
      </section>

      {/* Task 3: CSV button above groups */}
      <div className="panel-header-row" style={{ padding: "0 2px" }}>
        <p className="muted">{filtered.length} înregistrări în filtrul curent</p>
        <button type="button" className="ghost-btn" onClick={downloadCsv}>
          ⬇ CSV
        </button>
      </div>

      <section className="investitii-groups-grid">
        {grouped.map((group) => {
          const groupGrowthPct =
            group.total2025 > 0
              ? ((group.total2026 - group.total2025) / group.total2025) * 100
              : null;
          const groupGrowthTone = toneForPct(groupGrowthPct);
          const groupGrowthLabel =
            groupGrowthPct === null
              ? "➖ n/a"
              : `${emojiForTone(groupGrowthTone)} ${formatPct(groupGrowthPct, 1)}`;

          return (
            <article key={group.ordonator} className="panel investitii-group-card reveal-on-load">
              <div className="investitii-group-head">
                <h3 className="panel-title investitii-group-title">{group.ordonator}</h3>
                <p className="investitii-group-amount">{formatMldAlways(group.total2026)}</p>
              </div>

              <div className="investitii-group-meta">
                <span className="mini-chip">{group.totalObiective} obiective</span>
                <span className="mini-chip">{group.totalSurse} surse</span>
                <span className="mini-chip">2025: {formatMldAlways(group.total2025)}</span>
                <span className={`mini-chip investitii-growth-chip investitii-growth-chip-${groupGrowthTone}`}>
                  {groupGrowthLabel}
                </span>
              </div>

              <div className="investitii-objective-list">
                {group.items.slice(0, 8).map((item) => {
                  const share = group.total2026 > 0 ? (item.program_2026 / group.total2026) * 100 : 0;
                  return (
                    <article
                      key={`${group.ordonator}-${item.sursa}-${item.indicator}-${item.total}`}
                      className="investitii-objective-row"
                    >
                      <div>
                        <p className="objective-name">{item.indicator}</p>
                        <p className="muted">{item.sursa}</p>
                      </div>
                      <div className="investitii-objective-side">
                        <p className="objective-amount">{formatMldAlways(item.program_2026)}</p>
                        <div className="progress-cell">
                          <span>{formatPct(share, 1)}</span>
                          <progress className="progress-track-native" value={share} max={100} />
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </article>
          );
        })}
      </section>
    </section>
  );
};
