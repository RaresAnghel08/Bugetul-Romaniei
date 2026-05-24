import { Seo } from "../components/Seo";

export const DesprePage = () => {
  return (
    <section className="page-grid">
      <Seo
        title="Despre Proiect | Bugetul României"
        description="Bugetul României este un dashboard civic independent care transformă datele XML oficiale ale Ministerului Finanțelor în vizualizări interactive accesibile oricui."
        path="/despre"
      />

      <section className="panel legal-hero reveal-on-load">
        <p className="ministere-kicker">Transparență bugetară</p>
        <h2 className="ministere-title">Despre proiect</h2>
        <p className="landing-copy">
          Un instrument civic independent pentru înțelegerea bugetului public al României —
          fără afiliere politică, fără finanțare instituțională.
        </p>
      </section>

      <section className="panel legal-content">
        <h3 className="panel-title">Ce este acest proiect</h3>
        <p>
          Bugetul României este un dashboard civic care pune datele bugetare oficiale într-o
          formă lizibilă pentru oricine. Scopul este simplu: să poți vedea cu ușurință cât
          primește fiecare minister, cum evoluează cheltuielile de la un an la altul și unde
          merg banii publici — fără să trebuiască să descarci fișiere XML sau să interpretezi
          tabele tehnice.
        </p>
        <p>
          Proiectul nu are afiliere politică și nu reprezintă o poziție oficială a niciunei
          instituții publice.
        </p>

        <h3 className="panel-title">Sursa datelor</h3>
        <p>
          Toate datele provin din{" "}
          <a
            className="site-footer-link"
            href="https://mfinante.gov.ro/domenii/buget"
            target="_blank"
            rel="noreferrer noopener"
          >
            anexele XML publicate de Ministerul Finanțelor Publice
          </a>
          . Acestea sunt documente oficiale, publicate periodic, care detaliază alocările
          bugetare pe ordonatori principali de credite.
        </p>

        <h3 className="panel-title">Cum sunt procesate datele</h3>
        <p>
          Un pipeline Python parsează fișierele XML și le
          transformă în fișiere JSON locale folosite de aplicație. Nu există bază de date
          externă — totul rulează din fișiere statice incluse în build.
        </p>

        <h3 className="panel-title">Limitări importante</h3>
        <p>
          Datele reflectă <strong>bugetul aprobat și/sau rectificat</strong>, nu execuția
          bugetară reală. Sumele alocate nu sunt echivalente cu sumele efectiv cheltuite.
          Pentru execuție bugetară, consultați rapoartele lunare publicate de Ministerul
          Finanțelor.
        </p>

        <h3 className="panel-title">Autor și cod sursă</h3>
        <p>
          Proiect realizat de{" "}
          <a
            className="site-footer-link"
            href="https://www.linkedin.com/in/raresanghel/"
            target="_blank"
            rel="noreferrer noopener"
          >
            Rareș Anghel
          </a>
          . Codul sursă este open source și disponibil pe{" "}
          <a
            className="site-footer-link"
            href="https://github.com/RaresAnghel08/Bugetul-Romaniei"
            target="_blank"
            rel="noreferrer noopener"
          >
            GitHub
          </a>
          . Contribuțiile și sugestiile sunt binevenite.
        </p>
      </section>
    </section>
  );
};
