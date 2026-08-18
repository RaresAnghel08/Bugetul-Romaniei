import { useCallback, useRef, useState } from "react";
import ministereJson from "../../data/ministere.json";
import type { LeaderboardEntry } from "../lib/gameDb";
import {
  fetchLeaderboard,
  fetchTotalPlayers,
  incrementTotalPlayers,
  submitScore,
} from "../lib/gameDb";
import { formatMld } from "../lib/format";
import { Seo } from "../components/Seo";
import { SITE_NAME, toAbsoluteSiteUrl } from "../lib/seo";
import { useLocale } from "../i18n/LocaleContext";
import type { MinisterRecord } from "../types";

// Only use ministries that have a 2026 budget and aren't excluded from ranking
const POOL = (ministereJson as MinisterRecord[]).filter(
  (m) => m["2026"] !== null && !m.exclude_from_ranking
);

const CARD_GRADIENTS = [
  "linear-gradient(145deg, #1e3c72, #2a5298)",
  "linear-gradient(145deg, #134E5E, #3a7d5a)",
  "linear-gradient(145deg, #6a040f, #9d0208)",
  "linear-gradient(145deg, #2d1b69, #11998e)",
  "linear-gradient(145deg, #1b4332, #40916c)",
  "linear-gradient(145deg, #3c1642, #086375)",
  "linear-gradient(145deg, #1a1a2e, #2d2d60)",
  "linear-gradient(145deg, #2c3e50, #3d5a6c)",
  "linear-gradient(145deg, #0f2027, #2c4a2e)",
  "linear-gradient(145deg, #5f0f40, #9a031e)",
  "linear-gradient(145deg, #012a4a, #023e8a)",
  "linear-gradient(145deg, #2b2d42, #4a4e69)",
];

function getGradient(cod: string): string {
  return CARD_GRADIENTS[Math.abs(parseInt(cod, 10)) % CARD_GRADIENTS.length];
}

function pickRight(
  fixedLeft: MinisterRecord,
  currentScore: number,
  recentCods: string[]
): MinisterRecord {
  const excluded = new Set([fixedLeft.cod, ...recentCods]);
  let candidates = POOL.filter((m) => !excluded.has(m.cod));
  if (candidates.length < 3) candidates = POOL.filter((m) => m.cod !== fixedLeft.cod);

  const lv = fixedLeft["2026"] ?? 1;
  const t = 6 / (currentScore + 6); // 1=easy → 0=hard
  const target = Math.log(1.3) + t * (Math.log(300) - Math.log(1.3));
  const sigma = 1.8;

  const weights = candidates.map((m) => {
    const rv = m["2026"] ?? 1;
    const logRatio = Math.log(Math.max(lv, rv) / Math.min(lv, rv));
    return Math.exp(-0.5 * Math.pow((logRatio - target) / sigma, 2));
  });

  const total = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  for (let i = 0; i < candidates.length; i++) {
    rand -= weights[i];
    if (rand <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

function getScoreTitle(score: number, titles: string[]): string {
  if (score >= 25) return titles[7];
  if (score >= 19) return titles[6];
  if (score >= 13) return titles[5];
  if (score >= 9) return titles[4];
  if (score >= 6) return titles[3];
  if (score >= 3) return titles[2];
  if (score >= 1) return titles[1];
  return titles[0];
}

function shortName(name: string): string {
  const stop = new Set(["si", "și", "al", "a", "de", "in", "în", "din", "cu", "la", "ale", "pentru", "privind"]);
  const words = name.split(/[\s,/-]+/).filter((w) => w.length > 2 && !stop.has(w.toLowerCase()));
  return words.slice(0, 2).map((w) => w.toUpperCase()).join(" ");
}

type Phase = "menu" | "playing" | "result-correct" | "result-wrong" | "gameover" | "leaderboard";
type SubmitStatus = "idle" | "loading" | "inserted" | "updated" | "skipped" | "error";

export function JocPage() {
  const { t, locale, path } = useLocale();
  const [phase, setPhase] = useState<Phase>("menu");
  const [left, setLeft] = useState<MinisterRecord | null>(null);
  const [right, setRight] = useState<MinisterRecord | null>(null);
  const [recentCods, setRecentCods] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() =>
    parseInt(localStorage.getItem("joc-highscore") ?? "0", 10)
  );

  const [playerName, setPlayerName] = useState("");
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [totalPlayers, setTotalPlayers] = useState<number | null>(null);
  const [loadingBoard, setLoadingBoard] = useState(false);

  const countedRef = useRef(false);
  const finalScoreRef = useRef(0);

  const seoPath = path("/joc");
  const seoJsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `${SITE_NAME} - ${t.joc.jsonLdName}`,
      url: toAbsoluteSiteUrl(seoPath),
      inLanguage: t.common.inLanguage,
      description: t.joc.seoDescription,
      isPartOf: {
        "@type": "WebSite",
        name: SITE_NAME,
        url: toAbsoluteSiteUrl(path("/")),
      },
    },
  ];

  // ── Game Control ───────────────────────────────────────────────────────────

  const startGame = useCallback(() => {
    const initialLeft = POOL[Math.floor(Math.random() * POOL.length)];
    const initialRight = pickRight(initialLeft, 0, []);
    setLeft(initialLeft);
    setRight(initialRight);
    setRecentCods([initialLeft.cod]);
    setScore(0);
    setSubmitStatus("idle");
    setPlayerName("");
    countedRef.current = false;
    setPhase("playing");
  }, []);

  const handleGuess = useCallback(
    (guess: "higher" | "lower") => {
      if (phase !== "playing" || !left || !right) return;

      const lv = left["2026"] ?? 0;
      const rv = right["2026"] ?? 0;

      const correct = guess === "higher" ? rv >= lv : rv <= lv;

      if (correct) {
        const newScore = score + 1;
        setScore(newScore);
        setPhase("result-correct");

        setTimeout(() => {
          const newLeft = right;
          const newRecentCods = [...recentCods, left.cod].slice(-4);
          const newRight = pickRight(newLeft, newScore, newRecentCods);
          setLeft(newLeft);
          setRight(newRight);
          setRecentCods(newRecentCods);
          setPhase("playing");
        }, 1100);
      } else {
        setPhase("result-wrong");

        setTimeout(() => {
          finalScoreRef.current = score;

          if (score > highScore) {
            setHighScore(score);
            localStorage.setItem("joc-highscore", String(score));
          }

          if (!countedRef.current) {
            countedRef.current = true;
            void incrementTotalPlayers();
          }

          setPhase("gameover");
        }, 1400);
      }
    },
    [phase, left, right, score, highScore, recentCods]
  );

  // ── Leaderboard ────────────────────────────────────────────────────────────

  const loadLeaderboard = useCallback(async () => {
    setLoadingBoard(true);
    try {
      const [entries, total] = await Promise.all([fetchLeaderboard(), fetchTotalPlayers()]);
      setLeaderboard(entries);
      setTotalPlayers(total);
    } catch {
      // silently fail — leaderboard is non-critical
    } finally {
      setLoadingBoard(false);
    }
  }, []);

  const goToLeaderboard = useCallback(() => {
    setPhase("leaderboard");
    void loadLeaderboard();
  }, [loadLeaderboard]);

  // ── Score submission ───────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    const name = playerName.trim();
    if (!name || submitStatus === "loading") return;

    setSubmitStatus("loading");
    try {
      const result = await submitScore(name, finalScoreRef.current);
      setSubmitStatus(result);
    } catch {
      setSubmitStatus("error");
    }
  }, [playerName, submitStatus]);

  // ── Derived values ─────────────────────────────────────────────────────────

  const isResult = phase === "result-correct" || phase === "result-wrong";

  // ── Renders ────────────────────────────────────────────────────────────────

  if (phase === "menu") {
    return (
      <div className="joc-page">
        <Seo title={t.joc.seoTitle} description={t.joc.seoDescription} path={seoPath} jsonLd={seoJsonLd} />
        <div className="joc-menu">
          <p className="joc-menu-kicker">{t.joc.menuKicker}</p>
          <h1 className="joc-menu-title">{t.joc.menuTitle}</h1>
          <p className="joc-menu-desc">
            {t.joc.menuDescBefore} <strong>{t.joc.menuDescStrong1}</strong> {t.joc.menuDescMiddle}{" "}
            <strong>{t.joc.menuDescStrong2}</strong> {t.joc.menuDescAfter}
          </p>
          <div className="joc-menu-btns">
            <button className="joc-primary-btn" onClick={startGame}>
              {t.joc.playNow}
            </button>
            <button className="joc-secondary-btn" onClick={goToLeaderboard}>
              {t.joc.top10}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "leaderboard") {
    return (
      <div className="joc-page">
        <Seo title={t.joc.seoTitle} description={t.joc.seoDescription} path={seoPath} jsonLd={seoJsonLd} />
        <div className="joc-leaderboard-wrap">
          <h2 className="joc-lb-title">{t.joc.lbTitle}</h2>
          {totalPlayers !== null && (
            <p className="joc-lb-stats">
              {t.joc.totalPlayersLabel} <strong>{totalPlayers.toLocaleString(t.format.numberLocale)}</strong>
            </p>
          )}

          {loadingBoard ? (
            <p className="joc-lb-loading">{t.joc.loading}</p>
          ) : leaderboard.length === 0 ? (
            <p className="joc-lb-loading">{t.joc.noScores}</p>
          ) : (
            <table className="joc-lb-table">
              <thead>
                <tr>
                  <th>{t.joc.colRank}</th>
                  <th>{t.joc.colName}</th>
                  <th>{t.joc.colScore}</th>
                  <th>{t.joc.colTitle}</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, i) => (
                  <tr key={entry.id} className={`joc-lb-row joc-lb-rank-${Math.min(i + 1, 4)}`}>
                    <td className="joc-lb-rank">{i + 1}</td>
                    <td>{entry.name}</td>
                    <td className="joc-lb-score">{entry.score}</td>
                    <td className="joc-lb-title-cell">{getScoreTitle(entry.score, t.joc.scoreTitles)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="joc-btn-row">
            <button className="joc-primary-btn" onClick={startGame}>
              {t.joc.playNow}
            </button>
            <button className="joc-secondary-btn" onClick={() => setPhase("menu")}>
              {t.joc.menuBtn}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "gameover") {
    const s = finalScoreRef.current;
    return (
      <div className="joc-page">
        <Seo title={t.joc.seoTitle} description={t.joc.seoDescription} path={seoPath} jsonLd={seoJsonLd} />
        <div className="joc-gameover">
          <p className="joc-go-kicker">{t.joc.gameOverKicker}</p>
          <div className="joc-go-score-box">
            <p className="joc-go-score-label">{t.joc.scoreLabel}</p>
            <p className="joc-go-score-val">{s}</p>
            <p className="joc-go-title">{getScoreTitle(s, t.joc.scoreTitles)}</p>
          </div>

          {s > 0 && submitStatus === "idle" && (
            <div className="joc-name-section">
              <p className="joc-name-prompt">{t.joc.namePrompt}</p>
              <div className="joc-name-form">
                <input
                  className="joc-name-input"
                  type="text"
                  placeholder={t.joc.namePlaceholder}
                  maxLength={30}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleSubmit();
                  }}
                  autoFocus
                />
                <button className="joc-submit-btn" onClick={() => void handleSubmit()}>
                  {t.joc.send}
                </button>
              </div>
            </div>
          )}

          {submitStatus === "loading" && (
            <p className="joc-submit-msg">{t.joc.saving}</p>
          )}
          {submitStatus === "inserted" && (
            <p className="joc-submit-msg joc-submit-success">
              {t.joc.successInserted}
            </p>
          )}
          {submitStatus === "updated" && (
            <p className="joc-submit-msg joc-submit-success">
              {t.joc.successUpdated}
            </p>
          )}
          {submitStatus === "skipped" && (
            <p className="joc-submit-msg joc-submit-muted">
              {t.joc.skipped}
            </p>
          )}
          {submitStatus === "error" && (
            <p className="joc-submit-msg joc-submit-error">
              {t.joc.error}
            </p>
          )}

          <div className="joc-btn-row">
            <button className="joc-primary-btn" onClick={startGame}>
              {t.joc.playAgain}
            </button>
            <button className="joc-secondary-btn" onClick={goToLeaderboard}>
              {t.joc.leaderboard}
            </button>
          </div>

          {highScore > 0 && (
            <p className="joc-go-highscore">
              {t.joc.personalHighscore} <strong>{highScore}</strong>
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Playing / Result ───────────────────────────────────────────────────────

  if (!left || !right) return null;

  return (
    <div className="joc-page joc-page--arena">
      <Seo title={t.joc.seoTitle} description={t.joc.seoDescription} path={seoPath} jsonLd={seoJsonLd} />
      {/* Score bar */}
      <div className="joc-scorebar">
        <span className="joc-scorebar-item">
          {t.joc.scorebarScor} <span className="joc-scorebar-val">{score}</span>
        </span>
        <span className="joc-scorebar-item joc-scorebar-right">
          {t.joc.scorebarHighscore} <span className="joc-scorebar-val joc-scorebar-hs">{highScore}</span>
        </span>
      </div>

      {/* Split arena */}
      <div className="joc-split">
        {/* Left — revealed */}
        <div
          className={`joc-card joc-card--left ${isResult ? "joc-card--dimmed" : ""}`}
          style={{ background: getGradient(left.cod) }}
        >
          <div className="joc-card-bg-text">{shortName(left.nume)}</div>
          <div className="joc-card-content">
            <p className="joc-ministry-name">{left.nume}</p>
            <div className="joc-divider" />
            <p className="joc-budget-label">{t.joc.budgetLabel}</p>
            <p className="joc-budget-value">{formatMld(left["2026"], locale)}</p>
          </div>
        </div>

        {/* VS badge */}
        <div className="joc-vs-badge">{t.joc.vs}</div>

        {/* Right — to guess */}
        <div
          className="joc-card joc-card--right"
          style={{ background: getGradient(right.cod) }}
        >
          <div className="joc-card-bg-text">{shortName(right.nume)}</div>
          <div className="joc-card-content">
            <p className="joc-ministry-name">{right.nume}</p>
            <div className="joc-divider" />
            <p className="joc-budget-label">{t.joc.budgetLabel}</p>

            {phase === "playing" ? (
              <div className="joc-guess-btns">
                <button
                  className="joc-guess-btn joc-guess-btn--higher"
                  onClick={() => handleGuess("higher")}
                >
                  <span className="joc-guess-arrow">▲</span> {t.joc.higher}{" "}
                  <span className="joc-guess-arrow">▲</span>
                </button>
                <button
                  className="joc-guess-btn joc-guess-btn--lower"
                  onClick={() => handleGuess("lower")}
                >
                  <span className="joc-guess-arrow">▼</span> {t.joc.lower}{" "}
                  <span className="joc-guess-arrow">▼</span>
                </button>
              </div>
            ) : (
              <p className="joc-budget-value">{formatMld(right["2026"], locale)}</p>
            )}
          </div>

          {/* Result overlay */}
          {phase === "result-correct" && (
            <div className="joc-overlay joc-overlay--correct">
              <span className="joc-overlay-icon">✓</span>
            </div>
          )}
          {phase === "result-wrong" && (
            <div className="joc-overlay joc-overlay--wrong">
              <span className="joc-overlay-icon">✕</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
