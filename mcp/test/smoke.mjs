/**
 * Smoke test: porneste serverul pe stdio si apeleaza fiecare tool, resursa si prompt.
 * Ruleaza cu `npm test` din folderul mcp/.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const here = dirname(fileURLToPath(import.meta.url));
const serverPath = join(here, "..", "server.mjs");

let esecuri = 0;

const verifica = (nume, conditie, detaliu = "") => {
  if (conditie) {
    console.log(`  ok   ${nume}`);
  } else {
    esecuri += 1;
    console.log(`  FAIL ${nume}${detaliu ? ` -> ${detaliu}` : ""}`);
  }
};

const apel = async (client, nume, args) => {
  const rezultat = await client.callTool({ name: nume, arguments: args });
  const continut = rezultat.content?.[0]?.text ?? "";
  verifica(
    `${nume}(${JSON.stringify(args)})`,
    !rezultat.isError && continut.length > 0,
    rezultat.isError ? continut.slice(0, 120) : "raspuns gol"
  );
  return continut;
};

const client = new Client({ name: "smoke-test", version: "1.0.0" });
const transport = new StdioClientTransport({ command: process.execPath, args: [serverPath] });
await client.connect(transport);

const { tools } = await client.listTools();
console.log(`Tools inregistrate: ${tools.map((t) => t.name).join(", ")}\n`);
verifica("toate tool-urile au descriere", tools.every((t) => t.description?.length > 20));

console.log("\nApeluri:");
const overviewText = await apel(client, "overview_buget", { ani: ["2025", "2026"], moneda: "RON" });
verifica("overview contine deficitul 2026", overviewText.includes("2026"));

await apel(client, "overview_buget", { moneda: "EUR" });
await apel(client, "lista_ministere", { an: "2026", sort: "buget", limit: 5 });
await apel(client, "lista_ministere", { an: "2026", sort: "crestere", limit: 5 });
await apel(client, "lista_ministere", { an: "2020", sort: "scadere", limit: 5, moneda: "USD" });

const mapn = await apel(client, "detalii_minister", { minister: "MApN" });
verifica("acronimul MApN duce la Apararii", mapn.includes("Apararii"));

await apel(client, "detalii_minister", { minister: "sanatate", moneda: "EUR", include_istoric: false });
await apel(client, "compara_ministere", { ministere: ["aparare", "sanatate", "educatie"] });
await apel(client, "cauta_programe", { q: "sanatate", limit: 5 });
await apel(client, "cauta_programe", { minister: "18", limit: 5 });
const spitale = await apel(client, "cauta_investitii", { q: "spitale", limit: 5 });
verifica("cautarea de investitii returneaza randuri", spitale.includes("| Ministerul"));
const transporturi = await apel(client, "cauta_investitii", {
  minister: "transporturi",
  sursa: "Buget de stat",
  limit: 5,
});
verifica("filtrul pe ordonator se aplica", !transporturi.includes("Ministerul Sanatatii"));
const fara = await apel(client, "cauta_investitii", { q: "xyzq", limit: 5 });
verifica("cautare fara rezultate returneaza mesaj explicit", fara.includes("Nicio investitie"));
await apel(client, "context_macro", { ani: ["2024", "2025", "2026"] });
await apel(client, "cauta_global", { q: "digitalizare" });

console.log("\nErori asteptate:");
const anGresit = await client.callTool({ name: "overview_buget", arguments: { ani: ["1999"] } });
verifica("an inexistent -> isError", anGresit.isError === true);
const ministerGresit = await client.callTool({
  name: "detalii_minister",
  arguments: { minister: "zzzz" },
});
verifica("minister inexistent -> isError", ministerGresit.isError === true);

console.log("\nResurse:");
const { resources } = await client.listResources();
verifica("7 resurse inregistrate", resources.length === 7, `gasite ${resources.length}`);
for (const resursa of resources) {
  const citit = await client.readResource({ uri: resursa.uri });
  const payload = citit.contents?.[0]?.text ?? "";
  let parsabil = false;
  try {
    JSON.parse(payload);
    parsabil = true;
  } catch {
    parsabil = false;
  }
  verifica(`${resursa.uri} returneaza JSON valid`, parsabil);
}

console.log("\nPrompts:");
const { prompts } = await client.listPrompts();
verifica("2 prompts inregistrate", prompts.length === 2, `gasite ${prompts.length}`);
const prompt = await client.getPrompt({
  name: "analiza-minister",
  arguments: { minister: "Ministerul Sanatatii" },
});
verifica(
  "analiza-minister interpoleaza argumentul",
  prompt.messages[0].content.text.includes("Ministerul Sanatatii")
);

await client.close();

console.log(esecuri === 0 ? "\nToate verificarile au trecut." : `\n${esecuri} verificari au esuat.`);
process.exit(esecuri === 0 ? 0 : 1);
