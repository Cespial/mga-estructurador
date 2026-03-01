"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { RubricEditor } from "./rubric-editor-client";
import { updateConvocatoriaStatus } from "./actions";
import type { PuBlitecConvocatoria, RubricCriterion, Project, Rubric, ConvocatoriaStatus } from "@/lib/types/database";

interface DetailClientProps {
  convocatoria: PuBlitecConvocatoria;
  rubric: (Rubric & { rubric_criteria: RubricCriterion[] }) | null;
  criteria: RubricCriterion[];
  projects: Project[];
}

export function ConvocatoriaDetailClient({ convocatoria, rubric, criteria, projects }: DetailClientProps) {
  const [isPending, startTransition] = useTransition();
  const [statusError, setStatusError] = useState<string | null>(null);

  function handleStatusChange(newStatus: ConvocatoriaStatus) {
    setStatusError(null);
    startTransition(async () => {
      const result = await updateConvocatoriaStatus(convocatoria.id, newStatus);
      if (result?.error) {
        setStatusError(result.error);
      }
    });
  }

  const statusActions: { label: string; status: ConvocatoriaStatus; variant: "primary" | "secondary" | "danger" }[] = [];

  if (convocatoria.status === "draft") {
    statusActions.push({ label: "Abrir Convocatoria", status: "open", variant: "primary" });
  }
  if (convocatoria.status === "open") {
    statusActions.push({ label: "Cerrar Recepcion", status: "closed", variant: "danger" });
  }
  if (convocatoria.status === "closed") {
    statusActions.push({ label: "Iniciar Evaluacion", status: "evaluating", variant: "primary" });
  }
  if (convocatoria.status === "evaluating") {
    statusActions.push({ label: "Marcar como Resuelta", status: "resolved", variant: "secondary" });
  }

  // -- Tabs --
  const infoTab = (
    <div className="space-y-6">
      {statusError && (
        <div className="rounded-[var(--radius-input)] border border-danger/30 bg-danger-muted p-3">
          <p className="text-sm text-danger">{statusError}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        {statusActions.map((action) => (
          <Button
            key={action.status}
            variant={action.variant}
            size="md"
            onClick={() => handleStatusChange(action.status)}
            disabled={isPending}
          >
            {isPending ? "Actualizando..." : action.label}
          </Button>
        ))}
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card variant="default" padding="md">
          <CardHeader>
            <CardTitle className="text-base">Detalles Generales</CardTitle>
          </CardHeader>
          <dl className="space-y-3">
            <DetailRow label="Nombre" value={convocatoria.name} />
            <DetailRow label="Slug" value={convocatoria.slug} />
            <DetailRow
              label="Descripcion"
              value={convocatoria.description || "Sin descripcion"}
            />
            <DetailRow
              label="Presupuesto"
              value={
                convocatoria.budget
                  ? `$${Number(convocatoria.budget).toLocaleString("es-CO")} COP`
                  : "No definido"
              }
            />
          </dl>
        </Card>

        <Card variant="default" padding="md">
          <CardHeader>
            <CardTitle className="text-base">Fechas y Estado</CardTitle>
          </CardHeader>
          <dl className="space-y-3">
            <div className="flex items-center justify-between">
              <dt className="text-sm text-text-muted">Estado</dt>
              <dd><Badge status={convocatoria.status} /></dd>
            </div>
            <DetailRow
              label="Apertura"
              value={
                convocatoria.open_date
                  ? new Date(convocatoria.open_date).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })
                  : "No definida"
              }
            />
            <DetailRow
              label="Cierre"
              value={
                convocatoria.close_date
                  ? new Date(convocatoria.close_date).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })
                  : "No definida"
              }
            />
            <DetailRow
              label="Creada"
              value={new Date(convocatoria.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
            />
            <DetailRow
              label="Proyectos recibidos"
              value={String(projects.length)}
            />
          </dl>
        </Card>
      </div>
    </div>
  );

  const rubricTab = rubric ? (
    <RubricEditor
      rubricId={rubric.id}
      convocatoriaId={convocatoria.id}
      criteria={criteria}
    />
  ) : (
    <EmptyState
      icon={
        <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      }
      title="Sin rubrica"
      description="No se pudo crear la rubrica automatica. Contacta al administrador."
    />
  );

  const projectsTab = projects.length > 0 ? (
    <div className="space-y-3">
      {projects.map((project) => (
        <Card key={project.id} variant="interactive" padding="md">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h4 className="text-sm font-semibold text-text-primary">{project.title}</h4>
                <Badge status={project.status} />
              </div>
              {project.description && (
                <p className="mt-1 text-xs text-text-secondary line-clamp-1">{project.description}</p>
              )}
              <div className="mt-2 flex items-center gap-4 text-xs text-text-muted">
                {project.budget_requested && (
                  <span>${Number(project.budget_requested).toLocaleString("es-CO")}</span>
                )}
                <span>
                  {project.submitted_at
                    ? `Enviado ${new Date(project.submitted_at).toLocaleDateString("es-CO")}`
                    : `Creado ${new Date(project.created_at).toLocaleDateString("es-CO")}`}
                </span>
              </div>
            </div>
            <Link href={`/dashboard/proyectos/${project.id}`}>
              <Button variant="ghost" size="sm">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Button>
            </Link>
          </div>
        </Card>
      ))}
    </div>
  ) : (
    <EmptyState
      icon={
        <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
        </svg>
      }
      title="Sin proyectos"
      description={
        convocatoria.status === "draft"
          ? "Los municipios podran enviar proyectos una vez abras la convocatoria."
          : "Aun no se han recibido proyectos para esta convocatoria."
      }
    />
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link
              href="/dashboard/convocatorias"
              className="text-text-muted hover:text-text-secondary transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-text-primary">{convocatoria.name}</h1>
          </div>
          {convocatoria.description && (
            <p className="mt-1 text-sm text-text-secondary max-w-2xl">{convocatoria.description}</p>
          )}
        </div>
        <Badge status={convocatoria.status} className="text-sm" />
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: "info", label: "Informacion", content: infoTab },
          { id: "rubrica", label: "Rubrica", content: rubricTab },
          { id: "proyectos", label: `Proyectos (${projects.length})`, content: projectsTab },
        ]}
        defaultTab="info"
      />
    </div>
  );
}

// ── Helper Components ──
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-sm text-text-muted shrink-0">{label}</dt>
      <dd className="text-sm text-text-primary text-right">{value}</dd>
    </div>
  );
}
