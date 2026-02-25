import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/database";

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data as Profile | null;
}

export function getRoleDashboardPath(role: Profile["role"]): string {
  switch (role) {
    case "platform_admin":
      return "/dashboard/admin";
    case "entidad_admin":
      return "/dashboard/entidad";
    case "municipio_user":
      return "/dashboard/municipio";
  }
}

export function getRoleLabel(role: Profile["role"]): string {
  switch (role) {
    case "platform_admin":
      return "Administrador de plataforma";
    case "entidad_admin":
      return "Administrador de entidad";
    case "municipio_user":
      return "Usuario de municipio";
  }
}
