"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { mgaTemplateSchema } from "@/lib/validators/convocatoria";
import type { MgaEtapa } from "@/lib/types/database";

export async function saveTemplate(convocatoriaId: string, etapas: MgaEtapa[]) {
  const profile = await getProfile();
  if (!profile || profile.role !== "entidad_admin") {
    return { error: "No autorizado" };
  }

  const parsed = mgaTemplateSchema.safeParse({ etapas_json: etapas });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("mga_templates")
    .update({ etapas_json: parsed.data.etapas_json })
    .eq("convocatoria_id", convocatoriaId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/entidad/convocatorias/${convocatoriaId}`);
  revalidatePath(`/dashboard/entidad/convocatorias/${convocatoriaId}/plantilla`);
  return { success: true };
}

export async function redirectToConvocatoria(id: string) {
  redirect(`/dashboard/entidad/convocatorias/${id}`);
}
