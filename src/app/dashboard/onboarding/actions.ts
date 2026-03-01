"use server";

import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createOrganizationSchema } from "@/lib/validators/publitec";

export interface OnboardingState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function createOrganization(
  _prevState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  // Check if user already has an organization
  const { data: existingOrg } = await supabase
    .from("organizations")
    .select("id")
    .eq("owner_id", profile.id)
    .single();

  if (existingOrg) {
    redirect("/dashboard");
  }

  // Parse form data
  const raw = {
    name: formData.get("name") as string,
    type: formData.get("type") as string,
    nit: (formData.get("nit") as string) || undefined,
    municipality: (formData.get("municipality") as string) || undefined,
    department: (formData.get("department") as string) || undefined,
  };

  // Validate
  const result = createOrganizationSchema.safeParse(raw);
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

  // Insert organization
  const { error: insertError } = await supabase.from("organizations").insert({
    owner_id: profile.id,
    name: data.name,
    type: data.type,
    nit: data.nit ?? null,
    municipality: data.municipality ?? null,
    department: data.department ?? null,
  });

  if (insertError) {
    console.error("Error creating organization:", insertError);
    return { error: "Error al crear la organizacion. Intenta de nuevo." };
  }

  redirect("/dashboard");
}
