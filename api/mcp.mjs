/**
 * Endpoint MCP remote (Streamable HTTP), rulat ca functie Vercel la /api/mcp.
 *
 * Functioneaza stateless: fiecare request primeste o instanta noua de server si de transport,
 * pentru ca invocarile serverless nu impart memorie intre ele. Datele sunt read-only, deci
 * nu exista stare de pastrat intre apeluri.
 */
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { createServer } from "../mcp/lib/server.mjs";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Accept, Authorization, Last-Event-ID, MCP-Session-Id, MCP-Protocol-Version",
  "Access-Control-Expose-Headers": "MCP-Session-Id, MCP-Protocol-Version",
  "Access-Control-Max-Age": "86400",
};

export default async function handler(req, res) {
  for (const [cheie, valoare] of Object.entries(CORS)) {
    res.setHeader(cheie, valoare);
  }

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  /*
   * In stateless mode nu exista notificari initiate de server si nici sesiuni de inchis, deci
   * stream-ul SSE deschis de GET ar tine functia ocupata pana la timeout, fara sa transmita nimic.
   * Raspunsul 405 este permis de specificatie si spune clientului sa foloseasca doar POST.
   */
  if (req.method === "GET" || req.method === "HEAD" || req.method === "DELETE") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST, OPTIONS");
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Method Not Allowed: acest server MCP accepta doar POST (stateless).",
        },
        id: null,
      })
    );
    return;
  }

  const server = createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  res.on("close", () => {
    transport.close().catch(() => {});
    server.close().catch(() => {});
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (eroare) {
    console.error("[mcp] request esuat:", eroare);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Eroare interna a serverului MCP." },
          id: null,
        })
      );
    }
  }
}
