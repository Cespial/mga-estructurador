import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";

/**
 * GET /api/documents/requirements?convocatoria_id=xxx
 */
export async function GET(request: Request) {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const convocatoriaId = searchParams.get("convocatoria_id");

  if (!convocatoriaId) {
    return NextResponse.json(
      { error: "convocatoria_id es requerido" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("document_requirements")
    .select("*")
    .eq("convocatoria_id", convocatoriaId)
    .order("sort_order");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ requirements: data ?? [] });
}
