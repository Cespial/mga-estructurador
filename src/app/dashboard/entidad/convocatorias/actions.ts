"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { createConvocatoriaSchema, updateConvocatoriaSchema } from "@/lib/validators/convocatoria";

export async function createConvocatoria(formData: FormData) {
  const profile = await getProfile();
  if (!profile || profile.role !== "entidad_admin" || !profile.tenant_id) {
    redirect("/dashboard");
  }

  const raw = {
    nombre: formData.get("nombre") as string,
    descripcion: formData.get("descripcion") as string,
    requisitos: formData.get("requisitos") as string,
    fecha_inicio: formData.get("fecha_inicio") as string || undefined,
    fecha_cierre: formData.get("fecha_cierre") as string || undefined,
  };

  const parsed = createConvocatoriaSchema.safeParse(raw);
  if (!parsed.success) {
    redirect("/dashboard/entidad/convocatorias/nueva?error=" + encodeURIComponent(parsed.error.issues[0].message));
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("convocatorias")
    .insert({
      ...parsed.data,
      tenant_id: profile.tenant_id,
    })
    .select("id")
    .single();

  if (error) {
    redirect("/dashboard/entidad/convocatorias/nueva?error=" + encodeURIComponent(error.message));
  }

  // Auto-create empty template (ignore errors — user can create later via plantilla page)
  await supabase.from("mga_templates").insert({
    convocatoria_id: data.id,
    etapas_json: [],
  });

  revalidatePath("/dashboard/entidad");
  redirect(`/dashboard/entidad/convocatorias/${data.id}`);
}

export async function updateConvocatoria(id: string, formData: FormData) {
  const profile = await getProfile();
  if (!profile || profile.role !== "entidad_admin") {
    redirect("/dashboard");
  }

  const raw = {
    nombre: formData.get("nombre") as string || undefined,
    descripcion: formData.get("descripcion") as string || undefined,
    requisitos: formData.get("requisitos") as string || undefined,
    fecha_inicio: formData.get("fecha_inicio") as string || undefined,
    fecha_cierre: formData.get("fecha_cierre") as string || undefined,
    estado: formData.get("estado") as string || undefined,
  };

  const parsed = updateConvocatoriaSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(`/dashboard/entidad/convocatorias/${id}?error=` + encodeURIComponent(parsed.error.issues[0].message));
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("convocatorias")
    .update(parsed.data)
    .eq("id", id);

  if (error) {
    redirect(`/dashboard/entidad/convocatorias/${id}?error=` + encodeURIComponent(error.message));
  }

  revalidatePath("/dashboard/entidad");
  revalidatePath(`/dashboard/entidad/convocatorias/${id}`);
  redirect(`/dashboard/entidad/convocatorias/${id}`);
}

export async function deleteConvocatoria(id: string) {
  const profile = await getProfile();
  if (!profile || profile.role !== "entidad_admin") {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("convocatorias")
    .delete()
    .eq("id", id);

  if (error) {
    redirect(`/dashboard/entidad/convocatorias/${id}?error=` + encodeURIComponent(error.message));
  }

  revalidatePath("/dashboard/entidad");
  redirect("/dashboard/entidad");
}

export async function assignMunicipio(convocatoriaId: string, formData: FormData) {
  const profile = await getProfile();
  if (!profile || profile.role !== "entidad_admin") {
    redirect("/dashboard");
  }

  const municipioId = formData.get("municipio_id") as string;
  if (!municipioId) {
    redirect(`/dashboard/entidad/convocatorias/${convocatoriaId}/municipios?error=Seleccione un municipio`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("convocatoria_municipios")
    .insert({
      convocatoria_id: convocatoriaId,
      municipio_id: municipioId,
      estado: "activo",
    });

  if (error) {
    const msg = error.code === "23505" ? "Este municipio ya está asignado" : error.message;
    redirect(`/dashboard/entidad/convocatorias/${convocatoriaId}/municipios?error=` + encodeURIComponent(msg));
  }

  revalidatePath(`/dashboard/entidad/convocatorias/${convocatoriaId}/municipios`);
  redirect(`/dashboard/entidad/convocatorias/${convocatoriaId}/municipios`);
}

export async function removeMunicipio(convocatoriaId: string, assignmentId: string) {
  const profile = await getProfile();
  if (!profile || profile.role !== "entidad_admin") {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  await supabase
    .from("convocatoria_municipios")
    .delete()
    .eq("id", assignmentId);

  revalidatePath(`/dashboard/entidad/convocatorias/${convocatoriaId}/municipios`);
  redirect(`/dashboard/entidad/convocatorias/${convocatoriaId}/municipios`);
}
