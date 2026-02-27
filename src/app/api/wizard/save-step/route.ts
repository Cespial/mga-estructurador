import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/wizard/save-step
 *
 * Auto-saves a wizard step form data. Upserts the project_forms record
 * matching (project_id, step_number).
 *
 * Body: { project_id: string, step_number: number, form_data: Record<string, unknown> }
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  // Verify authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body: {
    project_id: string;
    step_number: number;
    form_data: Record<string, unknown>;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Cuerpo de la solicitud invalido" },
      { status: 400 },
    );
  }

  const { project_id, step_number, form_data } = body;

  if (!project_id || step_number == null || !form_data) {
    return NextResponse.json(
      {
        error:
          "Faltan campos requeridos: project_id, step_number, form_data",
      },
      { status: 400 },
    );
  }

  try {
    // ------------------------------------------------------------------
    // 1. Verify the project exists and belongs to the user's organization
    // ------------------------------------------------------------------
    const { data: project, error: projError } = await supabase
      .from("projects")
      .select("id, status, convocatoria_id")
      .eq("id", project_id)
      .single();

    if (projError || !project) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 },
      );
    }

    // Prevent saving on already submitted/scored projects
    if (
      project.status !== "draft" &&
      project.status !== "under_review"
    ) {
      return NextResponse.json(
        {
          error: `No se puede modificar un proyecto con estado "${project.status}"`,
        },
        { status: 400 },
      );
    }

    // ------------------------------------------------------------------
    // 2. Get the step name from the convocatoria form_schema
    // ------------------------------------------------------------------
    const { data: convocatoria } = await supabase
      .from("convocatorias_v2")
      .select("form_schema")
      .eq("id", project.convocatoria_id)
      .single();

    const stepSchema = convocatoria?.form_schema?.find(
      (s: { step_number: number }) => s.step_number === step_number,
    );
    const stepName = stepSchema?.step_name ?? `Paso ${step_number}`;

    // ------------------------------------------------------------------
    // 3. Check if a record already exists for this step
    // ------------------------------------------------------------------
    const { data: existing } = await supabase
      .from("project_forms")
      .select("id")
      .eq("project_id", project_id)
      .eq("step_number", step_number)
      .single();

    const now = new Date().toISOString();

    if (existing) {
      // Update existing record
      const { error: updateError } = await supabase
        .from("project_forms")
        .update({
          form_data,
          step_name: stepName,
          updated_at: now,
        })
        .eq("id", existing.id);

      if (updateError) {
        throw new Error(
          `Error al actualizar formulario: ${updateError.message}`,
        );
      }

      return NextResponse.json({
        success: true,
        action: "updated",
        form_id: existing.id,
      });
    } else {
      // Insert new record
      const { data: inserted, error: insertError } = await supabase
        .from("project_forms")
        .insert({
          project_id,
          step_number,
          step_name: stepName,
          form_data,
          ai_suggestions: [],
          completed: false,
          created_at: now,
          updated_at: now,
        })
        .select("id")
        .single();

      if (insertError) {
        throw new Error(
          `Error al crear formulario: ${insertError.message}`,
        );
      }

      return NextResponse.json({
        success: true,
        action: "created",
        form_id: inserted?.id,
      });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error interno del servidor";
    console.error("[wizard/save-step] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
