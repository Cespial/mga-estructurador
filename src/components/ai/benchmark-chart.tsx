"use client";

interface BenchmarkChartProps {
  distribution: number[];
  myScore: number | null;
  average: number;
  median: number;
}

/**
 * Simple histogram showing score distribution with a marker for "your position".
 * Uses inline SVG for a lightweight implementation (no recharts dependency here).
 */
export function BenchmarkChart({
  distribution,
  myScore,
  average,
  median,
}: BenchmarkChartProps) {
  // Create histogram buckets (0-10, 10-20, ..., 90-100)
  const buckets = new Array(10).fill(0);
  for (const score of distribution) {
    const idx = Math.min(Math.floor(score / 10), 9);
    buckets[idx]++;
  }

  const maxCount = Math.max(...buckets, 1);

  return (
    <div className="space-y-3">
      {/* Chart */}
      <div className="flex items-end gap-1" style={{ height: 120 }}>
        {buckets.map((count, i) => {
          const height = (count / maxCount) * 100;
          const isMyBucket =
            myScore !== null && Math.min(Math.floor(myScore / 10), 9) === i;

          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[9px] text-text-muted tabular-nums">
                {count > 0 ? count : ""}
              </span>
              <div
                className={`w-full rounded-t transition-all ${
                  isMyBucket
                    ? "bg-purple-500"
                    : "bg-purple-200 hover:bg-purple-300"
                }`}
                style={{ height: `${height}%`, minHeight: count > 0 ? 4 : 0 }}
                title={`${i * 10}-${(i + 1) * 10}: ${count} proyectos`}
              />
              <span className="text-[9px] text-text-muted">{i * 10}</span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-3">
          <span className="text-text-muted">
            Promedio: <strong className="text-text-primary">{average}</strong>
          </span>
          <span className="text-text-muted">
            Mediana: <strong className="text-text-primary">{median}</strong>
          </span>
        </div>
        {myScore !== null && (
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-purple-500" />
            <span className="text-purple-700 font-semibold">Tu proyecto: {myScore}</span>
          </span>
        )}
      </div>
    </div>
  );
}
