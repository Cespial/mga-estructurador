import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import type { Convocatoria, ConvocatoriaEstado } from "@/lib/types/database";

const estadoBadge: Record<ConvocatoriaEstado, string> = {
  borrador: "bg-bg-app text-text-muted",
  abierta: "bg-emerald-50 text-emerald-600",
  cerrada: "bg-red-50 text-red-600",
  evaluacion: "bg-amber-50 text-amber-600",
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
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-text-primary">
            Panel de Entidad
          </h1>
          <p className="mt-1 text-[13px] text-text-muted">
            Gestiona convocatorias y monitorea el avance de municipios.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/entidad/analytics">
            <Button variant="secondary" size="md">Analytics</Button>
          </Link>
          <Link href="/dashboard/entidad/convocatorias/nueva">
            <Button variant="primary" size="md">+ Nueva convocatoria</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="card-premium px-5 py-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">Total convocatorias</p>
          <p className="mt-3 text-[28px] font-semibold leading-none tracking-tight text-text-primary tabular-nums">{items.length}</p>
        </div>
        <div className="card-premium px-5 py-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">Abiertas</p>
          <p className="mt-3 text-[28px] font-semibold leading-none tracking-tight text-emerald-600 tabular-nums">{activas}</p>
        </div>
        <div className="card-premium px-5 py-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">En borrador</p>
          <p className="mt-3 text-[28px] font-semibold leading-none tracking-tight text-text-muted tabular-nums">
            {items.filter((c) => c.estado === "borrador").length}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[8px] border border-dashed border-border p-8 text-center">
          <p className="text-[13px] text-text-muted">
            No hay convocatorias aun. Crea la primera.
          </p>
        </div>
      ) : (
        <div className="card-premium">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
                  Fecha cierre
                </th>
                <th className="px-6 py-3 text-right text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((conv) => (
                <tr key={conv.id} className="hover:bg-bg-hover transition-colors">
                  <td className="px-6 py-3.5 text-[13px] font-medium text-text-primary">
                    {conv.nombre}
                  </td>
                  <td className="px-6 py-3.5">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${estadoBadge[conv.estado]}`}
                    >
                      {conv.estado}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-[13px] text-text-muted tabular-nums">
                    {conv.fecha_cierre ?? "—"}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <Link
                      href={`/dashboard/entidad/convocatorias/${conv.id}`}
                      className="text-[12px] font-medium text-accent hover:text-accent-hover transition-colors"
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
