"use client";

import { useState, useEffect } from "react";
import { BenchmarkChart } from "@/components/ai/benchmark-chart";

interface BenchmarkData {
  available: boolean;
  message?: string;
  summary?: {
    total_submissions: number;
    average: number;
    median: number;
    top_quartile: number;
    min: number;
    max: number;
  };
  my_position?: {
    score: number | null;
    position: number | null;
    percentile: number | null;
    of: number;
  } | null;
  distribution?: number[];
  criteria?: Array<{
    campo_id: string;
    campo_nombre: string;
    average: number;
    max_score: number;
    count: number;
  }>;
}

export default function BenchmarksPage() {
  const [data, setData] = useState<BenchmarkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [convocatoriaId, setConvocatoriaId] = useState<string | null>(null);

  useEffect(() => {
    // Get convocatoria_id from URL params
    const params = new URLSearchParams(window.location.search);
    const cId = params.get("convocatoria_id");
    const sId = params.get("submission_id");
    setConvocatoriaId(cId);

    if (!cId) {
      setLoading(false);
      return;
    }

    fetch(
      `/api/ai/benchmarks?convocatoria_id=${cId}${sId ? `&submission_id=${sId}` : ""}`,
    )
      .then((res) => res.json())
      .then(setData)
      .catch(() =>
        setData({ available: false, message: "Error al cargar benchmarks" }),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded bg-bg-elevated" />
          <div className="h-40 rounded-lg bg-bg-elevated" />
        </div>
      </div>
    );
  }

  if (!convocatoriaId || !data?.available) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-2">
          Benchmarks
        </h2>
        <p className="text-sm text-text-muted">
          {data?.message ?? "Selecciona una convocatoria para ver los benchmarks."}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">
          Benchmarks de la Convocatoria
        </h2>
        <p className="text-sm text-text-muted">
          Comparacion anonimizada con {data.summary?.total_submissions} proyectos
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Promedio" value={`${data.summary?.average}%`} />
        <StatCard label="Mediana" value={`${data.summary?.median}%`} />
        <StatCard label="Cuartil superior" value={`${data.summary?.top_quartile}%`} />
        {data.my_position?.score != null && (
          <StatCard
            label="Tu posicion"
            value={`#${data.my_position.position} de ${data.my_position.of}`}
            accent
          />
        )}
      </div>

      {/* Distribution chart */}
      {data.distribution && data.summary && (
        <div className="rounded-[14px] border border-border bg-bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-text-primary">
            Distribucion de Scores
          </h3>
          <BenchmarkChart
            distribution={data.distribution}
            myScore={data.my_position?.score ?? null}
            average={data.summary.average}
            median={data.summary.median}
          />
        </div>
      )}

      {/* Per-criteria breakdown */}
      {data.criteria && data.criteria.length > 0 && (
        <div className="rounded-[14px] border border-border bg-bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-text-primary">
            Promedios por Criterio
          </h3>
          <div className="space-y-3">
            {data.criteria.map((c) => {
              const pct =
                c.max_score > 0
                  ? Math.round((c.average / c.max_score) * 100)
                  : 0;
              return (
                <div key={c.campo_id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-text-secondary">
                      {c.campo_nombre}
                    </span>
                    <span className="text-xs tabular-nums text-text-muted">
                      {c.average}/{c.max_score}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-bg-elevated">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pct >= 75
                          ? "bg-emerald-500"
                          : pct >= 50
                            ? "bg-amber-500"
                            : "bg-red-400"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-[14px] border p-4 ${
        accent
          ? "border-purple-200 bg-purple-50"
          : "border-border bg-bg-card"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </p>
      <p
        className={`mt-1 text-xl font-bold tabular-nums ${
          accent ? "text-purple-700" : "text-text-primary"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
