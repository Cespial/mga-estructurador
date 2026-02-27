import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type {
  Convocatoria,
  Submission,
  Evaluation,
  ConvocatoriaMunicipio,
  Municipio,
} from "@/lib/types/database";
import { toRows } from "@/lib/supabase/helpers";

export default async function AnalyticsPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "entidad_admin" || !profile.tenant_id) {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  // Fetch all data in parallel
  const [convResult, subResult, evalResult, assignResult] = await Promise.all([
    supabase
      .from("convocatorias")
      .select("*")
      .eq("tenant_id", profile.tenant_id),
    supabase
      .from("submissions")
      .select("*"),
    supabase
      .from("evaluations")
      .select("*"),
    supabase
      .from("convocatoria_municipios")
      .select("*, municipios(*)")
  ]);

  const convocatorias = toRows<Convocatoria>(convResult.data);
  const convIds = new Set(convocatorias.map((c) => c.id));

  // Filter to this tenant's data
  const submissions = toRows<Submission>(subResult.data).filter((s) =>
    convIds.has(s.convocatoria_id),
  );
  const evaluations = toRows<Evaluation>(evalResult.data).filter((e) =>
    convIds.has(e.convocatoria_id),
  );
  const assignments = toRows<ConvocatoriaMunicipio & { municipios: Municipio }>(
    assignResult.data,
  ).filter((a) => convIds.has(a.convocatoria_id));

  // Compute stats
  const totalConv = convocatorias.length;
  const openConv = convocatorias.filter((c) => c.estado === "abierta").length;
  const totalMunicipios = new Set(assignments.map((a) => a.municipio_id)).size;
  const totalSubmissions = submissions.length;
  const totalEvaluations = evaluations.length;

  const avgProgress =
    submissions.length > 0
      ? Math.round(
          submissions.reduce((acc, s) => acc + s.progress, 0) /
            submissions.length,
        )
      : 0;

  const avgScore =
    evaluations.length > 0
      ? Math.round(
          evaluations.reduce((acc, e) => acc + e.total_score, 0) /
            evaluations.length,
        )
      : 0;

  const completedSubmissions = submissions.filter(
    (s) => s.progress === 100,
  ).length;

  // Top municipios by progress
  const municipioProgress = new Map<
    string,
    { nombre: string; departamento: string; progress: number; count: number }
  >();
  for (const sub of submissions) {
    const assign = assignments.find(
      (a) =>
        a.municipio_id === sub.municipio_id &&
        a.convocatoria_id === sub.convocatoria_id,
    );
    if (!assign) continue;
    const mun = assign.municipios;
    const existing = municipioProgress.get(mun.id);
    if (existing) {
      existing.progress += sub.progress;
      existing.count += 1;
    } else {
      municipioProgress.set(mun.id, {
        nombre: mun.nombre,
        departamento: mun.departamento,
        progress: sub.progress,
        count: 1,
      });
    }
  }

  const topMunicipios = Array.from(municipioProgress.values())
    .map((m) => ({ ...m, avgProgress: Math.round(m.progress / m.count) }))
    .sort((a, b) => b.avgProgress - a.avgProgress)
    .slice(0, 5);

  // Convocatoria breakdown
  const convBreakdown = convocatorias.map((c) => {
    const subs = submissions.filter((s) => s.convocatoria_id === c.id);
    const evals = evaluations.filter((e) => e.convocatoria_id === c.id);
    const assigns = assignments.filter((a) => a.convocatoria_id === c.id);
    const avg =
      subs.length > 0
        ? Math.round(subs.reduce((acc, s) => acc + s.progress, 0) / subs.length)
        : 0;
    return {
      id: c.id,
      nombre: c.nombre,
      estado: c.estado,
      municipios: assigns.length,
      submissions: subs.length,
      evaluaciones: evals.length,
      avgProgress: avg,
    };
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-text-primary">Analytics</h1>
          <p className="mt-1 text-[13px] text-text-muted">
            Resumen general de todas tus convocatorias.
          </p>
        </div>
        <Link
          href="/dashboard/entidad"
          className="text-[12px] text-accent hover:text-accent-hover transition-colors"
        >
          &larr; Volver al panel
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Convocatorias" value={totalConv} sub={`${openConv} abiertas`} />
        <KpiCard
          label="Municipios asignados"
          value={totalMunicipios}
          sub={`${totalSubmissions} submissions`}
        />
        <KpiCard
          label="Progreso promedio"
          value={`${avgProgress}%`}
          sub={`${completedSubmissions} completadas`}
          highlight
        />
        <KpiCard
          label="Evaluaciones"
          value={totalEvaluations}
          sub={avgScore > 0 ? `Score promedio: ${avgScore}pts` : "Sin evaluar"}
        />
      </div>

      {/* Convocatoria breakdown */}
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted mb-4">
          Por convocatoria
        </p>
        {convBreakdown.length === 0 ? (
          <p className="text-[13px] text-text-muted">No hay convocatorias.</p>
        ) : (
          <div className="card-premium">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
                    Convocatoria
                  </th>
                  <th className="px-6 py-3 text-center text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-center text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
                    Municipios
                  </th>
                  <th className="px-6 py-3 text-center text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
                    Submissions
                  </th>
                  <th className="px-6 py-3 text-center text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
                    Progreso
                  </th>
                  <th className="px-6 py-3 text-center text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
                    Evaluaciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {convBreakdown.map((c) => (
                  <tr key={c.id} className="hover:bg-bg-hover transition-colors">
                    <td className="px-6 py-3.5">
                      <Link
                        href={`/dashboard/entidad/convocatorias/${c.id}`}
                        className="text-[13px] font-medium text-accent hover:text-accent-hover transition-colors"
                      >
                        {c.nombre}
                      </Link>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <EstadoBadge estado={c.estado} />
                    </td>
                    <td className="px-6 py-3.5 text-center text-[13px] text-text-secondary tabular-nums">
                      {c.municipios}
                    </td>
                    <td className="px-6 py-3.5 text-center text-[13px] text-text-secondary tabular-nums">
                      {c.submissions}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <ProgressBar value={c.avgProgress} />
                    </td>
                    <td className="px-6 py-3.5 text-center text-[13px] text-text-secondary tabular-nums">
                      {c.evaluaciones}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top municipios */}
      {topMunicipios.length > 0 && (
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted mb-4">
            Top municipios por avance
          </p>
          <div className="space-y-2">
            {topMunicipios.map((m, i) => (
              <div
                key={m.nombre}
                className="flex items-center gap-4 card-premium px-5 py-3.5"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/8 text-[11px] font-bold text-accent">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-text-primary">
                    {m.nombre}
                  </p>
                  <p className="text-[11px] text-text-muted">{m.departamento}</p>
                </div>
                <ProgressBar value={m.avgProgress} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ── */

function KpiCard({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string;
  value: string | number;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div className="card-premium px-5 py-5">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">{label}</p>
      <p
        className={`mt-3 text-[28px] font-semibold leading-none tracking-tight tabular-nums ${
          highlight ? "text-accent" : "text-text-primary"
        }`}
      >
        {value}
      </p>
      <p className="mt-2 text-[11px] text-text-muted">{sub}</p>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const colors: Record<string, string> = {
    borrador: "bg-bg-app text-text-muted",
    abierta: "bg-emerald-50 text-emerald-600",
    cerrada: "bg-red-50 text-red-600",
    evaluacion: "bg-amber-50 text-amber-600",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
        colors[estado] ?? "bg-bg-app text-text-muted"
      }`}
    >
      {estado}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  let color = "bg-border";
  if (value === 100) color = "bg-emerald-500";
  else if (value >= 60) color = "bg-accent";
  else if (value > 0) color = "bg-amber-500";

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-bg-elevated">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-[11px] font-medium text-text-secondary tabular-nums">{value}%</span>
    </div>
  );
}
