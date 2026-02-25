import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { createConvocatoria } from "../actions";

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
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link
          href="/dashboard/entidad"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          &larr; Volver al panel
        </Link>
      </div>

      <h2 className="text-xl font-semibold text-gray-900">
        Nueva convocatoria
      </h2>

      {params.error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {params.error}
        </div>
      )}

      <form action={createConvocatoria} className="mt-6 space-y-4">
        <div>
          <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
            Nombre de la convocatoria *
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Ej: Mejoramiento de vías terciarias 2026"
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
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Describa el objetivo de la convocatoria..."
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
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Requisitos para participar en la convocatoria..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="fecha_inicio" className="block text-sm font-medium text-gray-700">
              Fecha de inicio
            </label>
            <input
              id="fecha_inicio"
              name="fecha_inicio"
              type="date"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="fecha_cierre" className="block text-sm font-medium text-gray-700">
              Fecha de cierre
            </label>
            <input
              id="fecha_cierre"
              name="fecha_cierre"
              type="date"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Crear convocatoria
          </button>
          <Link
            href="/dashboard/entidad"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
