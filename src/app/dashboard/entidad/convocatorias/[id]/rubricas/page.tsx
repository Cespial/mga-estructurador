import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Convocatoria, MgaTemplate, LegacyRubric as Rubric } from "@/lib/types/database";
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
    <div className="mx-auto max-w-3xl space-y-8 animate-fade-in">
      <div>
        <Link
          href={`/dashboard/entidad/convocatorias/${id}`}
          className="text-[12px] text-accent hover:text-accent-hover transition-colors"
        >
          &larr; Volver a {convocatoria.nombre}
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <h1 className="text-[22px] font-semibold tracking-tight text-text-primary">
            Rubrica de evaluacion — {convocatoria.nombre}
          </h1>
          <HelpButton section="rubricas" label="Ayuda con rubricas" />
        </div>
        <p className="mt-1 text-[13px] text-text-muted">
          Define los criterios de evaluacion por campo MGA. Estos criterios se
          usaran para evaluar automaticamente las submissions de los municipios.
        </p>
      </div>

      {etapas.length === 0 ? (
        <div className="rounded-[8px] border border-dashed border-border p-6 text-center">
          <p className="text-[13px] text-text-secondary">
            Primero configura la plantilla MGA para definir criterios de evaluacion.
          </p>
          <Link
            href={`/dashboard/entidad/convocatorias/${id}/plantilla`}
            className="mt-2 inline-block text-[12px] text-accent hover:text-accent-hover transition-colors"
          >
            Ir a plantilla MGA
          </Link>
        </div>
      ) : (
        <RubricEditor
          convocatoriaId={id}
          etapas={etapas}
          initialCriterios={existingRubric?.criterios_json ?? []}
        />
      )}
    </div>
  );
}
