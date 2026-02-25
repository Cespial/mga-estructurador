import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";

export default async function EntidadDashboard() {
  const profile = await getProfile();

  if (!profile || profile.role !== "entidad_admin") {
    redirect("/dashboard");
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900">
        Panel de Entidad
      </h2>
      <p className="mt-2 text-sm text-gray-600">
        Gestiona convocatorias y monitorea el avance de municipios.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          title="Convocatorias"
          value="0"
          description="Convocatorias activas"
        />
        <DashboardCard
          title="Municipios"
          value="0"
          description="Municipios vinculados"
        />
        <DashboardCard
          title="Avance promedio"
          value="0%"
          description="Progreso en MGA"
        />
      </div>

      <div className="mt-8 rounded-lg border border-dashed border-gray-300 p-8 text-center">
        <p className="text-sm text-gray-500">
          Las convocatorias se habilitarán en Wave 2.
        </p>
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-400">{description}</p>
    </div>
  );
}
