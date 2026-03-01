import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { PuBlitecConvocatoria, ProjectForm } from "@/lib/types/database";

/**
 * POST /api/wizard/submit
 *
 * Submits a project after validating that all required wizard steps
 * are completed. Updates project status to "submitted" and sets submitted_at.
 *
 * Body: { project_id: string }
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

  let body: { project_id: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Cuerpo de la solicitud invalido" },
      { status: 400 },
    );
  }

  const { project_id } = body;

  if (!project_id) {
    return NextResponse.json(
      { error: "Falta el campo requerido: project_id" },
      { status: 400 },
    );
  }

  try {
    // ------------------------------------------------------------------
    // 1. Fetch project
    // ------------------------------------------------------------------
    const { data: project, error: projError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", project_id)
      .single();

    if (projError || !project) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 },
      );
    }

    if (project.status !== "draft") {
      return NextResponse.json(
        {
          error: `El proyecto ya tiene estado "${project.status}" y no puede ser enviado nuevamente.`,
        },
        { status: 400 },
      );
    }

    // ------------------------------------------------------------------
    // 2. Fetch convocatoria form_schema to know required steps/fields
    // ------------------------------------------------------------------
    const { data: convocatoria, error: convError } = await supabase
      .from("convocatorias_v2")
      .select("*")
      .eq("id", project.convocatoria_id)
      .single<PuBlitecConvocatoria>();

    if (convError || !convocatoria) {
      return NextResponse.json(
        { error: "Convocatoria no encontrada" },
        { status: 404 },
      );
    }

    // ------------------------------------------------------------------
    // 3. Fetch all project forms
    // ------------------------------------------------------------------
    const { data: forms, error: formsError } = await supabase
      .from("project_forms")
      .select("*")
      .eq("project_id", project_id)
      .order("step_number", { ascending: true });

    if (formsError) {
      throw new Error(
        `Error al obtener formularios: ${formsError.message}`,
      );
    }

    const projectForms = (forms ?? []) as ProjectForm[];

    // ------------------------------------------------------------------
    // 4. Validate all required steps and fields are completed
    // ------------------------------------------------------------------
    const validationErrors: string[] = [];
    const formSchema = convocatoria.form_schema ?? [];

    for (const stepDef of formSchema) {
      const form = projectForms.find(
        (f) => f.step_number === stepDef.step_number,
      );

      if (!form) {
        // Check if step has required fields -- if so, it's missing
        const hasRequired = stepDef.fields.some((f) => f.required);
        if (hasRequired) {
          validationErrors.push(
            `El paso ${stepDef.step_number} (${stepDef.step_name}) no ha sido diligenciado.`,
          );
        }
        continue;
      }

      // Check each required field
      for (const field of stepDef.fields) {
        if (!field.required) continue;

        // Skip file fields from required check (handled by document uploads)
        if (field.type === "file") continue;

        const value = form.form_data?.[field.id];
        if (value === null || value === undefined || value === "") {
          validationErrors.push(
            `El campo "${field.label}" en el paso ${stepDef.step_number} (${stepDef.step_name}) es requerido.`,
          );
        }
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: "El proyecto tiene campos requeridos sin diligenciar.",
          validation_errors: validationErrors,
        },
        { status: 422 },
      );
    }

    // ------------------------------------------------------------------
    // 5. Update project status to "submitted"
    // ------------------------------------------------------------------
    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("projects")
      .update({
        status: "submitted",
        submitted_at: now,
        updated_at: now,
      })
      .eq("id", project_id);

    if (updateError) {
      throw new Error(
        `Error al actualizar estado del proyecto: ${updateError.message}`,
      );
    }

    // Mark all forms as completed
    await supabase
      .from("project_forms")
      .update({ completed: true, updated_at: now })
      .eq("project_id", project_id);

    return NextResponse.json({
      success: true,
      project_id,
      status: "submitted",
      submitted_at: now,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error interno del servidor";
    console.error("[wizard/submit] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
