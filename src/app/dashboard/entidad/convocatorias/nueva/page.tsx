import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { createConvocatoria } from "../actions";
import { Button } from "@/components/ui/button";

export default async function NuevaConvocatoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await getProfile();
  if (!profile || profile.role !== "entidad_admin") {
    redirect("/dashboard");
  }

  const params = await searchParams;

  return (
    <div className="mx-auto max-w-2xl space-y-8 animate-fade-in">
      <div>
        <Link
          href="/dashboard/entidad"
          className="text-[12px] text-accent hover:text-accent-hover transition-colors"
        >
          &larr; Volver al panel
        </Link>
        <h1 className="mt-3 text-[22px] font-semibold tracking-tight text-text-primary">
          Nueva convocatoria
        </h1>
      </div>

      {params.error && (
        <div className="rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {params.error}
        </div>
      )}

      <form action={createConvocatoria} className="card-premium px-6 py-6 space-y-5">
        <div>
          <label htmlFor="nombre" className="block text-[13px] font-medium text-text-primary">
            Nombre de la convocatoria *
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            required
            className="mt-1.5 block w-full rounded-[var(--radius-input)] border border-border bg-bg-input px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/8"
            placeholder="Ej: Mejoramiento de vias terciarias 2026"
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
            className="mt-1.5 block w-full rounded-[var(--radius-input)] border border-border bg-bg-input px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/8"
            placeholder="Describa el objetivo de la convocatoria..."
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
            className="mt-1.5 block w-full rounded-[var(--radius-input)] border border-border bg-bg-input px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/8"
            placeholder="Requisitos para participar en la convocatoria..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="fecha_inicio" className="block text-[13px] font-medium text-text-primary">
              Fecha de inicio
            </label>
            <input
              id="fecha_inicio"
              name="fecha_inicio"
              type="date"
              className="mt-1.5 block w-full rounded-[var(--radius-input)] border border-border bg-bg-input px-3 py-2.5 text-[13px] text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/8"
            />
          </div>
          <div>
            <label htmlFor="fecha_cierre" className="block text-[13px] font-medium text-text-primary">
              Fecha de cierre
            </label>
            <input
              id="fecha_cierre"
              name="fecha_cierre"
              type="date"
              className="mt-1.5 block w-full rounded-[var(--radius-input)] border border-border bg-bg-input px-3 py-2.5 text-[13px] text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/8"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="primary" type="submit">Crear convocatoria</Button>
          <Link href="/dashboard/entidad">
            <Button variant="secondary" type="button">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
