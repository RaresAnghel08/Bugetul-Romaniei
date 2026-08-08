import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { AN_MAX, AN_MIN } from "./data.mjs";
import { registerPrompts, registerResources, registerTools } from "./tools.mjs";

export const NUME_SERVER = "bugetul-romaniei";
export const VERSIUNE_SERVER = "1.0.0";

const INSTRUCTIUNI =
  `Server cu datele oficiale ale bugetului de stat al Romaniei, ${AN_MIN}-${AN_MAX}, ` +
  "extrase din XML-urile Ministerului Finantelor.\n\n" +
  "Toate sumele sunt in RON (lei) daca nu se cere alta moneda; conversia EUR/USD foloseste cursul BNR " +
  "de la inceputul anului respectiv, deci comparatiile multianuale in valuta includ efectul cursului.\n\n" +
  "Ghid: overview_buget pentru totaluri si deficit, lista_ministere pentru clasamente, detalii_minister " +
  "pentru fisa unui ordonator, compara_ministere pentru comparatii, cauta_programe si cauta_investitii " +
  "pentru detalii de cheltuiala, context_macro pentru PIB/curs/guvern, cauta_global cand nu stii unde sa cauti.\n\n" +
  "Atentie la interpretare: 2026 este buget aprobat, 2025 este executie preliminata, 2027-2029 sunt estimari. " +
  "'Ministerul Finantelor-Actiuni Generale' nu e un minister obisnuit (datorie publica si transferuri) si este " +
  "exclus implicit din clasamente.";

/**
 * Construieste o instanta noua de server MCP, cu tools, resurse si prompts inregistrate.
 * Se creeaza cate una per conexiune: pe stdio o singura data, pe HTTP la fiecare request.
 */
export const createServer = () => {
  const server = new McpServer(
    { name: NUME_SERVER, version: VERSIUNE_SERVER },
    {
      capabilities: { tools: {}, resources: {}, prompts: {} },
      instructions: INSTRUCTIUNI,
    }
  );

  registerTools(server);
  registerResources(server);
  registerPrompts(server);

  return server;
};
