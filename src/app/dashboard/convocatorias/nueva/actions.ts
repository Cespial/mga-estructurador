"use server";

import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createConvocatoriaV2Schema } from "@/lib/validators/polytech";

export interface CreateConvocatoriaState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function createConvocatoria(
  _prevState: CreateConvocatoriaState,
  formData: FormData,
): Promise<CreateConvocatoriaState> {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  // Get organization
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("owner_id", profile.id)
    .single();

  if (!org) {
    return { error: "No se encontro tu organizacion. Por favor completa el onboarding." };
  }

  // Parse form data
  const rawBudget = formData.get("budget") as string;
  const raw = {
    name: formData.get("name") as string,
    slug: formData.get("slug") as string,
    description: (formData.get("description") as string) || undefined,
    budget: rawBudget ? Number(rawBudget) : undefined,
    open_date: (formData.get("open_date") as string) || undefined,
    close_date: (formData.get("close_date") as string) || undefined,
  };

  // Validate
  const result = createConvocatoriaV2Schema.safeParse(raw);
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

  // Check slug uniqueness within the organization
  const { data: existingSlug } = await supabase
    .from("convocatorias_v2")
    .select("id")
    .eq("organization_id", org.id)
    .eq("slug", data.slug)
    .single();

  if (existingSlug) {
    return { fieldErrors: { slug: ["Este slug ya esta en uso. Elige otro."] } };
  }

  // Insert convocatoria
  const { data: convocatoria, error: insertError } = await supabase
    .from("convocatorias_v2")
    .insert({
      organization_id: org.id,
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      status: "draft",
      budget: data.budget ?? null,
      open_date: data.open_date ?? null,
      close_date: data.close_date ?? null,
      form_schema: [],
    })
    .select("id")
    .single();

  if (insertError || !convocatoria) {
    console.error("Error creating convocatoria:", insertError);
    return { error: "Error al crear la convocatoria. Intenta de nuevo." };
  }

  // Create default rubric
  const { error: rubricError } = await supabase
    .from("rubrics_v2")
    .insert({
      convocatoria_id: convocatoria.id,
      name: `Rubrica - ${data.name}`,
      total_score: 100,
    });

  if (rubricError) {
    console.error("Error creating default rubric:", rubricError);
    // Non-blocking: convocatoria was created, rubric can be added later
  }

  redirect(`/dashboard/convocatorias/${convocatoria.id}`);
}
