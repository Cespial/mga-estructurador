import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";

/**
 * GET /api/comments?submission_id=xxx&field_id=yyy
 * POST /api/comments { submission_id, field_id, content }
 *
 * CRUD for field-level comments (entity → municipality feedback loop).
 */
export async function GET(request: Request) {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const submissionId = searchParams.get("submission_id");
  const fieldId = searchParams.get("field_id");

  if (!submissionId) {
    return NextResponse.json(
      { error: "submission_id es requerido" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  let query = supabase
    .from("field_comments")
    .select("*")
    .eq("submission_id", submissionId)
    .order("created_at", { ascending: true });

  if (fieldId) {
    query = query.eq("field_id", fieldId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comments: data ?? [] });
}

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body: { submission_id: string; field_id: string; content: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request invalido" }, { status: 400 });
  }

  const { submission_id, field_id, content } = body;

  if (!submission_id || !field_id || !content?.trim()) {
    return NextResponse.json(
      { error: "submission_id, field_id y content son requeridos" },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("field_comments")
    .insert({
      submission_id,
      field_id,
      author_id: profile.id,
      author_role: profile.role,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Create notification for the other party
  if (profile.role === "entidad_admin") {
    // Notify the municipality user
    const { data: submission } = await supabase
      .from("submissions")
      .select("municipio_id, convocatoria_id")
      .eq("id", submission_id)
      .single();

    if (submission) {
      const { data: muniProfiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("municipio_id", submission.municipio_id)
        .limit(1);

      if (muniProfiles?.[0]) {
        await supabase.from("notifications").insert({
          user_id: muniProfiles[0].id,
          type: "comment",
          title: "Nuevo comentario del evaluador",
          body: `Un evaluador dejo un comentario en tu proyecto. Revisa y responde.`,
          action_url: `/dashboard/municipio/convocatorias/${submission.convocatoria_id}/wizard`,
        });
      }
    }
  }

  return NextResponse.json({ comment: data });
}
