import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { assignMunicipio, removeMunicipio } from "../../actions";
import { Button } from "@/components/ui/button";
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
    <div className="mx-auto max-w-3xl space-y-8 animate-fade-in">
      <div>
        <Link
          href={`/dashboard/entidad/convocatorias/${id}`}
          className="text-[12px] text-accent hover:text-accent-hover transition-colors"
        >
          &larr; Volver a {convocatoria.nombre}
        </Link>
        <h1 className="mt-3 text-[22px] font-semibold tracking-tight text-text-primary">
          Municipios asignados
        </h1>
        <p className="mt-1 text-[13px] text-text-muted">
          {convocatoria.nombre}
        </p>
      </div>

      {sp.error && (
        <div className="rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {sp.error}
        </div>
      )}

      {/* Assign form */}
      {available.length > 0 && (
        <form action={assignWithId} className="flex gap-3">
          <select
            name="municipio_id"
            required
            className="flex-1 rounded-[var(--radius-input)] border border-border bg-bg-input px-3 py-2.5 text-[13px] text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/8"
          >
            <option value="">Seleccionar municipio...</option>
            {available.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre} ({m.departamento})
              </option>
            ))}
          </select>
          <Button variant="primary" type="submit">Asignar</Button>
        </form>
      )}

      {/* Assigned list */}
      {assigned.length === 0 ? (
        <div className="rounded-[8px] border border-dashed border-border p-8 text-center">
          <p className="text-[13px] text-text-muted">
            No hay municipios asignados a esta convocatoria.
          </p>
        </div>
      ) : (
        <div className="card-premium">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
                  Municipio
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
                  Departamento
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
                  Avance
                </th>
                <th className="px-6 py-3 text-right text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {assigned.map((a) => {
                const removeWithIds = removeMunicipio.bind(null, id, a.id);
                return (
                  <tr key={a.id} className="hover:bg-bg-hover transition-colors">
                    <td className="px-6 py-3.5 text-[13px] font-medium text-text-primary">
                      {a.municipios.nombre}
                    </td>
                    <td className="px-6 py-3.5 text-[13px] text-text-muted">
                      {a.municipios.departamento}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600">
                        {a.estado}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-[13px] text-text-secondary tabular-nums">
                      {Math.round(a.progress)}%
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <form action={removeWithIds} className="inline">
                        <button
                          type="submit"
                          className="text-[12px] text-red-600 hover:text-red-800 transition-colors"
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
