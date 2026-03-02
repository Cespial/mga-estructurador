"use client";

import { useState, useMemo } from "react";

/**
 * Score Simulator ("What-If")
 *
 * Interactive component that lets municipalities see the impact of
 * improving specific criteria on their total score.
 */

interface CriterionScore {
  campo_id: string;
  campo_nombre: string;
  score: number;
  max_score: number;
  peso: number;
}

interface ScoreSimulatorProps {
  criteria: CriterionScore[];
  currentTotalScore: number;
  onNavigateToField?: (campoId: string) => void;
  onClose: () => void;
}

export function ScoreSimulator({
  criteria,
  currentTotalScore,
  onNavigateToField,
  onClose,
}: ScoreSimulatorProps) {
  const [simulated, setSimulated] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const c of criteria) {
      initial[c.campo_id] = c.score;
    }
    return initial;
  });

  const totalWeight = useMemo(
    () => criteria.reduce((sum, c) => sum + c.peso, 0),
    [criteria],
  );

  const simulatedTotal = useMemo(() => {
    let total = 0;
    for (const c of criteria) {
      const score = simulated[c.campo_id] ?? c.score;
      const normalizedScore =
        c.max_score > 0 ? (score / c.max_score) * 100 : 0;
      total += normalizedScore * (c.peso / (totalWeight || 1));
    }
    return Math.round(total);
  }, [criteria, simulated, totalWeight]);

  const scoreDiff = simulatedTotal - Math.round(currentTotalScore);

  // Calculate ROI: which criteria give the most score improvement per point
  const roiRanking = useMemo(() => {
    return criteria
      .map((c) => {
        const currentScore = c.score;
        const maxGain = c.max_score - currentScore;
        const impactPerPoint =
          maxGain > 0
            ? ((maxGain / c.max_score) * 100 * (c.peso / (totalWeight || 1))) /
              maxGain
            : 0;
        return {
          ...c,
          maxGain,
          totalImpact: (maxGain / c.max_score) * 100 * (c.peso / (totalWeight || 1)),
          impactPerPoint,
        };
      })
      .filter((c) => c.maxGain > 0)
      .sort((a, b) => b.totalImpact - a.totalImpact);
  }, [criteria, totalWeight]);

  return (
    <div className="rounded-[14px] border border-border bg-bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <svg
            className="h-4 w-4 text-purple-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
            />
          </svg>
          <span className="text-sm font-semibold text-text-primary">
            Simulador de Score
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-text-muted hover:text-text-primary"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Total score display */}
      <div className="border-b border-border px-5 py-3">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-[10px] text-text-muted">Actual</p>
            <p className="text-xl font-bold tabular-nums text-text-primary">
              {Math.round(currentTotalScore)}
            </p>
          </div>
          <svg
            className="h-4 w-4 text-text-muted"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
            />
          </svg>
          <div className="text-center">
            <p className="text-[10px] text-text-muted">Simulado</p>
            <p className="text-xl font-bold tabular-nums text-purple-700">
              {simulatedTotal}
            </p>
          </div>
          {scoreDiff !== 0 && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                scoreDiff > 0
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {scoreDiff > 0 ? "+" : ""}
              {scoreDiff}
            </span>
          )}
        </div>
      </div>

      {/* Top 3 ROI improvements */}
      {roiRanking.length > 0 && (
        <div className="border-b border-border px-5 py-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
            Top mejoras de mayor impacto
          </p>
          <div className="space-y-1.5">
            {roiRanking.slice(0, 3).map((item, i) => (
              <div
                key={item.campo_id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
                    {i + 1}
                  </span>
                  <span className="text-[11px] text-text-secondary">
                    {item.campo_nombre}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-emerald-600 font-medium">
                    +{Math.round(item.totalImpact)} pts potenciales
                  </span>
                  {onNavigateToField && (
                    <button
                      onClick={() => onNavigateToField(item.campo_id)}
                      className="text-[10px] text-accent hover:text-accent-hover"
                    >
                      Ir al campo
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sliders per criterion */}
      <div className="max-h-80 overflow-y-auto divide-y divide-border px-5">
        {criteria.map((c) => (
          <div key={c.campo_id} className="py-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-medium text-text-primary">
                {c.campo_nombre}
              </span>
              <span className="text-[11px] tabular-nums text-text-muted">
                {simulated[c.campo_id] ?? c.score}/{c.max_score}
                {c.peso > 0 && (
                  <span className="ml-1 text-[9px]">(peso: {c.peso}%)</span>
                )}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={c.max_score}
              step={1}
              value={simulated[c.campo_id] ?? c.score}
              onChange={(e) =>
                setSimulated((prev) => ({
                  ...prev,
                  [c.campo_id]: Number(e.target.value),
                }))
              }
              className="w-full h-1.5 accent-purple-600 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-text-muted mt-0.5">
              <span>0</span>
              <span>{c.max_score}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Reset button */}
      <div className="border-t border-border px-5 py-3">
        <button
          onClick={() => {
            const reset: Record<string, number> = {};
            for (const c of criteria) reset[c.campo_id] = c.score;
            setSimulated(reset);
          }}
          className="text-[11px] text-text-muted hover:text-text-primary"
        >
          Restablecer valores originales
        </button>
      </div>
    </div>
  );
}
