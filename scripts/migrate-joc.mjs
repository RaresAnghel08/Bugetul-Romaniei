/**
 * Migration script: creates Supabase tables for the "Ce Minister Esti?" game.
 * Run: node scripts/migrate-joc.mjs
 */
import { readFileSync } from "fs";
import pg from "pg";

// Load DATABASE_URL from .env
const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const DATABASE_URL = env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not found in .env");
  process.exit(1);
}

// Supabase direct host often doesn't resolve — use the Session pooler instead
const client = new pg.Client({
  host: "aws-0-eu-west-1.pooler.supabase.com",
  port: 5432, // Session pooler — supports DDL
  user: "postgres.riiljdvgpxqemvevdyit",
  password: DATABASE_URL.match(/:([^:@]+)@/)?.[1] ?? "",
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

const SQL = `
-- Leaderboard: one row per player name, keeps best score
CREATE TABLE IF NOT EXISTS joc_leaderboard (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text        NOT NULL UNIQUE,
  score       integer     NOT NULL CHECK (score >= 0),
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_joc_leaderboard_score ON joc_leaderboard (score DESC);

-- Stats: single-row counter for total players
CREATE TABLE IF NOT EXISTS joc_stats (
  id             integer  PRIMARY KEY DEFAULT 1,
  total_players  bigint   NOT NULL DEFAULT 0
);
INSERT INTO joc_stats (id, total_players) VALUES (1, 0) ON CONFLICT (id) DO NOTHING;

-- Row Level Security
ALTER TABLE joc_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE joc_stats       ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "lb_read"      ON joc_leaderboard;
DROP POLICY IF EXISTS "lb_insert"    ON joc_leaderboard;
DROP POLICY IF EXISTS "lb_update"    ON joc_leaderboard;
DROP POLICY IF EXISTS "stats_read"   ON joc_stats;
DROP POLICY IF EXISTS "stats_update" ON joc_stats;

-- Leaderboard policies
CREATE POLICY "lb_read"   ON joc_leaderboard FOR SELECT TO anon USING (true);
CREATE POLICY "lb_insert" ON joc_leaderboard FOR INSERT TO anon WITH CHECK (length(name) BETWEEN 1 AND 30);
CREATE POLICY "lb_update" ON joc_leaderboard FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Stats policies
CREATE POLICY "stats_read"   ON joc_stats FOR SELECT TO anon USING (true);
CREATE POLICY "stats_update" ON joc_stats FOR UPDATE TO anon USING (id = 1);
`;

try {
  console.log("Connecting to Supabase...");
  await client.connect();
  console.log("Connected. Running migration...");
  await client.query(SQL);
  const { rows } = await client.query("SELECT total_players FROM joc_stats WHERE id = 1");
  console.log("✓ joc_leaderboard created");
  console.log("✓ joc_stats created, total_players:", rows[0]?.total_players ?? 0);
  console.log("Migration complete.");
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
