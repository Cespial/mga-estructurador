"use client";

import { useState } from "react";

/**
 * Evaluation Deep Dive
 *
 * Per-criterion detailed analysis showing:
 * - Municipality's response
 * - Evaluator justification
 * - Current rubric level description
 * - Next level description with examples
 * - Link to improvement wizard
 */

interface RubricLevel {
  score: number;
  label: string;
  descripcion: string;
}

interface CriterionAnalysis {
  campo_id: string;
  campo_nombre: string;
  score: number;
  max_score: number;
  justificacion: string;
  recomendacion?: string;
  current_response?: string;
  rubric_levels?: RubricLevel[];
}

interface EvaluationDeepDiveProps {
  scores: CriterionAnalysis[];
  totalScore: number;
  maxScore: number;
  onImproveField?: (campoId: string) => void;
}

export function EvaluationDeepDive({
  scores,
  totalScore,
  maxScore,
  onImproveField,
}: EvaluationDeepDiveProps) {
  const [expandedCriterion, setExpandedCriterion] = useState<string | null>(
    null,
  );
  const [filterMode, setFilterMode] = useState<"all" | "needs_improvement">(
    "all",
  );

  const percentage = Math.round((totalScore / maxScore) * 100);
  const filteredScores =
    filterMode === "needs_improvement"
      ? scores.filter((s) => s.score < s.max_score)
      : scores;

  const needsImprovementCount = scores.filter(
    (s) => s.score < s.max_score,
  ).length;

  return (
    <div className="rounded-[14px] border border-border bg-bg-card">
      {/* Header */}
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-text-primary">
              Analisis detallado de evaluacion
            </h3>
            <p className="mt-0.5 text-[12px] text-text-muted">
              Revision criterio por criterio con guia de mejora
            </p>
          </div>
          <div className="text-center">
            <p
              className={`text-[28px] font-bold tabular-nums ${
                percentage >= 70
                  ? "text-emerald-600"
                  : percentage >= 50
                    ? "text-amber-600"
                    : "text-red-500"
              }`}
            >
              {percentage}
            </p>
            <p className="text-[10px] text-text-muted">
              {totalScore}/{maxScore}
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setFilterMode("all")}
            className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
              filterMode === "all"
                ? "bg-accent text-white"
                : "bg-bg-elevated text-text-secondary hover:bg-bg-hover"
            }`}
          >
            Todos ({scores.length})
          </button>
          <button
            onClick={() => setFilterMode("needs_improvement")}
            className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
              filterMode === "needs_improvement"
                ? "bg-orange-500 text-white"
                : "bg-bg-elevated text-text-secondary hover:bg-bg-hover"
            }`}
          >
            Por mejorar ({needsImprovementCount})
          </button>
        </div>
      </div>

      {/* Criteria List */}
      <div className="divide-y divide-border">
        {filteredScores.map((criterion) => {
          const isExpanded = expandedCriterion === criterion.campo_id;
          const scorePercent = Math.round(
            (criterion.score / criterion.max_score) * 100,
          );
          const currentLevel = criterion.rubric_levels?.findLast(
            (l) => l.score <= criterion.score,
          );
          const nextLevel = criterion.rubric_levels?.find(
            (l) => l.score > criterion.score,
          );

          return (
            <div key={criterion.campo_id} className="px-5">
              {/* Criterion header */}
              <button
                onClick={() =>
                  setExpandedCriterion(isExpanded ? null : criterion.campo_id)
                }
                className="w-full py-3 flex items-center justify-between gap-3 text-left"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                      scorePercent >= 75
                        ? "bg-emerald-100 text-emerald-700"
                        : scorePercent >= 50
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {criterion.score}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-medium text-text-primary truncate">
                      {criterion.campo_nombre}
                    </p>
                    <p className="text-[10px] text-text-muted">
                      {criterion.score}/{criterion.max_score} puntos
                    </p>
                  </div>
                </div>

                {/* Score bar */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-20 h-1.5 rounded-full bg-bg-elevated overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        scorePercent >= 75
                          ? "bg-emerald-500"
                          : scorePercent >= 50
                            ? "bg-amber-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${scorePercent}%` }}
                    />
                  </div>
                  <svg
                    className={`h-4 w-4 text-text-muted transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m19.5 8.25-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </div>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="pb-4 space-y-3">
                  {/* Evaluator justification */}
                  <div className="rounded-lg bg-bg-elevated p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1">
                      Justificacion del evaluador
                    </p>
                    <p className="text-[12px] text-text-secondary leading-relaxed">
                      {criterion.justificacion}
                    </p>
                  </div>

                  {/* Current response excerpt */}
                  {criterion.current_response && (
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1">
                        Tu respuesta
                      </p>
                      <p className="text-[12px] text-text-secondary leading-relaxed line-clamp-4">
                        {criterion.current_response}
                      </p>
                    </div>
                  )}

                  {/* Rubric levels comparison */}
                  {currentLevel && nextLevel && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border border-amber-200 bg-amber-50/30 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 mb-1">
                          Nivel actual: {currentLevel.label} (
                          {currentLevel.score})
                        </p>
                        <p className="text-[11px] text-amber-800 leading-relaxed">
                          {currentLevel.descripcion}
                        </p>
                      </div>
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50/30 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 mb-1">
                          Siguiente nivel: {nextLevel.label} ({nextLevel.score})
                        </p>
                        <p className="text-[11px] text-emerald-800 leading-relaxed">
                          {nextLevel.descripcion}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Recommendation */}
                  {criterion.recomendacion && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50/30 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 mb-1">
                        Recomendacion
                      </p>
                      <p className="text-[11px] text-blue-800 leading-relaxed">
                        {criterion.recomendacion}
                      </p>
                    </div>
                  )}

                  {/* Action button */}
                  {criterion.score < criterion.max_score && onImproveField && (
                    <button
                      onClick={() => onImproveField(criterion.campo_id)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-purple-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-purple-700 transition-colors"
                    >
                      <svg
                        className="h-3.5 w-3.5"
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
                      Mejorar este campo con IA
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
