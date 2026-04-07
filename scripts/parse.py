from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any
import xml.etree.ElementTree as ET


ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"
XMLS_DIR = ROOT_DIR / "XMLs"

XML_2025 = XMLS_DIR / "xml_2025"
XML_2026 = XMLS_DIR / "xml_2026"
XML_2024 = XMLS_DIR / "xml_2024"
XML_2023 = XMLS_DIR / "xml_2023"
XML_2022 = XMLS_DIR / "xml_2022"


def parse_xml(path: Path, encoding: str = "iso-8859-2") -> ET.Element:
    text = path.read_bytes().decode(encoding)
    return ET.fromstring(text)


def clean_text(value: str | None) -> str:
    if value is None:
        return ""
    return value.strip()


def clean_amount(value: str | None) -> int:
    if value is None:
        return 0

    raw = value.strip()
    if raw == "":
        return 0

    raw = raw.replace(".", "")

    try:
        # XML values are in thousands of lei; convert to lei.
        return int(raw) * 1000
    except ValueError:
        return 0


def find_rows(root: ET.Element, row_tag: str) -> list[ET.Element]:
    return list(root.findall(f".//{row_tag}"))


def node_text(node: ET.Element, tag: str) -> str:
    return clean_text(node.findtext(tag))


def normalize_label(value: str) -> str:
    return clean_text(value).upper().replace(" ", "")


def find_budget_rows(root: ET.Element) -> list[ET.Element]:
    rows = find_rows(root, "G_TITLU_RAPORT")
    if rows:
        return rows
    return find_rows(root, "DATA_RECORD")


def find_overview_rows(root: ET.Element) -> list[ET.Element]:
    return find_budget_rows(root)


def overview_for_year(path: Path, amount_tag: str) -> dict[str, int]:
    root = parse_xml(path)
    rows = find_overview_rows(root)

    venituri_total = 0
    cheltuieli_total = 0

    for row in rows:
        den = node_text(row, "DENUMIRE")
        den_upper = den.upper()
        cod = node_text(row, "COD_ORDONATOR")
        cap = node_text(row, "CAPITOL")

        if den_upper == "VENITURI - TOTAL" and cod == "00":
            venituri_total = max(venituri_total, clean_amount(node_text(row, amount_tag)))

        # State budget total expenditure is usually on CAPITOL 5001.
        # Label differs by year: "II.Credite bugetare" or "CHELTUIELI - BUGET DE STAT".
        if (
            cod == "00"
            and cap == "5001"
            and den_upper in {"II.CREDITE BUGETARE", "CHELTUIELI - BUGET DE STAT"}
        ):
            cheltuieli_total = max(
                cheltuieli_total, clean_amount(node_text(row, amount_tag))
            )

    deficit = venituri_total - cheltuieli_total

    return {
        "venituri_total": venituri_total,
        "cheltuieli_total": cheltuieli_total,
        "deficit": deficit,
    }


def is_state_budget_overview_file(path: Path) -> bool:
    try:
        root = parse_xml(path)
    except (ET.ParseError, UnicodeDecodeError):
        return False

    rows = find_overview_rows(root)
    if not rows:
        return False

    has_state_title = False
    has_venituri_total = False
    has_capitol_5001 = False

    for row in rows:
        title = node_text(row, "TITLU_RAPORT").upper()
        cod = node_text(row, "COD_ORDONATOR")
        den = node_text(row, "DENUMIRE").upper()
        cap = node_text(row, "CAPITOL")

        if "BUGETUL DE STAT" in title:
            has_state_title = True
        if cod == "00" and den == "VENITURI - TOTAL":
            has_venituri_total = True
        if cod == "00" and cap == "5001":
            has_capitol_5001 = True

        if has_state_title and has_venituri_total and has_capitol_5001:
            return True

    return False


def discover_overview_source(year: int) -> Path | None:
    year_dir = XMLS_DIR / f"xml_{year}"
    if not year_dir.exists():
        return None

    candidates = [
        path
        for path in sorted(year_dir.rglob("*.xml"))
        if is_state_budget_overview_file(path)
    ]

    if not candidates:
        return None

    def candidate_rank(path: Path) -> tuple[int, int, str]:
        name = path.name.lower()
        score = 0
        if "anexa1" in name or "anexa001" in name:
            score += 4
        if "bugstat" in name:
            score += 3
        if "bugetcash" in name or "bcash" in name:
            score += 2
        if "bsan" in name or "bass" in name or "bsom" in name:
            score -= 2
        # Sort descending by score, then shorter paths first.
        return (-score, len(path.as_posix()), path.as_posix())

    return sorted(candidates, key=candidate_rank)[0]


def overview_with_first_valid_tag(path: Path, tags: list[str]) -> dict[str, int] | None:
    for tag in tags:
        data = overview_for_year(path, tag)
        if data["venituri_total"] > 0 and data["cheltuieli_total"] > 0:
            return data
    return None


def build_overview_series() -> dict[str, dict[str, int]]:
    years = sorted(
        int(path.name.split("_", 1)[1])
        for path in XMLS_DIR.glob("xml_*")
        if path.is_dir()
        and path.name.split("_", 1)[1].isdigit()
        and int(path.name.split("_", 1)[1]) >= 2015
    )

    sources_by_year = {year: discover_overview_source(year) for year in years}

    overview: dict[str, dict[str, int]] = {}

    for year in years:
        source = sources_by_year.get(year)

        data: dict[str, int] | None = None

        if source is not None:
            data = overview_with_first_valid_tag(
                source,
                [f"PROGRAM_{year}", f"PROGRAM{year}"],
            )

        # Fallback for missing direct-year files, e.g. 2016 from 2015 ESTIMARI_2016.
        if data is None:
            prev_source = sources_by_year.get(year - 1)
            if prev_source is not None:
                data = overview_with_first_valid_tag(
                    prev_source,
                    [f"ESTIMARI_{year}", f"ESTIMARI{year}"],
                )

        if data is None:
            continue

        overview[str(year)] = data

    return overview


@dataclass
class MinistryYearData:
    name: str
    total: int
    estimari_2027: int | None
    estimari_2028: int | None
    estimari_2029: int | None
    chapters: dict[str, int]
    chapter_names: dict[str, str]


META_DENUMIRI = {
    "",
    "TOTAL GENERAL",
    "I.Credite de angajament",
    "II.Credite bugetare",
    "CHELTUIELI CURENTE",
    "CHELTUIELI DE CAPITAL",
    "OPERATIUNI FINANCIARE",
    "REZERVE, EXCEDENT/DEFICIT",
}


def is_empty_level(subcap: str, titlu: str) -> bool:
    return subcap == "" and titlu == ""


def parse_f01_year(
    path: Path,
    amount_tag: str,
    estimate_tags: tuple[str, str, str] | None = None,
) -> dict[str, MinistryYearData]:
    root = parse_xml(path)
    rows = find_budget_rows(root)

    ministry_name: dict[str, str] = {}
    ministry_total: dict[str, int] = {}
    ministry_est_2027: dict[str, int | None] = {}
    ministry_est_2028: dict[str, int | None] = {}
    ministry_est_2029: dict[str, int | None] = {}
    chapter_values: dict[str, dict[str, int]] = {}
    chapter_names: dict[str, dict[str, str]] = {}

    for row in rows:
        cod = node_text(row, "COD_ORDONATOR")
        if cod == "":
            continue

        ordonator = node_text(row, "ORDONATOR")
        cap = node_text(row, "CAPITOL")
        sub = node_text(row, "SUBCAPITOL")
        titlu = node_text(row, "TITLU")
        den = node_text(row, "DENUMIRE")

        if ordonator:
            ministry_name[cod] = ordonator

        # Chapter display name: top-level chapter label lines (no title/subchapter).
        if is_empty_level(sub, titlu) and den not in META_DENUMIRI and not den.startswith("TITLUL "):
            chapter_names.setdefault(cod, {})[cap] = den

        if normalize_label(den) != "II.CREDITEBUGETARE":
            continue

        value = clean_amount(node_text(row, amount_tag))

        # Ministry total: CAPITOL 5000, top-level line only.
        if cap == "5000" and is_empty_level(sub, titlu):
            ministry_total[cod] = value

            if estimate_tags is not None:
                t2027, t2028, t2029 = estimate_tags
                ministry_est_2027[cod] = clean_amount(node_text(row, t2027))
                ministry_est_2028[cod] = clean_amount(node_text(row, t2028))
                ministry_est_2029[cod] = clean_amount(node_text(row, t2029))

        # Chapter details: keep only xx00, exclude 5000 (overall total).
        if is_empty_level(sub, titlu) and cap.endswith("00") and cap != "5000":
            chapter_values.setdefault(cod, {})[cap] = value

    result: dict[str, MinistryYearData] = {}
    all_codes = set(ministry_name) | set(ministry_total) | set(chapter_values)
    for cod in all_codes:
        result[cod] = MinistryYearData(
            name=ministry_name.get(cod, ""),
            total=ministry_total.get(cod, 0),
            estimari_2027=ministry_est_2027.get(cod),
            estimari_2028=ministry_est_2028.get(cod),
            estimari_2029=ministry_est_2029.get(cod),
            chapters=chapter_values.get(cod, {}),
            chapter_names=chapter_names.get(cod, {}),
        )

    return result


def parse_ministry_totals(path: Path, amount_tag: str) -> tuple[dict[str, int], dict[str, str]]:
    root = parse_xml(path)
    rows = find_budget_rows(root)

    totals: dict[str, int] = {}
    names: dict[str, str] = {}

    for row in rows:
        cod = node_text(row, "COD_ORDONATOR")
        if cod == "" or cod == "00":
            continue

        ordonator = node_text(row, "ORDONATOR")
        if ordonator:
            names[cod] = ordonator

        cap = node_text(row, "CAPITOL")
        if cap != "5000":
            continue

        den = normalize_label(node_text(row, "DENUMIRE"))
        sub = node_text(row, "SUBCAPITOL")
        titlu = node_text(row, "TITLU")

        if den not in {"II.CREDITEBUGETARE", "TOTALGENERAL"}:
            continue

        # Keep only top-level totals for the ordonator.
        if not is_empty_level(sub, titlu):
            continue

        value = clean_amount(node_text(row, amount_tag))
        if value <= 0:
            continue

        totals[cod] = max(totals.get(cod, 0), value)

    return totals, names


def parse_ministry_totals_with_first_valid_tag(
    path: Path, tags: list[str]
) -> tuple[dict[str, int], dict[str, str], str] | None:
    for tag in tags:
        try:
            totals, names = parse_ministry_totals(path, tag)
        except (ET.ParseError, UnicodeDecodeError):
            continue

        if len(totals) >= 5:
            return totals, names, tag

    return None


def discover_f01_source(year: int) -> Path | None:
    year_dir = XMLS_DIR / f"xml_{year}"
    if not year_dir.exists():
        return None

    tags = [f"PROGRAM_{year}", f"PROGRAM{year}"]
    best_path: Path | None = None
    best_score: tuple[int, int, str] | None = None

    for path in sorted(year_dir.rglob("*.xml")):
        parsed = parse_ministry_totals_with_first_valid_tag(path, tags)
        if parsed is None:
            continue

        totals, _, _ = parsed
        name = path.name.lower()

        score = len(totals)
        if "f01" in name:
            score += 30
        if "bugstat" in name:
            score += 12
        if "cash" in name or "bugetcash" in name or "bcash" in name:
            score += 8
        if "anexa" in name:
            score -= 6

        rank = (score, -len(path.as_posix()), path.as_posix())
        if best_score is None or rank > best_score:
            best_score = rank
            best_path = path

    return best_path


def build_ministry_history_series() -> dict[str, dict[str, int]]:
    years = sorted(
        int(path.name.split("_", 1)[1])
        for path in XMLS_DIR.glob("xml_*")
        if path.is_dir()
        and path.name.split("_", 1)[1].isdigit()
        and int(path.name.split("_", 1)[1]) >= 2015
    )

    sources_by_year = {year: discover_f01_source(year) for year in years}
    history: dict[str, dict[str, int]] = {}

    for year in years:
        parsed: tuple[dict[str, int], dict[str, str], str] | None = None
        source = sources_by_year.get(year)

        if source is not None:
            parsed = parse_ministry_totals_with_first_valid_tag(
                source,
                [f"PROGRAM_{year}", f"PROGRAM{year}"],
            )

        # Fallback for years without direct files (e.g. 2016) using prior-year estimates.
        if parsed is None:
            prev_source = sources_by_year.get(year - 1)
            if prev_source is not None:
                parsed = parse_ministry_totals_with_first_valid_tag(
                    prev_source,
                    [f"ESTIMARI_{year}", f"ESTIMARI{year}"],
                )

        if parsed is None:
            continue

        totals, _, _ = parsed
        for cod, value in totals.items():
            history.setdefault(cod, {})[str(year)] = value

    return history


def merge_ministries(
    data_2025: dict[str, MinistryYearData],
    data_2026: dict[str, MinistryYearData],
    ministry_history: dict[str, dict[str, int]] | None = None,
) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    all_codes = sorted(set(data_2025) | set(data_2026))

    for cod in all_codes:
        d25 = data_2025.get(cod)
        d26 = data_2026.get(cod)

        name = (d26.name if d26 and d26.name else "") or (d25.name if d25 else "")

        v25 = d25.total if d25 else None
        v26 = d26.total if d26 else None

        delta_pct: float | None
        if v25 is None or v26 is None or v25 == 0:
            delta_pct = None
        else:
            delta_pct = round(((v26 - v25) / v25) * 100, 2)

        chapters_25 = d25.chapters if d25 else {}
        chapters_26 = d26.chapters if d26 else {}
        chapter_name_25 = d25.chapter_names if d25 else {}
        chapter_name_26 = d26.chapter_names if d26 else {}

        chapter_codes = set(chapters_25) | set(chapters_26)
        detalii: list[dict[str, Any]] = []
        for cap in sorted(chapter_codes):
            detalii.append(
                {
                    "capitol": cap,
                    "denumire": chapter_name_26.get(cap)
                    or chapter_name_25.get(cap)
                    or cap,
                    "2025": chapters_25.get(cap, 0),
                    "2026": chapters_26.get(cap, 0),
                }
            )

        detalii.sort(key=lambda x: x["2026"], reverse=True)

        lower_name = name.lower()
        is_finante_actiuni_generale = cod == "57" or (
            "finant" in lower_name and "actiuni generale" in lower_name
        )

        history_values = dict(
            sorted(
                ((ministry_history or {}).get(cod, {})).items(),
                key=lambda item: int(item[0]),
            )
        )
        if v25 is not None:
            history_values.setdefault("2025", v25)
        if v26 is not None:
            history_values.setdefault("2026", v26)

        records.append(
            {
                "cod": cod,
                "nume": name,
                "2025": v25,
                "2026": v26,
                "estimari_2027": d26.estimari_2027 if d26 else None,
                "estimari_2028": d26.estimari_2028 if d26 else None,
                "estimari_2029": d26.estimari_2029 if d26 else None,
                "delta_pct": delta_pct,
                "exclude_from_ranking": is_finante_actiuni_generale,
                "istoric": history_values,
                "detalii_capitol": detalii,
            }
        )

    records.sort(key=lambda x: (x["2026"] if isinstance(x["2026"], int) else -1), reverse=True)
    return records


PROGRAM_MARKERS = {
    "PROGRAM",
    "TOTAL PROGRAM",
    "TOTAL CHELTUIELI",
    "I. Credite de angajament",
    "II. Credite bugetare",
    "Buget de stat",
    "Venituri proprii",
    "Fonduri externe nerambursabile",
    "Buget asigurari sociale de stat",
    "Buget fond somaj",
    "Buget fond sanatate",
}


def parse_f26_year(path: Path, *, year: int) -> dict[tuple[str, str], dict[str, Any]]:
    root = parse_xml(path)
    rows = find_rows(root, "G_TITLU_RAPORT")

    if year == 2026:
        realizari_tag = "REALIZARI_PANA_2024"
        executie_tag = "EXECUTIE_PRELIMINATA_2025"
        program_tag = "PROGRAM_2026"
    else:
        realizari_tag = "REALIZARI_PANA_2023"
        executie_tag = "EXECUTIE_PRELIMINATA_2024"
        program_tag = "PROGRAM_2025"

    ordonator_names: dict[str, str] = {}
    ordonator_codes: dict[str, str] = {}
    program_names: dict[tuple[str, str], str] = {}
    totals_by_key: dict[tuple[str, str], dict[str, int]] = {}

    for row in rows:
        ord_cui = node_text(row, "ORDONATOR")
        ord_code = node_text(row, "COD")
        cod_program = node_text(row, "COD_PROGRAM")
        den = node_text(row, "DENUMIRE")

        if ord_cui == "":
            continue

        if ord_code:
            ordonator_codes.setdefault(ord_cui, ord_code)

        # Ministry name lines have empty COD_PROGRAM and non-marker labels.
        if cod_program == "" and den and den not in PROGRAM_MARKERS:
            ordonator_names.setdefault(ord_cui, den)

        if cod_program:
            if den and den not in PROGRAM_MARKERS:
                program_names.setdefault((ord_cui, cod_program), den)

            if den == "II. Credite bugetare":
                key = (ord_cui, cod_program)
                val_total = clean_amount(node_text(row, "TOTAL"))
                val_realizari = clean_amount(node_text(row, realizari_tag))
                val_executie = clean_amount(node_text(row, executie_tag))
                val_program = clean_amount(node_text(row, program_tag))

                current = totals_by_key.get(key)
                candidate_score = max(val_total, val_program, val_executie, val_realizari)
                current_score = -1
                if current is not None:
                    current_score = max(
                        current["total"],
                        current["realizari"],
                        current["executie"],
                        current["program"],
                    )

                # Keep the largest aggregate line to avoid source-level duplicates.
                if candidate_score >= current_score:
                    totals_by_key[key] = {
                        "total": val_total,
                        "realizari": val_realizari,
                        "executie": val_executie,
                        "program": val_program,
                    }

    merged: dict[tuple[str, str], dict[str, Any]] = {}
    for key, vals in totals_by_key.items():
        ord_cui, cod_program = key
        merged[key] = {
            "ordonator_cod": ordonator_codes.get(ord_cui, ""),
            "ordonator_cui": ord_cui,
            "ordonator_nume": ordonator_names.get(ord_cui, ""),
            "cod_program": cod_program,
            "program_nume": program_names.get(key, ""),
            "total": vals["total"],
            "realizari": vals["realizari"],
            "executie": vals["executie"],
            "program": vals["program"],
        }

    return merged


def merge_programs(p25: dict[tuple[str, str], dict[str, Any]], p26: dict[tuple[str, str], dict[str, Any]]) -> list[dict[str, Any]]:
    keys = sorted(set(p25) | set(p26))
    out: list[dict[str, Any]] = []

    for key in keys:
        v25 = p25.get(key)
        v26 = p26.get(key)

        out.append(
            {
                "ordonator_cod": (v26 or v25 or {}).get("ordonator_cod", ""),
                "ordonator_cui": (v26 or v25 or {}).get("ordonator_cui", ""),
                "ordonator_nume": (v26 or v25 or {}).get("ordonator_nume", ""),
                "cod_program": (v26 or v25 or {}).get("cod_program", ""),
                "program_nume": (v26 or v25 or {}).get("program_nume", ""),
                "realizari_pana_2023": (v25 or {}).get("realizari"),
                "executie_2024": (v25 or {}).get("executie"),
                "program_2025": (v25 or {}).get("program"),
                "realizari_pana_2024": (v26 or {}).get("realizari"),
                "executie_2025": (v26 or {}).get("executie"),
                "program_2026": (v26 or {}).get("program"),
            }
        )

    out.sort(key=lambda x: (x["program_2026"] if isinstance(x.get("program_2026"), int) else 0), reverse=True)
    return out


def parse_investitii_2026(path: Path) -> list[dict[str, Any]]:
    root = parse_xml(path, encoding="utf-8")
    rows = find_rows(root, "DATA_RECORD")

    out: list[dict[str, Any]] = []
    seen: set[tuple[Any, ...]] = set()
    for row in rows:
        tip = node_text(row, "TIP_CREDIT")
        if not tip.startswith("II"):
            continue

        indicator = node_text(row, "INDICATOR")
        if indicator == "":
            continue

        if "TOTAL GENERAL" in indicator:
            continue

        # Keep detailed objective-level rows (e.g. 5001710102), not aggregates.
        code = indicator.split()[0] if indicator.split() else ""
        if not code.isdigit() or len(code) < 10:
            continue

        record = {
            "ordonator": node_text(row, "ORDONATOR"),
            "sursa": node_text(row, "SURSA_FINANTARE"),
            "indicator": indicator,
            "_indicator_code": code,
            "total": clean_amount(node_text(row, "TOTAL")),
            "cheltuit_pana_2024": clean_amount(
                node_text(row, "CHELT_EFECT_PANA_LA_31_12_2024")
            ),
            "preliminat_2025": clean_amount(
                node_text(row, "CHELTUIELI_PRELIMINATE_2025")
            ),
            "program_2026": clean_amount(node_text(row, "PROGRAM_2026")),
        }

        dedup_key = (
            record["ordonator"],
            record["sursa"],
            record["indicator"],
            record["total"],
            record["cheltuit_pana_2024"],
            record["preliminat_2025"],
            record["program_2026"],
        )
        if dedup_key in seen:
            continue
        seen.add(dedup_key)
        out.append(record)

    # Remove 500xxxxxxx duplicates when a function-level equivalent exists.
    non500_equivalents: set[tuple[Any, ...]] = set()
    for rec in out:
        code = rec["_indicator_code"]
        if not code.startswith("500"):
            non500_equivalents.add(
                (
                    rec["ordonator"],
                    rec["sursa"],
                    code[3:],
                    rec["total"],
                    rec["cheltuit_pana_2024"],
                    rec["preliminat_2025"],
                    rec["program_2026"],
                )
            )

    filtered: list[dict[str, Any]] = []
    for rec in out:
        code = rec["_indicator_code"]
        if code.startswith("500"):
            key = (
                rec["ordonator"],
                rec["sursa"],
                code[3:],
                rec["total"],
                rec["cheltuit_pana_2024"],
                rec["preliminat_2025"],
                rec["program_2026"],
            )
            if key in non500_equivalents:
                continue
        filtered.append(rec)

    # Consolidate repeated objective rows per ministry/source/indicator code.
    # This keeps UI lists clean and ensures percentages use merged values.
    aggregated: dict[tuple[str, str, str], dict[str, Any]] = {}
    for rec in filtered:
        key = (rec["ordonator"], rec["sursa"], rec["_indicator_code"])
        existing = aggregated.get(key)

        if existing is None:
            aggregated[key] = dict(rec)
            continue

        existing["total"] += rec["total"]
        existing["cheltuit_pana_2024"] += rec["cheltuit_pana_2024"]
        existing["preliminat_2025"] += rec["preliminat_2025"]
        existing["program_2026"] += rec["program_2026"]

        # Prefer the more descriptive label if variants differ.
        if len(rec["indicator"]) > len(existing["indicator"]):
            existing["indicator"] = rec["indicator"]

    merged: list[dict[str, Any]] = []
    for rec in aggregated.values():
        rec.pop("_indicator_code", None)
        merged.append(rec)

    merged.sort(key=lambda x: x["program_2026"], reverse=True)
    return merged


def write_json(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    overview = build_overview_series()
    ministry_history = build_ministry_history_series()

    f01_2025 = parse_f01_year(XML_2025 / "f01_bs_2025.xml", "PROGRAM_2025")
    f01_2026 = parse_f01_year(
        XML_2026 / "f01_bs_2026.xml",
        "PROGRAM_2026",
        estimate_tags=("ESTIMARI2027", "ESTIMARI2028", "ESTIMARI2029"),
    )
    ministere = merge_ministries(f01_2025, f01_2026, ministry_history=ministry_history)

    f26_2025 = parse_f26_year(XML_2025 / "f26_bugprog_2025.xml", year=2025)
    f26_2026 = parse_f26_year(XML_2026 / "f26_bugprog.xml", year=2026)
    programe = merge_programs(f26_2025, f26_2026)

    investitii = parse_investitii_2026(XML_2026 / "INV2026_F28.xml")

    write_json(DATA_DIR / "overview.json", overview)
    write_json(DATA_DIR / "ministere.json", ministere)
    write_json(DATA_DIR / "programe.json", programe)
    write_json(DATA_DIR / "investitii.json", investitii)

    print(f"Generated: {DATA_DIR / 'overview.json'}")
    print(f"Generated: {DATA_DIR / 'ministere.json'}")
    print(f"Generated: {DATA_DIR / 'programe.json'}")
    print(f"Generated: {DATA_DIR / 'investitii.json'}")


if __name__ == "__main__":
    main()
