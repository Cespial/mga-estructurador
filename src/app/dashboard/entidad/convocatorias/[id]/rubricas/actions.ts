"use server";

import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { RubricCriterio } from "@/lib/types/database";

export async function saveRubric(
  convocatoriaId: string,
  criterios: RubricCriterio[],
) {
  const profile = await getProfile();
  if (!profile || profile.role !== "entidad_admin") {
    redirect("/dashboard");
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
      .update({ criterios_json: criterios })
      .eq("id", existing.id);

    if (error) {
      return { error: error.message };
    }
  } else {
    const { error } = await supabase.from("rubrics").insert({
      convocatoria_id: convocatoriaId,
      tenant_id: profile.tenant_id,
      criterios_json: criterios,
    });

    if (error) {
      return { error: error.message };
    }
  }

  return { success: true };
}
