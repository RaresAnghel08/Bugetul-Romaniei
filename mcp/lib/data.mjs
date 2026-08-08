/*
 * Datele sunt importate static, nu citite cu fs: asa sunt urmarite automat de bundler-ul
 * Vercel si ajung in functia din api/mcp.mjs, nu doar in rularea locala pe stdio.
 */
import cursuriJson from "../../data/cursuri-valutare.json" with { type: "json" };
import guverneJson from "../../data/guverne.json" with { type: "json" };
import investitiiJson from "../../data/investitii.json" with { type: "json" };
import ministereJson from "../../data/ministere.json" with { type: "json" };
import overviewJson from "../../data/overview.json" with { type: "json" };
import pibJson from "../../data/pib.json" with { type: "json" };
import programeJson from "../../data/programe.json" with { type: "json" };

export const overview = overviewJson;
export const ministere = ministereJson;
export const programe = programeJson;
export const investitii = investitiiJson;
export const pib = pibJson;
export const guverne = guverneJson;
export const cursuri = cursuriJson;

/** Anii pentru care exista date agregate, in ordine crescatoare. */
export const ANI = Object.keys(overview).sort();
export const AN_MIN = ANI[0];
export const AN_MAX = ANI[ANI.length - 1];

export const MONEDE = ["RON", "EUR", "USD"];

/* ------------------------------------------------------------------ */
/* Text                                                                */
/* ------------------------------------------------------------------ */

/** Lowercase fara diacritice, pentru cautari tolerante ("Apărării" -> "apararii"). */
export const normalize = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const tokens = (value) => normalize(value).split(" ").filter(Boolean);

const commonPrefix = (a, b) => {
  const max = Math.min(a.length, b.length);
  let i = 0;
  while (i < max && a[i] === b[i]) i += 1;
  return i;
};

/** Potrivire tolerantala flexiune ("aparare" ~ "apararii", "sanatate" ~ "sanatatii"). */
const tokenMatch = (a, b) => {
  if (a === b) return 1;
  const shorter = Math.min(a.length, b.length);
  if (shorter < 4) return 0;
  const prefix = commonPrefix(a, b);
  return prefix >= 4 && prefix / shorter >= 0.75 ? 0.8 : 0;
};

/** Scor de potrivire intre o interogare si un text. 0 = fara potrivire. */
export const matchScore = (query, text) => {
  const q = normalize(query);
  if (!q) return 1;
  const t = normalize(text);
  if (!t) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(q)) return 60;

  const qt = tokens(query);
  const tt = tokens(text);
  if (qt.length === 0 || tt.length === 0) return 0;

  const total = qt.reduce(
    (sum, token) => sum + Math.max(0, ...tt.map((word) => tokenMatch(token, word))),
    0
  );
  return Math.round((total / qt.length) * 50);
};

/* ------------------------------------------------------------------ */
/* Numere si moneda                                                    */
/* ------------------------------------------------------------------ */

export const getCurs = (an, moneda) => {
  if (moneda === "RON") return 1;
  const row = cursuri[String(an)];
  if (!row) return null;
  return row[moneda] ?? null;
};

/** Converteste RON in moneda ceruta la cursul BNR din anul respectiv. */
export const convert = (valoareRON, an, moneda = "RON") => {
  if (valoareRON === null || valoareRON === undefined) return null;
  if (moneda === "RON") return valoareRON;
  const curs = getCurs(an, moneda);
  if (curs === null) return null;
  return valoareRON / curs;
};

const nf = (digits) =>
  new Intl.NumberFormat("ro-RO", { minimumFractionDigits: 0, maximumFractionDigits: digits });

const simbol = { RON: "lei", EUR: "EUR", USD: "USD" };

/** Formateaza in miliarde, cu trecere la milioane sub 1 mld ("111,8 mld lei", "540 mil lei"). */
export const formatMld = (value, moneda = "RON") => {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  const unitate = simbol[moneda] ?? moneda;

  if (Math.abs(value) < 1_000_000_000) {
    const mil = value / 1_000_000;
    return `${nf(Math.abs(mil) >= 10 ? 0 : 1).format(mil)} mil ${unitate}`;
  }

  const mld = value / 1_000_000_000;
  return `${nf(Math.abs(mld) >= 10 ? 1 : 2).format(mld)} mld ${unitate}`;
};

export const formatPct = (value, digits = 1) =>
  value === null || value === undefined || Number.isNaN(value) ? "-" : `${nf(digits).format(value)}%`;

/** Variatie procentuala de la a la b; null daca baza lipseste sau e 0. */
export const deltaPct = (from, to) => {
  if (from === null || from === undefined || to === null || to === undefined) return null;
  if (from === 0) return null;
  return ((to - from) / Math.abs(from)) * 100;
};

/** Suma in RON exprimata ca procent din PIB-ul anului. */
export const pctDinPib = (valoareRON, an) => {
  const gdp = pib[String(an)];
  if (!gdp || valoareRON === null || valoareRON === undefined) return null;
  return (valoareRON / gdp) * 100;
};

/* ------------------------------------------------------------------ */
/* Cautari in seturile de date                                         */
/* ------------------------------------------------------------------ */

/** Guvernul care a gestionat bugetul anului dat. */
export const guvernPentruAn = (an) =>
  guverne.find((g) => g.ani.includes(String(an))) ?? null;

/** Valoarea unui minister intr-un an oarecare (istoric acopera 2015-2026). */
export const bugetMinisterAn = (minister, an) => {
  const key = String(an);
  if (minister[key] !== undefined && minister[key] !== null) return minister[key];
  const istoric = minister.istoric?.[key];
  return istoric === undefined ? null : istoric;
};

/** Acronime uzuale -> codul ordonatorului. */
const ACRONIME = {
  mapn: "18",
  mai: "19",
  mae: "14",
  mf: "16",
  mfp: "16",
  ms: "26",
  mec: "25",
  men: "25",
  mt: "24",
  mti: "24",
  mj: "17",
  mmap: "23",
  madr: "22",
  mdlpa: "15",
  mipe: "54",
  sri: "31",
  sie: "32",
  sts: "34",
  spp: "33",
  sgg: "13",
  ansvsa: "38",
  iccj: "04",
  csm: "47",
  anrsps: "40",
};

/** Ministerele ordonate dupa scorul de potrivire cu interogarea (cod, acronim sau nume). */
export const cautaMinistere = (query) => {
  const q = String(query ?? "").trim();
  if (!q) return ministere.map((m) => ({ minister: m, scor: 1 }));

  const codAcronim = ACRONIME[normalize(q).replace(/ /g, "")];

  const rezultate = [];
  for (const m of ministere) {
    let scor = 0;
    if (m.cod === q || m.cod === codAcronim) scor = 100;
    else scor = matchScore(q, m.nume);
    if (scor > 0) rezultate.push({ minister: m, scor });
  }
  return rezultate.sort((a, b) => b.scor - a.scor);
};

/** Cel mai bun minister pentru interogare, plus sugestii cand nu exista potrivire clara. */
export const gasesteMinister = (query) => {
  const rezultate = cautaMinistere(query);
  if (rezultate.length === 0) return { minister: null, sugestii: [] };
  return {
    minister: rezultate[0].minister,
    sugestii: rezultate.slice(1, 6).map((r) => r.minister.nume),
  };
};

