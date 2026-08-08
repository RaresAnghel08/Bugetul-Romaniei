import { z } from "zod";

import {
  ANI,
  AN_MAX,
  AN_MIN,
  MONEDE,
  bugetMinisterAn,
  cautaMinistere,
  convert,
  cursuri,
  deltaPct,
  formatMld,
  formatPct,
  gasesteMinister,
  guverne,
  guvernPentruAn,
  investitii,
  matchScore,
  ministere,
  normalize,
  overview,
  pctDinPib,
  pib,
  programe,
} from "./data.mjs";

/* ------------------------------------------------------------------ */
/* Formatare raspunsuri                                                */
/* ------------------------------------------------------------------ */

const text = (value) => ({ content: [{ type: "text", text: value }] });
const eroare = (value) => ({ content: [{ type: "text", text: value }], isError: true });

/** Tabel markdown dintr-un antet si randuri deja formatate. */
const tabel = (headers, rows) => {
  if (rows.length === 0) return "_Niciun rezultat._";
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");
};

const semn = (value, digits = 1) =>
  value === null || value === undefined || Number.isNaN(value)
    ? "-"
    : `${value > 0 ? "+" : ""}${formatPct(value, digits)}`;

/* ------------------------------------------------------------------ */
/* Scheme comune                                                       */
/* ------------------------------------------------------------------ */

const monedaSchema = z
  .enum(MONEDE)
  .default("RON")
  .describe("Moneda de afisare; conversia foloseste cursul BNR din anul respectiv.");

const anSchema = z
  .string()
  .regex(/^\d{4}$/)
  .describe(`An bugetar intre ${AN_MIN} si ${AN_MAX}.`);

const validAn = (an) => ANI.includes(String(an));

const aniInvalid = (an) =>
  eroare(`Anul "${an}" nu exista in date. Ani disponibili: ${ANI.join(", ")}.`);

/* ------------------------------------------------------------------ */
/* Tools                                                               */
/* ------------------------------------------------------------------ */

export const registerTools = (server) => {
  server.registerTool(
    "overview_buget",
    {
      title: "Overview buget",
      description:
        "Venituri, cheltuieli si deficit pentru bugetul de stat al Romaniei, pe ani (2015-2026), " +
        "cu deficitul exprimat si ca procent din PIB. Foloseste acest tool pentru intrebari despre totaluri, trend sau deficit.",
      inputSchema: {
        ani: z
          .array(anSchema)
          .optional()
          .describe("Anii doriti; implicit toti anii disponibili."),
        moneda: monedaSchema,
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ ani, moneda }) => {
      const lista = ani?.length ? ani.map(String) : ANI;
      const necunoscut = lista.find((an) => !validAn(an));
      if (necunoscut) return aniInvalid(necunoscut);

      const rows = lista.map((an) => {
        const row = overview[an];
        const guvern = guvernPentruAn(an);
        return [
          an,
          formatMld(convert(row.venituri_total, an, moneda), moneda),
          formatMld(convert(row.cheltuieli_total, an, moneda), moneda),
          formatMld(convert(row.deficit, an, moneda), moneda),
          formatPct(pctDinPib(row.deficit, an)),
          guvern ? `${guvern.premier} (${guvern.partid})` : "-",
        ];
      });

      const primul = overview[lista[0]];
      const ultimul = overview[lista[lista.length - 1]];
      const rezumat =
        lista.length > 1
          ? `Intre ${lista[0]} si ${lista[lista.length - 1]}: cheltuielile au variat cu ${semn(
              deltaPct(primul.cheltuieli_total, ultimul.cheltuieli_total)
            )}, veniturile cu ${semn(deltaPct(primul.venituri_total, ultimul.venituri_total))}.`
          : "";

      return text(
        [
          `## Bugetul de stat (${moneda})`,
          tabel(["An", "Venituri", "Cheltuieli", "Deficit", "Deficit % PIB", "Guvern"], rows),
          rezumat,
          "_Sume din legile bugetului de stat; deficitul raportat la PIB nominal (INS / Strategia Fiscal-Bugetara)._",
        ]
          .filter(Boolean)
          .join("\n\n")
      );
    }
  );

  server.registerTool(
    "lista_ministere",
    {
      title: "Clasament ministere",
      description:
        "Clasamentul ordonatorilor principali de credite (ministere si institutii) dupa buget sau dupa variatia " +
        "fata de anul precedent. Raspunde la intrebari de tipul 'cine primeste cei mai multi bani' sau 'cine creste/scade cel mai mult'.",
      inputSchema: {
        an: anSchema.default(AN_MAX),
        sort: z
          .enum(["buget", "crestere", "scadere"])
          .default("buget")
          .describe("Criteriu de ordonare: buget absolut, crestere procentuala sau scadere procentuala."),
        limit: z.number().int().min(1).max(60).default(15),
        include_actiuni_generale: z
          .boolean()
          .default(false)
          .describe(
            "Include 'Ministerul Finantelor-Actiuni Generale' (datorie publica, transferuri), exclus implicit din clasament."
          ),
        moneda: monedaSchema,
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ an, sort, limit, include_actiuni_generale, moneda }) => {
      if (!validAn(an)) return aniInvalid(an);
      const anPrecedent = String(Number(an) - 1);

      const randuri = ministere
        .filter((m) => include_actiuni_generale || !m.exclude_from_ranking)
        .map((m) => {
          const valoare = bugetMinisterAn(m, an);
          const anterior = bugetMinisterAn(m, anPrecedent);
          return { m, valoare, delta: deltaPct(anterior, valoare) };
        })
        .filter((r) => r.valoare !== null);

      const total = randuri.reduce((sum, r) => sum + r.valoare, 0);

      const ordonate = [...randuri].sort((a, b) => {
        if (sort === "buget") return b.valoare - a.valoare;
        const da = a.delta ?? (sort === "crestere" ? -Infinity : Infinity);
        const db = b.delta ?? (sort === "crestere" ? -Infinity : Infinity);
        return sort === "crestere" ? db - da : da - db;
      });

      const rows = ordonate.slice(0, limit).map((r, index) => [
        String(index + 1),
        r.m.nume,
        formatMld(convert(r.valoare, an, moneda), moneda),
        formatPct((r.valoare / total) * 100),
        formatPct(pctDinPib(r.valoare, an), 2),
        semn(r.delta),
      ]);

      const etichetaSort = {
        buget: "buget descrescator",
        crestere: `crestere ${anPrecedent} -> ${an}`,
        scadere: `scadere ${anPrecedent} -> ${an}`,
      }[sort];

      return text(
        [
          `## Ministere ${an} - ordonate dupa ${etichetaSort} (${moneda})`,
          tabel(["#", "Ordonator", "Buget", "% din total ordonatori", "% din PIB", `vs ${anPrecedent}`], rows),
          `Total ${ordonate.length} ordonatori inclusi in calcul: ${formatMld(
            convert(total, an, moneda),
            moneda
          )}. Cheltuieli totale buget de stat ${an}: ${formatMld(
            convert(overview[an]?.cheltuieli_total, an, moneda),
            moneda
          )}.`,
          include_actiuni_generale
            ? ""
            : "_'Ministerul Finantelor-Actiuni Generale' (datorie publica, transferuri catre alte bugete) este exclus; foloseste include_actiuni_generale=true pentru a-l include._",
        ]
          .filter(Boolean)
          .join("\n\n")
      );
    }
  );

  server.registerTool(
    "detalii_minister",
    {
      title: "Detalii minister",
      description:
        "Fisa completa a unui ordonator principal de credite: buget 2025/2026, istoric 2015-2026, estimari 2027-2029, " +
        "defalcare pe capitole bugetare si numarul de programe si investitii asociate. Accepta nume, cod sau acronim (ex. 'MApN', '18', 'sanatate').",
      inputSchema: {
        minister: z.string().min(2).describe("Nume, cod sau acronim al ordonatorului."),
        moneda: monedaSchema,
        include_istoric: z.boolean().default(true).describe("Include seria istorica 2015-2026."),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ minister, moneda, include_istoric }) => {
      const { minister: m, sugestii } = gasesteMinister(minister);
      if (!m) {
        return eroare(
          `Nu am gasit niciun ordonator pentru "${minister}". Incearca un nume mai lung sau foloseste lista_ministere.`
        );
      }

      const val2026 = m["2026"];
      const val2025 = m["2025"];
      const capitole = [...(m.detalii_capitol ?? [])].sort(
        (a, b) => (b["2026"] ?? 0) - (a["2026"] ?? 0)
      );

      const programeMinister = programe.filter((p) => p.ordonator_cod === m.cod);
      const numeNormalizat = normalize(m.nume);
      const investitiiMinister = investitii.filter((i) => normalize(i.ordonator) === numeNormalizat);

      const sectiuni = [
        `## ${m.nume} (cod ${m.cod})`,
        tabel(
          ["Indicator", "Valoare"],
          [
            ["Buget 2025", formatMld(convert(val2025, "2025", moneda), moneda)],
            ["Buget 2026", formatMld(convert(val2026, "2026", moneda), moneda)],
            ["Variatie 2025 -> 2026", semn(m.delta_pct ?? deltaPct(val2025, val2026), 2)],
            ["% din cheltuielile bugetului 2026", formatPct((val2026 / overview["2026"].cheltuieli_total) * 100, 2)],
            ["% din PIB 2026", formatPct(pctDinPib(val2026, "2026"), 2)],
            ["Estimare 2027", formatMld(convert(m.estimari_2027, "2026", moneda), moneda)],
            ["Estimare 2028", formatMld(convert(m.estimari_2028, "2026", moneda), moneda)],
            ["Estimare 2029", formatMld(convert(m.estimari_2029, "2026", moneda), moneda)],
            ["Programe bugetare", String(programeMinister.length)],
            ["Pozitii de investitii", String(investitiiMinister.length)],
          ]
        ),
      ];

      if (include_istoric && m.istoric) {
        const ani = Object.keys(m.istoric).sort();
        sectiuni.push(
          "### Istoric",
          tabel(
            ["An", "Buget", "vs an precedent", "% din PIB"],
            ani.map((an, index) => [
              an,
              formatMld(convert(m.istoric[an], an, moneda), moneda),
              index === 0 ? "-" : semn(deltaPct(m.istoric[ani[index - 1]], m.istoric[an])),
              formatPct(pctDinPib(m.istoric[an], an), 2),
            ])
          )
        );
      }

      if (capitole.length > 0) {
        sectiuni.push(
          "### Capitole bugetare",
          tabel(
            ["Capitol", "Denumire", "2025", "2026", "Variatie"],
            capitole.map((c) => [
              c.capitol,
              c.denumire,
              formatMld(convert(c["2025"], "2025", moneda), moneda),
              formatMld(convert(c["2026"], "2026", moneda), moneda),
              semn(deltaPct(c["2025"], c["2026"])),
            ])
          )
        );
      }

      if (m.exclude_from_ranking) {
        sectiuni.push(
          "_Acest ordonator este exclus implicit din clasamente: nu reprezinta cheltuieli proprii, ci datorie publica si transferuri._"
        );
      }
      if (sugestii.length > 0) {
        sectiuni.push(`_Alte potriviri posibile: ${sugestii.join(", ")}._`);
      }

      return text(sectiuni.join("\n\n"));
    }
  );

  server.registerTool(
    "compara_ministere",
    {
      title: "Compara ministere",
      description:
        "Compara doi sau mai multi ordonatori pe aceiasi ani, cu variatie procentuala si pondere in PIB. " +
        "Util pentru intrebari de tipul 'cat cheltuim pe aparare fata de sanatate'.",
      inputSchema: {
        ministere: z
          .array(z.string().min(2))
          .min(2)
          .max(8)
          .describe("Nume, coduri sau acronime ale ordonatorilor de comparat."),
        ani: z.array(anSchema).optional().describe("Anii de comparat; implicit 2025 si 2026."),
        moneda: monedaSchema,
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ ministere: cerute, ani, moneda }) => {
      const lista = ani?.length ? ani.map(String) : ["2025", AN_MAX];
      const necunoscut = lista.find((an) => !validAn(an));
      if (necunoscut) return aniInvalid(necunoscut);

      const gasite = [];
      const lipsa = [];
      for (const cerinta of cerute) {
        const { minister } = gasesteMinister(cerinta);
        if (minister) gasite.push(minister);
        else lipsa.push(cerinta);
      }
      if (gasite.length < 2) {
        return eroare(
          `Nu am gasit suficienti ordonatori pentru comparatie. Nepotriviti: ${lipsa.join(", ")}.`
        );
      }

      const primul = lista[0];
      const ultimul = lista[lista.length - 1];
      const rows = gasite.map((m) => {
        const valori = lista.map((an) => bugetMinisterAn(m, an));
        return [
          m.nume,
          ...valori.map((v, index) => formatMld(convert(v, lista[index], moneda), moneda)),
          semn(deltaPct(valori[0], valori[valori.length - 1])),
          formatPct(pctDinPib(valori[valori.length - 1], ultimul), 2),
        ];
      });

      const referinta = gasite[0];
      const rapoarte = gasite
        .slice(1)
        .map((m) => {
          const a = bugetMinisterAn(referinta, ultimul);
          const b = bugetMinisterAn(m, ultimul);
          if (!a || !b) return null;
          return `${referinta.nume} = ${(a / b).toFixed(2)}x ${m.nume} in ${ultimul}`;
        })
        .filter(Boolean);

      return text(
        [
          `## Comparatie ordonatori (${moneda})`,
          tabel([
            "Ordonator",
            ...lista,
            `Variatie ${primul} -> ${ultimul}`,
            `% din PIB ${ultimul}`,
          ], rows),
          rapoarte.length > 0 ? rapoarte.join("\n") : "",
          lipsa.length > 0 ? `_Nu am gasit: ${lipsa.join(", ")}._` : "",
        ]
          .filter(Boolean)
          .join("\n\n")
      );
    }
  );

  server.registerTool(
    "cauta_programe",
    {
      title: "Cauta programe bugetare",
      description:
        "Cauta in cele ~275 de programe bugetare (obiective finantate de ordonatori) dupa text si/sau ordonator, " +
        "cu realizari pana in 2024, executie 2025 si program 2026.",
      inputSchema: {
        q: z.string().optional().describe("Text cautat in denumirea programului."),
        minister: z.string().optional().describe("Filtreaza dupa ordonator (nume, cod sau acronim)."),
        limit: z.number().int().min(1).max(60).default(15),
        moneda: monedaSchema,
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ q, minister, limit, moneda }) => {
      let rezultate = programe.map((p) => ({ p, scor: 1 }));

      if (minister) {
        const { minister: m } = gasesteMinister(minister);
        if (!m) return eroare(`Nu am gasit ordonatorul "${minister}".`);
        rezultate = rezultate.filter((r) => r.p.ordonator_cod === m.cod);
      }

      if (q) {
        rezultate = rezultate
          .map((r) => ({ ...r, scor: matchScore(q, r.p.program_nume) }))
          .filter((r) => r.scor > 0);
      }

      if (rezultate.length === 0) {
        return text(`Niciun program pentru criteriile date (q=${q ?? "-"}, minister=${minister ?? "-"}).`);
      }

      const ordonate = rezultate.sort(
        (a, b) => b.scor - a.scor || (b.p.program_2026 ?? 0) - (a.p.program_2026 ?? 0)
      );

      const rows = ordonate.slice(0, limit).map(({ p }) => [
        p.program_nume,
        p.ordonator_nume,
        formatMld(convert(p.executie_2025, "2025", moneda), moneda),
        formatMld(convert(p.program_2026, "2026", moneda), moneda),
        semn(deltaPct(p.executie_2025, p.program_2026)),
      ]);

      const total2026 = ordonate.reduce((sum, { p }) => sum + (p.program_2026 ?? 0), 0);

      return text(
        [
          `## Programe bugetare (${ordonate.length} rezultate, primele ${Math.min(limit, ordonate.length)}, ${moneda})`,
          tabel(["Program", "Ordonator", "Executie 2025", "Program 2026", "Variatie"], rows),
          `Total program 2026 pentru toate rezultatele: ${formatMld(
            convert(total2026, "2026", moneda),
            moneda
          )}.`,
        ].join("\n\n")
      );
    }
  );

  server.registerTool(
    "cauta_investitii",
    {
      title: "Cauta investitii",
      description:
        "Cauta in cele ~843 de pozitii de investitii publice (obiective, dotari, active fixe) dupa text, ordonator sau sursa de finantare, " +
        "cu valoarea totala a obiectivului, cheltuit pana in 2024, preliminat 2025 si program 2026.",
      inputSchema: {
        q: z.string().optional().describe("Text cautat in denumirea indicatorului de investitii."),
        minister: z.string().optional().describe("Filtreaza dupa ordonator (nume, cod sau acronim)."),
        sursa: z
          .string()
          .optional()
          .describe(
            "Sursa de finantare, ex. 'Buget de stat', 'Fonduri externe nerambursabile', 'Credite externe'."
          ),
        limit: z.number().int().min(1).max(60).default(15),
        sort: z
          .enum(["program_2026", "total"])
          .default("program_2026")
          .describe("Ordoneaza dupa alocarea pe 2026 sau dupa valoarea totala a obiectivului."),
        moneda: monedaSchema,
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ q, minister, sursa, limit, sort, moneda }) => {
      let rezultate = investitii.map((i) => ({ i, scor: 1 }));

      if (minister) {
        const { minister: m } = gasesteMinister(minister);
        if (!m) return eroare(`Nu am gasit ordonatorul "${minister}".`);
        const numeNormalizat = normalize(m.nume);
        rezultate = rezultate.filter((r) => normalize(r.i.ordonator) === numeNormalizat);
      }

      if (sursa) {
        rezultate = rezultate.filter((r) => matchScore(sursa, r.i.sursa) >= 50);
      }

      if (q) {
        rezultate = rezultate
          .map((r) => ({ ...r, scor: matchScore(q, r.i.indicator) }))
          .filter((r) => r.scor > 0);
      }

      if (rezultate.length === 0) {
        return text(
          `Nicio investitie pentru criteriile date (q=${q ?? "-"}, minister=${minister ?? "-"}, sursa=${sursa ?? "-"}).`
        );
      }

      const ordonate = rezultate.sort(
        (a, b) => b.scor - a.scor || (b.i[sort] ?? 0) - (a.i[sort] ?? 0)
      );

      const rows = ordonate.slice(0, limit).map(({ i }) => [
        i.indicator,
        i.ordonator,
        i.sursa,
        formatMld(convert(i.total, "2026", moneda), moneda),
        formatMld(convert(i.preliminat_2025, "2025", moneda), moneda),
        formatMld(convert(i.program_2026, "2026", moneda), moneda),
      ]);

      const total2026 = ordonate.reduce((sum, { i }) => sum + (i.program_2026 ?? 0), 0);

      return text(
        [
          `## Investitii publice (${ordonate.length} rezultate, primele ${Math.min(limit, ordonate.length)}, ${moneda})`,
          tabel(
            ["Indicator", "Ordonator", "Sursa", "Valoare totala", "Preliminat 2025", "Program 2026"],
            rows
          ),
          `Total program 2026 pentru toate rezultatele: ${formatMld(
            convert(total2026, "2026", moneda),
            moneda
          )}.`,
          "_'Valoare totala' este costul intregului obiectiv de investitii, nu doar alocarea anuala._",
        ].join("\n\n")
      );
    }
  );

  server.registerTool(
    "context_macro",
    {
      title: "Context macroeconomic",
      description:
        "PIB nominal, curs BNR EUR/USD, guvernul in exercitiu si ponderea bugetului in PIB, pe ani. " +
        "Foloseste-l pentru a pune sumele bugetare in context sau pentru conversii valutare.",
      inputSchema: {
        ani: z.array(anSchema).optional().describe("Anii doriti; implicit toti anii disponibili."),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ ani }) => {
      const lista = ani?.length ? ani.map(String) : ANI;
      const necunoscut = lista.find((an) => !validAn(an));
      if (necunoscut) return aniInvalid(necunoscut);

      const rows = lista.map((an) => {
        const guvern = guvernPentruAn(an);
        const row = overview[an];
        return [
          an,
          formatMld(pib[an], "RON"),
          cursuri[an] ? cursuri[an].EUR.toFixed(4) : "-",
          cursuri[an] ? cursuri[an].USD.toFixed(4) : "-",
          formatPct(pctDinPib(row.venituri_total, an)),
          formatPct(pctDinPib(row.cheltuieli_total, an)),
          guvern ? `${guvern.premier} (${guvern.partid})` : "-",
        ];
      });

      return text(
        [
          "## Context macroeconomic",
          tabel(
            ["An", "PIB nominal", "Curs EUR", "Curs USD", "Venituri % PIB", "Cheltuieli % PIB", "Guvern"],
            rows
          ),
          `_${pib._note}_`,
          `_${cursuri._note}_`,
        ].join("\n\n")
      );
    }
  );

  server.registerTool(
    "cauta_global",
    {
      title: "Cautare globala",
      description:
        "Cauta simultan in ministere, programe bugetare si investitii. Punct de plecare cand nu stii in ce set de date " +
        "se afla raspunsul (ex. 'spitale', 'autostrada', 'digitalizare').",
      inputSchema: {
        q: z.string().min(2).describe("Text cautat."),
        limit_per_categorie: z.number().int().min(1).max(20).default(5),
        moneda: monedaSchema,
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ q, limit_per_categorie, moneda }) => {
      const min = cautaMinistere(q)
        .filter((r) => r.scor >= 50)
        .slice(0, limit_per_categorie);

      const prog = programe
        .map((p) => ({ p, scor: matchScore(q, p.program_nume) }))
        .filter((r) => r.scor > 0)
        .sort((a, b) => b.scor - a.scor || (b.p.program_2026 ?? 0) - (a.p.program_2026 ?? 0));

      const inv = investitii
        .map((i) => ({ i, scor: matchScore(q, i.indicator) }))
        .filter((r) => r.scor > 0)
        .sort((a, b) => b.scor - a.scor || (b.i.program_2026 ?? 0) - (a.i.program_2026 ?? 0));

      const sectiuni = [`## Rezultate pentru "${q}" (${moneda})`];

      sectiuni.push(
        `### Ministere (${min.length})`,
        tabel(
          ["Ordonator", "Buget 2026"],
          min.map((r) => [r.minister.nume, formatMld(convert(r.minister["2026"], "2026", moneda), moneda)])
        )
      );

      sectiuni.push(
        `### Programe bugetare (${prog.length})`,
        tabel(
          ["Program", "Ordonator", "Program 2026"],
          prog
            .slice(0, limit_per_categorie)
            .map((r) => [
              r.p.program_nume,
              r.p.ordonator_nume,
              formatMld(convert(r.p.program_2026, "2026", moneda), moneda),
            ])
        )
      );

      sectiuni.push(
        `### Investitii (${inv.length})`,
        tabel(
          ["Indicator", "Ordonator", "Program 2026"],
          inv
            .slice(0, limit_per_categorie)
            .map((r) => [
              r.i.indicator,
              r.i.ordonator,
              formatMld(convert(r.i.program_2026, "2026", moneda), moneda),
            ])
        )
      );

      if (prog.length > limit_per_categorie || inv.length > limit_per_categorie) {
        sectiuni.push(
          "_Foloseste cauta_programe sau cauta_investitii cu un limit mai mare pentru lista completa._"
        );
      }

      return text(sectiuni.join("\n\n"));
    }
  );
};

/* ------------------------------------------------------------------ */
/* Resurse                                                             */
/* ------------------------------------------------------------------ */

const RESURSE = [
  ["overview", "overview.json", "Venituri, cheltuieli si deficit pe ani (2015-2026).", overview],
  ["ministere", "ministere.json", "Buget pe ordonatori principali, istoric, estimari si capitole.", ministere],
  ["programe", "programe.json", "Programe bugetare pe ordonator.", programe],
  ["investitii", "investitii.json", "Pozitii de investitii publice pe ordonator si sursa.", investitii],
  ["pib", "pib.json", "PIB nominal anual, in RON.", pib],
  ["cursuri-valutare", "cursuri-valutare.json", "Curs BNR EUR/USD la inceputul anului.", cursuri],
  ["guverne", "guverne.json", "Guvernele si anii bugetari gestionati.", guverne],
];

export const registerResources = (server) => {
  for (const [nume, fisier, descriere, continut] of RESURSE) {
    server.registerResource(
      nume,
      `buget://${nume}`,
      { title: fisier, description: descriere, mimeType: "application/json" },
      async (uri) => ({
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(continut, null, 2),
          },
        ],
      })
    );
  }
};

/* ------------------------------------------------------------------ */
/* Prompts                                                             */
/* ------------------------------------------------------------------ */

export const registerPrompts = (server) => {
  server.registerPrompt(
    "analiza-minister",
    {
      title: "Analiza unui minister",
      description: "Analiza structurata a bugetului unui ordonator, cu context macro si programe.",
      argsSchema: { minister: z.string().describe("Nume, cod sau acronim al ordonatorului.") },
    },
    ({ minister }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text:
              `Analizeaza bugetul pentru "${minister}" folosind tools-urile serverului bugetul-romaniei.\n\n` +
              "Pasi:\n" +
              "1. detalii_minister pentru fisa completa si evolutia istorica.\n" +
              "2. cauta_programe si cauta_investitii filtrate pe acest ordonator, pentru a vedea unde se duc banii.\n" +
              "3. context_macro pentru a raporta sumele la PIB si la guvernul in exercitiu.\n\n" +
              "Scrie apoi o analiza in romana: cat primeste, cum a evoluat, ce pondere are, ce se finanteaza efectiv " +
              "si ce se schimba in 2026. Citeaza cifrele in mld lei si mentioneaza incertitudinile (estimari vs. executie).",
          },
        },
      ],
    })
  );

  server.registerPrompt(
    "raport-deficit",
    {
      title: "Raport deficit bugetar",
      description: "Raport despre evolutia deficitului si a ponderii lui in PIB.",
      argsSchema: {
        de_la: z.string().optional().describe(`An de start (implicit ${AN_MIN}).`),
        pana_la: z.string().optional().describe(`An de final (implicit ${AN_MAX}).`),
      },
    },
    ({ de_la, pana_la }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text:
              `Realizeaza un raport despre deficitul bugetului de stat intre ${de_la || AN_MIN} si ${pana_la || AN_MAX}.\n\n` +
              "Foloseste overview_buget pentru serii si context_macro pentru PIB si guverne. " +
              "Explica: cum a evoluat deficitul nominal si ca procent din PIB, in ce ani a crescut cel mai mult, " +
              "ce guverne au gestionat acele bugete si care sunt cele mai mari cresteri de cheltuieli " +
              "(foloseste lista_ministere cu sort='crestere'). Raspunde in romana, factual, fara speculatii politice.",
          },
        },
      ],
    })
  );
};
