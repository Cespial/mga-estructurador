import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";

/**
 * GET /api/snippets
 * POST /api/snippets { label, content, tags }
 */
export async function GET() {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("text_snippets")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ snippets: data ?? [] });
}

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body: {
    label: string;
    content: string;
    tags?: string[];
    organization_id?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request invalido" }, { status: 400 });
  }

  if (!body.label?.trim() || !body.content?.trim()) {
    return NextResponse.json(
      { error: "label y content son requeridos" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("text_snippets")
    .insert({
      organization_id: body.organization_id ?? null,
      label: body.label.trim(),
      content: body.content.trim(),
      tags: body.tags ?? [],
      created_by: profile.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ snippet: data });
}
