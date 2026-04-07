export const SITE_URL = "https://bugetul-romaniei.ro";
export const SITE_NAME = "Bugetul Romaniei";

export const toAbsoluteSiteUrl = (path: string): string => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalized = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalized, SITE_URL).toString();
};
