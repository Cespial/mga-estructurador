"use server";

import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_WIZARD_STEPS } from "@/lib/wizard-steps";

export async function createProjectForConvocatoria(convocatoriaId: string) {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  // Get user's organization
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("owner_id", profile.id)
    .single();

  if (!org) {
    throw new Error("No se encontro tu organizacion.");
  }

  // Fetch convocatoria to get form schema (or use defaults)
  const { data: convocatoria } = await supabase
    .from("convocatorias_v2")
    .select("id, name, form_schema")
    .eq("id", convocatoriaId)
    .single();

  if (!convocatoria) {
    throw new Error("Convocatoria no encontrada.");
  }

  // Check if user already has a project for this convocatoria
  const { data: existing } = await supabase
    .from("projects")
    .select("id")
    .eq("convocatoria_id", convocatoriaId)
    .eq("organization_id", org.id)
    .single();

  if (existing) {
    // Already applied, redirect to existing project wizard
    redirect(`/dashboard/proyectos/${existing.id}/wizard`);
  }

  // Use convocatoria form_schema if available, otherwise default
  const steps =
    convocatoria.form_schema && Array.isArray(convocatoria.form_schema) && convocatoria.form_schema.length > 0
      ? convocatoria.form_schema
      : DEFAULT_WIZARD_STEPS;

  // Create the project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      convocatoria_id: convocatoriaId,
      organization_id: org.id,
      title: `Proyecto - ${convocatoria.name}`,
      status: "draft",
    })
    .select("id")
    .single();

  if (projectError || !project) {
    throw new Error("Error al crear el proyecto: " + (projectError?.message ?? "unknown"));
  }

  // Create project_forms for each wizard step
  const formInserts = steps.map((step) => ({
    project_id: project.id,
    step_number: step.step_number,
    step_name: step.step_name,
    form_data: {},
    ai_suggestions: [],
    completed: false,
  }));

  const { error: formsError } = await supabase
    .from("project_forms")
    .insert(formInserts);

  if (formsError) {
    // Cleanup: delete the project if form creation fails
    await supabase.from("projects").delete().eq("id", project.id);
    throw new Error("Error al crear formularios: " + formsError.message);
  }

  // Redirect to the wizard
  redirect(`/dashboard/proyectos/${project.id}/wizard`);
}
