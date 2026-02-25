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
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href={`/dashboard/entidad/convocatorias/${id}`}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          &larr; Volver a {convocatoria.nombre}
        </Link>
      </div>

      <h2 className="text-xl font-semibold text-gray-900">Plantilla MGA</h2>
      <p className="mt-1 text-sm text-gray-500">
        Define las etapas y campos que los municipios deben diligenciar para{" "}
        <span className="font-medium">{convocatoria.nombre}</span>.
      </p>

      <div className="mt-6">
        <TemplateEditor
          convocatoriaId={id}
          initialEtapas={mgaTemplate?.etapas_json ?? []}
        />
      </div>
    </div>
  );
}
