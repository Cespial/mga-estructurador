import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TemplateEditor } from "./template-editor";
import type { Convocatoria, MgaTemplate } from "@/lib/types/database";

export default async function PlantillaPage({
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

  const { data: template } = await supabase
    .from("mga_templates")
    .select("*")
    .eq("convocatoria_id", id)
    .maybeSingle();

  const mgaTemplate = template as MgaTemplate | null;

  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-fade-in">
      <div>
        <Link
          href={`/dashboard/entidad/convocatorias/${id}`}
          className="text-[12px] text-accent hover:text-accent-hover transition-colors"
        >
          &larr; Volver a {convocatoria.nombre}
        </Link>
        <h1 className="mt-3 text-[22px] font-semibold tracking-tight text-text-primary">Plantilla MGA</h1>
        <p className="mt-1 text-[13px] text-text-muted">
          Define las etapas y campos que los municipios deben diligenciar para{" "}
          <span className="font-medium text-text-secondary">{convocatoria.nombre}</span>.
        </p>
      </div>

      <TemplateEditor
        convocatoriaId={id}
        initialEtapas={mgaTemplate?.etapas_json ?? []}
      />
    </div>
  );
}
