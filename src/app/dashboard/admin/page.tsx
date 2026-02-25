import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const profile = await getProfile();

  if (!profile || profile.role !== "platform_admin") {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  const [{ count: tenantCount }, { count: userCount }, { count: convCount }] =
    await Promise.all([
      supabase.from("tenants").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("convocatorias").select("*", { count: "exact", head: true }),
    ]);

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900">
        Panel de Administración
      </h2>
      <p className="mt-2 text-sm text-gray-600">
        Vista global de la plataforma (soporte interno).
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">Tenants</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{tenantCount ?? 0}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">Usuarios</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{userCount ?? 0}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">Convocatorias</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{convCount ?? 0}</p>
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-dashed border-gray-300 p-8 text-center">
        <p className="text-sm text-gray-500">
          Gestión de tenants y usuarios se habilitará próximamente.
        </p>
      </div>
    </div>
  );
}
