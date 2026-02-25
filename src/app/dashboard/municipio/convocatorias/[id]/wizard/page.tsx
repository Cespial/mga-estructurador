import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateSubmission } from "./actions";
import { WizardClient } from "./wizard-client";
import type { Convocatoria, MgaTemplate } from "@/lib/types/database";

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
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <Link
            href={`/dashboard/municipio/convocatorias/${id}`}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            &larr; Volver
          </Link>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="text-sm text-amber-800">
            Esta convocatoria no está abierta para diligenciamiento.
          </p>
          <p className="mt-1 text-xs text-amber-600">
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
    .single();

  const mgaTemplate = template as MgaTemplate | null;
  const etapas = mgaTemplate?.etapas_json ?? [];

  if (etapas.length === 0) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <Link
            href={`/dashboard/municipio/convocatorias/${id}`}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            &larr; Volver
          </Link>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
          <p className="text-sm text-gray-600">
            La entidad aún no ha configurado la plantilla MGA para esta convocatoria.
          </p>
        </div>
      </div>
    );
  }

  // Get or create submission
  const { submission, error } = await getOrCreateSubmission(id);
  if (error || !submission) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <Link
            href={`/dashboard/municipio/convocatorias/${id}`}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            &larr; Volver
          </Link>
        </div>
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          Error: {error ?? "No se pudo crear la submission"}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href={`/dashboard/municipio/convocatorias/${id}`}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          &larr; Volver a {convocatoria.nombre}
        </Link>
      </div>

      <h2 className="text-lg font-semibold text-gray-900">
        Diligenciar MGA — {convocatoria.nombre}
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Completa cada etapa. El progreso se guarda automáticamente.
      </p>

      <div className="mt-6">
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
