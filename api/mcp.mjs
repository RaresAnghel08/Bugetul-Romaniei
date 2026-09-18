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

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 60;

/*
 * Fereastra fixa in memorie, per instanta serverless "warm" — nu e distribuita si se reseteaza
 * la cold start, dar e suficienta ca prima linie de aparare impotriva unui singur client care
 * bombardeaza endpoint-ul, fara sa adauge o dependinta externa (Redis) la scara acestui proiect.
 */
const requestLog = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  const timestamps = (requestLog.get(ip) ?? []).filter((t) => t > windowStart);
  timestamps.push(now);
  requestLog.set(ip, timestamps);

  if (requestLog.size > 5000) {
    for (const [key, value] of requestLog) {
      if (value.every((t) => t <= windowStart)) requestLog.delete(key);
    }
  }

  return timestamps.length > RATE_LIMIT_MAX_REQUESTS;
}

export default async function handler(req, res) {
  for (const [cheie, valoare] of Object.entries(CORS)) {
    res.setHeader(cheie, valoare);
  }

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const ip = (req.headers["x-forwarded-for"] ?? req.socket?.remoteAddress ?? "unknown").split(",")[0].trim();
  if (isRateLimited(ip)) {
    res.statusCode = 429;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Retry-After", "60");
    res.end(
      JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Too Many Requests: limita este de 60 cereri/minut per IP." },
        id: null,
      })
    );
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
