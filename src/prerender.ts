const SITE_URL = "https://bugetul-romaniei.com";

interface RouteMeta {
  title: string;
  description: string;
}

const routeMeta: Record<string, RouteMeta> = {
  "/": {
    title: "Bugetul României | Dashboard Civic Bugetar 2025-2026",
    description:
      "Dashboard civic independent pentru analiza bugetului Romaniei: overview national, ministere, investiții si comparatii rapide intre ani pe date oficiale.",
  },
  "/overview": {
    title: "Overview Bugetar 2025-2026 | Bugetul României",
    description:
      "Vizualizare comparativa a bugetului national 2025-2026: deficit, cheltuieli si venituri pe date oficiale ale Ministerului Finantelor.",
  },
  "/ministere": {
    title: "Ministere | Bugetul României",
    description:
      "Bugetele tuturor ministerelor din Romania pentru 2025-2026, sortabile si filtrabile dupa domeniu si suma alocata.",
  },
  "/investitii": {
    title: "Investiții Publice | Bugetul României",
    description:
      "Proiectele de investiții publice ale Romaniei 2025-2026 din datele oficiale ale Ministerului Finantelor.",
  },
  "/joc": {
    title: "Ce Minister Esti? | Bugetul României",
    description:
      "Ghiceste bugetul ministerelor si afla ce minister esti tu in jocul civic al Bugetului Romaniei.",
  },
};

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

  return {
    html: "",
    head: {
      title: meta.title,
      lang: "ro",
      elements: new Set<HeadElement>([
        { type: "meta", props: { name: "description", content: meta.description } },
        { type: "link", props: { rel: "canonical", href: canonicalUrl } },
        { type: "link", props: { rel: "alternate", href: canonicalUrl, hreflang: "ro-RO" } },
        { type: "meta", props: { property: "og:title", content: meta.title } },
        { type: "meta", props: { property: "og:description", content: meta.description } },
        { type: "meta", props: { property: "og:url", content: canonicalUrl } },
        { type: "meta", props: { name: "twitter:card", content: "summary_large_image" } },
        { type: "meta", props: { name: "twitter:title", content: meta.title } },
        { type: "meta", props: { name: "twitter:description", content: meta.description } },
        { type: "meta", props: { name: "twitter:image:alt", content: "Bugetul României — dashboard civic cu date bugetare 2025-2026" } },
      ]),
    },
  };
}
