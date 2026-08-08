# Server MCP - Bugetul Romaniei

Server [Model Context Protocol](https://modelcontextprotocol.io) care expune datele bugetului de stat
al Romaniei (2015-2026) catre asistenti AI: Claude Code, Claude Desktop, Cursor, VS Code sau orice
alt client MCP.

Citeste aceleasi fisiere din `data/` pe care le foloseste dashboard-ul, deci datele raman
sincronizate automat dupa fiecare rulare a `python scripts/parse.py`.

Serverul are doua transporturi, peste exact aceleasi tools:

| Transport | Unde ruleaza | Cand il folosesti |
| --- | --- | --- |
| **HTTP** (`https://bugetul-romaniei.com/api/mcp`) | functie Vercel, `api/mcp.mjs` | conectare din claude.ai, Claude Desktop, Claude Code - nu cere instalare |
| **stdio** (`mcp/server.mjs`) | local, pe masina ta | dezvoltare si testare inainte de deploy |

## Conectare la Claude

### claude.ai (browser) si Claude Desktop

Settings → Connectors → **Add custom connector**:

- Name: `Bugetul Romaniei`
- URL: `https://bugetul-romaniei.com/api/mcp`

Nu cere autentificare. Dupa adaugare, tool-urile apar in meniul de atasamente al conversatiei.

### Claude Code

```bash
claude mcp add --transport http --scope user bugetul-romaniei https://bugetul-romaniei.com/api/mcp
```

`--scope user` il face disponibil in toate proiectele tale. Verificare: `/mcp` in Claude Code.

### Cursor / alt client MCP cu suport HTTP

```json
{
  "mcpServers": {
    "bugetul-romaniei": {
      "type": "http",
      "url": "https://bugetul-romaniei.com/api/mcp"
    }
  }
}
```

### Local, pe stdio

`.mcp.json` din radacina proiectului configureaza deja varianta locala pentru Claude Code. Pentru
alt client:

```json
{
  "mcpServers": {
    "bugetul-romaniei": {
      "command": "node",
      "args": ["D:/GITHUB/Bugetul-Romaniei/mcp/server.mjs"]
    }
  }
}
```

## Dezvoltare

Dependintele sunt in `package.json` din radacina proiectului, ca sa fie disponibile si functiei
Vercel:

```bash
npm install        # in radacina, o singura data
npm run mcp        # server pe stdio
npm test --prefix mcp   # ambele suite de teste
npm run inspect --prefix mcp   # MCP Inspector, interfata web de testare manuala
```

Testele: `test/smoke.mjs` porneste serverul pe stdio si apeleaza fiecare tool, resursa si prompt;
`test/http.mjs` monteaza handler-ul Vercel intr-un server Node si il apeleaza cu un client MCP real,
verificand si CORS, raspunsul la GET si erorile de protocol.

## Tools

| Tool | Ce face |
| --- | --- |
| `overview_buget` | Venituri, cheltuieli, deficit pe ani, cu deficit ca % din PIB si guvernul in exercitiu. |
| `lista_ministere` | Clasamentul ordonatorilor dupa buget, crestere sau scadere, cu pondere in total si in PIB. |
| `detalii_minister` | Fisa unui ordonator: 2025/2026, istoric 2015-2026, estimari 2027-2029, capitole bugetare. |
| `compara_ministere` | Compara 2-8 ordonatori pe aceiasi ani, cu variatii si raporturi intre ei. |
| `cauta_programe` | Cauta in cele ~275 de programe bugetare, dupa text si/sau ordonator. |
| `cauta_investitii` | Cauta in cele ~843 de pozitii de investitii, dupa text, ordonator sau sursa de finantare. |
| `context_macro` | PIB nominal, curs BNR EUR/USD, guvern, ponderi buget in PIB. |
| `cauta_global` | Cautare simultana in ministere, programe si investitii. |

Toate tool-urile accepta `moneda` (`RON`, `EUR`, `USD`). Conversia foloseste cursul BNR de la
inceputul anului respectiv, deci seriile multianuale in valuta includ si efectul cursului.

Ordonatorii pot fi indicati prin nume, cod sau acronim, cu tolerata la diacritice si flexiune:
`"MApN"`, `"18"`, `"aparare"` si `"Ministerul Apărării Naționale"` duc la aceeasi fisa.

## Resurse

Datele brute, ca JSON: `buget://overview`, `buget://ministere`, `buget://programe`,
`buget://investitii`, `buget://pib`, `buget://cursuri-valutare`, `buget://guverne`.

## Prompts

- `analiza-minister` - analiza structurata a unui ordonator (buget, evolutie, programe, investitii).
- `raport-deficit` - raport despre evolutia deficitului si a ponderii lui in PIB.

## Note de interpretare

- 2026 este buget aprobat, 2025 executie preliminata, 2027-2029 estimari din Strategia Fiscal-Bugetara.
- `Ministerul Finantelor-Actiuni Generale` nu e un minister obisnuit (datorie publica si transferuri
  catre alte bugete) si este exclus implicit din clasamente; include-l cu
  `include_actiuni_generale: true`.
- Suma ordonatorilor nu egaleaza cheltuielile totale ale bugetului de stat: exista transferuri intre
  bugete si pozitii care nu apar defalcate pe ordonatori.
- `total` la investitii este costul intregului obiectiv, nu alocarea anuala.

## Structura

```
api/mcp.mjs         # endpoint HTTP (Streamable HTTP, stateless) rulat ca functie Vercel
mcp/
  server.mjs        # acelasi server, pe transport stdio, pentru rulare locala
  lib/server.mjs    # createServer(): instanta MCP comuna celor doua transporturi
  lib/data.mjs      # incarcare date, normalizare text, cautari, conversii valutare
  lib/tools.mjs     # definitii tools, resurse si prompts
  test/smoke.mjs    # test end-to-end pe stdio
  test/http.mjs     # test end-to-end pe HTTP, peste handler-ul Vercel
```

Endpointul HTTP este stateless: fiecare request primeste o instanta noua de server, pentru ca
invocarile serverless nu impart memorie. Doar `POST` este acceptat; `GET` raspunde `405`, ca sa nu
tina o functie deschisa pe un stream SSE care oricum nu ar transmite nimic.

Datele sunt importate static (`import ... with { type: "json" }`), nu citite cu `fs`, pentru ca
bundler-ul Vercel sa le urmareasca si sa le includa in functie.
