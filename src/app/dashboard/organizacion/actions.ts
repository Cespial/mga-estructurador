"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateOrganizationSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  nit: z.string().optional(),
  municipality: z.string().optional(),
  department: z.string().optional(),
});

export interface UpdateOrgState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
}

export async function updateOrganization(
  orgId: string,
  _prevState: UpdateOrgState,
  formData: FormData,
): Promise<UpdateOrgState> {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  // Verify ownership
  const { data: org } = await supabase
    .from("organizations")
    .select("id, owner_id")
    .eq("id", orgId)
    .single();

  if (!org || org.owner_id !== profile.id) {
    return { error: "No tienes permisos para editar esta organizacion." };
  }

  const raw = {
    name: formData.get("name") as string,
    nit: (formData.get("nit") as string) || undefined,
    municipality: (formData.get("municipality") as string) || undefined,
    department: (formData.get("department") as string) || undefined,
  };

  const result = updateOrganizationSchema.safeParse(raw);
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

  const { error: updateError } = await supabase
    .from("organizations")
    .update({
      name: data.name,
      nit: data.nit ?? null,
      municipality: data.municipality ?? null,
      department: data.department ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orgId);

  if (updateError) {
    console.error("Error updating organization:", updateError);
    return { error: "Error al actualizar la organizacion." };
  }

  revalidatePath("/dashboard/organizacion");
  return { success: true };
}
