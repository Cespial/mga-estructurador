"use client";

import { useState, useEffect } from "react";

interface HeatmapScore {
  campo_id: string;
  score: number | null;
  max_score: number;
  percentage: number | null;
}

interface HeatmapRow {
  municipio_id: string;
  municipio_nombre: string;
  departamento: string;
  scores: HeatmapScore[];
}

interface Criterio {
  campo_id: string;
  campo_nombre: string;
}

interface PerformanceHeatmapProps {
  convocatoriaId: string;
}

function getCellColor(percentage: number | null): string {
  if (percentage === null) return "bg-bg-elevated";
  if (percentage >= 80) return "bg-emerald-400";
  if (percentage >= 60) return "bg-emerald-200";
  if (percentage >= 40) return "bg-amber-300";
  if (percentage >= 20) return "bg-orange-300";
  return "bg-red-400";
}

function getCellTextColor(percentage: number | null): string {
  if (percentage === null) return "text-text-muted";
  if (percentage >= 80) return "text-emerald-950";
  if (percentage >= 60) return "text-emerald-900";
  if (percentage >= 40) return "text-amber-900";
  if (percentage >= 20) return "text-orange-900";
  return "text-red-950";
}

/**
 * Cross-municipality performance heatmap.
 * Rows = municipios, columns = evaluation criteria, cells = score %.
 */
export function PerformanceHeatmap({ convocatoriaId }: PerformanceHeatmapProps) {
  const [matrix, setMatrix] = useState<HeatmapRow[]>([]);
  const [criterios, setCriterios] = useState<Criterio[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHeatmap() {
      try {
        const res = await fetch(
          `/api/analytics/heatmap?convocatoria_id=${convocatoriaId}`,
        );
        if (res.ok) {
          const data = await res.json();
          setMatrix(data.matrix ?? []);
          setCriterios(data.criterios ?? []);
          setSummary(data.summary ?? null);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchHeatmap();
  }, [convocatoriaId]);

  if (loading) {
    return (
      <div className="rounded-[14px] border border-border bg-bg-card p-6">
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-border border-t-accent" />
          Cargando heatmap...
        </div>
      </div>
    );
  }

  if (matrix.length === 0 || criterios.length === 0) {
    return (
      <div className="rounded-[14px] border border-border bg-bg-card p-6 text-center">
        <p className="text-sm text-text-muted">
          No hay datos de evaluacion suficientes para generar el heatmap.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-[14px] border border-border bg-bg-card">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="sticky left-0 z-10 bg-bg-card px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-muted">
                Municipio
              </th>
              {criterios.map((c) => (
                <th
                  key={c.campo_id}
                  className="px-2 py-3 text-center text-[10px] font-medium uppercase tracking-wider text-text-muted"
                  title={c.campo_nombre}
                >
                  <span className="block max-w-[80px] truncate">
                    {c.campo_nombre}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {matrix.map((row) => (
              <tr key={row.municipio_id}>
                <td className="sticky left-0 z-10 bg-bg-card px-4 py-2">
                  <p className="text-xs font-medium text-text-primary">
                    {row.municipio_nombre}
                  </p>
                  <p className="text-[10px] text-text-muted">
                    {row.departamento}
                  </p>
                </td>
                {row.scores.map((s) => {
                  const cellKey = `${row.municipio_id}:${s.campo_id}`;
                  return (
                    <td
                      key={s.campo_id}
                      className="relative px-1 py-2 text-center"
                      onMouseEnter={() => setHoveredCell(cellKey)}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      <div
                        className={`mx-auto flex h-8 w-12 items-center justify-center rounded-md transition-all ${getCellColor(s.percentage)} ${getCellTextColor(s.percentage)} ${
                          hoveredCell === cellKey
                            ? "ring-2 ring-accent ring-offset-1"
                            : ""
                        }`}
                      >
                        <span className="text-[11px] font-bold tabular-nums">
                          {s.percentage !== null ? `${s.percentage}%` : "—"}
                        </span>
                      </div>
                      {/* Tooltip */}
                      {hoveredCell === cellKey && s.score !== null && (
                        <div className="absolute bottom-full left-1/2 z-20 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-bg-elevated px-2 py-1 text-[10px] shadow-lg border border-border">
                          {s.score}/{s.max_score}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-2">
        <span className="text-[10px] text-text-muted">Escala:</span>
        <div className="flex items-center gap-1">
          {[
            { label: "<20%", color: "bg-red-400" },
            { label: "20-40%", color: "bg-orange-300" },
            { label: "40-60%", color: "bg-amber-300" },
            { label: "60-80%", color: "bg-emerald-200" },
            { label: ">80%", color: "bg-emerald-400" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1">
              <div className={`h-3 w-3 rounded-sm ${item.color}`} />
              <span className="text-[10px] text-text-muted">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Summary */}
      {summary && (
        <div className="rounded-md border border-purple-200 bg-purple-50 px-4 py-3">
          <div className="flex items-start gap-2">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-purple-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
              />
            </svg>
            <p className="text-xs text-purple-800">{summary}</p>
          </div>
        </div>
      )}
    </div>
  );
}
