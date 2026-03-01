import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await request.formData();
    const projectId = formData.get("project_id") as string;

    if (!projectId) {
      return NextResponse.json({ error: "project_id requerido" }, { status: 400 });
    }

    // Verify user has an organization
    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    // Fetch project and verify ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, convocatoria_id, status, organization_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    }

    if (org && project.organization_id !== org.id) {
      return NextResponse.json({ error: "No autorizado para este proyecto" }, { status: 403 });
    }

    // Fetch rubric for the convocatoria
    const { data: rubric } = await supabase
      .from("rubrics_v2")
      .select("id")
      .eq("convocatoria_id", project.convocatoria_id)
      .limit(1)
      .single();

    if (!rubric) {
      return NextResponse.json({ error: "No hay rubrica para esta convocatoria" }, { status: 400 });
    }

    // Create project_score
    const { data: score, error: scoreError } = await supabase
      .from("project_scores")
      .insert({
        project_id: projectId,
        rubric_id: rubric.id,
        evaluator_type: "ai",
        status: "pending",
      })
      .select("id")
      .single();

    if (scoreError) {
      return NextResponse.json({ error: scoreError.message }, { status: 500 });
    }

    // Create scoring job
    const { error: jobError } = await supabase
      .from("scoring_jobs")
      .insert({
        project_score_id: score.id,
        engine_version: "v1",
        status: "pending",
      });

    if (jobError) {
      return NextResponse.json({ error: jobError.message }, { status: 500 });
    }

    // Update project status
    await supabase
      .from("projects")
      .update({ status: "under_review" })
      .eq("id", projectId);

    // Redirect back to evaluation page
    return NextResponse.redirect(
      new URL(`/dashboard/evaluaciones/${projectId}`, request.url),
      303,
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 },
    );
  }
}
