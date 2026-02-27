import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function EvaluacionesPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  // Get user's org
  const { data: org } = await supabase
    .from("organizations")
    .select("id, type")
    .eq("owner_id", profile.id)
    .single();

  if (!org || org.type !== "entity") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <h2 className="text-[22px] font-semibold tracking-tight text-text-primary">Seccion de Evaluaciones</h2>
        <p className="mt-2 text-[13px] text-text-muted">
          Esta seccion es exclusiva para entidades que gestionan convocatorias.
        </p>
      </div>
    );
  }

  // Fetch convocatorias with project counts
  let convocatorias: { id: string; name: string; status: string }[] = [];
  try {
    const { data } = await supabase
      .from("convocatorias_v2")
      .select("id, name, status")
      .eq("organization_id", org.id)
      .order("created_at", { ascending: false });
    convocatorias = data ?? [];
  } catch { /* */ }

  // Fetch projects with scores
  let projects: {
    id: string;
    title: string;
    status: string;
    budget_requested: number | null;
    convocatoria_id: string;
  }[] = [];
  try {
    const { data } = await supabase
      .from("projects")
      .select("id, title, status, budget_requested, convocatoria_id")
      .in("status", ["submitted", "under_review", "scored", "approved", "rejected"])
      .order("created_at", { ascending: false });
    projects = data ?? [];
  } catch { /* */ }

  // Fetch scores
  let scores: {
    id: string;
    project_id: string;
    total_score: number | null;
    total_weighted_score: number | null;
    status: string;
  }[] = [];
  try {
    const { data } = await supabase
      .from("project_scores")
      .select("id, project_id, total_score, total_weighted_score, status")
      .order("created_at", { ascending: false });
    scores = data ?? [];
  } catch { /* */ }

  const scoredCount = scores.filter(s => s.status === "completed").length;
  const pendingCount = projects.filter(p => p.status === "submitted").length;
  const avgScore = scores.filter(s => s.total_weighted_score).length > 0
    ? (scores.filter(s => s.total_weighted_score).reduce((acc, s) => acc + (s.total_weighted_score ?? 0), 0) / scores.filter(s => s.total_weighted_score).length).toFixed(1)
    : "--";

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-text-primary">Evaluaciones</h1>
        <p className="mt-1 text-[13px] text-text-muted">
          Revisa y gestiona las evaluaciones de proyectos recibidos.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 stagger-children">
        <div className="card-premium px-5 py-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">Pendientes</p>
          <p className="mt-3 text-[28px] font-semibold leading-none tracking-tight text-accent tabular-nums">{pendingCount}</p>
        </div>
        <div className="card-premium px-5 py-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">Evaluados</p>
          <p className="mt-3 text-[28px] font-semibold leading-none tracking-tight text-success tabular-nums">{scoredCount}</p>
        </div>
        <div className="card-premium px-5 py-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">Puntaje Promedio</p>
          <p className="mt-3 text-[28px] font-semibold leading-none tracking-tight text-text-primary tabular-nums">{avgScore}</p>
        </div>
      </div>

      {/* Projects table */}
      <div className="card-premium">
        <div className="px-6 pt-5 pb-4 flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">Proyectos</p>
          <span className="text-[12px] text-text-muted tabular-nums">{projects.length} total</span>
        </div>
        {projects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-y border-border">
                  <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">Proyecto</th>
                  <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">Presupuesto</th>
                  <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">Estado</th>
                  <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">Puntaje</th>
                  <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {projects.map((proj) => {
                  const score = scores.find(s => s.project_id === proj.id);
                  return (
                    <tr key={proj.id} className="hover:bg-bg-hover transition-colors">
                      <td className="px-6 py-3.5 text-[13px] text-text-primary font-medium">{proj.title}</td>
                      <td className="px-6 py-3.5 text-[13px] text-text-secondary tabular-nums">
                        {proj.budget_requested
                          ? `$${Number(proj.budget_requested).toLocaleString("es-CO")}`
                          : "--"}
                      </td>
                      <td className="px-6 py-3.5">
                        <Badge status={proj.status} />
                      </td>
                      <td className="px-6 py-3.5 text-[13px] text-text-primary font-semibold tabular-nums">
                        {score?.total_weighted_score?.toFixed(1) ?? "--"}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex gap-2">
                          <Link href={`/dashboard/evaluaciones/${proj.id}`}>
                            <Button variant="ghost" size="sm">Ver</Button>
                          </Link>
                          {proj.status === "submitted" && !score && (
                            <form action={`/api/scoring/start`} method="POST">
                              <input type="hidden" name="project_id" value={proj.id} />
                              <Button variant="primary" size="sm" type="submit">
                                Evaluar
                              </Button>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 pb-6">
            <p className="py-8 text-center text-[13px] text-text-muted">
              No hay proyectos para evaluar aun.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
