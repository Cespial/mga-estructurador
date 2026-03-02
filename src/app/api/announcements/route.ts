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

  if (!convocatoriaId) {
    return NextResponse.json({ error: "convocatoria_id requerido" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("convocatoria_id", convocatoriaId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ announcements: data ?? [] });
}

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile || profile.role !== "entidad_admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  let body: { convocatoria_id: string; title: string; body: string; pinned?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request invalido" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("announcements")
    .insert({
      convocatoria_id: body.convocatoria_id,
      author_id: profile.id,
      title: body.title,
      body: body.body,
      pinned: body.pinned ?? false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ announcement: data });
}
