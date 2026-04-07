/// <reference types="node" />

const COUNTER_WORKSPACE =
  process.env.COUNTER_WORKSPACE || process.env.VITE_COUNTER_WORKSPACE || "rares-anghels-team-3633";
const COUNTER_NAME = process.env.COUNTER_NAME || process.env.VITE_COUNTER_NAME || "mycountrar";

const getCounterToken = (): string =>
  (process.env.COUNTER_API || process.env.VITE_COUNTER_API || "").trim();

const buildCounterUrl = (suffix: "" | "/up"): string =>
  `https://api.counterapi.dev/v2/${COUNTER_WORKSPACE}/${COUNTER_NAME}${suffix}`;

const proxyCounter = async (res: any, suffix: "" | "/up"): Promise<void> => {
  const token = getCounterToken();

  res.setHeader("Cache-Control", "no-store");

  if (!token) {
    res.status(500).json({
      code: 500,
      message: "COUNTER_API is not configured on server",
    });
    return;
  }

  try {
    const upstream = await fetch(buildCounterUrl(suffix), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const responseText = await upstream.text();
    const contentType = upstream.headers.get("content-type");

    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }

    if (!upstream.ok) {
      res.status(upstream.status).send(responseText || "CounterAPI upstream error");
      return;
    }

    if (!responseText.trim()) {
      res.status(upstream.status === 204 ? 204 : 200).end();
      return;
    }

    res.status(upstream.status).send(responseText);
  } catch {
    res.status(502).json({
      code: 502,
      message: "Failed to reach CounterAPI upstream",
    });
  }
};

export default async function handler(req: any, res: any): Promise<void> {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  await proxyCounter(res, "");
}
