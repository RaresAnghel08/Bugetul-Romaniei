# Bugetul Romaniei

Dashboard civic pentru analiza bugetului public 2025-2026, construit pe date XML oficiale.

## Ce contine proiectul

- parser Python pentru transformarea XML in JSON consumabil in frontend
- date agregate in `data/overview.json`, `data/ministere.json`, `data/programe.json`, `data/investitii.json`
- aplicatie React + Vite + TypeScript cu pagini:
	- Overview
	- Ministere
	- Detaliu minister
	- Investitii

## Cerinte

- Python 3.10+
- Node.js 20+
- npm 10+

## Instalare

```bash
npm install
```

## Generare date din XML

```bash
python scripts/parse.py
```

Comanda regenereaza toate fisierele JSON din folderul `data/`.

## Rulare locala

```bash
npm run dev
```

Server implicit: `http://localhost:5173`

## Build productie

```bash
npm run build
```

## Script counter up/down

Ruleaza operatii de `up` si `down` pe CounterAPI pentru un `n` configurabil.

```bash
npm run counter:batch -- --n 5 --mode both
```

Optiuni:

- `--n <numar>`: numarul de operatii (obligatoriu, integer pozitiv)
- `--mode up|down|both`: tipul operatiilor (`both` este implicit)
- `--delay-ms <numar>`: pauza intre request-uri, utila la rate-limit

Exemple:

```bash
npm run counter:batch -- --n 10 --mode up
npm run counter:batch -- --n 10 --mode down
npm run counter:batch -- --n 3 --mode both --delay-ms 120
```

## Preview build

```bash
npm run preview
```