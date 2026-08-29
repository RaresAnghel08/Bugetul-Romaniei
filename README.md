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
- server MCP in `mcp/`, care expune aceleasi date catre asistenti AI

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

## Server MCP

Proiectul expune datele din `data/` si catre asistenti AI, printr-un server Model Context Protocol:
clasamente de ministere, fise de ordonator, programe, investitii si context macro, cu conversie
RON/EUR/USD.

Endpoint public, gazduit ca functie Vercel:

```
https://bugetul-romaniei.com/api/mcp
```

Se adauga in claude.ai sau Claude Desktop din Settings → Connectors → Add custom connector, sau in
Claude Code cu:

```bash
claude mcp add --transport http --scope user bugetul-romaniei https://bugetul-romaniei.com/api/mcp
```

Pentru dezvoltare locala exista si varianta pe stdio, configurata in `.mcp.json`:

```bash
npm run mcp        # porneste serverul pe stdio
npm run mcp:test   # teste end-to-end, pe stdio si pe HTTP
```

Detalii complete: `mcp/README.md`.

## Licenta

Proiectul este licentiat sub [MIT](LICENSE).