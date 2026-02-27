"use client";

import { useState, useEffect, useCallback } from "react";
import type { Municipio, EvaluationScore } from "@/lib/types/database";

interface EtapaData {
  etapaId: string;
  nombre: string;
  progress: number;
  score: number | null;
  totalPeso: number;
  scoresJson: EvaluationScore[] | null;
  recomendaciones: string[];
}

interface MonitoreoRow {
  municipio: Municipio;
  assignmentEstado: string;
  submissionId: string | null;
  overallProgress: number;
  perEtapa: EtapaData[];
}

interface MonitoreoTableProps {
  rows: MonitoreoRow[];
  etapas: { id: string; nombre: string }[];
  hasRubric: boolean;
}

function computeWeightedScore(perEtapa: EtapaData[]): number | null {
  const scored = perEtapa.filter((ep) => ep.score !== null);
  if (scored.length === 0) return null;

  const totalWeight = scored.reduce((sum, ep) => sum + (ep.totalPeso || 1), 0);
  if (totalWeight === 0) {
    // Fallback to simple average
    return scored.reduce((sum, ep) => sum + (ep.score ?? 0), 0) / scored.length;
  }

  return (
    scored.reduce((sum, ep) => sum + (ep.score ?? 0) * (ep.totalPeso || 1), 0) /
    totalWeight
  );
}

export function MonitoreoTable({
  rows,
  etapas,
  hasRubric,
}: MonitoreoTableProps) {
  const [evaluating, setEvaluating] = useState<string | null>(null);
  const [localRows, setLocalRows] = useState(rows);
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [freshScores, setFreshScores] = useState<Set<string>>(new Set());

  const closePopover = useCallback(() => setOpenPopover(null), []);

  useEffect(() => {
    if (!openPopover) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closePopover();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [openPopover, closePopover]);

  async function handleEvaluate(
    submissionId: string,
    etapaId: string,
    rowIndex: number,
    etapaIndex: number,
  ) {
    const key = `${submissionId}:${etapaId}`;
    setEvaluating(key);

    try {
      const res = await fetch("/api/evaluations/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: submissionId,
          etapa_id: etapaId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setLocalRows((prev) =>
          prev.map((r, ri) =>
            ri === rowIndex
              ? {
                  ...r,
                  perEtapa: r.perEtapa.map((ep, ei) =>
                    ei === etapaIndex
                      ? {
                          ...ep,
                          score: data.total_score,
                          scoresJson: data.scores_json ?? null,
                          recomendaciones: data.recomendaciones,
                        }
                      : ep,
                  ),
                }
              : r,
          ),
        );
        // Mark as fresh for reveal animation
        setFreshScores((prev) => new Set(prev).add(key));
        setTimeout(() => {
          setFreshScores((prev) => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
        }, 1000);
      }
    } catch {
      // silently fail
    } finally {
      setEvaluating(null);
    }
  }

  return (
    <div className="overflow-x-auto rounded-[14px] border border-border bg-bg-card">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-bg-app">
          <tr>
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-muted">
              Municipio
            </th>
            <th className="px-4 py-3 text-center text-[11px] font-medium uppercase tracking-wider text-text-muted">
              Estado
            </th>
            {etapas.map((etapa) => (
              <th
                key={etapa.id}
                className="px-3 py-3 text-center text-[11px] font-medium uppercase tracking-wider text-text-muted"
              >
                {etapa.nombre}
              </th>
            ))}
            <th className="px-4 py-3 text-center text-[11px] font-medium uppercase tracking-wider text-text-muted">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {localRows.map((row, rowIndex) => {
            const weightedScore = computeWeightedScore(row.perEtapa);

            return (
              <tr key={row.municipio.id}>
                <td className="px-4 py-3">
                  <p className="text-[13px] font-medium text-text-primary">
                    {row.municipio.nombre}
                  </p>
                  <p className="text-xs text-text-muted">
                    {row.municipio.departamento}
                  </p>
                  {row.submissionId && (
                    <a
                      href={`/api/submissions/${row.submissionId}/pdf`}
                      download
                      className="mt-0.5 inline-block text-[10px] font-medium text-accent hover:text-accent-hover"
                    >
                      PDF
                    </a>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {row.submissionId ? (
                    <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      En curso
                    </span>
                  ) : (
                    <span className="inline-block rounded-full bg-bg-elevated px-2 py-0.5 text-xs font-medium text-text-muted">
                      Sin iniciar
                    </span>
                  )}
                </td>
                {row.perEtapa.map((ep, etapaIndex) => {
                  const popoverKey = `${row.municipio.id}:${ep.etapaId}`;
                  return (
                    <td key={ep.etapaId} className="px-3 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <ProgressPill value={ep.progress} />
                        {ep.score !== null ? (
                          <div className="relative">
                            <button
                              onClick={() =>
                                setOpenPopover(
                                  openPopover === popoverKey ? null : popoverKey,
                                )
                              }
                              aria-expanded={openPopover === popoverKey}
                              aria-label={`Score ${Math.round(ep.score)} puntos — ver desglose`}
                              className="cursor-pointer"
                            >
                              <ScoreBadge
                                score={ep.score}
                                animate={freshScores.has(`${row.submissionId}:${ep.etapaId}`)}
                              />
                            </button>
                            {openPopover === popoverKey && ep.scoresJson && (
                              <ScorePopover
                                scores={ep.scoresJson}
                                onClose={() => setOpenPopover(null)}
                              />
                            )}
                          </div>
                        ) : hasRubric && row.submissionId && ep.progress > 0 ? (
                          <button
                            onClick={() =>
                              handleEvaluate(
                                row.submissionId!,
                                ep.etapaId,
                                rowIndex,
                                etapaIndex,
                              )
                            }
                            disabled={evaluating !== null}
                            className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600 hover:bg-indigo-100 disabled:opacity-50"
                          >
                            {evaluating ===
                            `${row.submissionId}:${ep.etapaId}`
                              ? "..."
                              : "Evaluar"}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-center">
                  <span className="text-[13px] font-bold text-text-primary">
                    {Math.round(row.overallProgress)}%
                  </span>
                  {weightedScore !== null && (
                    <p className="text-[10px] text-indigo-600">
                      {Math.round(weightedScore)}pts
                    </p>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ScorePopover({
  scores,
  onClose,
}: {
  scores: EvaluationScore[];
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-label="Desglose por criterio" className="absolute left-1/2 z-20 mt-1 w-56 -translate-x-1/2 rounded-[8px] border border-border bg-bg-card p-3 shadow-lg">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          Desglose por criterio
        </p>
        <div className="space-y-1.5">
          {scores.map((s) => (
            <div key={s.campo_id} className="flex items-center justify-between gap-2">
              <span className="truncate text-xs text-text-secondary">
                {s.campo_nombre}
              </span>
              <span className="shrink-0 text-xs font-bold text-text-primary">
                {s.score}/{s.max_score}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function ProgressPill({ value }: { value: number }) {
  let bg = "bg-bg-elevated text-text-muted";
  if (value === 100) bg = "bg-emerald-100 text-emerald-700";
  else if (value > 0) bg = "bg-amber-100 text-amber-700";

  return (
    <span
      className={`inline-block min-w-[2.5rem] rounded-full px-2 py-0.5 text-xs font-medium ${bg}`}
    >
      {value}%
    </span>
  );
}

function ScoreBadge({ score, animate = false }: { score: number; animate?: boolean }) {
  let color = "bg-red-100 text-red-700";
  if (score >= 80) color = "bg-emerald-100 text-emerald-700";
  else if (score >= 60) color = "bg-amber-100 text-amber-700";
  else if (score >= 40) color = "bg-orange-100 text-orange-700";

  return (
    <span
      className={`inline-block min-w-[2.5rem] rounded-full px-2 py-0.5 text-[10px] font-bold ${color} ${
        animate ? "animate-score-reveal" : ""
      }`}
      title={`Score: ${score}/100`}
    >
      {Math.round(score)}pts
    </span>
  );
}
