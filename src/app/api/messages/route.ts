import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";

export async function GET(request: Request) {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const convocatoriaId = searchParams.get("convocatoria_id");
  const submissionId = searchParams.get("submission_id");

  const supabase = await createClient();
  let query = supabase
    .from("direct_messages")
    .select("*")
    .order("created_at", { ascending: true });

  if (convocatoriaId) query = query.eq("convocatoria_id", convocatoriaId);
  if (submissionId) query = query.eq("submission_id", submissionId);

  const { data, error } = await query.limit(100);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body: { convocatoria_id: string; submission_id?: string; content: string; thread_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request invalido" }, { status: 400 });
  }

  if (!body.convocatoria_id || !body.content?.trim()) {
    return NextResponse.json({ error: "convocatoria_id y content requeridos" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("direct_messages")
    .insert({
      convocatoria_id: body.convocatoria_id,
      submission_id: body.submission_id ?? null,
      sender_id: profile.id,
      sender_role: profile.role,
      content: body.content.trim(),
      thread_id: body.thread_id ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: data });
}
