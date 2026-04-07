const leiFormatter = new Intl.NumberFormat("ro-RO", {
  style: "currency",
  currency: "RON",
  maximumFractionDigits: 0,
});

const compactNumber = (value: number): string => {
  return new Intl.NumberFormat("ro-RO", {
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

export const formatMld = (lei: number | null | undefined): string => {
  if (lei === null || lei === undefined) {
    return "-";
  }

  const abs = Math.abs(lei);
  if (abs >= 1_000_000_000) {
    return `${compactNumber(lei / 1_000_000_000)} mld lei`;
  }

  return `${compactNumber(lei / 1_000_000)} mil lei`;
};

export const formatMldAlways = (lei: number | null | undefined): string => {
  if (lei === null || lei === undefined) {
    return "-";
  }

  const valueInMld = lei / 1_000_000_000;
  const abs = Math.abs(valueInMld);
  const maxFractionDigits = abs >= 10 ? 0 : abs >= 1 ? 1 : 2;

  const formatted = new Intl.NumberFormat("ro-RO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  }).format(valueInMld);

  return `${formatted} mld lei`;
};

export const formatMil = (lei: number | null | undefined): string => {
  if (lei === null || lei === undefined) {
    return "-";
  }
  return `${(lei / 1_000_000).toFixed(0)} mil lei`;
};

export const formatPct = (value: number | null | undefined, digits = 1): string => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }
  return `${value.toFixed(digits)}%`;
};

export const formatAxisBudget = (value: number | string): string => {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return "-";
  }

  const abs = Math.abs(num);
  if (abs >= 1_000_000_000) {
    return `${compactNumber(num / 1_000_000_000)} mld`;
  }

  return `${compactNumber(num / 1_000_000)} mil`;
};
