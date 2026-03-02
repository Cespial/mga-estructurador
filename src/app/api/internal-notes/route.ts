import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";

export async function GET(request: Request) {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const submissionId = searchParams.get("submission_id");
  const campoId = searchParams.get("campo_id");

  if (!submissionId) {
    return NextResponse.json({ error: "submission_id requerido" }, { status: 400 });
  }

  const supabase = await createClient();
  let query = supabase
    .from("internal_notes")
    .select("*")
    .eq("submission_id", submissionId)
    .order("created_at", { ascending: true });

  if (campoId) query = query.eq("campo_id", campoId);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ notes: data ?? [] });
}

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body: { submission_id: string; campo_id?: string; content: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request invalido" }, { status: 400 });
  }

  if (!body.submission_id || !body.content?.trim()) {
    return NextResponse.json({ error: "submission_id y content requeridos" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("internal_notes")
    .insert({
      submission_id: body.submission_id,
      campo_id: body.campo_id ?? null,
      author_id: profile.id,
      content: body.content.trim(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ note: data });
}

export async function PATCH(request: Request) {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body: { note_id: string; resolved: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request invalido" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("internal_notes")
    .update({
      resolved: body.resolved,
      resolved_at: body.resolved ? new Date().toISOString() : null,
    })
    .eq("id", body.note_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ note: data });
}
