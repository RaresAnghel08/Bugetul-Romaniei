import { Seo } from "../components/Seo";

export const TermeniPage = () => {
  return (
    <section className="page-grid">
      <Seo
        title="Termeni si Conditii | Bugetul Romaniei"
        description="Termenii de utilizare ai platformei civice Bugetul Romaniei."
        path="/termeni"
        noIndex
      />

      <section className="panel legal-hero reveal-on-load">
        <p className="ministere-kicker">Document legal</p>
        <h2 className="ministere-title">Termeni si Conditii</h2>
        <p className="landing-copy">
          Aceasta platforma este oferita exclusiv in scop demonstrativ, pentru transparenta
          datelor publice si explorare civica.
        </p>
      </section>

      <section className="panel legal-content">
        <h3 className="panel-title">1. Natura serviciului</h3>
        <p>
          Acest site este un proiect demo si nu este afiliat cu ANAF sau Ministerul
          Finantelor. Datele sunt preluate din API-urile publice ANAF.
        </p>

        <h3 className="panel-title">2. Fara garantie oficiala</h3>
        <p>
          Informatiile prezentate au caracter orientativ. Pentru validari oficiale,
          consultati sursele institutionale publicate pe canalele autoritatilor competente.
        </p>

        <h3 className="panel-title">3. Utilizare permisa</h3>
        <p>
          Puteti utiliza liber datele si vizualizarile pentru analiza, educatie si informare,
          cu mentiunea ca acest produs nu reprezinta un serviciu guvernamental oficial.
        </p>

        <h3 className="panel-title">4. Contact</h3>
        <p>
          Pentru sugestii sau corectii, folositi datele de contact publicate in repository.
        </p>
      </section>
    </section>
  );
};
