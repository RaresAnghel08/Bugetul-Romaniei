import { useMemo, useState } from "react";
import type { CapitolDetail, MinisterRecord } from "../types";
import { formatPct } from "../lib/format";
import { useLocale } from "../i18n/LocaleContext";
import type { Dictionary } from "../i18n/dictionary";

interface AISummaryProps {
  minister: MinisterRecord;
  topCapitole: CapitolDetail[];
  year: number;
}

const buildSummary = (
  minister: MinisterRecord,
  topCapitole: CapitolDetail[],
  t: Dictionary["aiSummary"]
): string[] => {
  const bullets: string[] = [];

  const delta = minister.delta_pct;
  if (delta === null || delta === undefined) {
    bullets.push(t.deltaUnavailable);
  } else if (delta >= 0) {
    bullets.push(`${t.deltaGrowingPrefix} ${formatPct(delta)}${t.deltaGrowingSuffix}`);
  } else {
    bullets.push(`${t.deltaShrinkingPrefix} ${formatPct(delta)}${t.deltaShrinkingSuffix}`);
  }

  const [first, second] = topCapitole;
  if (first && second) {
    bullets.push(
      `${t.chaptersTwoPrefix} ${first.denumire} ${t.chaptersTwoMiddle} ${second.denumire}${t.chaptersTwoSuffix}`
    );
  } else if (first) {
    bullets.push(`${t.chaptersOnePrefix} ${first.denumire}${t.chaptersOneSuffix}`);
  } else {
    bullets.push(t.chaptersNone);
  }

  if (minister.estimari_2027 && minister.estimari_2028 && minister.estimari_2029) {
    const trend =
      minister.estimari_2029 > minister.estimari_2027
        ? t.trendGrowing
        : minister.estimari_2029 < minister.estimari_2027
          ? t.trendAdjusting
          : t.trendStable;
    bullets.push(`${t.trendPrefix} ${trend}${t.trendSuffix}`);
  } else {
    bullets.push(t.trendIncomplete);
  }

  return bullets.slice(0, 3);
};

export const AISummary = ({ minister, topCapitole, year }: AISummaryProps) => {
  const { t, locale } = useLocale();
  const storageKey = `summary_${minister.cod}_${year}_${locale}`;
  const initial = useMemo(() => {
    const fromStorage = localStorage.getItem(storageKey);
    if (fromStorage) {
      try {
        return JSON.parse(fromStorage) as string[];
      } catch {
        return null;
      }
    }
    return null;
  }, [storageKey]);

  const [bullets, setBullets] = useState<string[] | null>(initial);

  const regenerate = () => {
    const next = buildSummary(minister, topCapitole, t.aiSummary);
    setBullets(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  return (
    <section className="panel">
      <div className="panel-header-row">
        <h3 className="panel-title">{t.aiSummary.title}</h3>
        <button className="ghost-btn" onClick={regenerate} type="button">
          {t.aiSummary.regenerate}
        </button>
      </div>

      {!bullets ? (
        <div className="summary-placeholder">
          <p>{t.aiSummary.placeholderText}</p>
          <button className="primary-btn" type="button" onClick={regenerate}>
            {t.aiSummary.generateBtn}
          </button>
        </div>
      ) : (
        <ul className="summary-list fade-in">
          {bullets.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      )}
    </section>
  );
};
