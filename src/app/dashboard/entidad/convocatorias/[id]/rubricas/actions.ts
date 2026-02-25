"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { RubricCriterio } from "@/lib/types/database";
import { rubricCriteriosSchema } from "@/lib/validators/convocatoria";

export async function saveRubric(
  convocatoriaId: string,
  criterios: RubricCriterio[],
) {
  const profile = await getProfile();
  if (!profile || profile.role !== "entidad_admin") {
    redirect("/dashboard");
  }

  // Validate with Zod
  const parsed = rubricCriteriosSchema.safeParse(criterios);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  // Check if rubric exists
  const { data: existing } = await supabase
    .from("rubrics")
    .select("id")
    .eq("convocatoria_id", convocatoriaId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("rubrics")
      .update({ criterios_json: parsed.data })
      .eq("id", existing.id);

    if (error) {
      return { error: error.message };
    }
  } else {
    const { error } = await supabase.from("rubrics").insert({
      convocatoria_id: convocatoriaId,
      tenant_id: profile.tenant_id,
      criterios_json: parsed.data,
    });

    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath(`/dashboard/entidad/convocatorias/${convocatoriaId}/rubricas`);
  revalidatePath(`/dashboard/entidad/convocatorias/${convocatoriaId}/monitoreo`);
  return { success: true };
}
