import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { assignMunicipio, removeMunicipio } from "../../actions";
import type { Convocatoria, Municipio, ConvocatoriaMunicipioWithDetails } from "@/lib/types/database";

export default async function MunicipiosAssignmentPage({
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

  // Get assigned municipios
  const { data: assignments } = await supabase
    .from("convocatoria_municipios")
    .select("*, municipios(*)")
    .eq("convocatoria_id", id);

  const assigned = (assignments ?? []) as ConvocatoriaMunicipioWithDetails[];
  const assignedIds = new Set(assigned.map((a) => a.municipio_id));

  // Get all municipios for the selector
  const { data: allMunicipios } = await supabase
    .from("municipios")
    .select("*")
    .order("departamento")
    .order("nombre");

  const available = ((allMunicipios ?? []) as Municipio[]).filter(
    (m) => !assignedIds.has(m.id),
  );

  const assignWithId = assignMunicipio.bind(null, id);

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

      <h2 className="text-xl font-semibold text-gray-900">
        Municipios asignados
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        {convocatoria.nombre}
      </p>

      {sp.error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {sp.error}
        </div>
      )}

      {/* Assign form */}
      {available.length > 0 && (
        <form action={assignWithId} className="mt-6 flex gap-3">
          <select
            name="municipio_id"
            required
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Seleccionar municipio...</option>
            {available.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre} ({m.departamento})
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Asignar
          </button>
        </form>
      )}

      {/* Assigned list */}
      {assigned.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-500">
            No hay municipios asignados a esta convocatoria.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Municipio
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Departamento
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Avance
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {assigned.map((a) => {
                const removeWithIds = removeMunicipio.bind(null, id, a.id);
                return (
                  <tr key={a.id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {a.municipios.nombre}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {a.municipios.departamento}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        {a.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {Math.round(a.progress)}%
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={removeWithIds} className="inline">
                        <button
                          type="submit"
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Remover
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
