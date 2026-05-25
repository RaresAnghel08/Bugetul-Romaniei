const runtimeOrigin = typeof window !== "undefined" ? window.location.origin : "";
const configuredSiteUrl = (import.meta.env.VITE_SITE_URL ?? "").trim();

export const SITE_URL = (configuredSiteUrl || runtimeOrigin || "https://bugetul-romaniei.com").replace(
  /\/+$/,
  ""
);
export const SITE_NAME = "Bugetul României";

export const toAbsoluteSiteUrl = (path: string): string => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalized = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalized, SITE_URL).toString();
};
