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
        <h2 className="text-xl font-bold text-text-primary">Seccion de Evaluaciones</h2>
        <p className="mt-2 text-sm text-text-secondary">
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
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Evaluaciones</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Revisa y gestiona las evaluaciones de proyectos recibidos.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 stagger-children">
        <div className="card-premium p-5">
          <p className="text-sm text-text-muted">Pendientes de Evaluacion</p>
          <p className="mt-1 text-2xl font-bold text-accent">{pendingCount}</p>
        </div>
        <div className="card-premium p-5">
          <p className="text-sm text-text-muted">Evaluados</p>
          <p className="mt-1 text-2xl font-bold text-success">{scoredCount}</p>
        </div>
        <div className="card-premium p-5">
          <p className="text-sm text-text-muted">Puntaje Promedio</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">{avgScore}</p>
        </div>
      </div>

      {/* Projects to evaluate */}
      <div className="card-premium p-5">
        <h2 className="text-base font-semibold text-text-primary mb-4">Proyectos</h2>
        {projects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-text-muted">
                  <th className="pb-3 font-medium">Proyecto</th>
                  <th className="pb-3 font-medium">Presupuesto</th>
                  <th className="pb-3 font-medium">Estado</th>
                  <th className="pb-3 font-medium">Puntaje</th>
                  <th className="pb-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((proj) => {
                  const score = scores.find(s => s.project_id === proj.id);
                  return (
                    <tr key={proj.id} className="border-b border-border/50 hover:bg-white/3 transition-colors">
                      <td className="py-3 text-text-primary font-medium">{proj.title}</td>
                      <td className="py-3 text-text-secondary">
                        {proj.budget_requested
                          ? `$${Number(proj.budget_requested).toLocaleString("es-CO")}`
                          : "--"}
                      </td>
                      <td className="py-3">
                        <Badge status={proj.status} />
                      </td>
                      <td className="py-3 text-text-primary font-semibold">
                        {score?.total_weighted_score?.toFixed(1) ?? "--"}
                      </td>
                      <td className="py-3">
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
          <p className="py-8 text-center text-sm text-text-muted">
            No hay proyectos para evaluar aun.
          </p>
        )}
      </div>
    </div>
  );
}
