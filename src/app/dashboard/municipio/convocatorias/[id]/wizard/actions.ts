"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import type { MgaEtapa, Submission } from "@/lib/types/database";

/**
 * Get or create a submission for the current municipio + convocatoria.
 * Returns the submission data.
 */
export async function getOrCreateSubmission(convocatoriaId: string): Promise<{
  submission: Submission | null;
  error?: string;
}> {
  const profile = await getProfile();
  if (!profile || profile.role !== "municipio_user" || !profile.municipio_id) {
    return { submission: null, error: "No autorizado" };
  }

  const supabase = await createClient();

  // Try to get existing
  const { data: existing } = await supabase
    .from("submissions")
    .select("*")
    .eq("convocatoria_id", convocatoriaId)
    .eq("municipio_id", profile.municipio_id)
    .single();

  if (existing) {
    return { submission: existing as Submission };
  }

  // Create new
  const { data: created, error } = await supabase
    .from("submissions")
    .insert({
      convocatoria_id: convocatoriaId,
      municipio_id: profile.municipio_id,
      data_json: {},
      progress: 0,
    })
    .select("*")
    .single();

  if (error) {
    return { submission: null, error: error.message };
  }

  return { submission: created as Submission };
}

/**
 * Save field data for a submission (autosave).
 * Receives partial data_json updates and merges them.
 * Also recalculates progress based on filled required fields.
 */
export async function saveSubmissionData(
  submissionId: string,
  fieldsToUpdate: Record<string, string>,
  etapaActual: string,
  etapas: MgaEtapa[],
): Promise<{ success: boolean; progress: number; error?: string }> {
  const profile = await getProfile();
  if (!profile || profile.role !== "municipio_user") {
    return { success: false, progress: 0, error: "No autorizado" };
  }

  const supabase = await createClient();

  // Get current data
  const { data: current } = await supabase
    .from("submissions")
    .select("data_json")
    .eq("id", submissionId)
    .single();

  if (!current) {
    return { success: false, progress: 0, error: "Submission no encontrada" };
  }

  // Merge new fields into existing data
  const mergedData = {
    ...(current.data_json as Record<string, string>),
    ...fieldsToUpdate,
  };

  // Calculate progress
  const progress = calculateProgress(mergedData, etapas);

  const { error } = await supabase
    .from("submissions")
    .update({
      data_json: mergedData,
      etapa_actual: etapaActual,
      progress,
    })
    .eq("id", submissionId);

  if (error) {
    return { success: false, progress: 0, error: error.message };
  }

  revalidatePath("/dashboard/municipio");
  return { success: true, progress };
}

/**
 * Calculate progress as % of required fields that have non-empty values.
 */
function calculateProgress(
  data: Record<string, string>,
  etapas: MgaEtapa[],
): number {
  let totalRequired = 0;
  let filledRequired = 0;

  for (const etapa of etapas) {
    for (const campo of etapa.campos) {
      if (campo.requerido) {
        totalRequired++;
        const value = data[campo.id];
        if (value && value.trim().length > 0) {
          filledRequired++;
        }
      }
    }
  }

  if (totalRequired === 0) return 0;
  return Math.round((filledRequired / totalRequired) * 100);
}
