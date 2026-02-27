import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("owner_id", profile.id)
    .single();

  if (!org) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-muted text-accent mb-6">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-text-primary">Bienvenido a Polytech</h2>
        <p className="mt-2 max-w-md text-sm text-text-secondary leading-relaxed">
          Para comenzar, crea tu organizacion. Esto te permitira crear convocatorias o aplicar a ellas.
        </p>
        <Link
          href="/dashboard/onboarding"
          className="mt-8 rounded-[var(--radius-button)] bg-accent px-6 py-2.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
        >
          Crear Organizacion
        </Link>
      </div>
    );
  }

  const isEntity = org.type === "entity";

  let convocatoriaCount = 0;
  let projectCount = 0;
  let scoredCount = 0;
  let avgScore = 0;

  try {
    const { count: cc } = await supabase
      .from("convocatorias_v2")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", org.id);
    convocatoriaCount = cc ?? 0;
  } catch { /* table may not exist yet */ }

  try {
    const query = supabase
      .from("projects")
      .select("*", { count: "exact", head: true });
    if (!isEntity) query.eq("organization_id", org.id);
    const { count: pc } = await query;
    projectCount = pc ?? 0;
  } catch { /* */ }

  try {
    const { data: scores } = await supabase
      .from("project_scores")
      .select("total_weighted_score")
      .eq("status", "completed");
    if (scores && scores.length > 0) {
      scoredCount = scores.length;
      avgScore = Math.round(scores.reduce((sum, s) => sum + (s.total_weighted_score || 0), 0) / scores.length * 10) / 10;
    }
  } catch { /* */ }

  let recentConvocatorias: { id: string; name: string; status: string; created_at: string }[] = [];
  try {
    const { data } = await supabase
      .from("convocatorias_v2")
      .select("id, name, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5);
    recentConvocatorias = data ?? [];
  } catch { /* */ }

  let recentProjects: { id: string; title: string; status: string; created_at: string; budget_requested: number | null }[] = [];
  try {
    const query = supabase
      .from("projects")
      .select("id, title, status, created_at, budget_requested")
      .order("created_at", { ascending: false })
      .limit(5);
    if (!isEntity) query.eq("organization_id", org.id);
    const { data } = await query;
    recentProjects = data ?? [];
  } catch { /* */ }

  const firstName = (profile.full_name || "Usuario").split(" ")[0];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome — reference style: large greeting */}
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-text-primary">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-[13px] text-text-muted">
          {isEntity
            ? "Gestiona tus convocatorias y evalua proyectos."
            : "Explora convocatorias y estructura tus proyectos."}
        </p>
      </div>

      {/* KPI Stats — reference style: uppercase label, large number, sparkline */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
        <StatCard
          label={isEntity ? "Convocatorias Activas" : "Disponibles"}
          value={convocatoriaCount}
          trend="+2 este mes"
          sparkline={[2, 3, 1, 4, 3, 5, 4]}
          color="accent"
        />
        <StatCard
          label={isEntity ? "Proyectos Recibidos" : "Mis Proyectos"}
          value={projectCount}
          trend={`${projectCount} total`}
          sparkline={[1, 2, 3, 2, 4, 3, 5]}
          color="accent"
        />
        <StatCard
          label="Evaluados"
          value={scoredCount}
          trend={scoredCount > 0 ? `${scoredCount} completados` : "Sin evaluar"}
          sparkline={[0, 1, 0, 2, 1, 2, 2]}
          color="success"
        />
        <StatCard
          label="Puntaje Promedio"
          value={avgScore > 0 ? avgScore.toFixed(1) : "--"}
          trend={avgScore > 0 ? "puntaje ponderado" : "Sin datos"}
          sparkline={[60, 72, 65, 80, 75, 85, 90]}
          color="accent"
        />
      </div>

      {/* Two Column Layout — generous spacing */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Convocatorias */}
        <div className="card-premium">
          <div className="flex items-center justify-between px-6 pt-5 pb-4">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
              Convocatorias Recientes
            </h2>
            <Link href="/dashboard/convocatorias" className="text-[12px] font-medium text-accent hover:text-accent-hover transition-colors">
              Ver todas
            </Link>
          </div>
          {recentConvocatorias.length > 0 ? (
            <div className="divide-y divide-border">
              {recentConvocatorias.map((conv) => (
                <Link
                  key={conv.id}
                  href={`/dashboard/convocatorias/${conv.id}`}
                  className="flex items-center justify-between px-6 py-3.5 hover:bg-bg-hover transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-text-primary truncate">{conv.name}</p>
                    <p className="mt-0.5 text-[11px] text-text-muted">
                      {new Date(conv.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <Badge status={conv.status} />
                </Link>
              ))}
            </div>
          ) : (
            <p className="px-6 py-10 text-center text-[13px] text-text-muted">No hay convocatorias aun.</p>
          )}
        </div>

        {/* Recent Projects */}
        <div className="card-premium">
          <div className="flex items-center justify-between px-6 pt-5 pb-4">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
              Proyectos Recientes
            </h2>
            <Link href="/dashboard/proyectos" className="text-[12px] font-medium text-accent hover:text-accent-hover transition-colors">
              Ver todos
            </Link>
          </div>
          {recentProjects.length > 0 ? (
            <div className="divide-y divide-border">
              {recentProjects.map((proj) => (
                <Link
                  key={proj.id}
                  href={`/dashboard/proyectos/${proj.id}`}
                  className="flex items-center justify-between px-6 py-3.5 hover:bg-bg-hover transition-colors"
                >
                  <div className="min-w-0 flex-1 pr-4">
                    <p className="text-[13px] font-medium text-text-primary truncate">{proj.title}</p>
                    <p className="mt-0.5 text-[11px] text-text-muted tabular-nums">
                      {proj.budget_requested
                        ? `$${Number(proj.budget_requested).toLocaleString("es-CO")}`
                        : "Sin presupuesto"}
                    </p>
                  </div>
                  <Badge status={proj.status} />
                </Link>
              ))}
            </div>
          ) : (
            <p className="px-6 py-10 text-center text-[13px] text-text-muted">No hay proyectos aun.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Stat Card — reference inspired ── */

function StatCard({
  label,
  value,
  trend,
  sparkline,
  color,
}: {
  label: string;
  value: string | number;
  trend: string;
  sparkline: number[];
  color: "accent" | "success";
}) {
  const max = Math.max(...sparkline, 1);
  const barColor = color === "success" ? "bg-success" : "bg-accent";

  return (
    <div className="card-premium px-5 py-5">
      {/* Uppercase label — reference style */}
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
        {label}
      </p>

      {/* Value + sparkline row */}
      <div className="mt-3 flex items-end justify-between">
        <p className="text-[28px] font-semibold leading-none tracking-tight text-text-primary tabular-nums">
          {value}
        </p>

        {/* Mini sparkline bars */}
        <div className="flex items-end gap-[3px] h-[28px]">
          {sparkline.map((v, i) => (
            <div
              key={i}
              className={`w-[4px] rounded-[1px] ${barColor} opacity-70`}
              style={{ height: `${Math.max((v / max) * 100, 8)}%` }}
            />
          ))}
        </div>
      </div>

      {/* Trend line */}
      <p className="mt-3 text-[11px] text-success font-medium">
        {trend}
      </p>
    </div>
  );
}
