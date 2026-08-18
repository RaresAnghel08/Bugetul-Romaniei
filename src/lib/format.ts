import type { Moneda } from "./cursValutar";
import { simbolMoneda } from "./cursValutar";
import type { Locale } from "../i18n/types";
import { ro } from "../i18n/ro";
import { en } from "../i18n/en";

const dictFor = (locale: Locale) => (locale === "en" ? en : ro);
const numberLocaleFor = (locale: Locale) => dictFor(locale).format.numberLocale;

const leiFormatter = new Intl.NumberFormat("ro-RO", {
  style: "currency",
  currency: "RON",
  maximumFractionDigits: 0,
});

const compactNumber = (value: number, locale: Locale = "ro"): string => {
  return new Intl.NumberFormat(numberLocaleFor(locale), {
    minimumFractionDigits: 0,
    maximumFractionDigits: Math.abs(value) < 10 ? 1 : 0,
  }).format(value);
};

export const formatLei = (lei: number | null | undefined): string => {
  if (lei === null || lei === undefined) {
    return "-";
  }
  return leiFormatter.format(lei);
};

export const formatMld = (lei: number | null | undefined, locale: Locale = "ro"): string => {
  if (lei === null || lei === undefined) {
    return "-";
  }

  const { mldSuffix, milSuffix } = dictFor(locale).format;
  const abs = Math.abs(lei);
  if (abs >= 1_000_000_000) {
    return `${compactNumber(lei / 1_000_000_000, locale)} ${mldSuffix}`;
  }

  return `${compactNumber(lei / 1_000_000, locale)} ${milSuffix}`;
};

export const formatMldAlways = (lei: number | null | undefined, locale: Locale = "ro"): string => {
  if (lei === null || lei === undefined) {
    return "-";
  }

  const valueInMld = lei / 1_000_000_000;
  const abs = Math.abs(valueInMld);
  const maxFractionDigits = abs >= 10 ? 0 : abs >= 1 ? 1 : 2;

  const formatted = new Intl.NumberFormat(numberLocaleFor(locale), {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  }).format(valueInMld);

  return `${formatted} ${dictFor(locale).format.mldSuffix}`;
};

export const formatMil = (lei: number | null | undefined, locale: Locale = "ro"): string => {
  if (lei === null || lei === undefined) {
    return "-";
  }
  return `${(lei / 1_000_000).toFixed(0)} ${dictFor(locale).format.milSuffix}`;
};

export const formatPct = (value: number | null | undefined, digits = 1): string => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }
  return `${value.toFixed(digits)}%`;
};

export const formatAxisBudget = (value: number | string, locale: Locale = "ro"): string => {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return "-";
  }

  const { mldSuffix, milSuffix } = dictFor(locale).format;
  const abs = Math.abs(num);
  if (abs >= 1_000_000_000) {
    return `${compactNumber(num / 1_000_000_000, locale)} ${mldSuffix}`;
  }

  return `${compactNumber(num / 1_000_000, locale)} ${milSuffix}`;
};

export const formatMldValuta = (
  value: number | null | undefined,
  moneda: Moneda,
  locale: Locale = "ro"
): string => {
  if (value === null || value === undefined) return "-";
  if (moneda === "RON") return formatMld(value, locale);

  const simbol = simbolMoneda(moneda);
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) {
    return `${simbol}${compactNumber(value / 1_000_000_000, locale)} ${dictFor(locale).format.mldBare}`;
  }
  return `${simbol}${compactNumber(value / 1_000_000, locale)} ${dictFor(locale).format.milBare}`;
};

export const formatAxisValuta = (
  value: number | string,
  moneda: Moneda,
  locale: Locale = "ro"
): string => {
  if (moneda === "RON") return formatAxisBudget(value, locale);

  const num = Number(value);
  if (!Number.isFinite(num)) return "-";

  const simbol = simbolMoneda(moneda);
  const abs = Math.abs(num);
  if (abs >= 1_000_000_000) {
    return `${simbol}${compactNumber(num / 1_000_000_000, locale)} ${dictFor(locale).format.mldBare}`;
  }
  return `${simbol}${compactNumber(num / 1_000_000, locale)} ${dictFor(locale).format.milBare}`;
};
