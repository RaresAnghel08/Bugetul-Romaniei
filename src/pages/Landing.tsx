import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import overviewJson from "../../data/overview.json";
import ministereJson from "../../data/ministere.json";
import investitiiJson from "../../data/investitii.json";
import { formatMld } from "../lib/format";
import { getVisitorSnapshotFromStorage, refreshVisitorSnapshot } from "../lib/visitorCounter";
import type { InvestitieRecord, MinisterRecord, OverviewData } from "../types";

const overview = overviewJson as OverviewData;
const ministere = ministereJson as MinisterRecord[];
const investitii = investitiiJson as InvestitieRecord[];

export const LandingPage = () => {
  const [totalVisits, setTotalVisits] = useState<number | null>(
    () => getVisitorSnapshotFromStorage().pageviews
  );

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const snapshot = await refreshVisitorSnapshot();
      if (mounted) {
        setTotalVisits(snapshot.pageviews);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const totalMinistere2026 = ministere.reduce((sum, row) => sum + (row["2026"] ?? 0), 0);
  const totalInvestitii2026 = investitii.reduce((sum, row) => sum + row.program_2026, 0);
  const deficit2026 = overview["2026"].deficit;
  const topMinister2026 = [...ministere]
    .sort((a, b) => (b["2026"] ?? 0) - (a["2026"] ?? 0))[0] ?? null;
  const formattedVisits = new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 }).format(
    Math.max(0, totalVisits ?? 0)
  );

  return (
    <section className="page-grid">
      <section className="landing-hero panel reveal-on-load">
        <div className="landing-hero-grid">
          <div>
            <p className="landing-kicker">Bugetul Romaniei 2025-2026</p>
            <h2 className="landing-title">Unde merg banii publici, intr-un tablou clar, explorabil si deschis.</h2>
            <p className="landing-lead">
              Proiect civic care transforma fisiere XML bugetare in vizualizari accesibile: ministere,
              programe si investitii, pentru comparatii rapide si transparente.
            </p>

            <div className="landing-actions">
              <Link className="primary-btn inline-btn" to="/overview">
                Vezi overview
              </Link>
              <Link className="ghost-btn inline-btn" to="/ministere">
                Exploreaza ministere
              </Link>
              <Link className="ghost-btn inline-btn" to="/investitii">
                Analizeaza investitii
              </Link>
            </div>

            <div className="landing-highlight-strip">
              <div className="landing-highlight">
                <p className="muted">Cel mai mare buget 2026</p>
                <p className="landing-highlight-title">
                  {topMinister2026 ? topMinister2026.nume : "Date indisponibile"}
                </p>
              </div>
              <div className="landing-highlight">
                <p className="muted">Seturi de date locale</p>
                <p className="landing-highlight-title">Ministere, programe, investitii, overview</p>
              </div>
            </div>
          </div>

          <div className="landing-hero-kpi-grid">
            <article className="landing-hero-kpi-card">
              <p className="landing-kpi-label">Buget total ministere 2026</p>
              <p className="landing-hero-kpi-value">{formatMld(totalMinistere2026)}</p>
            </article>

            <article className="landing-hero-kpi-card">
              <p className="landing-kpi-label">Program investitii 2026</p>
              <p className="landing-hero-kpi-value">{formatMld(totalInvestitii2026)}</p>
            </article>

            <article className="landing-hero-kpi-card deficit">
              <p className="landing-kpi-label">Deficit 2026</p>
              <p className="landing-hero-kpi-value">{formatMld(deficit2026)}</p>
            </article>

            <article className="landing-hero-kpi-card visits">
              <p className="landing-kpi-label">Vizite totale site</p>
              <p className="landing-hero-kpi-value">{formattedVisits}</p>
            </article>
          </div>
        </div>
      </section>

      <section className="landing-pillars-grid">
        <article className="panel landing-pillar reveal-on-load">
          <h3 className="panel-title">Date oficiale, fara opacitate</h3>
          <p className="landing-copy">
            Valorile sunt extrase direct din XML-urile publicate oficial si transformate intr-un
            format usor de verificat si comparat.
          </p>
        </article>

        <article className="panel landing-pillar reveal-on-load">
          <h3 className="panel-title">Comparatii rapide pe ani</h3>
          <p className="landing-copy">
            Vezi imediat variatii 2025-2026, ierarhii pe ministere, programe si distributia
            principalelor capitole bugetare.
          </p>
        </article>

        <article className="panel landing-pillar reveal-on-load">
          <h3 className="panel-title">Focus pe investitii publice</h3>
          <p className="landing-copy">
            Obiectivele de investitii sunt grupate si filtrabile, pentru a intelege unde se
            concentreaza programarea financiara.
          </p>
        </article>
      </section>

      <section className="panel landing-info">
        <h3 className="panel-title">Cum este construit proiectul</h3>
        <p className="landing-copy">
          Datele provin din anexele XML oficiale si sunt procesate local intr-un pipeline Python,
          apoi servite in frontend-ul React pentru cautare, comparatii pe ani si drill-down pe ministere.
        </p>
      </section>
    </section>
  );
};
