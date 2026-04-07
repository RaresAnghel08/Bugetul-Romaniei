import { useEffect } from "react";
import { SITE_NAME, SITE_URL } from "../lib/seo";

const OG_IMAGE_VERSION = "20260407-2";
const DEFAULT_IMAGE_PATH = `/og-cover.png?v=${OG_IMAGE_VERSION}`;
const DEFAULT_IMAGE_ALT = "Bugetul Romaniei - dashboard civic bugetar";

type JsonLd = Record<string, unknown>;

export interface SeoProps {
  title: string;
  description: string;
  path?: string;
  imagePath?: string;
  noIndex?: boolean;
  jsonLd?: JsonLd | JsonLd[];
}

const toAbsoluteUrl = (value: string): string => {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const normalized = value.startsWith("/") ? value : `/${value}`;
  return new URL(normalized, SITE_URL).toString();
};

const upsertMetaTag = (attr: "name" | "property", key: string, content: string): void => {
  const selector = `meta[${attr}="${key}"]`;
  let element = document.head.querySelector(selector) as HTMLMetaElement | null;

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
};

const upsertCanonical = (href: string): void => {
  let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;

  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }

  link.setAttribute("href", href);
};

export const Seo = ({
  title,
  description,
  path,
  imagePath = DEFAULT_IMAGE_PATH,
  noIndex = false,
  jsonLd,
}: SeoProps) => {
  useEffect(() => {
    const currentPath = path ?? window.location.pathname;
    const canonicalUrl = toAbsoluteUrl(currentPath);
    const imageUrl = toAbsoluteUrl(imagePath);
    const robots = noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large";

    document.title = title;

    upsertMetaTag("name", "description", description);
    upsertMetaTag("name", "robots", robots);

    upsertMetaTag("property", "og:type", "website");
    upsertMetaTag("property", "og:locale", "ro_RO");
    upsertMetaTag("property", "og:site_name", SITE_NAME);
    upsertMetaTag("property", "og:title", title);
    upsertMetaTag("property", "og:description", description);
    upsertMetaTag("property", "og:url", canonicalUrl);
    upsertMetaTag("property", "og:image", imageUrl);
    upsertMetaTag("property", "og:image:secure_url", imageUrl);
    upsertMetaTag("property", "og:image:alt", DEFAULT_IMAGE_ALT);
    upsertMetaTag("property", "og:image:type", "image/png");
    upsertMetaTag("property", "og:image:width", "1200");
    upsertMetaTag("property", "og:image:height", "630");

    upsertMetaTag("name", "twitter:card", "summary_large_image");
    upsertMetaTag("name", "twitter:title", title);
    upsertMetaTag("name", "twitter:description", description);
    upsertMetaTag("name", "twitter:image", imageUrl);
    upsertMetaTag("name", "twitter:image:alt", DEFAULT_IMAGE_ALT);

    upsertCanonical(canonicalUrl);

    document.head
      .querySelectorAll('script[type="application/ld+json"][data-seo-json-ld="true"]')
      .forEach((node) => node.remove());

    const blocks = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];

    for (const block of blocks) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-seo-json-ld", "true");
      script.text = JSON.stringify(block);
      document.head.appendChild(script);
    }
  }, [description, imagePath, jsonLd, noIndex, path, title]);

  return null;
};
