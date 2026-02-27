import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateSubmission } from "./actions";
import { WizardClient } from "./wizard-client";
import type { Convocatoria, MgaTemplate } from "@/lib/types/database";
import { HelpButton } from "@/components/help-button";

export default async function WizardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getProfile();
  if (!profile || profile.role !== "municipio_user") {
    redirect("/dashboard");
  }

  const { id } = await params;
  const supabase = await createClient();

  // Fetch convocatoria
  const { data: conv } = await supabase
    .from("convocatorias")
    .select("*")
    .eq("id", id)
    .single();

  if (!conv) notFound();
  const convocatoria = conv as Convocatoria;

  // Check convocatoria is open
  if (convocatoria.estado !== "abierta") {
    return (
      <div className="mx-auto max-w-3xl animate-fade-in">
        <div className="mb-6">
          <Link
            href={`/dashboard/municipio/convocatorias/${id}`}
            className="text-[12px] text-accent hover:text-accent-hover transition-colors"
          >
            &larr; Volver
          </Link>
        </div>
        <div className="rounded-[8px] border border-amber-200 bg-amber-50 px-5 py-5 text-center">
          <p className="text-[13px] text-amber-800">
            Esta convocatoria no esta abierta para diligenciamiento.
          </p>
          <p className="mt-1 text-[11px] text-amber-600">
            Estado actual: {convocatoria.estado}
          </p>
        </div>
      </div>
    );
  }

  // Fetch MGA template
  const { data: template } = await supabase
    .from("mga_templates")
    .select("*")
    .eq("convocatoria_id", id)
    .maybeSingle();

  const mgaTemplate = template as MgaTemplate | null;
  const etapas = mgaTemplate?.etapas_json ?? [];

  if (etapas.length === 0) {
    return (
      <div className="mx-auto max-w-3xl animate-fade-in">
        <div className="mb-6">
          <Link
            href={`/dashboard/municipio/convocatorias/${id}`}
            className="text-[12px] text-accent hover:text-accent-hover transition-colors"
          >
            &larr; Volver
          </Link>
        </div>
        <div className="rounded-[8px] border border-dashed border-border p-6 text-center">
          <p className="text-[13px] text-text-muted">
            La entidad aun no ha configurado la plantilla MGA para esta convocatoria.
          </p>
        </div>
      </div>
    );
  }

  // Get or create submission
  const { submission, error } = await getOrCreateSubmission(id);
  if (error || !submission) {
    return (
      <div className="mx-auto max-w-3xl animate-fade-in">
        <div className="mb-6">
          <Link
            href={`/dashboard/municipio/convocatorias/${id}`}
            className="text-[12px] text-accent hover:text-accent-hover transition-colors"
          >
            &larr; Volver
          </Link>
        </div>
        <div className="rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          Error: {error ?? "No se pudo crear la submission"}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href={`/dashboard/municipio/convocatorias/${id}`}
          className="text-[12px] text-accent hover:text-accent-hover transition-colors"
        >
          &larr; Volver a {convocatoria.nombre}
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <h1 className="text-[22px] font-semibold tracking-tight text-text-primary">
          Diligenciar MGA — {convocatoria.nombre}
        </h1>
        <HelpButton section="flujo-ejecucion" label="Ayuda con el wizard" />
      </div>
      <p className="mt-1 text-[13px] text-text-muted">
        Completa cada etapa. El progreso se guarda automaticamente.
      </p>

      <div className="mt-8">
        <WizardClient
          convocatoriaId={id}
          submissionId={submission.id}
          etapas={etapas}
          initialData={submission.data_json}
          initialEtapa={submission.etapa_actual}
          initialProgress={submission.progress}
        />
      </div>
    </div>
  );
}
