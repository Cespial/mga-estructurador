"use server";

import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function saveWizardStep(
  projectId: string,
  stepNumber: number,
  formData: Record<string, string>,
  completed: boolean
) {
  const profile = await getProfile();
  if (!profile) throw new Error("No autenticado");

  const supabase = await createClient();

  // Upsert project form data
  const { error } = await supabase
    .from("project_forms")
    .update({
      form_data: formData,
      completed,
      updated_at: new Date().toISOString(),
    })
    .eq("project_id", projectId)
    .eq("step_number", stepNumber);

  if (error) {
    throw new Error("Error al guardar: " + error.message);
  }

  // If the first step has a project_name, update the project title
  if (stepNumber === 1 && formData.project_name) {
    await supabase
      .from("projects")
      .update({
        title: formData.project_name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);
  }

  // If the budget step has requested_amount, update project budget
  if (stepNumber === 2 && formData.requested_amount) {
    const budget = parseFloat(formData.requested_amount.replace(/[^0-9.]/g, ""));
    if (!isNaN(budget)) {
      await supabase
        .from("projects")
        .update({
          budget_requested: budget,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId);
    }
  }

  return { success: true };
}

export async function submitProject(projectId: string) {
  const profile = await getProfile();
  if (!profile) throw new Error("No autenticado");

  const supabase = await createClient();

  // Check all required steps are completed
  const { data: forms } = await supabase
    .from("project_forms")
    .select("step_number, step_name, completed")
    .eq("project_id", projectId)
    .order("step_number");

  if (!forms || forms.length === 0) {
    throw new Error("No se encontraron formularios para este proyecto.");
  }

  const incompleteSteps = forms.filter((f) => !f.completed);
  if (incompleteSteps.length > 0) {
    const names = incompleteSteps.map((s) => s.step_name).join(", ");
    throw new Error(`Pasos incompletos: ${names}. Completa todos los pasos antes de enviar.`);
  }

  // Update project status to submitted
  const { error } = await supabase
    .from("projects")
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  if (error) {
    throw new Error("Error al enviar el proyecto: " + error.message);
  }

  redirect(`/dashboard/proyectos/${projectId}`);
}

export async function saveChatMessage(
  projectId: string,
  role: "user" | "assistant",
  content: string,
  stepNumber: number | null
) {
  const profile = await getProfile();
  if (!profile) throw new Error("No autenticado");

  const supabase = await createClient();

  const { error } = await supabase.from("ai_chat_messages").insert({
    project_id: projectId,
    role,
    content,
    step_number: stepNumber,
  });

  if (error) {
    console.error("Error saving chat message:", error);
  }
}
