import { redirect, notFound } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default async function EvaluationDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  // Fetch project
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (!project) notFound();

  // Fetch convocatoria
  const { data: convocatoria } = await supabase
    .from("convocatorias_v2")
    .select("id, name")
    .eq("id", project.convocatoria_id)
    .single();

  // Fetch scores
  const { data: projectScore } = await supabase
    .from("project_scores")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Fetch criteria scores
  let criteriaScores: {
    id: string;
    score: number;
    max_score: number;
    weight: number;
    weighted_score: number | null;
    justification: string | null;
    ai_rationale: string | null;
    rubric_criteria_id: string;
  }[] = [];

  if (projectScore) {
    const { data } = await supabase
      .from("criteria_scores")
      .select("*")
      .eq("project_score_id", projectScore.id);
    criteriaScores = data ?? [];
  }

  // Fetch rubric criteria names
  let criteriaNames: Record<string, string> = {};
  if (criteriaScores.length > 0) {
    const { data: criteria } = await supabase
      .from("rubric_criteria")
      .select("id, criterion_name")
      .in("id", criteriaScores.map(cs => cs.rubric_criteria_id));
    if (criteria) {
      criteriaNames = Object.fromEntries(criteria.map(c => [c.id, c.criterion_name]));
    }
  }

  // Fetch project forms
  const { data: forms } = await supabase
    .from("project_forms")
    .select("*")
    .eq("project_id", projectId)
    .order("step_number");

  const hasScore = projectScore?.status === "completed";
  const totalScore = projectScore?.total_weighted_score ?? 0;
  const maxPossible = criteriaScores.reduce((acc, cs) => acc + cs.max_score * cs.weight, 0) || 100;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/dashboard/evaluaciones" className="text-xs text-accent hover:text-accent-hover transition-colors">
            &larr; Volver a Evaluaciones
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-text-primary">{project.title}</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Convocatoria: {convocatoria?.name ?? "Desconocida"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge status={project.status} />
          {hasScore && (
            <div className="flex gap-2">
              <Link href={`/api/reports/${projectId}/pdf`} target="_blank">
                <Button variant="outline" size="sm">PDF</Button>
              </Link>
              <Link href={`/api/reports/${projectId}/xlsx`} target="_blank">
                <Button variant="outline" size="sm">Excel</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {hasScore ? (
        <>
          {/* Score circle */}
          <div className="flex items-center gap-8">
            <div className="flex flex-col items-center animate-score-reveal">
              <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-accent glow-accent">
                <div className="text-center">
                  <p className="text-3xl font-bold text-accent">{totalScore.toFixed(1)}</p>
                  <p className="text-xs text-text-muted">/ {maxPossible.toFixed(0)}</p>
                </div>
              </div>
              <p className="mt-3 text-sm font-medium text-text-secondary">Puntaje Total</p>
            </div>
            {projectScore?.ai_summary && (
              <div className="flex-1 card-premium p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-2">Resumen IA</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{projectScore.ai_summary}</p>
              </div>
            )}
          </div>

          {/* Criteria scores */}
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-text-primary">Desglose por Criterio</h2>
            <div className="space-y-3 stagger-children">
              {criteriaScores.map((cs) => {
                const pct = cs.max_score > 0 ? (cs.score / cs.max_score) * 100 : 0;
                return (
                  <div key={cs.id} className="card-premium p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-text-primary">
                        {criteriaNames[cs.rubric_criteria_id] ?? "Criterio"}
                      </h3>
                      <span className="text-sm font-bold text-accent">
                        {cs.score.toFixed(1)} / {cs.max_score}
                      </span>
                    </div>
                    <Progress value={pct} showValue={false} size="sm" />
                    <div className="mt-3 space-y-2">
                      {cs.justification && (
                        <div>
                          <p className="text-xs font-medium text-text-muted">Justificacion</p>
                          <p className="mt-0.5 text-sm text-text-secondary">{cs.justification}</p>
                        </div>
                      )}
                      {cs.ai_rationale && (
                        <div>
                          <p className="text-xs font-medium text-text-muted">Razonamiento IA</p>
                          <p className="mt-0.5 text-sm text-text-secondary">{cs.ai_rationale}</p>
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-text-muted">
                      Peso: {cs.weight}x &middot; Puntaje ponderado: {(cs.weighted_score ?? cs.score * cs.weight).toFixed(1)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="card-premium p-8 text-center">
          {projectScore?.status === "processing" ? (
            <>
              <div className="mx-auto h-10 w-10 rounded-full border-2 border-accent border-t-transparent animate-spin-slow" />
              <p className="mt-4 text-sm text-text-secondary">Evaluando proyecto con IA...</p>
              <p className="mt-1 text-xs text-text-muted">Esto puede tomar unos minutos.</p>
            </>
          ) : (
            <>
              <p className="text-sm text-text-secondary">Este proyecto aun no ha sido evaluado.</p>
              <form action="/api/scoring/start" method="POST" className="mt-4">
                <input type="hidden" name="project_id" value={projectId} />
                <Button variant="primary" type="submit">Iniciar Evaluacion con IA</Button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Project forms data */}
      {forms && forms.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-text-primary">Datos del Proyecto</h2>
          {forms.map((form) => (
            <div key={form.id} className="card-premium p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-3">
                Paso {form.step_number}: {form.step_name}
              </h3>
              <div className="space-y-2">
                {Object.entries(form.form_data as Record<string, string>).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-xs text-text-muted">{key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</p>
                    <p className="text-sm text-text-secondary">{String(value) || "--"}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
