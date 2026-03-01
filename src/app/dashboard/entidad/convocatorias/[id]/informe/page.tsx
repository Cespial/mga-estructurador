"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface ReportData {
  titulo: string;
  resumen_ejecutivo: string;
  estadisticas: {
    total_municipios: number;
    promedio_progreso: number;
    promedio_puntaje: number;
    municipios_completados: number;
  };
  evaluacion_por_municipio: Array<{
    municipio: string;
    puntaje: number;
    fortalezas: string[];
    debilidades: string[];
    recomendacion: string;
  }>;
  analisis_comparativo: {
    mejor_municipio: string;
    areas_fuertes: string[];
    areas_debiles: string[];
    brechas: string;
  };
  recomendaciones_futuras: string[];
}

export default function InformePage() {
  const params = useParams();
  const convocatoriaId = params.id as string;

  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [cached, setCached] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateReport() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/reports/${convocatoriaId}/ai-report`,
        { method: "POST" },
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error generando informe");
      }

      const data = await res.json();
      setReport(data.report);
      setCached(data.cached ?? false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error generando informe",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-text-primary">
            Informe IA
          </h1>
          <p className="mt-1 text-[13px] text-text-muted">
            Reporte ejecutivo generado con inteligencia artificial.
          </p>
        </div>
        <Link
          href={`/dashboard/entidad/convocatorias/${convocatoriaId}`}
          className="text-[12px] text-accent hover:text-accent-hover transition-colors"
        >
          &larr; Volver
        </Link>
      </div>

      {!report && (
        <div className="card-premium px-6 py-8 text-center">
          <svg
            className="mx-auto h-10 w-10 text-purple-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z"
            />
          </svg>
          <p className="mt-4 text-sm font-medium text-text-primary">
            Generar informe ejecutivo con IA
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Analisis comparativo de todos los municipios, fortalezas,
            debilidades y recomendaciones.
          </p>
          <button
            onClick={generateReport}
            disabled={loading}
            className="mt-5 inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-purple-300 border-t-white" />
                Generando informe...
              </>
            ) : (
              "Generar informe"
            )}
          </button>
          {error && (
            <p className="mt-3 text-xs text-red-600">{error}</p>
          )}
        </div>
      )}

      {report && (
        <div className="space-y-6">
          {/* Cache indicator */}
          {cached && (
            <div className="rounded-md bg-blue-50 border border-blue-200 px-3 py-2">
              <p className="text-xs text-blue-700">
                Este informe fue generado previamente hoy. Click &quot;Generar
                informe&quot; manana para una version actualizada.
              </p>
            </div>
          )}

          {/* Title & Summary */}
          <div className="card-premium px-6 py-5">
            <h2 className="text-lg font-semibold text-text-primary">
              {report.titulo}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              {report.resumen_ejecutivo}
            </p>
          </div>

          {/* Stats */}
          {report.estadisticas && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Municipios"
                value={report.estadisticas.total_municipios}
              />
              <StatCard
                label="Progreso promedio"
                value={`${report.estadisticas.promedio_progreso}%`}
              />
              <StatCard
                label="Puntaje promedio"
                value={report.estadisticas.promedio_puntaje}
              />
              <StatCard
                label="Completados"
                value={report.estadisticas.municipios_completados}
              />
            </div>
          )}

          {/* Comparative Analysis */}
          {report.analisis_comparativo && (
            <div className="card-premium px-6 py-5">
              <h3 className="text-sm font-semibold text-text-primary mb-3">
                Analisis comparativo
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
                    Mejor municipio
                  </span>
                  <p className="text-sm font-medium text-emerald-600">
                    {report.analisis_comparativo.mejor_municipio}
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-600">
                      Areas fuertes
                    </span>
                    <ul className="mt-1 space-y-1">
                      {report.analisis_comparativo.areas_fuertes.map(
                        (a, i) => (
                          <li
                            key={i}
                            className="text-xs text-text-secondary flex items-start gap-1.5"
                          >
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                            {a}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                  <div>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-red-500">
                      Areas debiles
                    </span>
                    <ul className="mt-1 space-y-1">
                      {report.analisis_comparativo.areas_debiles.map(
                        (a, i) => (
                          <li
                            key={i}
                            className="text-xs text-text-secondary flex items-start gap-1.5"
                          >
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                            {a}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                </div>
                <p className="text-xs text-text-muted">
                  {report.analisis_comparativo.brechas}
                </p>
              </div>
            </div>
          )}

          {/* Per-municipality evaluation */}
          {report.evaluacion_por_municipio?.length > 0 && (
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted mb-3">
                Evaluacion por municipio
              </p>
              <div className="space-y-3">
                {report.evaluacion_por_municipio.map((mun, i) => (
                  <div key={i} className="card-premium px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-text-primary">
                        {mun.municipio}
                      </h4>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          mun.puntaje >= 70
                            ? "bg-emerald-100 text-emerald-700"
                            : mun.puntaje >= 40
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {mun.puntaje}pts
                      </span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 mb-2">
                      <div>
                        <span className="text-[10px] text-emerald-600 font-medium">
                          Fortalezas
                        </span>
                        <ul className="mt-0.5">
                          {mun.fortalezas.map((f, fi) => (
                            <li key={fi} className="text-xs text-text-secondary">
                              + {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="text-[10px] text-red-500 font-medium">
                          Debilidades
                        </span>
                        <ul className="mt-0.5">
                          {mun.debilidades.map((d, di) => (
                            <li key={di} className="text-xs text-text-secondary">
                              - {d}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <p className="text-xs text-text-muted italic">
                      {mun.recomendacion}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Future recommendations */}
          {report.recomendaciones_futuras?.length > 0 && (
            <div className="card-premium px-6 py-5">
              <h3 className="text-sm font-semibold text-text-primary mb-3">
                Recomendaciones futuras
              </h3>
              <ol className="space-y-2">
                {report.recomendaciones_futuras.map((rec, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-text-secondary"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[10px] font-bold text-purple-700">
                      {i + 1}
                    </span>
                    {rec}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Regenerate button */}
          <div className="flex justify-center">
            <button
              onClick={generateReport}
              disabled={loading}
              className="text-xs text-text-muted hover:text-text-secondary disabled:opacity-50"
            >
              {loading ? "Regenerando..." : "Regenerar informe"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="card-premium px-4 py-4 text-center">
      <p className="text-[28px] font-semibold tracking-tight tabular-nums text-text-primary">
        {value}
      </p>
      <p className="mt-1 text-[11px] text-text-muted">{label}</p>
    </div>
  );
}
