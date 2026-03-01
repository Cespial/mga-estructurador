"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createRubricCriterionSchema } from "@/lib/validators/publitec";
import type { ConvocatoriaStatus } from "@/lib/types/database";

// ── Update Convocatoria Status ──
export async function updateConvocatoriaStatus(
  convocatoriaId: string,
  newStatus: ConvocatoriaStatus,
) {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  // Verify ownership
  const { data: conv } = await supabase
    .from("convocatorias_v2")
    .select("id, organization_id, organizations!inner(owner_id)")
    .eq("id", convocatoriaId)
    .single();

  if (!conv) {
    return { error: "Convocatoria no encontrada." };
  }

  const org = conv.organizations as unknown as { owner_id: string };
  if (org.owner_id !== profile.id) {
    return { error: "No tienes permisos para modificar esta convocatoria." };
  }

  const { error } = await supabase
    .from("convocatorias_v2")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", convocatoriaId);

  if (error) {
    console.error("Error updating status:", error);
    return { error: "Error al actualizar el estado." };
  }

  revalidatePath(`/dashboard/convocatorias/${convocatoriaId}`);
  return { success: true };
}

// ── Add Rubric Criterion ──
export async function addRubricCriterion(
  rubricId: string,
  convocatoriaId: string,
  formData: FormData,
) {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  const rawMaxScore = formData.get("max_score") as string;
  const rawWeight = formData.get("weight") as string;
  const rawSortOrder = formData.get("sort_order") as string;

  const raw = {
    criterion_name: formData.get("criterion_name") as string,
    max_score: rawMaxScore ? Number(rawMaxScore) : 0,
    weight: rawWeight ? Number(rawWeight) : 0,
    evaluation_guide: (formData.get("evaluation_guide") as string) || undefined,
    sort_order: rawSortOrder ? Number(rawSortOrder) : 0,
  };

  const result = createRubricCriterionSchema.safeParse(raw);
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    }
    return { fieldErrors };
  }

  const data = result.data;

  const { error } = await supabase.from("rubric_criteria").insert({
    rubric_id: rubricId,
    criterion_name: data.criterion_name,
    max_score: data.max_score,
    weight: data.weight,
    evaluation_guide: data.evaluation_guide ?? null,
    sort_order: data.sort_order,
  });

  if (error) {
    console.error("Error adding criterion:", error);
    return { error: "Error al agregar el criterio." };
  }

  revalidatePath(`/dashboard/convocatorias/${convocatoriaId}`);
  return { success: true };
}

// ── Delete Rubric Criterion ──
export async function deleteRubricCriterion(
  criterionId: string,
  convocatoriaId: string,
) {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  const { error } = await supabase
    .from("rubric_criteria")
    .delete()
    .eq("id", criterionId);

  if (error) {
    console.error("Error deleting criterion:", error);
    return { error: "Error al eliminar el criterio." };
  }

  revalidatePath(`/dashboard/convocatorias/${convocatoriaId}`);
  return { success: true };
}

// ── Update Rubric Criterion ──
export async function updateRubricCriterion(
  criterionId: string,
  convocatoriaId: string,
  formData: FormData,
) {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  const rawMaxScore = formData.get("max_score") as string;
  const rawWeight = formData.get("weight") as string;
  const rawSortOrder = formData.get("sort_order") as string;

  const updates: Record<string, unknown> = {};

  const criterionName = formData.get("criterion_name") as string;
  if (criterionName) updates.criterion_name = criterionName;
  if (rawMaxScore) updates.max_score = Number(rawMaxScore);
  if (rawWeight) updates.weight = Number(rawWeight);
  if (rawSortOrder) updates.sort_order = Number(rawSortOrder);

  const evaluationGuide = formData.get("evaluation_guide") as string;
  if (evaluationGuide !== null) updates.evaluation_guide = evaluationGuide || null;

  const { error } = await supabase
    .from("rubric_criteria")
    .update(updates)
    .eq("id", criterionId);

  if (error) {
    console.error("Error updating criterion:", error);
    return { error: "Error al actualizar el criterio." };
  }

  revalidatePath(`/dashboard/convocatorias/${convocatoriaId}`);
  return { success: true };
}
