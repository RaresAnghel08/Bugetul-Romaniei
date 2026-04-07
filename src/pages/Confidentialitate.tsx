export const ConfidentialitatePage = () => {
  return (
    <section className="page-grid">
      <section className="panel legal-hero reveal-on-load">
        <p className="ministere-kicker">Document legal</p>
        <h2 className="ministere-title">Confidentialitate</h2>
        <p className="landing-copy">
          Scopul acestei pagini este sa explice transparent ce date sunt procesate pentru
          functionarea dashboard-ului de trafic.
        </p>
      </section>

      <section className="panel legal-content">
        <h3 className="panel-title">1. Date colectate</h3>
        <p>
          Aplicatia poate folosi un contor public de vizite pentru a afisa trafic agregat la
          nivel de site si stocheaza local, in browser, metadate minime de utilizare.
        </p>

        <h3 className="panel-title">2. Date locale in browser</h3>
        <p>
          Pentru experienta de demo sunt salvate local numarul de vizite din acest browser,
          prima accesare si ultima accesare. Aceste date nu identifica direct persoana.
        </p>

        <h3 className="panel-title">3. Fara conturi si profilare</h3>
        <p>
          Site-ul nu solicita autentificare, nu creeaza profil comercial si nu vinde date.
        </p>

        <h3 className="panel-title">4. Limitari</h3>
        <p>
          Acest site este un proiect demo si nu este afiliat cu ANAF sau Ministerul
          Finantelor. Datele sunt preluate din API-urile publice ANAF.
        </p>
      </section>
    </section>
  );
};
