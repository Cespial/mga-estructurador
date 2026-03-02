import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";

/**
 * GET /api/comments?submission_id=xxx&field_id=yyy
 * POST /api/comments { submission_id, field_id, content }
 * PATCH /api/comments { comment_id, action: "resolve"|"reopen", resolved_note? }
 *
 * CRUD for field-level comments (entity <-> municipality feedback loop).
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

/**
 * PATCH /api/comments — Resolve or reopen a comment
 */
export async function PATCH(request: Request) {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body: {
    comment_id: string;
    action: "resolve" | "reopen";
    resolved_note?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request invalido" }, { status: 400 });
  }

  const { comment_id, action, resolved_note } = body;

  if (!comment_id || !action) {
    return NextResponse.json(
      { error: "comment_id y action son requeridos" },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  if (action === "resolve") {
    const { data, error } = await supabase
      .from("field_comments")
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: profile.id,
        resolved_note: resolved_note?.trim() || null,
      })
      .eq("id", comment_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ comment: data });
  }

  if (action === "reopen") {
    const { data, error } = await supabase
      .from("field_comments")
      .update({
        resolved: false,
        resolved_at: null,
        resolved_by: null,
        resolved_note: null,
      })
      .eq("id", comment_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ comment: data });
  }

  return NextResponse.json(
    { error: "action debe ser 'resolve' o 'reopen'" },
    { status: 400 },
  );
}
