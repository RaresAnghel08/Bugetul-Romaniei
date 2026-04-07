import { useMemo, useState } from "react";
import type { CapitolDetail, MinisterRecord } from "../types";
import { formatPct } from "../lib/format";

interface AISummaryProps {
  minister: MinisterRecord;
  topCapitole: CapitolDetail[];
  year: number;
}

const buildSummary = (minister: MinisterRecord, topCapitole: CapitolDetail[]): string[] => {
  const bullets: string[] = [];

  const delta = minister.delta_pct;
  if (delta === null || delta === undefined) {
    bullets.push("Comparatia procentuala fata de anul anterior nu este disponibila pentru acest minister.");
  } else if (delta >= 0) {
    bullets.push(`Bugetul pe 2026 este in crestere fata de 2025, cu ${formatPct(delta)}.`);
  } else {
    bullets.push(`Bugetul pe 2026 este in scadere fata de 2025, cu ${formatPct(delta)}.`);
  }

  const [first, second] = topCapitole;
  if (first && second) {
    bullets.push(
      `Capitolele dominante in alocare sunt ${first.denumire} si ${second.denumire}, care concentreaza grosul bugetului pe 2026.`
    );
  } else if (first) {
    bullets.push(`Principalul capitol ca volum este ${first.denumire}.`);
  } else {
    bullets.push("Nu exista suficiente date de capitol pentru o distributie detaliata.");
  }

  if (minister.estimari_2027 && minister.estimari_2028 && minister.estimari_2029) {
    const trend =
      minister.estimari_2029 > minister.estimari_2027
        ? "traiectorie usoara de crestere"
        : minister.estimari_2029 < minister.estimari_2027
          ? "traiectorie usoara de ajustare"
          : "traiectorie relativ stabila";
    bullets.push(`Estimarea 2027-2029 indica o ${trend}, fara schimbari structurale majore.`);
  } else {
    bullets.push("Estimarea pe 2027-2029 este incompleta, deci trendul multianual ramane orientativ.");
  }

  return bullets.slice(0, 3);
};

export const AISummary = ({ minister, topCapitole, year }: AISummaryProps) => {
  const storageKey = `summary_${minister.cod}_${year}`;
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
    const next = buildSummary(minister, topCapitole);
    setBullets(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  return (
    <section className="panel">
      <div className="panel-header-row">
        <h3 className="panel-title">Sumar automat</h3>
        <button className="ghost-btn" onClick={regenerate} type="button">
          Regenereaza
        </button>
      </div>

      {!bullets ? (
        <div className="summary-placeholder">
          <p>Genereaza un rezumat in 3 puncte pentru ministerul curent.</p>
          <button className="primary-btn" type="button" onClick={regenerate}>
            Genereaza sumar
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
