export interface OverviewYearData {
  venituri_total: number;
  cheltuieli_total: number;
  deficit: number;
}

export type OverviewData = Record<string, OverviewYearData>;

export interface CapitolDetail {
  capitol: string;
  denumire: string;
  "2025": number;
  "2026": number;
}

export interface MinisterRecord {
  cod: string;
  nume: string;
  "2025": number | null;
  "2026": number | null;
  istoric: Record<string, number>;
  estimari_2027: number | null;
  estimari_2028: number | null;
  estimari_2029: number | null;
  delta_pct: number | null;
  exclude_from_ranking: boolean;
  detalii_capitol: CapitolDetail[];
}

export interface ProgramRecord {
  ordonator_cod: string;
  ordonator_cui: string;
  ordonator_nume: string;
  cod_program: string;
  program_nume: string;
  realizari_pana_2023: number | null;
  executie_2024: number | null;
  program_2025: number | null;
  realizari_pana_2024: number | null;
  executie_2025: number | null;
  program_2026: number | null;
}

export interface InvestitieRecord {
  ordonator: string;
  sursa: string;
  indicator: string;
  total: number;
  cheltuit_pana_2024: number;
  preliminat_2025: number;
  program_2026: number;
}
