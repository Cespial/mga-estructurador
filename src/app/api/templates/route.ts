import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";

/**
 * GET /api/templates?organization_id=xxx
 * POST /api/templates { name, description, source_submission_id, data_snapshot, tags }
 */
export async function GET(request: Request) {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("organization_id");

  const supabase = await createClient();
  let query = supabase
    .from("project_templates")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (orgId) {
    query = query.eq("organization_id", orgId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ templates: data ?? [] });
}

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body: {
    name: string;
    description?: string;
    source_submission_id?: string;
    data_snapshot: Record<string, string>;
    tags?: string[];
    organization_id?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request invalido" }, { status: 400 });
  }

  if (!body.name || !body.data_snapshot) {
    return NextResponse.json(
      { error: "name y data_snapshot son requeridos" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_templates")
    .insert({
      organization_id: body.organization_id ?? null,
      name: body.name,
      description: body.description ?? null,
      source_submission_id: body.source_submission_id ?? null,
      data_snapshot: body.data_snapshot,
      tags: body.tags ?? [],
      created_by: profile.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ template: data });
}
