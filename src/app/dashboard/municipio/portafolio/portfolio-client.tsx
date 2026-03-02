"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { STATUS_META } from "@/lib/submission-status";
import type { SubmissionStatus } from "@/lib/types/database";

interface PortfolioSubmission {
  id: string;
  convocatoria_id: string;
  progress: number;
  status: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  submitted_at: string | null;
}

interface PortfolioEvaluation {
  id: string;
  submission_id: string;
  total_score: number;
  max_score: number;
  created_at: string;
}

interface ConvInfo {
  nombre: string;
  estado: string;
  fecha_cierre: string | null;
}

interface PortfolioClientProps {
  submissions: PortfolioSubmission[];
  evaluations: PortfolioEvaluation[];
  convocatoriaMap: Record<string, ConvInfo>;
}

const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "draft", label: "Borrador" },
  { value: "submitted", label: "Enviado" },
  { value: "under_review", label: "En revision" },
  { value: "needs_revision", label: "Requiere cambios" },
  { value: "approved", label: "Aprobado" },
  { value: "rejected", label: "No aprobado" },
];

export function PortfolioClient({
  submissions,
  evaluations,
  convocatoriaMap,
}: PortfolioClientProps) {
  const [statusFilter, setStatusFilter] = useState("all");

  const evalMap = useMemo(() => {
    const map: Record<string, PortfolioEvaluation> = {};
    for (const e of evaluations) {
      if (!map[e.submission_id] || e.created_at > map[e.submission_id].created_at) {
        map[e.submission_id] = e;
      }
    }
    return map;
  }, [evaluations]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return submissions;
    return submissions.filter((s) => s.status === statusFilter);
  }, [submissions, statusFilter]);

  // Aggregate stats
  const stats = useMemo(() => {
    const total = submissions.length;
    const approved = submissions.filter((s) => s.status === "approved").length;
    const rejected = submissions.filter((s) => s.status === "rejected").length;
    const active = submissions.filter(
      (s) => !["approved", "rejected"].includes(s.status),
    ).length;
    const scores = submissions
      .map((s) => evalMap[s.id])
      .filter(Boolean)
      .map((e) => Math.round((e.total_score / e.max_score) * 100));
    const avgScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null;
    const successRate =
      approved + rejected > 0
        ? Math.round((approved / (approved + rejected)) * 100)
        : null;

    return { total, approved, rejected, active, avgScore, successRate };
  }, [submissions, evalMap]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total proyectos" value={stats.total} />
        <StatCard label="Activos" value={stats.active} />
        <StatCard
          label="Tasa de exito"
          value={stats.successRate !== null ? `${stats.successRate}%` : "—"}
        />
        <StatCard
          label="Score promedio"
          value={stats.avgScore !== null ? `${stats.avgScore}/100` : "—"}
        />
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
          Filtrar:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                statusFilter === opt.value
                  ? "bg-accent text-white"
                  : "bg-bg-elevated text-text-secondary hover:bg-bg-hover"
              }`}
            >
              {opt.label}
              {opt.value !== "all" && (
                <span className="ml-1 opacity-70">
                  ({submissions.filter((s) => s.status === opt.value).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Project List */}
      {filtered.length === 0 ? (
        <div className="rounded-[8px] border border-dashed border-border p-8 text-center">
          <p className="text-[13px] text-text-muted">
            No hay proyectos con este filtro.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((sub) => {
            const conv = convocatoriaMap[sub.convocatoria_id];
            const evaluation = evalMap[sub.id];
            const statusMeta =
              STATUS_META[sub.status as SubmissionStatus] ?? STATUS_META.draft;

            return (
              <Link
                key={sub.id}
                href={`/dashboard/municipio/convocatorias/${sub.convocatoria_id}`}
                className="block card-premium hover:border-accent/30 transition-colors"
              >
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[14px] font-medium text-text-primary truncate">
                        {conv?.nombre ?? "Convocatoria"}
                      </h3>
                      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${statusMeta.bgColor} ${statusMeta.color} ${statusMeta.borderColor}`}
                        >
                          {statusMeta.label}
                        </span>
                        {conv?.fecha_cierre && (
                          <span className="text-[10px] text-text-muted">
                            Cierre:{" "}
                            {new Date(conv.fecha_cierre).toLocaleDateString(
                              "es-CO",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
                        )}
                        {sub.submitted_at && (
                          <span className="text-[10px] text-text-muted">
                            Enviado:{" "}
                            {new Date(sub.submitted_at).toLocaleDateString(
                              "es-CO",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {evaluation && (
                        <div className="text-center">
                          <p
                            className={`text-[18px] font-semibold tabular-nums ${
                              Math.round(
                                (evaluation.total_score /
                                  evaluation.max_score) *
                                  100,
                              ) >= 70
                                ? "text-emerald-600"
                                : Math.round(
                                      (evaluation.total_score /
                                        evaluation.max_score) *
                                        100,
                                    ) >= 50
                                  ? "text-amber-600"
                                  : "text-red-500"
                            }`}
                          >
                            {Math.round(
                              (evaluation.total_score / evaluation.max_score) *
                                100,
                            )}
                          </p>
                          <p className="text-[9px] text-text-muted uppercase tracking-wider">
                            score
                          </p>
                        </div>
                      )}
                      <div className="text-center">
                        <p className="text-[18px] font-semibold text-accent tabular-nums">
                          {Math.round(sub.progress)}%
                        </p>
                        <p className="text-[9px] text-text-muted uppercase tracking-wider">
                          avance
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 h-1.5 rounded-full bg-bg-elevated overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-300"
                      style={{ width: `${sub.progress}%` }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
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
    <div className="card-premium px-5 py-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
        {label}
      </p>
      <p className="mt-2 text-[24px] font-semibold leading-none tracking-tight text-text-primary tabular-nums">
        {value}
      </p>
    </div>
  );
}
