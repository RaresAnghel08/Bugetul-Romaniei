import { Seo } from "../components/Seo";

export const ConfidentialitatePage = () => {
  return (
    <section className="page-grid">
      <Seo
        title="Confidențialitate | Bugetul României"
        description="Politica de confidențialitate pentru platforma civică Bugetul României."
        path="/confidentialitate"
        noIndex
      />

      <section className="panel legal-hero reveal-on-load">
        <p className="ministere-kicker">Document legal</p>
        <h2 className="ministere-title">Confidențialitate</h2>
        <p className="landing-copy">
          Scopul acestei pagini este să explice transparent ce date sunt procesate pentru
          funcționarea dashboard-ului de trafic.
        </p>
      </section>

      <section className="panel legal-content">
        <h3 className="panel-title">1. Date colectate</h3>
        <p>
          Aplicația poate folosi un contor public de vizite pentru a afișa trafic agregat la
          nivel de site și stochează local, în browser, metadate minime de utilizare.
        </p>

        <h3 className="panel-title">2. Date locale in browser</h3>
        <p>
          Pentru experiența de demo sunt salvate local numărul de vizite din acest browser,
          prima accesare și ultima accesare. Aceste date nu identifică direct persoana.
        </p>

        <h3 className="panel-title">3. Fara conturi si profilare</h3>
        <p>
          Site-ul nu solicita autentificare, nu creeaza profil comercial si nu vinde date.
        </p>

        <h3 className="panel-title">4. Limitari</h3>
        <p>
          Acest site este un proiect demo și nu este afiliat cu ANAF sau Ministerul
          Finanțelor. Datele sunt preluate din API-urile publice ANAF.
        </p>
      </section>
    </section>
  );
};
