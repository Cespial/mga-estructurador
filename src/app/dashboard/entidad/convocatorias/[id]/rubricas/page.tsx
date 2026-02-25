import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Convocatoria, MgaTemplate, Rubric } from "@/lib/types/database";
import { RubricEditor } from "./rubric-editor";
import { HelpButton } from "@/components/help-button";

export default async function RubricasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getProfile();
  if (!profile || profile.role !== "entidad_admin") {
    redirect("/dashboard");
  }

  const { id } = await params;
  const supabase = await createClient();

  const { data: conv } = await supabase
    .from("convocatorias")
    .select("*")
    .eq("id", id)
    .single();

  if (!conv) notFound();
  const convocatoria = conv as Convocatoria;

  // Fetch template for campo list
  const { data: template } = await supabase
    .from("mga_templates")
    .select("*")
    .eq("convocatoria_id", id)
    .maybeSingle();

  const mgaTemplate = template as MgaTemplate | null;
  const etapas = mgaTemplate?.etapas_json ?? [];

  // Fetch existing rubric
  const { data: rubric } = await supabase
    .from("rubrics")
    .select("*")
    .eq("convocatoria_id", id)
    .maybeSingle();

  const existingRubric = rubric as Rubric | null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href={`/dashboard/entidad/convocatorias/${id}`}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          &larr; Volver a {convocatoria.nombre}
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-gray-900">
          Rúbrica de evaluación — {convocatoria.nombre}
        </h2>
        <HelpButton section="rubricas" label="Ayuda con rúbricas" />
      </div>
      <p className="mt-1 text-sm text-gray-500">
        Define los criterios de evaluación por campo MGA. Estos criterios se
        usarán para evaluar automáticamente las submissions de los municipios.
      </p>

      {etapas.length === 0 ? (
        <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
          <p className="text-sm text-gray-600">
            Primero configura la plantilla MGA para definir criterios de evaluación.
          </p>
          <Link
            href={`/dashboard/entidad/convocatorias/${id}/plantilla`}
            className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-800"
          >
            Ir a plantilla MGA
          </Link>
        </div>
      ) : (
        <div className="mt-6">
          <RubricEditor
            convocatoriaId={id}
            etapas={etapas}
            initialCriterios={existingRubric?.criterios_json ?? []}
          />
        </div>
      )}
    </div>
  );
}
