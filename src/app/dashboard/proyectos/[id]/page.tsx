import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import type {
  ProjectWithDetails,
  ProjectScoreWithCriteria,
} from "@/lib/types/database";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  // Fetch project with all related data
  const { data: project, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      convocatorias_v2(id, name, slug, status, open_date, close_date),
      project_forms(*),
      project_documents(*),
      project_scores(*, criteria_scores(*))
    `
    )
    .eq("id", id)
    .single();

  if (error || !project) {
    notFound();
  }

  const proj = project as unknown as ProjectWithDetails & {
    project_scores: ProjectScoreWithCriteria[];
  };

  const forms = (proj.project_forms ?? []).sort(
    (a, b) => a.step_number - b.step_number
  );
  const documents = proj.project_documents ?? [];
  const scores = (proj.project_scores ?? []) as ProjectScoreWithCriteria[];
  const convocatoria = proj.convocatorias_v2;

  const completedSteps = forms.filter((f) => f.completed).length;
  const totalSteps = forms.length || 1;
  const progressPct = Math.round((completedSteps / totalSteps) * 100);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <Link
              href="/dashboard/proyectos"
              className="text-text-muted hover:text-text-secondary transition-colors"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
            </Link>
            <Badge status={proj.status} />
          </div>
          <h1 className="text-2xl font-bold text-text-primary truncate">
            {proj.title || "Proyecto sin titulo"}
          </h1>
          {convocatoria && (
            <p className="mt-1 text-sm text-text-secondary">
              Convocatoria:{" "}
              <Link
                href={`/dashboard/convocatorias/${convocatoria.id}`}
                className="text-accent hover:text-accent-hover transition-colors"
              >
                {convocatoria.name}
              </Link>
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {proj.status === "draft" && (
            <Link href={`/dashboard/proyectos/${id}/wizard`}>
              <Button variant="primary">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
                  />
                </svg>
                Continuar Estructuracion
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Progress
              value={progressPct}
              label={`${completedSteps} de ${totalSteps} pasos completados`}
            />
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs
        tabs={[
          {
            id: "info",
            label: "Informacion",
            content: (
              <InfoTab project={proj} convocatoria={convocatoria} />
            ),
          },
          {
            id: "formulario",
            label: "Formulario",
            content: <FormularioTab forms={forms} />,
          },
          {
            id: "documentos",
            label: "Documentos",
            content: <DocumentosTab documents={documents} />,
          },
          {
            id: "calificacion",
            label: "Calificacion",
            content: <CalificacionTab scores={scores} />,
          },
        ]}
      />
    </div>
  );
}

/* ── Tab: Informacion ────────────────────────────────── */
function InfoTab({
  project,
  convocatoria,
}: {
  project: ProjectWithDetails;
  convocatoria: ProjectWithDetails["convocatorias_v2"];
}) {
  const infoItems = [
    { label: "Estado", value: project.status },
    {
      label: "Presupuesto Solicitado",
      value: project.budget_requested
        ? `$${Number(project.budget_requested).toLocaleString("es-CO")}`
        : "No definido",
    },
    {
      label: "Creado",
      value: new Date(project.created_at).toLocaleDateString("es-CO", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    },
    {
      label: "Enviado",
      value: project.submitted_at
        ? new Date(project.submitted_at).toLocaleDateString("es-CO", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "Pendiente",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 stagger-children">
      {infoItems.map((item) => (
        <Card key={item.label} padding="sm">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
            {item.label}
          </p>
          <p className="mt-1 text-sm font-semibold text-text-primary">
            {item.label === "Estado" ? (
              <Badge status={item.value as string} />
            ) : (
              item.value
            )}
          </p>
        </Card>
      ))}

      {convocatoria && (
        <Card padding="sm" className="md:col-span-2">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
            Convocatoria
          </p>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {convocatoria.name}
              </p>
              <div className="mt-1 flex items-center gap-3 text-xs text-text-muted">
                {convocatoria.open_date && (
                  <span>
                    Apertura:{" "}
                    {new Date(convocatoria.open_date).toLocaleDateString("es-CO")}
                  </span>
                )}
                {convocatoria.close_date && (
                  <span>
                    Cierre:{" "}
                    {new Date(convocatoria.close_date).toLocaleDateString("es-CO")}
                  </span>
                )}
              </div>
            </div>
            <Badge status={convocatoria.status} />
          </div>
        </Card>
      )}

      {project.description && (
        <Card padding="sm" className="md:col-span-2">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
            Descripcion
          </p>
          <p className="mt-1 text-sm text-text-secondary whitespace-pre-wrap">
            {project.description}
          </p>
        </Card>
      )}
    </div>
  );
}

/* ── Tab: Formulario ─────────────────────────────────── */
function FormularioTab({
  forms,
}: {
  forms: ProjectWithDetails["project_forms"];
}) {
  if (forms.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-text-muted">
          No hay datos de formulario aun.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 stagger-children">
      {forms.map((form) => {
        const data = (form.form_data ?? {}) as Record<string, string>;
        const entries = Object.entries(data).filter(
          ([, v]) => v && String(v).trim() !== ""
        );

        return (
          <Card key={form.id}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                    form.completed
                      ? "bg-success-muted text-success"
                      : "bg-white/5 text-text-muted"
                  }`}
                >
                  {form.step_number}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">
                    {form.step_name}
                  </h3>
                </div>
              </div>
              <Badge
                variant={form.completed ? "success" : "default"}
              >
                {form.completed ? "Completo" : "Incompleto"}
              </Badge>
            </div>

            {entries.length > 0 ? (
              <div className="space-y-2 mt-3 pt-3 border-t border-border">
                {entries.map(([key, value]) => (
                  <div key={key}>
                    <p className="text-xs font-medium text-text-muted capitalize">
                      {key.replace(/_/g, " ")}
                    </p>
                    <p className="mt-0.5 text-sm text-text-secondary whitespace-pre-wrap">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted mt-2">
                Sin datos completados.
              </p>
            )}
          </Card>
        );
      })}
    </div>
  );
}

/* ── Tab: Documentos ─────────────────────────────────── */
function DocumentosTab({
  documents,
}: {
  documents: ProjectWithDetails["project_documents"];
}) {
  if (documents.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-text-muted">
          No hay documentos cargados aun.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 stagger-children">
      {documents.map((doc) => (
        <Card key={doc.id} padding="sm" variant="interactive">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-input)] bg-accent-muted text-accent shrink-0">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text-primary truncate">
                {doc.filename}
              </p>
              <div className="flex items-center gap-3 text-xs text-text-muted">
                {doc.mime_type && <span>{doc.mime_type}</span>}
                {doc.file_size && (
                  <span>{(doc.file_size / 1024).toFixed(0)} KB</span>
                )}
                <span>
                  {new Date(doc.created_at).toLocaleDateString("es-CO")}
                </span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ── Tab: Calificacion ───────────────────────────────── */
function CalificacionTab({
  scores,
}: {
  scores: ProjectScoreWithCriteria[];
}) {
  if (scores.length === 0) {
    return (
      <div className="py-12 text-center">
        <svg
          className="mx-auto h-10 w-10 text-text-muted mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
          />
        </svg>
        <p className="text-sm text-text-muted">
          Este proyecto aun no ha sido calificado.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 stagger-children">
      {scores.map((score) => (
        <Card key={score.id}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-text-primary">
                  Evaluacion{" "}
                  {score.evaluator_type === "ai" ? "IA" : "Humana"}
                </h3>
                <Badge status={score.status} />
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                {new Date(score.created_at).toLocaleDateString("es-CO", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            {score.total_weighted_score != null && (
              <div className="text-right">
                <p className="text-2xl font-bold text-accent">
                  {score.total_weighted_score.toFixed(1)}
                </p>
                <p className="text-xs text-text-muted">Puntaje Total</p>
              </div>
            )}
          </div>

          {/* AI Summary */}
          {score.ai_summary && (
            <div className="mb-4 rounded-[var(--radius-input)] bg-bg-input p-3">
              <p className="text-xs font-medium text-text-muted mb-1">
                Resumen IA
              </p>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">
                {score.ai_summary}
              </p>
            </div>
          )}

          {/* Criteria breakdown */}
          {score.criteria_scores && score.criteria_scores.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-border">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
                Desglose por Criterio
              </p>
              {score.criteria_scores.map((cs) => (
                <div key={cs.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">
                      {cs.rubric_criteria_id}
                    </span>
                    <span className="font-medium text-text-primary">
                      {cs.score}/{cs.max_score}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full bg-accent transition-all duration-500"
                      style={{
                        width: `${cs.max_score > 0 ? (cs.score / cs.max_score) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  {cs.justification && (
                    <p className="text-xs text-text-muted">
                      {cs.justification}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
