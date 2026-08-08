/**
 * Test pentru endpointul HTTP din api/mcp.mjs.
 *
 * Monteaza handler-ul Vercel intr-un server Node obisnuit si il apeleaza cu un client MCP real,
 * peste Streamable HTTP. Body-ul JSON este parsat inainte de handler, exact cum face Vercel.
 */
import { createServer as createHttpServer } from "node:http";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

import handler from "../../api/mcp.mjs";

let esecuri = 0;

const verifica = (nume, conditie, detaliu = "") => {
  if (conditie) {
    console.log(`  ok   ${nume}`);
  } else {
    esecuri += 1;
    console.log(`  FAIL ${nume}${detaliu ? ` -> ${detaliu}` : ""}`);
  }
};

const citesteBody = (req) =>
  new Promise((resolve) => {
    const bucati = [];
    req.on("data", (bucata) => bucati.push(bucata));
    req.on("end", () => {
      const brut = Buffer.concat(bucati).toString("utf8");
      if (!brut) return resolve(undefined);
      try {
        resolve(JSON.parse(brut));
      } catch {
        resolve(brut);
      }
    });
  });

const http = createHttpServer(async (req, res) => {
  if (req.method === "POST" || req.method === "PUT") {
    req.body = await citesteBody(req);
  }
  await handler(req, res);
});

await new Promise((resolve) => http.listen(0, "127.0.0.1", resolve));
const url = new URL(`http://127.0.0.1:${http.address().port}/api/mcp`);
console.log(`Endpoint local: ${url.href}\n`);

const client = new Client({ name: "http-test", version: "1.0.0" });
await client.connect(new StreamableHTTPClientTransport(url));

const server = client.getServerVersion();
verifica("handshake initialize", server?.name === "bugetul-romaniei", JSON.stringify(server));
verifica("instructiuni trimise clientului", (client.getInstructions() ?? "").includes("BNR"));

const { tools } = await client.listTools();
verifica("8 tools peste HTTP", tools.length === 8, `gasite ${tools.length}`);

const rezultat = await client.callTool({
  name: "detalii_minister",
  arguments: { minister: "MApN", moneda: "EUR" },
});
const continut = rezultat.content?.[0]?.text ?? "";
verifica("apel de tool peste HTTP", !rezultat.isError && continut.includes("Apararii"));
verifica("conversia valutara se aplica", continut.includes("EUR"));

const { resources } = await client.listResources();
verifica("resurse peste HTTP", resources.length === 7, `gasite ${resources.length}`);
const resursa = await client.readResource({ uri: "buget://overview" });
verifica("citire resursa peste HTTP", (resursa.contents?.[0]?.text ?? "").includes("venituri_total"));

const { prompts } = await client.listPrompts();
verifica("prompts peste HTTP", prompts.length === 2, `gasite ${prompts.length}`);

await client.close();

console.log("\nVerificari de protocol:");

const preflight = await fetch(url, {
  method: "OPTIONS",
  headers: { Origin: "https://claude.ai", "Access-Control-Request-Method": "POST" },
});
verifica("OPTIONS returneaza 204", preflight.status === 204, `status ${preflight.status}`);
verifica(
  "CORS permite orice origine",
  preflight.headers.get("access-control-allow-origin") === "*"
);

const getFaraSesiune = await fetch(url, { method: "GET", headers: { Accept: "text/event-stream" } });
verifica(
  "GET fara sesiune este respins (stateless)",
  getFaraSesiune.status === 405,
  `status ${getFaraSesiune.status}`
);

const jsonInvalid = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
  body: JSON.stringify({ nu: "e jsonrpc" }),
});
verifica(
  "payload invalid returneaza 4xx",
  jsonInvalid.status >= 400 && jsonInvalid.status < 500,
  `status ${jsonInvalid.status}`
);

http.close();

console.log(esecuri === 0 ? "\nToate verificarile au trecut." : `\n${esecuri} verificari au esuat.`);
process.exit(esecuri === 0 ? 0 : 1);
