import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Convocatoria, ConvocatoriaEstado } from "@/lib/types/database";

const estadoBadge: Record<ConvocatoriaEstado, string> = {
  borrador: "bg-gray-100 text-gray-700",
  abierta: "bg-green-100 text-green-700",
  cerrada: "bg-red-100 text-red-700",
  evaluacion: "bg-yellow-100 text-yellow-700",
};

export default async function EntidadDashboard() {
  const profile = await getProfile();
  if (!profile || profile.role !== "entidad_admin" || !profile.tenant_id) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data: convocatorias } = await supabase
    .from("convocatorias")
    .select("*")
    .eq("tenant_id", profile.tenant_id)
    .order("created_at", { ascending: false });

  const items = (convocatorias ?? []) as Convocatoria[];

  const activas = items.filter((c) => c.estado === "abierta").length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Panel de Entidad
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Gestiona convocatorias y monitorea el avance de municipios.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/entidad/analytics"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Analytics
          </Link>
          <Link
            href="/dashboard/entidad/convocatorias/nueva"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Nueva convocatoria
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">Total convocatorias</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{items.length}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">Abiertas</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{activas}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">En borrador</p>
          <p className="mt-1 text-2xl font-bold text-gray-400">
            {items.filter((c) => c.estado === "borrador").length}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-500">
            No hay convocatorias aún. Crea la primera.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Fecha cierre
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((conv) => (
                <tr key={conv.id}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {conv.nombre}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${estadoBadge[conv.estado]}`}
                    >
                      {conv.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {conv.fecha_cierre ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/entidad/convocatorias/${conv.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
