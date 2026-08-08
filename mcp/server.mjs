#!/usr/bin/env node
/**
 * Server MCP pe stdio, pentru rulare locala (Claude Desktop, Cursor, `claude mcp add`).
 * Varianta remote, peste HTTP, este in api/mcp.mjs si foloseste acelasi createServer().
 */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { createServer } from "./lib/server.mjs";

const server = createServer();
await server.connect(new StdioServerTransport());
