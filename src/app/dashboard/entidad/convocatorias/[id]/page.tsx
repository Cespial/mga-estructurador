import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateConvocatoria, deleteConvocatoria } from "../actions";
import type { Convocatoria, MgaTemplate, ConvocatoriaMunicipioWithDetails, Document, Rubric } from "@/lib/types/database";

export default async function ConvocatoriaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await getProfile();
  if (!profile || profile.role !== "entidad_admin") {
    redirect("/dashboard");
  }

  const { id } = await params;
  const sp = await searchParams;
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
  const etapasCount = mgaTemplate?.etapas_json?.length ?? 0;

  const { data: assignments } = await supabase
    .from("convocatoria_municipios")
    .select("*, municipios(*)")
    .eq("convocatoria_id", id);

  const municipiosAsignados = (assignments ?? []) as ConvocatoriaMunicipioWithDetails[];

  const { data: docsList } = await supabase
    .from("documents")
    .select("*")
    .eq("convocatoria_id", id);

  const documents = (docsList ?? []) as Document[];
  const readyDocs = documents.filter((d) => d.status === "ready").length;

  const { data: rubricData } = await supabase
    .from("rubrics")
    .select("*")
    .eq("convocatoria_id", id)
    .maybeSingle();

  const rubric = rubricData as Rubric | null;
  const criteriosCount = rubric?.criterios_json?.length ?? 0;

  const updateWithId = updateConvocatoria.bind(null, id);
  const deleteWithId = deleteConvocatoria.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href="/dashboard/entidad"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          &larr; Volver al panel
        </Link>
      </div>

      {sp.error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {sp.error}
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {convocatoria.nombre}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Estado:{" "}
            <span className="font-medium">{convocatoria.estado}</span>
            {convocatoria.fecha_cierre && ` | Cierre: ${convocatoria.fecha_cierre}`}
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href={`/dashboard/entidad/convocatorias/${id}/plantilla`}
          className="rounded-lg border border-gray-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm"
        >
          <p className="text-sm font-medium text-gray-500">Plantilla MGA</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{etapasCount}</p>
          <p className="mt-1 text-xs text-blue-600">
            {etapasCount === 0 ? "Configurar etapas" : "etapas definidas"}
          </p>
        </Link>
        <Link
          href={`/dashboard/entidad/convocatorias/${id}/municipios`}
          className="rounded-lg border border-gray-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm"
        >
          <p className="text-sm font-medium text-gray-500">Municipios</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{municipiosAsignados.length}</p>
          <p className="mt-1 text-xs text-blue-600">
            {municipiosAsignados.length === 0 ? "Asignar municipios" : "municipios asignados"}
          </p>
        </Link>
        <Link
          href={`/dashboard/entidad/convocatorias/${id}/monitoreo`}
          className="rounded-lg border border-gray-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm"
        >
          <p className="text-sm font-medium text-gray-500">Avance promedio</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {municipiosAsignados.length > 0
              ? Math.round(
                  municipiosAsignados.reduce((acc, m) => acc + m.progress, 0) /
                    municipiosAsignados.length,
                ) + "%"
              : "—"}
          </p>
          <p className="mt-1 text-xs text-blue-600">ver monitoreo</p>
        </Link>
        <Link
          href={`/dashboard/entidad/convocatorias/${id}/documentos`}
          className="rounded-lg border border-gray-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm"
        >
          <p className="text-sm font-medium text-gray-500">Documentos</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{documents.length}</p>
          <p className="mt-1 text-xs text-blue-600">
            {documents.length === 0
              ? "Subir documentos"
              : `${readyDocs} procesado${readyDocs !== 1 ? "s" : ""}`}
          </p>
        </Link>
        <Link
          href={`/dashboard/entidad/convocatorias/${id}/rubricas`}
          className="rounded-lg border border-gray-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm"
        >
          <p className="text-sm font-medium text-gray-500">Rúbrica</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{criteriosCount}</p>
          <p className="mt-1 text-xs text-blue-600">
            {criteriosCount === 0
              ? "Definir criterios"
              : `criterio${criteriosCount !== 1 ? "s" : ""} definido${criteriosCount !== 1 ? "s" : ""}`}
          </p>
        </Link>
      </div>

      {/* Edit form */}
      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-base font-semibold text-gray-900">
          Editar convocatoria
        </h3>
        <form action={updateWithId} className="mt-4 space-y-4">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
              Nombre
            </label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              defaultValue={convocatoria.nombre}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              rows={3}
              defaultValue={convocatoria.descripcion ?? ""}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="requisitos" className="block text-sm font-medium text-gray-700">
              Requisitos
            </label>
            <textarea
              id="requisitos"
              name="requisitos"
              rows={3}
              defaultValue={convocatoria.requisitos ?? ""}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="fecha_inicio" className="block text-sm font-medium text-gray-700">
                Fecha inicio
              </label>
              <input
                id="fecha_inicio"
                name="fecha_inicio"
                type="date"
                defaultValue={convocatoria.fecha_inicio ?? ""}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="fecha_cierre" className="block text-sm font-medium text-gray-700">
                Fecha cierre
              </label>
              <input
                id="fecha_cierre"
                name="fecha_cierre"
                type="date"
                defaultValue={convocatoria.fecha_cierre ?? ""}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="estado" className="block text-sm font-medium text-gray-700">
                Estado
              </label>
              <select
                id="estado"
                name="estado"
                defaultValue={convocatoria.estado}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="borrador">Borrador</option>
                <option value="abierta">Abierta</option>
                <option value="cerrada">Cerrada</option>
                <option value="evaluacion">Evaluación</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Guardar cambios
          </button>
        </form>
      </div>

      {/* Delete */}
      <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
        <form action={deleteWithId}>
          <p className="text-sm text-red-700">
            Eliminar esta convocatoria y todos sus datos asociados.
          </p>
          <button
            type="submit"
            className="mt-2 rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            Eliminar convocatoria
          </button>
        </form>
      </div>
    </div>
  );
}
