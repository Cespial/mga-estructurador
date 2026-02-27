import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  Project,
  ProjectScore,
  CriteriaScore,
  RubricCriterion,
  Rubric,
  ProjectForm,
  Organization,
} from "@/lib/types/database";

// Publitec brand orange
const BRAND_ORANGE: [number, number, number] = [245, 124, 0];
const DARK_TEXT: [number, number, number] = [33, 33, 33];
const GRAY_TEXT: [number, number, number] = [100, 100, 100];

/**
 * GET /api/reports/[projectId]/pdf
 *
 * Generates a professional PDF report for a scored project.
 * Includes project info, criteria scores table, totals, and AI summary.
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

    const scores = (criteriaScores ?? []) as CriteriaScore[];
    const criteria = (rubricCriteria ?? []) as RubricCriterion[];
    const projectForms = (forms ?? []) as ProjectForm[];

    // Build criterion lookup
    const criterionMap = new Map(criteria.map((c) => [c.id, c]));

    // ------------------------------------------------------------------
    // Generate PDF
    // ------------------------------------------------------------------
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = margin;

    // ---- Header bar ----
    doc.setFillColor(...BRAND_ORANGE);
    doc.rect(0, 0, pageWidth, 28, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("PUBLITEC", margin, 12);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Reporte de Evaluacion de Proyecto", margin, 20);

    doc.setFontSize(8);
    doc.text(
      `Generado: ${new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}`,
      pageWidth - margin,
      20,
      { align: "right" },
    );

    y = 36;

    // ---- Project info section ----
    doc.setTextColor(...DARK_TEXT);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Informacion del Proyecto", margin, y);
    y += 2;

    doc.setDrawColor(...BRAND_ORANGE);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY_TEXT);

    const infoLines: [string, string][] = [
      ["Titulo", project.title],
      [
        "Organizacion",
        project.organizations?.name ?? "No especificada",
      ],
      ["Estado", translateStatus(project.status)],
      [
        "Presupuesto solicitado",
        project.budget_requested
          ? `$${project.budget_requested.toLocaleString("es-CO")}`
          : "No especificado",
      ],
      [
        "Fecha de envio",
        project.submitted_at
          ? new Date(project.submitted_at).toLocaleDateString("es-CO")
          : "No enviado",
      ],
    ];

    for (const [label, value] of infoLines) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...DARK_TEXT);
      doc.text(`${label}:`, margin, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...GRAY_TEXT);
      doc.text(value, margin + 50, y);
      y += 5;
    }

    y += 4;

    // ---- Scores table ----
    doc.setTextColor(...DARK_TEXT);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Detalle de Evaluacion", margin, y);
    y += 2;

    doc.setDrawColor(...BRAND_ORANGE);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;

    const tableHead = [
      [
        "Criterio",
        "Puntaje",
        "Maximo",
        "Peso",
        "Ponderado",
        "Justificacion",
      ],
    ];

    const tableBody = scores.map((s) => {
      const criterion = criterionMap.get(s.rubric_criteria_id);
      return [
        criterion?.criterion_name ?? "—",
        String(s.score),
        String(s.max_score),
        `${((criterion?.weight ?? 0) * 100).toFixed(0)}%`,
        String(s.weighted_score?.toFixed(2) ?? "—"),
        truncate(s.justification ?? "—", 80),
      ];
    });

    autoTable(doc, {
      startY: y,
      head: tableHead,
      body: tableBody,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2,
        textColor: DARK_TEXT,
      },
      headStyles: {
        fillColor: BRAND_ORANGE,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { halign: "center", cellWidth: 15 },
        2: { halign: "center", cellWidth: 15 },
        3: { halign: "center", cellWidth: 15 },
        4: { halign: "center", cellWidth: 18 },
        5: { cellWidth: "auto" },
      },
      margin: { left: margin, right: margin },
    });

    // Get Y position after the table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable?.finalY ?? y + 40;
    y += 8;

    // ---- Totals section ----
    // Check if we need a new page
    if (y > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage();
      y = margin;
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK_TEXT);
    doc.text("Resultados Totales", margin, y);
    y += 6;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    doc.text(
      `Puntaje Total: ${projectScore.total_score ?? 0} / ${rubric?.total_score ?? "—"}`,
      margin,
      y,
    );
    y += 5;
    doc.text(
      `Puntaje Ponderado: ${projectScore.total_weighted_score?.toFixed(2) ?? "—"}`,
      margin,
      y,
    );
    y += 10;

    // ---- AI Summary ----
    if (projectScore.ai_summary) {
      if (y > doc.internal.pageSize.getHeight() - 50) {
        doc.addPage();
        y = margin;
      }

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...DARK_TEXT);
      doc.text("Resumen de la Evaluacion (IA)", margin, y);
      y += 2;

      doc.setDrawColor(...BRAND_ORANGE);
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...GRAY_TEXT);

      const summaryLines = doc.splitTextToSize(
        projectScore.ai_summary,
        pageWidth - margin * 2,
      );
      doc.text(summaryLines, margin, y);
      y += summaryLines.length * 4 + 6;
    }

    // ---- Project form data summary ----
    if (projectForms.length > 0) {
      if (y > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        y = margin;
      }

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...DARK_TEXT);
      doc.text("Datos del Formulario", margin, y);
      y += 2;

      doc.setDrawColor(...BRAND_ORANGE);
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;

      for (const form of projectForms) {
        if (y > doc.internal.pageSize.getHeight() - 30) {
          doc.addPage();
          y = margin;
        }

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...DARK_TEXT);
        doc.text(`Paso ${form.step_number}: ${form.step_name}`, margin, y);
        y += 4;

        doc.setFont("helvetica", "normal");
        doc.setTextColor(...GRAY_TEXT);
        doc.setFontSize(8);

        for (const [key, value] of Object.entries(form.form_data ?? {})) {
          if (y > doc.internal.pageSize.getHeight() - 15) {
            doc.addPage();
            y = margin;
          }

          const displayValue =
            value !== null && value !== undefined && value !== ""
              ? truncate(String(value), 100)
              : "(sin diligenciar)";

          const line = `${key}: ${displayValue}`;
          const wrappedLines = doc.splitTextToSize(
            line,
            pageWidth - margin * 2 - 5,
          );
          doc.text(wrappedLines, margin + 3, y);
          y += wrappedLines.length * 3.5 + 1;
        }
        y += 3;
      }
    }

    // ---- Footer ----
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Publitec - Reporte generado automaticamente | Pagina ${i} de ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: "center" },
      );
    }

    // ------------------------------------------------------------------
    // Return PDF
    // ------------------------------------------------------------------
    const pdfBuffer = doc.output("arraybuffer");

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="publitec-reporte-${projectId}.pdf"`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error interno del servidor";
    console.error("[reports/pdf] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}

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
