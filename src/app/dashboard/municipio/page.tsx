import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ConvocatoriaMunicipioWithConvocatoria, ConvocatoriaEstado } from "@/lib/types/database";

const estadoBadge: Record<ConvocatoriaEstado, string> = {
  borrador: "bg-gray-100 text-gray-700",
  abierta: "bg-green-100 text-green-700",
  cerrada: "bg-red-100 text-red-700",
  evaluacion: "bg-yellow-100 text-yellow-700",
};

export default async function MunicipioDashboard() {
  const profile = await getProfile();
  if (!profile || profile.role !== "municipio_user") {
    redirect("/dashboard");
  }

  if (!profile.municipio_id) {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  const { data: assignments } = await supabase
    .from("convocatoria_municipios")
    .select("*, convocatorias(*)")
    .eq("municipio_id", profile.municipio_id)
    .order("created_at", { ascending: false });

  const items = (assignments ?? []) as ConvocatoriaMunicipioWithConvocatoria[];

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900">
        Panel de Municipio
      </h2>
      <p className="mt-1 text-sm text-gray-600">
        Diligencia proyectos MGA para las convocatorias asignadas.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">
            Convocatorias asignadas
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{items.length}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">Avance promedio</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {items.length > 0
              ? Math.round(items.reduce((acc, i) => acc + i.progress, 0) / items.length) + "%"
              : "—"}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-500">
            No tienes convocatorias asignadas actualmente.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/dashboard/municipio/convocatorias/${item.convocatoria_id}`}
              className="block rounded-lg border border-gray-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">
                    {item.convocatorias.nombre}
                  </h3>
                  {item.convocatorias.descripcion && (
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                      {item.convocatorias.descripcion}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${estadoBadge[item.convocatorias.estado]}`}
                    >
                      {item.convocatorias.estado}
                    </span>
                    {item.convocatorias.fecha_cierre && (
                      <span className="text-xs text-gray-400">
                        Cierre: {item.convocatorias.fecha_cierre}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.round(item.progress)}%
                  </p>
                  <p className="text-xs text-gray-400">avance</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
