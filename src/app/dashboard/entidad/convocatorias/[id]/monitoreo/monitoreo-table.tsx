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
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Municipio
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
              Estado
            </th>
            {etapas.map((etapa) => (
              <th
                key={etapa.id}
                className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                {etapa.nombre}
              </th>
            ))}
            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {localRows.map((row, rowIndex) => {
            const weightedScore = computeWeightedScore(row.perEtapa);

            return (
              <tr key={row.municipio.id}>
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">
                    {row.municipio.nombre}
                  </p>
                  <p className="text-xs text-gray-400">
                    {row.municipio.departamento}
                  </p>
                  {row.submissionId && (
                    <a
                      href={`/api/submissions/${row.submissionId}/pdf`}
                      download
                      className="mt-0.5 inline-block text-[10px] font-medium text-blue-600 hover:text-blue-800"
                    >
                      PDF
                    </a>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {row.submissionId ? (
                    <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      En curso
                    </span>
                  ) : (
                    <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
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
                  <span className="text-sm font-bold text-gray-900">
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
      <div role="dialog" aria-label="Desglose por criterio" className="absolute left-1/2 z-20 mt-1 w-56 -translate-x-1/2 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
          Desglose por criterio
        </p>
        <div className="space-y-1.5">
          {scores.map((s) => (
            <div key={s.campo_id} className="flex items-center justify-between gap-2">
              <span className="truncate text-xs text-gray-700">
                {s.campo_nombre}
              </span>
              <span className="shrink-0 text-xs font-bold text-gray-900">
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
  let bg = "bg-gray-100 text-gray-500";
  if (value === 100) bg = "bg-green-100 text-green-700";
  else if (value > 0) bg = "bg-yellow-100 text-yellow-700";

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
  if (score >= 80) color = "bg-green-100 text-green-700";
  else if (score >= 60) color = "bg-yellow-100 text-yellow-700";
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
