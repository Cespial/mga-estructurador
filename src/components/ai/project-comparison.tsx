"use client";

import { useState } from "react";

interface ComparisonData {
  available: boolean;
  reference_text?: string;
  reference_score?: { score: number; max_score: number } | null;
  annotation?: string;
  similarity?: number;
  message?: string;
}

interface ProjectComparisonProps {
  convocatoriaId: string;
  submissionId: string;
  etapaId: string;
  campoId: string;
  campoNombre: string;
  currentValue: string;
}

/**
 * Side-by-side comparison of user's field value vs a high-scoring reference project.
 * Button triggers a comparison API call, then shows split view with AI annotation.
 */
export function ProjectComparison({
  convocatoriaId,
  submissionId,
  etapaId,
  campoId,
  campoNombre,
  currentValue,
}: ProjectComparisonProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ComparisonData | null>(null);

  async function fetchComparison() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/compare-field", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          convocatoria_id: convocatoriaId,
          submission_id: submissionId,
          etapa_id: etapaId,
          campo_id: campoId,
          campo_nombre: campoNombre,
          current_value: currentValue,
        }),
      });
      const json = await res.json();
      setData(json);
    } catch {
      setData({ available: false, message: "Error al cargar comparacion" });
    } finally {
      setLoading(false);
    }
  }

  if (!data) {
    return (
      <button
        onClick={fetchComparison}
        disabled={loading || !currentValue?.trim()}
        className="inline-flex items-center gap-1 text-[11px] text-purple-600 hover:text-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="inline-block h-3 w-3 animate-spin rounded-full border border-purple-300 border-t-purple-700" />
        ) : (
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
        )}
        Comparar
      </button>
    );
  }

  if (!data.available) {
    return (
      <div className="mt-2 rounded-md bg-bg-elevated px-3 py-2 text-xs text-text-muted">
        {data.message}
        <button
          onClick={() => setData(null)}
          className="ml-2 text-purple-600 hover:underline"
        >
          Cerrar
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-purple-200 bg-purple-50/30">
      <div className="flex items-center justify-between border-b border-purple-100 px-4 py-2">
        <span className="text-xs font-semibold text-purple-700">
          Comparacion con proyecto de referencia
        </span>
        <button
          onClick={() => setData(null)}
          className="text-purple-400 hover:text-purple-600"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4">
        {/* Current */}
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            Tu respuesta
          </p>
          <div className="rounded-md border border-border bg-bg-card p-3 text-[12px] text-text-primary">
            {currentValue || <span className="text-text-muted">(vacio)</span>}
          </div>
        </div>

        {/* Reference */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
              Proyecto referente
            </p>
            {data.reference_score && (
              <span className="text-[10px] font-bold text-emerald-600">
                {data.reference_score.score}/{data.reference_score.max_score}
              </span>
            )}
          </div>
          <div className="rounded-md border border-emerald-200 bg-emerald-50/50 p-3 text-[12px] text-text-primary">
            {data.reference_text}
          </div>
        </div>
      </div>

      {/* AI annotation */}
      {data.annotation && (
        <div className="border-t border-purple-100 px-4 py-2">
          <p className="text-xs text-purple-700">
            <span className="font-semibold">Analisis IA:</span> {data.annotation}
          </p>
        </div>
      )}
    </div>
  );
}
