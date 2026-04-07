import fs from "node:fs";
import path from "node:path";

const ENV_PATH = path.resolve(process.cwd(), ".env");

const parseEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const entries = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const eq = trimmed.indexOf("=");
    if (eq <= 0) {
      continue;
    }

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    entries[key] = value;
  }

  return entries;
};

const envFile = parseEnvFile(ENV_PATH);

const env = (key) => process.env[key] || envFile[key] || "";

const parseArgs = (argv) => {
  const result = {
    n: 1,
    mode: "both",
    baseUrl: "",
    token: "",
    delayMs: 0,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if ((arg === "--n" || arg === "-n") && argv[i + 1]) {
      result.n = Number(argv[++i]);
      continue;
    }

    if (arg === "--mode" && argv[i + 1]) {
      result.mode = argv[++i].toLowerCase();
      continue;
    }

    if (arg === "--base-url" && argv[i + 1]) {
      result.baseUrl = argv[++i];
      continue;
    }

    if (arg === "--token" && argv[i + 1]) {
      result.token = argv[++i];
      continue;
    }

    if (arg === "--delay-ms" && argv[i + 1]) {
      result.delayMs = Number(argv[++i]);
      continue;
    }
  }

  return result;
};

const args = parseArgs(process.argv.slice(2));

const workspace = env("COUNTER_WORKSPACE") || env("VITE_COUNTER_WORKSPACE") || "rares-anghels-team-3633";
const counterName = env("COUNTER_NAME") || env("VITE_COUNTER_NAME") || "mycountrar";
const fallbackBaseUrl = `https://api.counterapi.dev/v2/${workspace}/${counterName}`;

let configuredBaseUrl = args.baseUrl || env("COUNTER_BASE_URL") || env("VITE_COUNTER_BASE_URL") || "";
if (!configuredBaseUrl || configuredBaseUrl.startsWith("/")) {
  configuredBaseUrl = fallbackBaseUrl;
}

const token = args.token || env("COUNTER_API") || env("VITE_COUNTER_API");

const usage = () => {
  console.log("Usage: node scripts/counter-batch.mjs --n <number> [--mode up|down|both] [--delay-ms 0]");
  console.log("Examples:");
  console.log("  node scripts/counter-batch.mjs --n 5 --mode both");
  console.log("  node scripts/counter-batch.mjs --n 10 --mode up");
  console.log("  node scripts/counter-batch.mjs --n 3 --mode down --delay-ms 120");
};

if (!Number.isInteger(args.n) || args.n <= 0) {
  console.error("Error: --n must be a positive integer.");
  usage();
  process.exit(1);
}

if (!["up", "down", "both"].includes(args.mode)) {
  console.error("Error: --mode must be one of up|down|both.");
  usage();
  process.exit(1);
}

if (!token) {
  console.error("Error: missing COUNTER_API token (or pass --token).\n");
  console.error("Expected one of: COUNTER_API, VITE_COUNTER_API, or --token argument.");
  process.exit(1);
}

const normalizeBaseUrl = (url) => url.replace(/\/+$/, "");
const baseUrl = normalizeBaseUrl(configuredBaseUrl);

const sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const requestCounter = async (suffix = "") => {
  const separator = baseUrl.includes("?") ? "&" : "?";
  const url = `${baseUrl}${suffix}${separator}ts=${Date.now()}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  const raw = await res.text();

  if (!res.ok) {
    const snippet = raw.slice(0, 200).replace(/\s+/g, " ").trim();
    throw new Error(`HTTP ${res.status} ${snippet}`);
  }

  if (!raw.trim()) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const getNumeric = (payload, keys) => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  for (const keyPath of keys) {
    const parts = keyPath.split(".");
    let cur = payload;
    let ok = true;

    for (const p of parts) {
      if (!cur || typeof cur !== "object" || !(p in cur)) {
        ok = false;
        break;
      }
      cur = cur[p];
    }

    if (!ok) {
      continue;
    }

    if (typeof cur === "number" && Number.isFinite(cur)) {
      return cur;
    }

    if (typeof cur === "string") {
      const parsed = Number(cur);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
};

const runBatch = async (kind, n, delayMs) => {
  const suffix = kind === "up" ? "/up" : "/down";

  console.log(`Running ${kind.toUpperCase()} x${n} on ${baseUrl}`);

  for (let i = 1; i <= n; i += 1) {
    const payload = await requestCounter(suffix);
    const upCount = getNumeric(payload, ["data.up_count", "up_count"]);
    const downCount = getNumeric(payload, ["data.down_count", "down_count"]);
    console.log(`${kind} ${i}/${n} -> up_count=${upCount ?? "?"}, down_count=${downCount ?? "?"}`);

    if (delayMs > 0 && i < n) {
      await sleep(delayMs);
    }
  }
};

const main = async () => {
  console.log(`Base URL: ${baseUrl}`);

  if (args.mode === "both" || args.mode === "down") {
    await runBatch("down", args.n, args.delayMs);
  }

  if (args.mode === "both" || args.mode === "up") {
    await runBatch("up", args.n, args.delayMs);
  }

  const finalPayload = await requestCounter("");
  const finalUp = getNumeric(finalPayload, ["data.up_count", "up_count", "data.value", "value"]);
  const finalDown = getNumeric(finalPayload, ["data.down_count", "down_count"]);
  console.log(`Final snapshot -> up_count=${finalUp ?? "?"}, down_count=${finalDown ?? "?"}`);
};

main().catch((error) => {
  console.error("counter-batch failed:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
