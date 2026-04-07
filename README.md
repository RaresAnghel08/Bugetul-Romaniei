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

## Preview build

```bash
npm run preview
```