import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import ExcelJS from "exceljs";
import type {
  Project,
  ProjectScore,
  CriteriaScore,
  RubricCriterion,
  Rubric,
  ProjectForm,
  Organization,
  ScoringJob,
} from "@/lib/types/database";

// Polytech brand blue (EAFIT)
const BRAND_BLUE_ARGB = "FF2563EB";
const WHITE_ARGB = "FFFFFFFF";
const LIGHT_GRAY_ARGB = "FFF5F5F5";

/**
 * GET /api/reports/[projectId]/xlsx
 *
 * Generates an Excel workbook with multiple sheets:
 * - RESUMEN: project info + total scores
 * - DETALLE: criteria scores with justifications
 * - PROYECTO: all form data
 * - METADATA: scoring job info, timestamps
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const supabase = await createClient();

  // Verify authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    // ------------------------------------------------------------------
    // Fetch all data
    // ------------------------------------------------------------------
    const { data: project, error: projError } = await supabase
      .from("projects")
      .select("*, organizations(*)")
      .eq("id", projectId)
      .single<Project & { organizations: Organization | null }>();

    if (projError || !project) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 },
      );
    }

    const { data: projectScore } = await supabase
      .from("project_scores")
      .select("*")
      .eq("project_id", projectId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1)
      .single<ProjectScore>();

    if (!projectScore) {
      return NextResponse.json(
        { error: "Este proyecto aun no ha sido evaluado" },
        { status: 404 },
      );
    }

    const { data: criteriaScores } = await supabase
      .from("criteria_scores")
      .select("*")
      .eq("project_score_id", projectScore.id)
      .order("created_at", { ascending: true });

    const { data: rubric } = await supabase
      .from("rubrics_v2")
      .select("*")
      .eq("id", projectScore.rubric_id)
      .single<Rubric>();

    const { data: rubricCriteria } = await supabase
      .from("rubric_criteria")
      .select("*")
      .eq("rubric_id", projectScore.rubric_id)
      .order("sort_order", { ascending: true });

    const { data: forms } = await supabase
      .from("project_forms")
      .select("*")
      .eq("project_id", projectId)
      .order("step_number", { ascending: true });

    const { data: scoringJob } = await supabase
      .from("scoring_jobs")
      .select("*")
      .eq("project_score_id", projectScore.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single<ScoringJob>();

    const scores = (criteriaScores ?? []) as CriteriaScore[];
    const criteria = (rubricCriteria ?? []) as RubricCriterion[];
    const projectForms = (forms ?? []) as ProjectForm[];

    const criterionMap = new Map(criteria.map((c) => [c.id, c]));

    // ------------------------------------------------------------------
    // Build workbook
    // ------------------------------------------------------------------
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Polytech";
    workbook.created = new Date();

    // ====================== RESUMEN sheet ======================
    const resumenSheet = workbook.addWorksheet("RESUMEN");

    // Title row
    resumenSheet.mergeCells("A1:F1");
    const titleCell = resumenSheet.getCell("A1");
    titleCell.value = "POLYTECH - Reporte de Evaluacion";
    titleCell.font = { bold: true, size: 16, color: { argb: WHITE_ARGB } };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: BRAND_BLUE_ARGB },
    };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    resumenSheet.getRow(1).height = 30;

    // Project info
    const infoData: [string, string][] = [
      ["Titulo del Proyecto", project.title],
      ["Organizacion", project.organizations?.name ?? "No especificada"],
      ["Estado", translateStatus(project.status)],
      [
        "Presupuesto Solicitado",
        project.budget_requested
          ? `$${project.budget_requested.toLocaleString("es-CO")}`
          : "No especificado",
      ],
      [
        "Fecha de Envio",
        project.submitted_at
          ? new Date(project.submitted_at).toLocaleDateString("es-CO")
          : "No enviado",
      ],
      ["Rubrica", rubric?.name ?? "No disponible"],
      [
        "Puntaje Total",
        `${projectScore.total_score ?? 0} / ${rubric?.total_score ?? "—"}`,
      ],
      [
        "Puntaje Ponderado",
        String(projectScore.total_weighted_score?.toFixed(2) ?? "—"),
      ],
      ["Tipo de Evaluador", projectScore.evaluator_type === "ai" ? "Inteligencia Artificial" : "Humano"],
    ];

    let row = 3;
    for (const [label, value] of infoData) {
      const labelCell = resumenSheet.getCell(`A${row}`);
      labelCell.value = label;
      labelCell.font = { bold: true, size: 10 };

      const valueCell = resumenSheet.getCell(`B${row}`);
      valueCell.value = value;
      valueCell.font = { size: 10 };

      row++;
    }

    // AI Summary
    row += 1;
    const summaryLabel = resumenSheet.getCell(`A${row}`);
    summaryLabel.value = "Resumen de la Evaluacion (IA)";
    summaryLabel.font = { bold: true, size: 11 };
    row++;

    resumenSheet.mergeCells(`A${row}:F${row + 3}`);
    const summaryCell = resumenSheet.getCell(`A${row}`);
    summaryCell.value = projectScore.ai_summary ?? "Sin resumen disponible.";
    summaryCell.alignment = { wrapText: true, vertical: "top" };
    summaryCell.font = { size: 9 };

    resumenSheet.getColumn(1).width = 25;
    resumenSheet.getColumn(2).width = 50;

    // ====================== DETALLE sheet ======================
    const detalleSheet = workbook.addWorksheet("DETALLE");

    // Header row
    detalleSheet.mergeCells("A1:G1");
    const detTitleCell = detalleSheet.getCell("A1");
    detTitleCell.value = "Detalle de Evaluacion por Criterio";
    detTitleCell.font = { bold: true, size: 14, color: { argb: WHITE_ARGB } };
    detTitleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: BRAND_BLUE_ARGB },
    };
    detTitleCell.alignment = { horizontal: "center", vertical: "middle" };
    detalleSheet.getRow(1).height = 28;

    // Column headers
    const detHeaders = [
      "Criterio",
      "Puntaje",
      "Maximo",
      "Peso (%)",
      "Ponderado",
      "Justificacion",
      "Razonamiento IA",
    ];

    const headerRow = detalleSheet.getRow(3);
    detHeaders.forEach((header, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = header;
      cell.font = { bold: true, size: 10, color: { argb: WHITE_ARGB } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: BRAND_BLUE_ARGB },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });
    headerRow.height = 22;

    // Data rows
    scores.forEach((s, idx) => {
      const criterion = criterionMap.get(s.rubric_criteria_id);
      const dataRow = detalleSheet.getRow(4 + idx);

      dataRow.getCell(1).value = criterion?.criterion_name ?? "—";
      dataRow.getCell(2).value = s.score;
      dataRow.getCell(3).value = s.max_score;
      dataRow.getCell(4).value = `${((criterion?.weight ?? 0) * 100).toFixed(0)}%`;
      dataRow.getCell(5).value = s.weighted_score ?? 0;
      dataRow.getCell(6).value = s.justification ?? "—";
      dataRow.getCell(7).value = s.ai_rationale ?? "—";

      // Alternate row colors
      if (idx % 2 === 0) {
        for (let col = 1; col <= 7; col++) {
          dataRow.getCell(col).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: LIGHT_GRAY_ARGB },
          };
        }
      }

      // Wrap text for justification columns
      dataRow.getCell(6).alignment = { wrapText: true, vertical: "top" };
      dataRow.getCell(7).alignment = { wrapText: true, vertical: "top" };
    });

    // Column widths
    detalleSheet.getColumn(1).width = 28;
    detalleSheet.getColumn(2).width = 10;
    detalleSheet.getColumn(3).width = 10;
    detalleSheet.getColumn(4).width = 10;
    detalleSheet.getColumn(5).width = 12;
    detalleSheet.getColumn(6).width = 45;
    detalleSheet.getColumn(7).width = 45;

    // ====================== PROYECTO sheet ======================
    const proyectoSheet = workbook.addWorksheet("PROYECTO");

    // Header
    proyectoSheet.mergeCells("A1:C1");
    const projTitleCell = proyectoSheet.getCell("A1");
    projTitleCell.value = "Datos del Formulario del Proyecto";
    projTitleCell.font = { bold: true, size: 14, color: { argb: WHITE_ARGB } };
    projTitleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: BRAND_BLUE_ARGB },
    };
    projTitleCell.alignment = { horizontal: "center", vertical: "middle" };
    proyectoSheet.getRow(1).height = 28;

    let projRow = 3;
    for (const form of projectForms) {
      // Step header
      const stepHeader = proyectoSheet.getCell(`A${projRow}`);
      stepHeader.value = `Paso ${form.step_number}: ${form.step_name}`;
      stepHeader.font = { bold: true, size: 11 };
      stepHeader.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: LIGHT_GRAY_ARGB },
      };
      proyectoSheet.mergeCells(`A${projRow}:C${projRow}`);
      projRow++;

      for (const [key, value] of Object.entries(form.form_data ?? {})) {
        proyectoSheet.getCell(`A${projRow}`).value = key;
        proyectoSheet.getCell(`A${projRow}`).font = { bold: true, size: 9 };

        const valCell = proyectoSheet.getCell(`B${projRow}`);
        valCell.value =
          value !== null && value !== undefined && value !== ""
            ? String(value)
            : "(sin diligenciar)";
        valCell.alignment = { wrapText: true, vertical: "top" };
        valCell.font = { size: 9 };

        projRow++;
      }
      projRow++; // blank row between steps
    }

    proyectoSheet.getColumn(1).width = 30;
    proyectoSheet.getColumn(2).width = 60;
    proyectoSheet.getColumn(3).width = 20;

    // ====================== METADATA sheet ======================
    const metaSheet = workbook.addWorksheet("METADATA");

    metaSheet.mergeCells("A1:B1");
    const metaTitleCell = metaSheet.getCell("A1");
    metaTitleCell.value = "Metadata de la Evaluacion";
    metaTitleCell.font = { bold: true, size: 14, color: { argb: WHITE_ARGB } };
    metaTitleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: BRAND_BLUE_ARGB },
    };
    metaTitleCell.alignment = { horizontal: "center", vertical: "middle" };
    metaSheet.getRow(1).height = 28;

    const metaData: [string, string][] = [
      ["ID del Proyecto", project.id],
      ["ID de la Evaluacion", projectScore.id],
      ["ID de la Rubrica", projectScore.rubric_id],
      ["Tipo de Evaluador", projectScore.evaluator_type],
      [
        "Fecha de Creacion (Proyecto)",
        new Date(project.created_at).toLocaleString("es-CO"),
      ],
      [
        "Fecha de Envio",
        project.submitted_at
          ? new Date(project.submitted_at).toLocaleString("es-CO")
          : "No enviado",
      ],
      [
        "Fecha de Evaluacion",
        new Date(projectScore.created_at).toLocaleString("es-CO"),
      ],
      ["Reporte Generado", new Date().toLocaleString("es-CO")],
    ];

    if (scoringJob) {
      metaData.push(
        ["ID del Job de Scoring", scoringJob.id],
        ["Version del Motor", scoringJob.engine_version],
        ["Estado del Job", scoringJob.status],
        [
          "Inicio del Procesamiento",
          scoringJob.started_at
            ? new Date(scoringJob.started_at).toLocaleString("es-CO")
            : "—",
        ],
        [
          "Fin del Procesamiento",
          scoringJob.completed_at
            ? new Date(scoringJob.completed_at).toLocaleString("es-CO")
            : "—",
        ],
      );

      // Add model info from config if available
      const config = scoringJob.config as Record<string, unknown> | null;
      if (config) {
        if (config.model) metaData.push(["Modelo IA", String(config.model)]);
        if (config.prompt_tokens)
          metaData.push(["Tokens de Prompt", String(config.prompt_tokens)]);
        if (config.completion_tokens)
          metaData.push([
            "Tokens de Respuesta",
            String(config.completion_tokens),
          ]);
      }

      if (scoringJob.error_message) {
        metaData.push(["Mensaje de Error", scoringJob.error_message]);
      }
    }

    let metaRow = 3;
    for (const [label, value] of metaData) {
      const labelCell = metaSheet.getCell(`A${metaRow}`);
      labelCell.value = label;
      labelCell.font = { bold: true, size: 10 };

      const valueCell = metaSheet.getCell(`B${metaRow}`);
      valueCell.value = value;
      valueCell.font = { size: 10 };
      valueCell.alignment = { wrapText: true };

      metaRow++;
    }

    metaSheet.getColumn(1).width = 30;
    metaSheet.getColumn(2).width = 55;

    // ------------------------------------------------------------------
    // Return XLSX
    // ------------------------------------------------------------------
    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="polytech-reporte-${projectId}.xlsx"`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error interno del servidor";
    console.error("[reports/xlsx] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function translateStatus(status: string): string {
  const map: Record<string, string> = {
    draft: "Borrador",
    submitted: "Enviado",
    under_review: "En revision",
    scored: "Evaluado",
    approved: "Aprobado",
    rejected: "Rechazado",
  };
  return map[status] ?? status;
}
