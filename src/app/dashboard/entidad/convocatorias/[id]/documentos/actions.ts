"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "@/lib/validators/convocatoria";

function docUrl(convocatoriaId: string, error?: string) {
  const base = `/dashboard/entidad/convocatorias/${convocatoriaId}/documentos`;
  return error ? `${base}?error=${encodeURIComponent(error)}` : base;
}

export async function uploadDocument(convocatoriaId: string, formData: FormData) {
  const profile = await getProfile();
  if (!profile || profile.role !== "entidad_admin") {
    redirect("/dashboard");
  }

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    redirect(docUrl(convocatoriaId, "No se seleccionó ningún archivo"));
  }

  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    redirect(docUrl(convocatoriaId, "Tipo de archivo no permitido. Solo PDF, TXT y DOCX."));
  }

  if (file.size > MAX_FILE_SIZE) {
    redirect(docUrl(convocatoriaId, "El archivo excede el tamaño máximo de 10MB."));
  }

  const supabase = await createClient();

  // Verify convocatoria belongs to user's tenant
  const { data: conv } = await supabase
    .from("convocatorias")
    .select("id, tenant_id")
    .eq("id", convocatoriaId)
    .single();

  if (!conv || conv.tenant_id !== profile.tenant_id) {
    redirect(docUrl(convocatoriaId, "Convocatoria no encontrada"));
  }

  // Upload to Storage
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${convocatoriaId}/${timestamp}_${safeName}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from("convocatoria-docs")
    .upload(filePath, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    redirect(docUrl(convocatoriaId, `Error al subir archivo: ${uploadError.message}`));
  }

  // Insert document metadata
  const { error: insertError } = await supabase.from("documents").insert({
    convocatoria_id: convocatoriaId,
    tenant_id: profile.tenant_id,
    file_name: file.name,
    file_path: filePath,
    file_size: file.size,
    mime_type: file.type,
    status: "pending",
    created_by: profile.id,
  });

  if (insertError) {
    // Clean up uploaded file
    await supabase.storage.from("convocatoria-docs").remove([filePath]);
    redirect(docUrl(convocatoriaId, `Error al registrar documento: ${insertError.message}`));
  }

  revalidatePath(docUrl(convocatoriaId));
  redirect(docUrl(convocatoriaId));
}

export async function uploadDocuments(
  convocatoriaId: string,
  _prevState: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string } | null> {
  const profile = await getProfile();
  if (!profile || profile.role !== "entidad_admin") {
    redirect("/dashboard");
  }

  const files = formData.getAll("files") as File[];
  if (files.length === 0 || (files.length === 1 && files[0].size === 0)) {
    return { error: "No se seleccionaron archivos" };
  }

  // Validate ALL files upfront before uploading any
  for (const file of files) {
    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
      return { error: `Tipo no permitido: "${file.name}". Solo PDF, TXT y DOCX.` };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { error: `"${file.name}" excede el tamaño máximo de 10MB.` };
    }
  }

  const supabase = await createClient();

  // Verify convocatoria belongs to user's tenant
  const { data: conv } = await supabase
    .from("convocatorias")
    .select("id, tenant_id")
    .eq("id", convocatoriaId)
    .single();

  if (!conv || conv.tenant_id !== profile.tenant_id) {
    return { error: "Convocatoria no encontrada" };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const errors: string[] = [];

  for (const file of files) {
    try {
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${convocatoriaId}/${timestamp}_${safeName}`;

      const arrayBuffer = await file.arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from("convocatoria-docs")
        .upload(filePath, arrayBuffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        errors.push(`${file.name}: ${uploadError.message}`);
        continue;
      }

      const { data: docRow, error: insertError } = await supabase
        .from("documents")
        .insert({
          convocatoria_id: convocatoriaId,
          tenant_id: profile.tenant_id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          status: "pending",
          created_by: profile.id,
        })
        .select("id")
        .single();

      if (insertError) {
        await supabase.storage.from("convocatoria-docs").remove([filePath]);
        errors.push(`${file.name}: ${insertError.message}`);
        continue;
      }

      // Fire-and-forget: trigger processing without awaiting
      fetch(`${baseUrl}/api/documents/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(serviceKey ? { "x-service-role-key": serviceKey } : {}),
        },
        body: JSON.stringify({ document_id: docRow.id }),
      }).catch(() => {});
    } catch {
      errors.push(`${file.name}: error inesperado`);
    }
  }

  revalidatePath(docUrl(convocatoriaId));

  if (errors.length > 0) {
    return { error: `Errores parciales: ${errors.join("; ")}` };
  }

  redirect(docUrl(convocatoriaId));
}

export async function deleteDocument(convocatoriaId: string, documentId: string) {
  const profile = await getProfile();
  if (!profile || profile.role !== "entidad_admin") {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  // Fetch document to get file_path
  const { data: doc } = await supabase
    .from("documents")
    .select("file_path, tenant_id")
    .eq("id", documentId)
    .single();

  if (!doc || doc.tenant_id !== profile.tenant_id) {
    redirect(docUrl(convocatoriaId, "Documento no encontrado"));
  }

  // Delete from storage
  await supabase.storage.from("convocatoria-docs").remove([doc.file_path]);

  // Delete from DB (cascades to embeddings)
  await supabase.from("documents").delete().eq("id", documentId);

  revalidatePath(docUrl(convocatoriaId));
  redirect(docUrl(convocatoriaId));
}

export async function processDocument(convocatoriaId: string, documentId: string) {
  const profile = await getProfile();
  if (!profile || profile.role !== "entidad_admin") {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  // Update to processing status directly, then trigger processing
  await supabase
    .from("documents")
    .update({ status: "processing" })
    .eq("id", documentId);

  // Call the processing API route using service role key for server-to-server auth
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const res = await fetch(`${baseUrl}/api/documents/process`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(serviceKey ? { "x-service-role-key": serviceKey } : {}),
    },
    body: JSON.stringify({ document_id: documentId }),
  });

  if (!res.ok) {
    const data = await res.json();
    redirect(docUrl(convocatoriaId, data.error ?? "Error al procesar documento"));
  }

  revalidatePath(docUrl(convocatoriaId));
  redirect(docUrl(convocatoriaId));
}
