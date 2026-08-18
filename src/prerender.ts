import { ro } from "./i18n/ro";
import { en } from "./i18n/en";
import type { Locale } from "./i18n/types";

const SITE_URL = "https://bugetul-romaniei.com";

interface RouteMeta {
  title: string;
  description: string;
  locale: Locale;
  /** RO path counterpart (without site origin), used to build hreflang alternates. */
  roPath: string;
  /** EN path counterpart (without site origin), used to build hreflang alternates. */
  enPath: string;
}

const roRoutes: Record<string, { path: string; title: string; description: string }> = {
  "/": { path: "/", title: ro.landing.seoTitle, description: ro.landing.seoDescription },
  "/overview": { path: "/overview", title: ro.overview.seoTitle, description: ro.overview.seoDescription },
  "/ministere": { path: "/ministere", title: ro.ministere.seoTitle, description: ro.ministere.seoDescription },
  "/investitii": { path: "/investitii", title: ro.investitii.seoTitle, description: ro.investitii.seoDescription },
  "/joc": { path: "/joc", title: `${ro.joc.seoTitle}`, description: ro.joc.seoDescription },
};

const enRoutes: Record<string, { path: string; title: string; description: string }> = {
  "/en": { path: "/en", title: en.landing.seoTitle, description: en.landing.seoDescription },
  "/en/overview": { path: "/en/overview", title: en.overview.seoTitle, description: en.overview.seoDescription },
  "/en/ministere": { path: "/en/ministere", title: en.ministere.seoTitle, description: en.ministere.seoDescription },
  "/en/investitii": { path: "/en/investitii", title: en.investitii.seoTitle, description: en.investitii.seoDescription },
  "/en/joc": { path: "/en/joc", title: `${en.joc.seoTitle}`, description: en.joc.seoDescription },
};

const roKeyByEnKey: Record<string, string> = {
  "/en": "/",
  "/en/overview": "/overview",
  "/en/ministere": "/ministere",
  "/en/investitii": "/investitii",
  "/en/joc": "/joc",
};

const routeMeta: Record<string, RouteMeta> = {};

for (const [key, meta] of Object.entries(roRoutes)) {
  const enKey = key === "/" ? "/en" : `/en${key}`;
  routeMeta[key] = { ...meta, locale: "ro", roPath: key, enPath: enKey };
}

for (const [key, meta] of Object.entries(enRoutes)) {
  routeMeta[key] = { ...meta, locale: "en", roPath: roKeyByEnKey[key], enPath: key };
}

interface HeadElement {
  type: string;
  props: Record<string, string>;
}

interface PrerenderResult {
  html: string;
  head: {
    title: string;
    lang: string;
    elements: Set<HeadElement>;
  };
}

export async function prerender(data: { url: string }): Promise<PrerenderResult> {
  const { url } = data;
  const meta = routeMeta[url] ?? routeMeta["/"];
  const canonicalUrl = url === "/" ? `${SITE_URL}/` : `${SITE_URL}${url}`;
  const roAlternate = meta.roPath === "/" ? `${SITE_URL}/` : `${SITE_URL}${meta.roPath}`;
  const enAlternate = `${SITE_URL}${meta.enPath}`;

  return {
    html: "",
    head: {
      title: meta.title,
      lang: meta.locale,
      elements: new Set<HeadElement>([
        { type: "meta", props: { name: "description", content: meta.description } },
        { type: "link", props: { rel: "canonical", href: canonicalUrl } },
        { type: "link", props: { rel: "alternate", href: roAlternate, hreflang: "ro" } },
        { type: "link", props: { rel: "alternate", href: enAlternate, hreflang: "en" } },
        { type: "link", props: { rel: "alternate", href: roAlternate, hreflang: "x-default" } },
        { type: "meta", props: { property: "og:title", content: meta.title } },
        { type: "meta", props: { property: "og:description", content: meta.description } },
        { type: "meta", props: { property: "og:url", content: canonicalUrl } },
        { type: "meta", props: { property: "og:locale", content: meta.locale === "en" ? "en_US" : "ro_RO" } },
        { type: "meta", props: { name: "twitter:card", content: "summary_large_image" } },
        { type: "meta", props: { name: "twitter:title", content: meta.title } },
        { type: "meta", props: { name: "twitter:description", content: meta.description } },
        {
          type: "meta",
          props: {
            name: "twitter:image:alt",
            content:
              meta.locale === "en"
                ? "Bugetul României — civic dashboard with budget data 2025-2026"
                : "Bugetul României — dashboard civic cu date bugetare 2025-2026",
          },
        },
      ]),
    },
  };
}
