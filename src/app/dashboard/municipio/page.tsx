import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ConvocatoriaMunicipioWithConvocatoria, ConvocatoriaEstado } from "@/lib/types/database";
import { ConvocatoriaRecommendations } from "@/components/ai/convocatoria-recommendations";
import { DeadlineRiskIndicator } from "@/components/deadline-risk-indicator";

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

      {/* Quick links */}
      <div className="flex gap-3">
        <Link
          href="/dashboard/municipio/analiticas"
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[12px] font-medium text-text-secondary hover:bg-bg-hover transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
          </svg>
          Analiticas de desempeno
        </Link>
        <Link
          href="/dashboard/municipio/portafolio"
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[12px] font-medium text-text-secondary hover:bg-bg-hover transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
          </svg>
          Mi portafolio
        </Link>
        <Link
          href="/dashboard/municipio/calendario"
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[12px] font-medium text-text-secondary hover:bg-bg-hover transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          Calendario
        </Link>
      </div>

      {/* AI-recommended convocatorias */}
      <ConvocatoriaRecommendations />

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
                <div className="text-right space-y-1.5">
                  <p className="text-[28px] font-semibold tracking-tight text-accent tabular-nums">
                    {Math.round(item.progress)}%
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.08em] text-text-muted">avance</p>
                  <DeadlineRiskIndicator
                    deadline={item.convocatorias.fecha_cierre}
                    progress={item.progress}
                    compact
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
