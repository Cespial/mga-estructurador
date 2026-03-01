"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Recommendation {
  convocatoria_id: string;
  convocatoria_nombre: string;
  convocatoria_tipo: "MGA" | "PuBlitec";
  match_score: number;
  razon: string;
  probabilidad_exito: string;
  fecha_cierre: string | null;
}

/**
 * Widget showing AI-recommended convocatorias for the municipality.
 * Fetches from /api/ai/match-convocatorias.
 */
export function ConvocatoriaRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch_recs() {
      try {
        const res = await fetch("/api/ai/match-convocatorias");
        if (res.ok) {
          const data = await res.json();
          setRecommendations(data.recommendations ?? []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetch_recs();
  }, []);

  if (loading) {
    return (
      <div className="card-premium px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-border border-t-purple-500" />
          <span className="text-xs text-text-muted">
            Buscando convocatorias recomendadas...
          </span>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null; // Don't show anything if no recommendations
  }

  return (
    <div className="card-premium">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3">
        <svg
          className="h-4 w-4 text-purple-500"
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
        <span className="text-sm font-semibold text-text-primary">
          Convocatorias recomendadas
        </span>
      </div>

      <div className="divide-y divide-border">
        {recommendations.slice(0, 5).map((rec) => (
          <div key={rec.convocatoria_id} className="px-5 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <Link
                  href={
                    rec.convocatoria_tipo === "PuBlitec"
                      ? `/dashboard/proyectos/aplicar/${rec.convocatoria_id}`
                      : `/dashboard/convocatorias/${rec.convocatoria_id}`
                  }
                  className="text-[13px] font-medium text-accent hover:text-accent-hover"
                >
                  {rec.convocatoria_nombre}
                </Link>
                <p className="mt-0.5 text-xs text-text-muted line-clamp-2">
                  {rec.razon}
                </p>
                {rec.fecha_cierre && (
                  <p className="mt-1 text-[10px] text-text-muted">
                    Cierra:{" "}
                    {new Date(rec.fecha_cierre).toLocaleDateString("es-CO", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold"
                  style={{
                    backgroundColor:
                      rec.match_score >= 0.7
                        ? "#d1fae5"
                        : rec.match_score >= 0.5
                          ? "#fef3c7"
                          : "#fee2e2",
                    color:
                      rec.match_score >= 0.7
                        ? "#065f46"
                        : rec.match_score >= 0.5
                          ? "#92400e"
                          : "#991b1b",
                  }}
                >
                  {Math.round(rec.match_score * 100)}
                </div>
                <span
                  className={`text-[10px] font-medium ${
                    rec.probabilidad_exito === "alta"
                      ? "text-emerald-600"
                      : rec.probabilidad_exito === "media"
                        ? "text-amber-600"
                        : "text-red-500"
                  }`}
                >
                  {rec.probabilidad_exito}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
