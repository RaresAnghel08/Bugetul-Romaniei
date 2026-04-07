import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const rootDir = process.cwd();
const publicDir = resolve(rootDir, "public");
const ministerePath = resolve(rootDir, "data", "ministere.json");

const siteUrl = (process.env.SITE_URL || process.env.VITE_SITE_URL || "https://bugetul-romaniei.vercel.app").replace(
  /\/+$/,
  ""
);

const today = new Date().toISOString().slice(0, 10);

const staticRoutes = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/overview", priority: "0.9", changefreq: "weekly" },
  { path: "/ministere", priority: "0.9", changefreq: "weekly" },
  { path: "/investitii", priority: "0.9", changefreq: "weekly" },
];

const toAbsoluteUrl = (path) => {
  if (path === "/") {
    return `${siteUrl}/`;
  }
  return `${siteUrl}${path}`;
};

const escapeXml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const run = async () => {
  const raw = await readFile(ministerePath, "utf8");
  const ministere = JSON.parse(raw);

  const ministryCodes = [...new Set(ministere.map((item) => String(item.cod).trim()))].filter(Boolean);
  const ministryRoutes = ministryCodes.map((cod) => ({
    path: `/minister/${encodeURIComponent(cod)}`,
    priority: "0.7",
    changefreq: "weekly",
  }));

  const routes = [...staticRoutes, ...ministryRoutes];

  const urlEntries = routes
    .map(
      (route) => `  <url>\n    <loc>${escapeXml(toAbsoluteUrl(route.path))}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${route.changefreq}</changefreq>\n    <priority>${route.priority}</priority>\n  </url>`
    )
    .join("\n");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>\n`;

  const robots = `User-agent: *\nAllow: /\n\nSitemap: ${toAbsoluteUrl("/sitemap.xml")}\n`;

  await mkdir(publicDir, { recursive: true });
  await writeFile(resolve(publicDir, "sitemap.xml"), sitemap, "utf8");
  await writeFile(resolve(publicDir, "robots.txt"), robots, "utf8");

  console.log(`Generated sitemap with ${routes.length} URLs at public/sitemap.xml`);
};

run().catch((error) => {
  console.error("Failed to generate sitemap:", error);
  process.exitCode = 1;
});
