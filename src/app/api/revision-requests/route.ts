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

  if (!submissionId) {
    return NextResponse.json({ error: "submission_id requerido" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("revision_requests")
    .select("*")
    .eq("submission_id", submissionId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ requests: data ?? [] });
}

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile || profile.role !== "entidad_admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  let body: {
    submission_id: string;
    campos: string[];
    message: string;
    deadline?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request invalido" }, { status: 400 });
  }

  const supabase = await createClient();

  // Count existing rounds
  const { data: existing } = await supabase
    .from("revision_requests")
    .select("round")
    .eq("submission_id", body.submission_id)
    .order("round", { ascending: false })
    .limit(1);

  const nextRound = (existing?.[0]?.round ?? 0) + 1;

  const { data, error } = await supabase
    .from("revision_requests")
    .insert({
      submission_id: body.submission_id,
      requested_by: profile.id,
      campos: body.campos,
      message: body.message,
      deadline: body.deadline ?? null,
      round: nextRound,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update submission status to needs_revision and unlock
  await supabase
    .from("submissions")
    .update({ status: "needs_revision", locked: false })
    .eq("id", body.submission_id);

  return NextResponse.json({ request: data });
}
