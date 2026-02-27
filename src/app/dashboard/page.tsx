import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  // Try to get organization
  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("owner_id", profile.id)
    .single();

  // If no org, show onboarding prompt
  if (!org) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-muted text-accent mb-6">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-text-primary">Bienvenido a Polytech</h2>
        <p className="mt-2 max-w-md text-sm text-text-secondary">
          Para comenzar, crea tu organizacion. Esto te permitira crear convocatorias o aplicar a ellas.
        </p>
        <Link
          href="/dashboard/onboarding"
          className="mt-6 rounded-[var(--radius-button)] bg-accent px-6 py-2.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
        >
          Crear Organizacion
        </Link>
      </div>
    );
  }

  const isEntity = org.type === "entity";

  // Fetch counts — use try/catch in case tables don't exist yet
  let convocatoriaCount = 0;
  let projectCount = 0;
  let scoredCount = 0;

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
    if (isEntity) {
      // Entity sees projects submitted to their convocatorias
    } else {
      query.eq("organization_id", org.id);
    }
    const { count: pc } = await query;
    projectCount = pc ?? 0;
  } catch { /* table may not exist yet */ }

  // Fetch recent convocatorias
  let recentConvocatorias: { id: string; name: string; status: string; created_at: string }[] = [];
  try {
    const { data } = await supabase
      .from("convocatorias_v2")
      .select("id, name, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5);
    recentConvocatorias = data ?? [];
  } catch { /* */ }

  // Fetch recent projects
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Hola, {profile.full_name || "Usuario"}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          {isEntity
            ? "Gestiona tus convocatorias y evalua proyectos."
            : "Explora convocatorias y estructura tus proyectos."}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
        <DashStatCard
          label={isEntity ? "Convocatorias" : "Disponibles"}
          value={convocatoriaCount}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          }
        />
        <DashStatCard
          label={isEntity ? "Proyectos" : "Mis Proyectos"}
          value={projectCount}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          }
        />
        <DashStatCard
          label="Evaluados"
          value={scoredCount}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          }
        />
        <DashStatCard
          label="Puntaje Promedio"
          value="--"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          }
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Convocatorias */}
        <div className="card-premium p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-text-primary">Convocatorias Recientes</h2>
            <Link href="/dashboard/convocatorias" className="text-xs text-accent hover:text-accent-hover transition-colors">
              Ver todas
            </Link>
          </div>
          {recentConvocatorias.length > 0 ? (
            <div className="space-y-2">
              {recentConvocatorias.map((conv) => (
                <Link
                  key={conv.id}
                  href={`/dashboard/convocatorias/${conv.id}`}
                  className="flex items-center justify-between rounded-[var(--radius-input)] p-3 hover:bg-bg-hover transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">{conv.name}</p>
                    <p className="text-xs text-text-muted">
                      {new Date(conv.created_at).toLocaleDateString("es-CO")}
                    </p>
                  </div>
                  <Badge status={conv.status} />
                </Link>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-text-muted">No hay convocatorias aun.</p>
          )}
        </div>

        {/* Recent Projects */}
        <div className="card-premium p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-text-primary">Proyectos Recientes</h2>
            <Link href="/dashboard/proyectos" className="text-xs text-accent hover:text-accent-hover transition-colors">
              Ver todos
            </Link>
          </div>
          {recentProjects.length > 0 ? (
            <div className="space-y-2">
              {recentProjects.map((proj) => (
                <Link
                  key={proj.id}
                  href={`/dashboard/proyectos/${proj.id}`}
                  className="flex items-center justify-between rounded-[var(--radius-input)] p-3 hover:bg-bg-hover transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">{proj.title}</p>
                    <p className="text-xs text-text-muted">
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
            <p className="py-8 text-center text-sm text-text-muted">No hay proyectos aun.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function DashStatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="card-premium p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-muted">{label}</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-input)] bg-accent-muted text-accent">
          {icon}
        </div>
      </div>
    </div>
  );
}
