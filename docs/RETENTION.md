# Politica de retenție a datelor

Document intern, pentru mentenanță — nu e pagina publică de confidențialitate
(aceea este la `/confidentialitate`, vezi `src/i18n/ro.ts` / `en.ts`).

## Ce date personale există în acest proiect

| Sursă | Date | Unde e stocat |
|---|---|---|
| Joc "Ghicește bugetul" | nume ales liber + scor | tabela `joc_leaderboard` din Supabase |
| Contor de vizite | număr agregat, fără identificare | tabela `counters` din Supabase, via CounterAPI |
| Găzduire (Vercel) | log-uri tehnice standard (IP, user-agent) | infrastructura Vercel, nu în baza noastră de date |

Nu există conturi de utilizator, autentificare sau profilare comercială.

## Durata de retenție

- **Leaderboard**: intrările rămân cât timp funcția de joc este activă pe site. Nu există
  ștergere automată programată.
- **Contor de vizite**: valoare agregată, fără istoric per-utilizator; nu se aplică retenție
  individuală.
- **Log-uri Vercel**: conform politicii de retenție a Vercel pentru planul folosit (de regulă
  câteva zile), nu sunt exportate sau arhivate de acest proiect.

## Ștergere la cerere

Orice persoană poate cere ștergerea numelui său din leaderboard scriind la
`raresanghel2008@gmail.com`, menționând numele folosit în joc. Cererile se rezolvă manual,
direct din Supabase (`delete from joc_leaderboard where name = '...'`), în cel mult 30 de zile.

## Ștergere în masă (întrerupere definitivă a proiectului sau a jocului)

Dacă funcția de joc este oprită definitiv:

1. Export opțional al scorurilor agregate (fără nume), dacă se dorește păstrarea unei statistici.
2. `truncate table joc_leaderboard;` și `truncate table joc_stats;` în Supabase.
3. Revocarea cheilor API (`VITE_SUPABASE_*`) din variabilele de mediu Vercel.
4. Actualizarea paginii `/confidentialitate` pentru a reflecta întreruperea colectării.

Dacă întregul proiect este întrerupt, toate datele din proiectul Supabase asociat se șterg prin
ștergerea proiectului Supabase.
