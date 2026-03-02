"use client";

/**
 * Score History Chart
 *
 * Shows the history of pre-evaluation scores for a project.
 * Highlights improvement streaks and notifies on threshold crossings.
 */

interface ScoreEntry {
  score: number;
  timestamp: string;
  label?: string;
}

interface ScoreHistoryChartProps {
  scores: ScoreEntry[];
}

export function ScoreHistoryChart({ scores }: ScoreHistoryChartProps) {
  if (scores.length === 0) return null;

  const latest = scores[scores.length - 1];
  const previous = scores.length >= 2 ? scores[scores.length - 2] : null;
  const diff = previous ? latest.score - previous.score : null;

  // Count improvement streak
  let streak = 0;
  for (let i = scores.length - 1; i > 0; i--) {
    if (scores[i].score > scores[i - 1].score) {
      streak++;
    } else {
      break;
    }
  }

  // Check threshold crossings
  const thresholds = [60, 70, 80, 90];
  const crossedThreshold = previous
    ? thresholds.find((t) => latest.score >= t && previous.score < t)
    : null;

  return (
    <div className="rounded-lg border border-border bg-bg-card p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">
        Historial de scores
      </p>

      {/* Score timeline mini */}
      <div className="flex items-end gap-1 h-12 mb-2">
        {scores.map((entry, i) => {
          const height = `${Math.max(entry.score, 5)}%`;
          const isLatest = i === scores.length - 1;
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-0.5"
              title={`${Math.round(entry.score)}/100 — ${new Date(entry.timestamp).toLocaleDateString("es-CO")}`}
            >
              <div
                className={`w-full rounded-sm ${
                  isLatest
                    ? "bg-purple-500"
                    : entry.score >= 70
                      ? "bg-emerald-400"
                      : entry.score >= 50
                        ? "bg-amber-400"
                        : "bg-red-300"
                }`}
                style={{ height }}
              />
            </div>
          );
        })}
      </div>

      {/* Latest score */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold tabular-nums text-purple-700">
          {Math.round(latest.score)}/100
        </span>
        <div className="flex items-center gap-2">
          {diff != null && (
            <span
              className={`text-[10px] font-semibold ${
                diff > 0
                  ? "text-emerald-600"
                  : diff < 0
                    ? "text-red-500"
                    : "text-text-muted"
              }`}
            >
              {diff > 0 ? "+" : ""}
              {Math.round(diff)}
            </span>
          )}
          {streak >= 2 && (
            <span className="text-[10px] text-emerald-600 font-medium">
              Racha: {streak}x mejora
            </span>
          )}
        </div>
      </div>

      {/* Threshold crossing notification */}
      {crossedThreshold && (
        <div className="mt-2 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-1.5">
          <p className="text-[10px] text-emerald-700 font-medium">
            Tu score cruzo el umbral de {crossedThreshold} puntos
          </p>
        </div>
      )}
    </div>
  );
}
