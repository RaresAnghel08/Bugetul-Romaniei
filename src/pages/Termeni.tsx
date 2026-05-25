import { Seo } from "../components/Seo";

export const TermeniPage = () => {
  return (
    <section className="page-grid">
      <Seo
        title="Termeni și Condiții | Bugetul României"
        description="Termenii de utilizare ai platformei civice Bugetul României."
        path="/termeni"
        noIndex
      />

      <section className="panel legal-hero reveal-on-load">
        <p className="ministere-kicker">Document legal</p>
        <h2 className="ministere-title">Termeni și Condiții</h2>
        <p className="landing-copy">
          Această platformă este oferită exclusiv în scop demonstrativ, pentru transparența
          datelor publice și explorare civică.
        </p>
      </section>

      <section className="panel legal-content">
        <h3 className="panel-title">1. Natura serviciului</h3>
        <p>
          Acest site este un proiect demo și nu este afiliat cu ANAF sau Ministerul
          Finanțelor. Datele sunt preluate din API-urile publice ANAF.
        </p>

        <h3 className="panel-title">2. Fara garantie oficiala</h3>
        <p>
          Informațiile prezentate au caracter orientativ. Pentru validări oficiale,
          consultați sursele instituționale publicate pe canalele autorităților competente.
        </p>

        <h3 className="panel-title">3. Utilizare permisa</h3>
        <p>
          Puteți utiliza liber datele și vizualizările pentru analiză, educație și informare,
          cu mențiunea că acest produs nu reprezintă un serviciu guvernamental oficial.
        </p>

        <h3 className="panel-title">4. Contact</h3>
        <p>
          Pentru sugestii sau corectii, folositi datele de contact publicate in repository.
        </p>
      </section>
    </section>
  );
};
