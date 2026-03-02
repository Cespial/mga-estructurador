import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { canTransition } from "@/lib/submission-status";
import { sendEmail, submissionConfirmationEmail } from "@/lib/email";
import type { SubmissionStatus } from "@/lib/types/database";

/**
 * POST /api/submissions/submit
 * Formally submit a draft submission.
 * - Validates status transition (draft → submitted)
 * - Locks the form
 * - Sets submitted_at timestamp
 * - Sends confirmation email
 */
export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile || profile.role !== "municipio_user") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  let body: { submission_id: string; convocatoria_id: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request invalido" }, { status: 400 });
  }

  const { submission_id, convocatoria_id } = body;

  if (!submission_id || !convocatoria_id) {
    return NextResponse.json(
      { error: "submission_id y convocatoria_id son requeridos" },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  // Fetch current submission
  const { data: submission, error: fetchError } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", submission_id)
    .single();

  if (fetchError || !submission) {
    return NextResponse.json(
      { error: "Submission no encontrada" },
      { status: 404 },
    );
  }

  const currentStatus = (submission.status ?? "draft") as SubmissionStatus;

  // Validate status transition
  if (!canTransition(currentStatus, "submitted")) {
    return NextResponse.json(
      {
        error: `No se puede enviar desde el estado actual: ${currentStatus}`,
      },
      { status: 400 },
    );
  }

  // Check for unresolved blocking comments
  const { data: blockingComments } = await supabase
    .from("field_comments")
    .select("id")
    .eq("submission_id", submission_id)
    .eq("resolved", false)
    .eq("blocking", true);

  if (blockingComments && blockingComments.length > 0) {
    return NextResponse.json(
      {
        error: `Hay ${blockingComments.length} comentario(s) bloqueante(s) sin resolver.`,
      },
      { status: 400 },
    );
  }

  // Update submission
  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("submissions")
    .update({
      status: "submitted",
      locked: true,
      submitted_at: now,
      completed_at: submission.completed_at ?? now,
    })
    .eq("id", submission_id);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 },
    );
  }

  // Update convocatoria_municipios status
  if (profile.municipio_id) {
    await supabase
      .from("convocatoria_municipios")
      .update({ estado: "completado" })
      .eq("convocatoria_id", convocatoria_id)
      .eq("municipio_id", profile.municipio_id);
  }

  // Create notification
  await supabase.from("notifications").insert({
    user_id: profile.id,
    type: "milestone",
    title: "Proyecto enviado",
    body: "Tu proyecto ha sido enviado exitosamente. Recibiras notificaciones sobre el estado de la evaluacion.",
    action_url: `/dashboard/municipio/convocatorias/${convocatoria_id}`,
  });

  // Send confirmation email
  const { data: convocatoria } = await supabase
    .from("convocatorias")
    .select("nombre")
    .eq("id", convocatoria_id)
    .single();

  const { data: municipio } = profile.municipio_id
    ? await supabase
        .from("municipios")
        .select("nombre")
        .eq("id", profile.municipio_id)
        .single()
    : { data: null };

  if (profile.email && convocatoria) {
    const emailData = submissionConfirmationEmail({
      municipioNombre: municipio?.nombre ?? "Municipio",
      convocatoriaNombre: convocatoria.nombre,
      progress: submission.progress ?? 100,
      submittedAt: now,
    });
    await sendEmail({
      to: profile.email,
      subject: emailData.subject,
      html: emailData.html,
    });
  }

  // Notify entity admins
  const { data: entityAdmins } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "entidad_admin")
    .limit(10);

  if (entityAdmins) {
    const notifications = entityAdmins.map((admin) => ({
      user_id: admin.id,
      type: "milestone" as const,
      title: "Nuevo proyecto enviado",
      body: `${municipio?.nombre ?? "Un municipio"} envio su proyecto para ${convocatoria?.nombre ?? "una convocatoria"}.`,
      action_url: `/dashboard/entidad/convocatorias/${convocatoria_id}`,
    }));
    await supabase.from("notifications").insert(notifications);
  }

  return NextResponse.json({
    success: true,
    status: "submitted",
    submitted_at: now,
  });
}
