import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";

/**
 * GET /api/field-changes?submission_id=xxx&campo_id=yyy
 * Returns field change history for a specific field.
 */
export async function GET(request: Request) {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const submissionId = searchParams.get("submission_id");
  const campoId = searchParams.get("campo_id");

  if (!submissionId || !campoId) {
    return NextResponse.json(
      { error: "submission_id y campo_id son requeridos" },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("field_changes")
    .select("*")
    .eq("submission_id", submissionId)
    .eq("campo_id", campoId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ changes: data ?? [] });
}
