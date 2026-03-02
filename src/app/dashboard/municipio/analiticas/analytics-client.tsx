"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

/**
 * Analytics Dashboard (Client Component)
 *
 * Visualizations:
 * 1. Score trajectory over time (line chart)
 * 2. Strongest/weakest MGA sections (radar chart)
 * 3. Progress distribution (bar chart)
 * 4. Summary statistics
 */

interface AnalyticsDashboardProps {
  submissions: Array<{
    id: string;
    convocatoria_id: string;
    progress: number;
    status: string;
    created_at: string;
    updated_at: string;
  }>;
  evaluations: Array<{
    id: string;
    submission_id: string;
    convocatoria_id: string;
    total_score: number;
    max_score: number;
    scores_json: Array<{
      campo_id: string;
      campo_nombre: string;
      score: number;
      max_score: number;
    }>;
    created_at: string;
  }>;
  convocatoriaNames: Record<string, string>;
}

export function AnalyticsDashboard({
  submissions,
  evaluations,
  convocatoriaNames,
}: AnalyticsDashboardProps) {
  // Summary stats
  const totalProjects = submissions.length;
  const avgProgress =
    totalProjects > 0
      ? Math.round(
          submissions.reduce((sum, s) => sum + s.progress, 0) / totalProjects,
        )
      : 0;
  const submitted = submissions.filter(
    (s) => s.status !== "draft",
  ).length;
  const avgScore =
    evaluations.length > 0
      ? Math.round(
          evaluations.reduce(
            (sum, e) => sum + (e.total_score / e.max_score) * 100,
            0,
          ) / evaluations.length,
        )
      : null;

  // Score trajectory data
  const scoreOverTime = evaluations
    .map((e) => ({
      date: new Date(e.created_at).toLocaleDateString("es-CO", {
        month: "short",
        year: "2-digit",
      }),
      score: Math.round((e.total_score / e.max_score) * 100),
      convocatoria:
        convocatoriaNames[e.convocatoria_id]?.slice(0, 20) ?? "—",
    }))
    .reverse();

  // Radar data: average score per campo across all evaluations
  const campoScores: Record<string, { total: number; count: number }> = {};
  for (const ev of evaluations) {
    for (const s of ev.scores_json ?? []) {
      if (!campoScores[s.campo_nombre]) {
        campoScores[s.campo_nombre] = { total: 0, count: 0 };
      }
      campoScores[s.campo_nombre].total +=
        s.max_score > 0 ? (s.score / s.max_score) * 100 : 0;
      campoScores[s.campo_nombre].count++;
    }
  }
  const radarData = Object.entries(campoScores)
    .map(([name, data]) => ({
      campo: name.length > 15 ? name.slice(0, 15) + "..." : name,
      fullName: name,
      score: Math.round(data.total / data.count),
    }))
    .slice(0, 8); // limit to 8 for readability

  // Progress distribution
  const progressBuckets = [
    { range: "0-25%", count: 0 },
    { range: "26-50%", count: 0 },
    { range: "51-75%", count: 0 },
    { range: "76-100%", count: 0 },
  ];
  for (const s of submissions) {
    if (s.progress <= 25) progressBuckets[0].count++;
    else if (s.progress <= 50) progressBuckets[1].count++;
    else if (s.progress <= 75) progressBuckets[2].count++;
    else progressBuckets[3].count++;
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Proyectos" value={totalProjects} />
        <StatCard label="Avance promedio" value={`${avgProgress}%`} />
        <StatCard label="Enviados" value={submitted} />
        <StatCard
          label="Score promedio"
          value={avgScore != null ? `${avgScore}/100` : "—"}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Score trajectory */}
        <div className="card-premium p-5">
          <h3 className="mb-4 text-[13px] font-semibold text-text-primary">
            Trayectoria de scores
          </h3>
          {scoreOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={scoreOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  stroke="#9ca3af"
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11 }}
                  stroke="#9ca3af"
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#7c3aed" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No hay evaluaciones aun." />
          )}
        </div>

        {/* Radar: strengths/weaknesses */}
        <div className="card-premium p-5">
          <h3 className="mb-4 text-[13px] font-semibold text-text-primary">
            Fortalezas y debilidades por seccion
          </h3>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis
                  dataKey="campo"
                  tick={{ fontSize: 10 }}
                  stroke="#9ca3af"
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fontSize: 9 }}
                  stroke="#d1d5db"
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#7c3aed"
                  fill="#7c3aed"
                  fillOpacity={0.2}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No hay datos de evaluacion." />
          )}
        </div>

        {/* Progress distribution */}
        <div className="card-premium p-5">
          <h3 className="mb-4 text-[13px] font-semibold text-text-primary">
            Distribucion de avance
          </h3>
          {totalProjects > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={progressBuckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="range"
                  tick={{ fontSize: 11 }}
                  stroke="#9ca3af"
                />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No hay proyectos." />
          )}
        </div>

        {/* Improvement trajectory */}
        <div className="card-premium p-5">
          <h3 className="mb-4 text-[13px] font-semibold text-text-primary">
            Mejora entre convocatorias
          </h3>
          {scoreOverTime.length >= 2 ? (
            <div className="space-y-3">
              {scoreOverTime.map((entry, i) => {
                const prev = i > 0 ? scoreOverTime[i - 1].score : null;
                const diff = prev != null ? entry.score - prev : null;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                  >
                    <div>
                      <p className="text-[12px] font-medium text-text-primary">
                        {entry.convocatoria}
                      </p>
                      <p className="text-[10px] text-text-muted">
                        {entry.date}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold tabular-nums text-purple-700">
                        {entry.score}
                      </span>
                      {diff != null && (
                        <span
                          className={`text-[10px] font-semibold ${
                            diff > 0
                              ? "text-emerald-600"
                              : diff < 0
                                ? "text-red-500"
                                : "text-text-muted"
                          }`}
                        >
                          {diff > 0 ? "+" : ""}
                          {diff}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyChart message="Necesitas al menos 2 evaluaciones para ver la trayectoria." />
          )}
        </div>
      </div>
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
      <p className="mt-2 text-[28px] font-semibold leading-none tracking-tight text-text-primary tabular-nums">
        {value}
      </p>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[200px] items-center justify-center">
      <p className="text-[12px] text-text-muted">{message}</p>
    </div>
  );
}
