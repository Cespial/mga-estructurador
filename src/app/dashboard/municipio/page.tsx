import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ConvocatoriaMunicipioWithConvocatoria, ConvocatoriaEstado } from "@/lib/types/database";

const estadoBadge: Record<ConvocatoriaEstado, string> = {
  borrador: "bg-bg-app text-text-muted",
  abierta: "bg-emerald-50 text-emerald-600",
  cerrada: "bg-red-50 text-red-600",
  evaluacion: "bg-amber-50 text-amber-600",
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
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-text-primary">
          Panel de Municipio
        </h1>
        <p className="mt-1 text-[13px] text-text-muted">
          Diligencia proyectos MGA para las convocatorias asignadas.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="card-premium px-5 py-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
            Convocatorias asignadas
          </p>
          <p className="mt-3 text-[28px] font-semibold leading-none tracking-tight text-text-primary tabular-nums">{items.length}</p>
        </div>
        <div className="card-premium px-5 py-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">Avance promedio</p>
          <p className="mt-3 text-[28px] font-semibold leading-none tracking-tight text-text-primary tabular-nums">
            {items.length > 0
              ? Math.round(items.reduce((acc, i) => acc + i.progress, 0) / items.length) + "%"
              : "—"}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[8px] border border-dashed border-border p-8 text-center">
          <p className="text-[13px] text-text-muted">
            No tienes convocatorias asignadas actualmente.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/dashboard/municipio/convocatorias/${item.convocatoria_id}`}
              className="block card-premium hover:border-accent/30 transition-colors"
            >
              <div className="px-6 py-4 flex items-start justify-between">
                <div>
                  <h3 className="text-[15px] font-medium text-text-primary">
                    {item.convocatorias.nombre}
                  </h3>
                  {item.convocatorias.descripcion && (
                    <p className="mt-1 line-clamp-2 text-[13px] text-text-muted">
                      {item.convocatorias.descripcion}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${estadoBadge[item.convocatorias.estado]}`}
                    >
                      {item.convocatorias.estado}
                    </span>
                    {item.convocatorias.fecha_cierre && (
                      <span className="text-[11px] text-text-muted">
                        Cierre: {item.convocatorias.fecha_cierre}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[28px] font-semibold tracking-tight text-accent tabular-nums">
                    {Math.round(item.progress)}%
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.08em] text-text-muted">avance</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
