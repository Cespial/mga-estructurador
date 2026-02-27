import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function ReportesPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, type")
    .eq("owner_id", profile.id)
    .single();

  // Fetch scored projects
  let scoredProjects: {
    id: string;
    title: string;
    status: string;
    budget_requested: number | null;
    total_weighted_score: number | null;
    score_status: string;
  }[] = [];

  try {
    const { data } = await supabase
      .from("projects")
      .select(`
        id, title, status, budget_requested,
        project_scores(total_weighted_score, status)
      `)
      .in("status", ["scored", "approved", "rejected"])
      .order("created_at", { ascending: false });

    scoredProjects = (data ?? []).map((p: Record<string, unknown>) => {
      const scores = p.project_scores as { total_weighted_score: number | null; status: string }[] | null;
      const latestScore = scores?.[0];
      return {
        id: p.id as string,
        title: p.title as string,
        status: p.status as string,
        budget_requested: p.budget_requested as number | null,
        total_weighted_score: latestScore?.total_weighted_score ?? null,
        score_status: latestScore?.status ?? "pending",
      };
    });
  } catch { /* */ }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-text-primary">Reportes</h1>
        <p className="mt-1 text-[13px] text-text-muted">
          Descarga reportes de evaluacion en PDF y Excel.
        </p>
      </div>

      {/* Report types */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 stagger-children">
        <div className="card-premium px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-accent/8 text-accent mb-3">
            <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h3 className="text-[13px] font-semibold text-text-primary">Pre-factibilidad</h3>
          <p className="mt-1 text-[12px] text-text-muted">
            Reporte completo de evaluacion con scoring por criterio y resumen ejecutivo.
          </p>
        </div>
        <div className="card-premium px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-emerald-50 text-emerald-600 mb-3">
            <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 0v.75" />
            </svg>
          </div>
          <h3 className="text-[13px] font-semibold text-text-primary">Comparativo</h3>
          <p className="mt-1 text-[12px] text-text-muted">
            Tabla comparativa de todos los proyectos de una convocatoria con ranking.
          </p>
        </div>
        <div className="card-premium px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-accent/8 text-accent mb-3">
            <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <h3 className="text-[13px] font-semibold text-text-primary">Individual</h3>
          <p className="mt-1 text-[12px] text-text-muted">
            Reporte detallado por proyecto con formulario completo y evaluacion.
          </p>
        </div>
      </div>

      {/* Scored projects table */}
      <div className="card-premium">
        <div className="px-6 pt-5 pb-4 flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">Proyectos Evaluados</p>
          <span className="text-[12px] text-text-muted tabular-nums">{scoredProjects.length} total</span>
        </div>
        {scoredProjects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-y border-border">
                  <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">Proyecto</th>
                  <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">Presupuesto</th>
                  <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">Puntaje</th>
                  <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">Estado</th>
                  <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">Exportar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {scoredProjects.map((proj) => (
                  <tr key={proj.id} className="hover:bg-bg-hover transition-colors">
                    <td className="px-6 py-3.5">
                      <Link href={`/dashboard/evaluaciones/${proj.id}`} className="text-[13px] text-text-primary hover:text-accent font-medium transition-colors">
                        {proj.title}
                      </Link>
                    </td>
                    <td className="px-6 py-3.5 text-[13px] text-text-secondary tabular-nums">
                      {proj.budget_requested
                        ? `$${Number(proj.budget_requested).toLocaleString("es-CO")}`
                        : "--"}
                    </td>
                    <td className="px-6 py-3.5 text-[13px] text-text-primary font-semibold tabular-nums">
                      {proj.total_weighted_score?.toFixed(1) ?? "--"}
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge status={proj.status} />
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex gap-2">
                        <Link href={`/api/reports/${proj.id}/pdf`} target="_blank">
                          <Button variant="ghost" size="sm">PDF</Button>
                        </Link>
                        <Link href={`/api/reports/${proj.id}/xlsx`} target="_blank">
                          <Button variant="ghost" size="sm">XLSX</Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 pb-6">
            <p className="py-8 text-center text-[13px] text-text-muted">
              No hay proyectos evaluados aun.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
