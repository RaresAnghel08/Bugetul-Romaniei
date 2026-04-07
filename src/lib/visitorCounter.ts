export interface VisitorSnapshot {
  pageviews: number | null;
  uniqueVisitors: number | null;
  localVisits: number;
  firstVisitIso: string | null;
  lastVisitIso: string | null;
  source: "live" | "fallback";
}

const configuredCounterBaseUrl = import.meta.env.VITE_COUNTER_BASE_URL?.trim();
const COUNTER_BASE_URL =
  configuredCounterBaseUrl && configuredCounterBaseUrl.startsWith("/")
    ? configuredCounterBaseUrl
    : "/api/counter";

const STORAGE = {
  pageviews: "buget.pageviews",
  localVisits: "buget.localVisits",
  firstVisitIso: "buget.firstVisitIso",
  lastVisitIso: "buget.lastVisitIso",
} as const;

const REQUEST_TIMEOUT_MS = 4500;
const REQUEST_RETRIES = 3;

let trackedInCurrentRuntime = false;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

const withRetries = async <T>(action: () => Promise<T>, attempts = REQUEST_RETRIES): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await sleep(220 * attempt);
      }
    }
  }

  throw (lastError ?? new Error("Counter request failed"));
};

const readNumber = (key: string): number => {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return 0;
  }

  const num = Number(raw);
  return Number.isFinite(num) ? num : 0;
};

const writeNumber = (key: string, value: number | null): void => {
  if (value === null || !Number.isFinite(value)) {
    return;
  }
  localStorage.setItem(key, String(Math.trunc(value)));
};

const readCounterValue = (payload: unknown): number | null => {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const directValue = (payload as { value?: unknown }).value;
  if (typeof directValue === "number" && Number.isFinite(directValue)) {
    return directValue;
  }
  if (typeof directValue === "string") {
    const parsed = Number(directValue);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  const nested = (payload as { data?: { value?: unknown } }).data?.value;
  if (typeof nested === "number" && Number.isFinite(nested)) {
    return nested;
  }
  if (typeof nested === "string") {
    const parsed = Number(nested);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  const upCount = (payload as { data?: { up_count?: unknown } }).data?.up_count;
  if (typeof upCount === "number" && Number.isFinite(upCount)) {
    return upCount;
  }
  if (typeof upCount === "string") {
    const parsed = Number(upCount);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
};

const requestCounter = async (suffix: "" | "/up"): Promise<unknown | null> => {
  const separator = COUNTER_BASE_URL.includes("?") ? "&" : "?";
  const noCacheUrl = `${COUNTER_BASE_URL}${suffix}${separator}ts=${Date.now()}`;

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(noCacheUrl, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }

  const rawBody = await response.text();

  if (!response.ok) {
    const snippet = rawBody.slice(0, 140).replace(/\s+/g, " ").trim();
    throw new Error(`CounterAPI request failed (${response.status}) ${snippet}`);
  }

  if (!rawBody.trim()) {
    return null;
  }

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    return null;
  }
};

const getCurrentCount = async (): Promise<number | null> => {
  const payload = await requestCounter("");
  const value = readCounterValue(payload);

  if (value !== null) {
    return value;
  }

  throw new Error("CounterAPI returned empty value for current count");
};

const incrementCounter = async (): Promise<number | null> => {
  const payload = await requestCounter("/up");
  const value = readCounterValue(payload);

  if (value !== null) {
    return value;
  }

  return getCurrentCount();
};

export const getVisitorSnapshotFromStorage = (): VisitorSnapshot => {
  const localVisits = readNumber(STORAGE.localVisits);
  const pageviews = Math.max(readNumber(STORAGE.pageviews), localVisits);

  return {
    pageviews,
    uniqueVisitors: null,
    localVisits,
    firstVisitIso: localStorage.getItem(STORAGE.firstVisitIso),
    lastVisitIso: localStorage.getItem(STORAGE.lastVisitIso),
    source: "fallback",
  };
};

export const trackSiteVisit = async (): Promise<VisitorSnapshot> => {
  if (trackedInCurrentRuntime) {
    return refreshVisitorSnapshot();
  }
  trackedInCurrentRuntime = true;

  const nowIso = new Date().toISOString();

  const localVisits = readNumber(STORAGE.localVisits) + 1;
  localStorage.setItem(STORAGE.localVisits, String(localVisits));

  // Always increment a local pageview counter so blocked devices still show progress.
  const localPageviews = readNumber(STORAGE.pageviews) + 1;
  writeNumber(STORAGE.pageviews, localPageviews);

  if (!localStorage.getItem(STORAGE.firstVisitIso)) {
    localStorage.setItem(STORAGE.firstVisitIso, nowIso);
  }
  localStorage.setItem(STORAGE.lastVisitIso, nowIso);

  try {
    const pageviewsHit = await withRetries(() => incrementCounter());
    const pageviews = pageviewsHit ?? (await withRetries(() => getCurrentCount()));
    const stablePageviews = Math.max(localPageviews, pageviews ?? localPageviews);

    writeNumber(STORAGE.pageviews, stablePageviews);

    return {
      pageviews: stablePageviews,
      uniqueVisitors: null,
      localVisits,
      firstVisitIso: localStorage.getItem(STORAGE.firstVisitIso),
      lastVisitIso: nowIso,
      source: "live",
    };
  } catch {
    return {
      pageviews: localPageviews,
      uniqueVisitors: null,
      localVisits,
      firstVisitIso: localStorage.getItem(STORAGE.firstVisitIso),
      lastVisitIso: nowIso,
      source: "fallback",
    };
  }
};

export const refreshVisitorSnapshot = async (): Promise<VisitorSnapshot> => {
  const fallback = getVisitorSnapshotFromStorage();

  try {
    const pageviews = await withRetries(() => getCurrentCount());
    const stablePageviews = Math.max(fallback.pageviews ?? 0, pageviews ?? 0);

    writeNumber(STORAGE.pageviews, stablePageviews);

    return {
      ...fallback,
      pageviews: stablePageviews,
      uniqueVisitors: null,
      source: "live",
    };
  } catch {
    return fallback;
  }
};
