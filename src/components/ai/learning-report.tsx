"use client";

import { useState } from "react";

/**
 * Learning Report
 *
 * Post-evaluation AI report that groups weaknesses into themes
 * and suggests improvement actions.
 */

interface LearningReportProps {
  submissionId: string;
  convocatoriaId: string;
}

interface ReportData {
  themes: Array<{
    name: string;
    description: string;
    affected_fields: string[];
    suggestion: string;
  }>;
  summary: string;
}

export function LearningReport({
  submissionId,
  convocatoriaId,
}: LearningReportProps) {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateReport() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/learning-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: submissionId,
          convocatoria_id: convocatoriaId,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? "Error al generar el reporte");
        return;
      }
      const json = await res.json();
      setReport(json);
    } catch {
      setError("Error de conexion");
    } finally {
      setLoading(false);
    }
  }

  if (!report) {
    return (
      <div className="rounded-[14px] border border-border bg-bg-card p-5 text-center">
        <svg className="mx-auto h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
        </svg>
        <h3 className="mt-2 text-[13px] font-semibold text-text-primary">
          Reporte de aprendizaje
        </h3>
        <p className="mt-1 text-[11px] text-text-muted">
          La IA analizara los resultados de tu evaluacion y agrupara las debilidades
          en temas de aprendizaje con sugerencias concretas.
        </p>
        {error && (
          <p className="mt-2 text-[11px] text-red-600">{error}</p>
        )}
        <button
          onClick={generateReport}
          disabled={loading}
          className="mt-3 inline-flex items-center gap-1.5 rounded-[var(--radius-button)] bg-purple-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Generando...
            </>
          ) : (
            "Generar reporte"
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-[14px] border border-border bg-bg-card">
      <div className="border-b border-border px-5 py-3">
        <h3 className="text-sm font-semibold text-text-primary">
          Reporte de aprendizaje
        </h3>
      </div>

      {/* Summary */}
      <div className="border-b border-border px-5 py-3">
        <p className="text-[12px] text-text-secondary leading-relaxed">
          {report.summary}
        </p>
      </div>

      {/* Themes */}
      <div className="divide-y divide-border">
        {report.themes.map((theme, i) => (
          <div key={i} className="px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-[10px] font-bold text-purple-700">
                {i + 1}
              </span>
              <h4 className="text-[13px] font-semibold text-text-primary">
                {theme.name}
              </h4>
            </div>
            <p className="mt-1 pl-8 text-[11px] text-text-secondary">
              {theme.description}
            </p>
            <div className="mt-2 pl-8 rounded-md bg-emerald-50 border border-emerald-100 px-3 py-2">
              <p className="text-[10px] font-medium text-emerald-700">
                Sugerencia de mejora:
              </p>
              <p className="text-[11px] text-emerald-800">{theme.suggestion}</p>
            </div>
            {theme.affected_fields.length > 0 && (
              <div className="mt-1.5 pl-8 flex gap-1 flex-wrap">
                {theme.affected_fields.map((f) => (
                  <span
                    key={f}
                    className="rounded-full bg-bg-elevated px-1.5 py-0.5 text-[9px] text-text-muted"
                  >
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
