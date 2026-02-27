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
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-text-primary">
          Panel de Administracion
        </h1>
        <p className="mt-1 text-[13px] text-text-muted">
          Vista global de la plataforma (soporte interno).
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="card-premium px-5 py-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">Tenants</p>
          <p className="mt-3 text-[28px] font-semibold leading-none tracking-tight text-text-primary tabular-nums">{tenantCount ?? 0}</p>
        </div>
        <div className="card-premium px-5 py-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">Usuarios</p>
          <p className="mt-3 text-[28px] font-semibold leading-none tracking-tight text-text-primary tabular-nums">{userCount ?? 0}</p>
        </div>
        <div className="card-premium px-5 py-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">Convocatorias</p>
          <p className="mt-3 text-[28px] font-semibold leading-none tracking-tight text-text-primary tabular-nums">{convCount ?? 0}</p>
        </div>
      </div>

      <div className="rounded-[8px] border border-dashed border-border p-8 text-center">
        <p className="text-[13px] text-text-muted">
          Gestion de tenants y usuarios se habilitara proximamente.
        </p>
      </div>
    </div>
  );
}
