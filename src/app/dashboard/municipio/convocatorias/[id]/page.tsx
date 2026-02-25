import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Convocatoria, MgaTemplate } from "@/lib/types/database";

export default async function MunicipioConvocatoriaPage({
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
    .single();

  const mgaTemplate = template as MgaTemplate | null;
  const etapas = mgaTemplate?.etapas_json ?? [];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href="/dashboard/municipio"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          &larr; Volver al panel
        </Link>
      </div>

      <h2 className="text-xl font-semibold text-gray-900">
        {convocatoria.nombre}
      </h2>

      {convocatoria.descripcion && (
        <p className="mt-2 text-sm text-gray-600">{convocatoria.descripcion}</p>
      )}

      {convocatoria.requisitos && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-medium uppercase text-amber-700">Requisitos</p>
          <p className="mt-1 text-sm text-amber-800">{convocatoria.requisitos}</p>
        </div>
      )}

      <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
        {convocatoria.fecha_inicio && (
          <span>Inicio: {convocatoria.fecha_inicio}</span>
        )}
        {convocatoria.fecha_cierre && (
          <span>Cierre: {convocatoria.fecha_cierre}</span>
        )}
      </div>

      {/* MGA Etapas */}
      <div className="mt-8">
        <h3 className="text-base font-semibold text-gray-900">
          Etapas MGA
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {etapas.length > 0
            ? "Estas son las etapas que debes diligenciar. El wizard se habilitará próximamente."
            : "La entidad aún no ha configurado las etapas para esta convocatoria."}
        </p>

        {etapas.length > 0 && (
          <div className="mt-4 space-y-4">
            {etapas.map((etapa) => (
              <div
                key={etapa.id}
                className="rounded-lg border border-gray-200 bg-white"
              >
                <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    {etapa.orden}
                  </span>
                  <h4 className="text-sm font-semibold text-gray-900">
                    {etapa.nombre}
                  </h4>
                  <span className="ml-auto text-xs text-gray-400">
                    {etapa.campos.length} campo{etapa.campos.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="divide-y divide-gray-50 px-4">
                  {etapa.campos.map((campo) => (
                    <div key={campo.id} className="py-3">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-800">
                          {campo.nombre}
                        </p>
                        {campo.requerido && (
                          <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-600">
                            Requerido
                          </span>
                        )}
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                          {campo.tipo}
                        </span>
                      </div>
                      {campo.descripcion && (
                        <p className="mt-1 text-xs text-gray-500">
                          {campo.descripcion}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="rounded-lg border border-dashed border-blue-300 bg-blue-50 p-6 text-center">
              <p className="text-sm font-medium text-blue-700">
                El wizard de diligenciamiento se habilitará en Wave 3.
              </p>
              <p className="mt-1 text-xs text-blue-500">
                Podrás completar cada etapa paso a paso con asistencia de IA.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
