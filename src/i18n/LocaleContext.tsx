import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Locale } from "./types";
import type { Dictionary } from "./dictionary";
import { ro } from "./ro";
import { en } from "./en";

const dictionaries: Record<Locale, Dictionary> = { ro, en };

interface LocaleContextValue {
  locale: Locale;
  t: Dictionary;
  /** Prefixes an internal absolute path ("/ministere") with the locale segment when needed. */
  path: (p: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/** Converts an absolute path from one locale's URL space to the other's, preserving the rest of the path. */
export const swapLocaleInPath = (pathname: string, targetLocale: Locale): string => {
  const withoutEnPrefix = pathname === "/en" || pathname.startsWith("/en/")
    ? pathname.slice(3) || "/"
    : pathname;

  if (targetLocale === "ro") {
    return withoutEnPrefix;
  }

  return withoutEnPrefix === "/" ? "/en" : `/en${withoutEnPrefix}`;
};

export const LocaleProvider = ({ locale, children }: { locale: Locale; children: ReactNode }) => {
  const value = useMemo<LocaleContextValue>(() => {
    const t = dictionaries[locale];
    const path = (p: string): string => {
      if (locale === "ro") return p;
      return p === "/" ? "/en" : `/en${p}`;
    };
    return { locale, t, path };
  }, [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
};

export const useLocale = (): LocaleContextValue => {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return ctx;
};
