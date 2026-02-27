import { redirect, notFound } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_WIZARD_STEPS } from "@/lib/wizard-steps";
import { WizardClient } from "./wizard-client";
import type {
  Project,
  ProjectForm,
  PolytechConvocatoria,
  AiChatMessage,
  WizardStepDefinition,
} from "@/lib/types/database";

export default async function WizardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  // Fetch project
  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !project) {
    notFound();
  }

  const proj = project as Project;

  // Only allow editing draft projects
  if (proj.status !== "draft") {
    redirect(`/dashboard/proyectos/${id}`);
  }

  // Fetch project forms
  const { data: forms } = await supabase
    .from("project_forms")
    .select("*")
    .eq("project_id", id)
    .order("step_number", { ascending: true });

  const projectForms = (forms ?? []) as ProjectForm[];

  // Fetch convocatoria for form schema
  const { data: convocatoria } = await supabase
    .from("convocatorias_v2")
    .select("id, name, form_schema")
    .eq("id", proj.convocatoria_id)
    .single();

  const conv = convocatoria as PolytechConvocatoria | null;

  // Determine wizard steps: use convocatoria form_schema or defaults
  const wizardSteps: WizardStepDefinition[] =
    conv?.form_schema && Array.isArray(conv.form_schema) && conv.form_schema.length > 0
      ? conv.form_schema
      : DEFAULT_WIZARD_STEPS;

  // Fetch existing chat messages for this project
  const { data: chatMessages } = await supabase
    .from("ai_chat_messages")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: true });

  const messages = (chatMessages ?? []) as AiChatMessage[];

  return (
    <WizardClient
      project={proj}
      projectForms={projectForms}
      wizardSteps={wizardSteps}
      convocatoriaName={conv?.name ?? "Convocatoria"}
      initialChatMessages={messages}
    />
  );
}
