import { supabase } from "./supabase";

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  created_at: string;
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from("joc_leaderboard")
    .select("id, name, score, created_at")
    .order("score", { ascending: false })
    .limit(10);

  if (error) throw error;
  return (data ?? []) as LeaderboardEntry[];
}

export async function fetchTotalPlayers(): Promise<number> {
  const { data, error } = await supabase
    .from("joc_stats")
    .select("total_players")
    .eq("id", 1)
    .single();

  if (error) return 0;
  return (data?.total_players as number) ?? 0;
}

/** Returns true if the given score would place in the current TOP 10. */
export async function isScoreInTop10(score: number): Promise<boolean> {
  const { count } = await supabase
    .from("joc_leaderboard")
    .select("*", { count: "exact", head: true })
    .gt("score", score);

  return (count ?? 0) < 10;
}

/**
 * Submit a score for a name.
 * - If name already exists: updates score only if the new score is higher.
 * - If name is new: inserts only if the score qualifies for TOP 10.
 * Returns: 'updated' | 'inserted' | 'skipped'
 */
export async function submitScore(
  name: string,
  score: number
): Promise<"updated" | "inserted" | "skipped"> {
  const { data: existing } = await supabase
    .from("joc_leaderboard")
    .select("id, score")
    .eq("name", name)
    .maybeSingle();

  if (existing) {
    if (score > (existing.score as number)) {
      await supabase
        .from("joc_leaderboard")
        .update({ score, created_at: new Date().toISOString() })
        .eq("id", existing.id);
      return "updated";
    }
    return "skipped";
  }

  const qualifies = await isScoreInTop10(score);
  if (!qualifies) return "skipped";

  await supabase.from("joc_leaderboard").insert({ name, score });
  return "inserted";
}

/** Atomically increments the total_players counter. */
export async function incrementTotalPlayers(): Promise<void> {
  const { data } = await supabase
    .from("joc_stats")
    .select("total_players")
    .eq("id", 1)
    .single();

  const current = (data?.total_players as number) ?? 0;
  await supabase
    .from("joc_stats")
    .update({ total_players: current + 1 })
    .eq("id", 1);
}
