import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateConvocatoria, deleteConvocatoria } from "../actions";
import { Button } from "@/components/ui/button";
import type { Convocatoria, MgaTemplate, ConvocatoriaMunicipioWithDetails, Document, LegacyRubric as Rubric } from "@/lib/types/database";

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
    <div className="mx-auto max-w-3xl space-y-8 animate-fade-in">
      <div>
        <Link
          href="/dashboard/entidad"
          className="text-[12px] text-accent hover:text-accent-hover transition-colors"
        >
          &larr; Volver al panel
        </Link>
      </div>

      {sp.error && (
        <div className="rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {sp.error}
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-text-primary">
            {convocatoria.nombre}
          </h1>
          <p className="mt-1 text-[13px] text-text-muted">
            Estado:{" "}
            <span className="font-medium text-text-secondary">{convocatoria.estado}</span>
            {convocatoria.fecha_cierre && ` | Cierre: ${convocatoria.fecha_cierre}`}
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { href: `plantilla`, label: "Plantilla MGA", value: etapasCount, sub: etapasCount === 0 ? "Configurar etapas" : "etapas definidas" },
          { href: `municipios`, label: "Municipios", value: municipiosAsignados.length, sub: municipiosAsignados.length === 0 ? "Asignar municipios" : "municipios asignados" },
          { href: `monitoreo`, label: "Avance promedio", value: municipiosAsignados.length > 0 ? Math.round(municipiosAsignados.reduce((acc, m) => acc + m.progress, 0) / municipiosAsignados.length) + "%" : "—", sub: "ver monitoreo" },
          { href: `documentos`, label: "Documentos", value: documents.length, sub: documents.length === 0 ? "Subir documentos" : `${readyDocs} procesado${readyDocs !== 1 ? "s" : ""}` },
          { href: `rubricas`, label: "Rubrica", value: criteriosCount, sub: criteriosCount === 0 ? "Definir criterios" : `criterio${criteriosCount !== 1 ? "s" : ""} definido${criteriosCount !== 1 ? "s" : ""}` },
          { href: `informe`, label: "Informe IA", value: "AI", sub: "Generar reporte ejecutivo" },
        ].map((stat) => (
          <Link
            key={stat.href}
            href={`/dashboard/entidad/convocatorias/${id}/${stat.href}`}
            className="card-premium px-5 py-5 hover:border-accent/30 transition-colors"
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">{stat.label}</p>
            <p className="mt-3 text-[28px] font-semibold leading-none tracking-tight text-text-primary tabular-nums">{stat.value}</p>
            <p className="mt-2 text-[12px] text-accent">{stat.sub}</p>
          </Link>
        ))}
      </div>

      {/* Edit form */}
      <div className="card-premium px-6 py-6">
        <h3 className="text-[13px] font-semibold text-text-primary mb-4">
          Editar convocatoria
        </h3>
        <form action={updateWithId} className="space-y-4">
          <div>
            <label htmlFor="nombre" className="block text-[13px] font-medium text-text-primary">
              Nombre
            </label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              defaultValue={convocatoria.nombre}
              required
              className="mt-1.5 block w-full rounded-[var(--radius-input)] border border-border bg-bg-input px-3 py-2.5 text-[13px] text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/8"
            />
          </div>
          <div>
            <label htmlFor="descripcion" className="block text-[13px] font-medium text-text-primary">
              Descripcion
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              rows={3}
              defaultValue={convocatoria.descripcion ?? ""}
              className="mt-1.5 block w-full rounded-[var(--radius-input)] border border-border bg-bg-input px-3 py-2.5 text-[13px] text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/8"
            />
          </div>
          <div>
            <label htmlFor="requisitos" className="block text-[13px] font-medium text-text-primary">
              Requisitos
            </label>
            <textarea
              id="requisitos"
              name="requisitos"
              rows={3}
              defaultValue={convocatoria.requisitos ?? ""}
              className="mt-1.5 block w-full rounded-[var(--radius-input)] border border-border bg-bg-input px-3 py-2.5 text-[13px] text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/8"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="fecha_inicio" className="block text-[13px] font-medium text-text-primary">
                Fecha inicio
              </label>
              <input
                id="fecha_inicio"
                name="fecha_inicio"
                type="date"
                defaultValue={convocatoria.fecha_inicio ?? ""}
                className="mt-1.5 block w-full rounded-[var(--radius-input)] border border-border bg-bg-input px-3 py-2.5 text-[13px] text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/8"
              />
            </div>
            <div>
              <label htmlFor="fecha_cierre" className="block text-[13px] font-medium text-text-primary">
                Fecha cierre
              </label>
              <input
                id="fecha_cierre"
                name="fecha_cierre"
                type="date"
                defaultValue={convocatoria.fecha_cierre ?? ""}
                className="mt-1.5 block w-full rounded-[var(--radius-input)] border border-border bg-bg-input px-3 py-2.5 text-[13px] text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/8"
              />
            </div>
            <div>
              <label htmlFor="estado" className="block text-[13px] font-medium text-text-primary">
                Estado
              </label>
              <select
                id="estado"
                name="estado"
                defaultValue={convocatoria.estado}
                className="mt-1.5 block w-full rounded-[var(--radius-input)] border border-border bg-bg-input px-3 py-2.5 text-[13px] text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/8"
              >
                <option value="borrador">Borrador</option>
                <option value="abierta">Abierta</option>
                <option value="cerrada">Cerrada</option>
                <option value="evaluacion">Evaluacion</option>
              </select>
            </div>
          </div>
          <Button variant="primary" type="submit">Guardar cambios</Button>
        </form>
      </div>

      {/* Delete */}
      <div className="rounded-[8px] border border-red-200 bg-red-50 px-5 py-4">
        <form action={deleteWithId}>
          <p className="text-[13px] text-red-700">
            Eliminar esta convocatoria y todos sus datos asociados.
          </p>
          <button
            type="submit"
            className="mt-2 rounded-[var(--radius-button)] border border-red-300 bg-white px-3 py-1.5 text-[12px] font-medium text-red-700 hover:bg-red-100 transition-colors"
          >
            Eliminar convocatoria
          </button>
        </form>
      </div>
    </div>
  );
}
