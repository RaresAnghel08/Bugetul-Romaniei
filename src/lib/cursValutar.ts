import cursuri from "../../data/cursuri-valutare.json";

type CursuriType = Record<string, { EUR: number; USD: number }>;
const cursValutar = cursuri as unknown as CursuriType;

export type Moneda = "RON" | "EUR" | "USD";

export const MONEDE: Moneda[] = ["RON", "EUR", "USD"];

export const getCurs = (an: string | number, moneda: Moneda): number | null => {
  if (moneda === "RON") return 1;
  const row = cursValutar[String(an)];
  if (!row) return null;
  return row[moneda];
};

/** Converteste o valoare din RON in moneda dorita folosind cursul anului respectiv.
 *  Returneaza null daca nu exista curs pentru acel an. */
export const convertRON = (
  valoareRON: number,
  an: string | number,
  moneda: Moneda
): number | null => {
  if (moneda === "RON") return valoareRON;
  const curs = getCurs(an, moneda);
  if (curs === null) return null;
  return valoareRON / curs;
};

export const simbolMoneda = (moneda: Moneda): string => {
  if (moneda === "EUR") return "€";
  if (moneda === "USD") return "$";
  return "lei";
};
