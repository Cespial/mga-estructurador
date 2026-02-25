import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type {
  Convocatoria,
  MgaTemplate,
  Submission,
  Municipio,
  Evaluation,
  EvaluationScore,
} from "@/lib/types/database";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id: submissionId } = await params;
  const supabase = await createClient();

  // Fetch submission
  const { data: sub } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", submissionId)
    .single();

  if (!sub) {
    return NextResponse.json({ error: "Submission no encontrada" }, { status: 404 });
  }

  const submission = sub as Submission;

  // Auth: municipio_user only their own, entidad_admin any in their tenant
  if (profile.role === "municipio_user") {
    if (submission.municipio_id !== profile.municipio_id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
  } else if (profile.role === "entidad_admin") {
    const { data: conv } = await supabase
      .from("convocatorias")
      .select("tenant_id")
      .eq("id", submission.convocatoria_id)
      .single();
    if (!conv || conv.tenant_id !== profile.tenant_id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
  } else {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // Fetch related data in parallel
  const [convResult, tmplResult, muniResult, evalsResult] = await Promise.all([
    supabase
      .from("convocatorias")
      .select("*")
      .eq("id", submission.convocatoria_id)
      .single(),
    supabase
      .from("mga_templates")
      .select("*")
      .eq("convocatoria_id", submission.convocatoria_id)
      .maybeSingle(),
    supabase
      .from("municipios")
      .select("*")
      .eq("id", submission.municipio_id)
      .single(),
    supabase
      .from("evaluations")
      .select("*")
      .eq("submission_id", submissionId),
  ]);

  const convocatoria = convResult.data as Convocatoria | null;
  const template = tmplResult.data as MgaTemplate | null;
  const municipio = muniResult.data as Municipio | null;
  const evaluations = (evalsResult.data ?? []) as Evaluation[];

  const etapas = template?.etapas_json ?? [];
  const evalMap = new Map<string, Evaluation>();
  for (const ev of evaluations) {
    evalMap.set(ev.etapa_id, ev);
  }

  // Generate PDF
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  function checkPageBreak(needed: number) {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  }

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(convocatoria?.nombre ?? "Submission", margin, y);
  y += 10;

  // Municipio info
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  if (municipio) {
    doc.text(
      `Municipio: ${municipio.nombre}, ${municipio.departamento}`,
      margin,
      y,
    );
    y += 6;
  }

  doc.text(`Progreso: ${Math.round(submission.progress)}%`, margin, y);
  y += 6;

  const dateStr = new Date(submission.updated_at).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(`Fecha: ${dateStr}`, margin, y);
  y += 12;

  // Draw a separator line
  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Per-etapa content
  for (const etapa of etapas) {
    checkPageBreak(30);

    // Etapa header
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`${etapa.orden}. ${etapa.nombre}`, margin, y);
    y += 8;

    // Campos with values
    doc.setFontSize(10);
    for (const campo of etapa.campos) {
      checkPageBreak(20);
      doc.setFont("helvetica", "bold");
      doc.text(`${campo.nombre}:`, margin, y);
      y += 5;

      doc.setFont("helvetica", "normal");
      const value = String(submission.data_json[campo.id] ?? "").trim();
      if (value) {
        const lines = doc.splitTextToSize(value, contentWidth);
        for (const line of lines) {
          checkPageBreak(6);
          doc.text(line, margin, y);
          y += 5;
        }
      } else {
        doc.setTextColor(150);
        doc.text("(sin completar)", margin, y);
        doc.setTextColor(0);
        y += 5;
      }
      y += 3;
    }

    // Evaluation for this etapa
    const evaluation = evalMap.get(etapa.id);
    if (evaluation) {
      checkPageBreak(25);
      y += 3;
      doc.setFillColor(245, 243, 255);
      doc.rect(margin, y - 4, contentWidth, 8, "F");
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(79, 70, 229);
      doc.text(
        `Evaluacion: ${Math.round(evaluation.total_score)} / ${evaluation.max_score} pts`,
        margin + 2,
        y + 1,
      );
      doc.setTextColor(0);
      y += 10;

      // Per-criterio breakdown
      if (evaluation.scores_json?.length > 0) {
        doc.setFontSize(9);
        for (const s of evaluation.scores_json as EvaluationScore[]) {
          checkPageBreak(12);
          doc.setFont("helvetica", "normal");
          doc.text(`- ${s.campo_nombre}: ${s.score}/${s.max_score}`, margin + 4, y);
          y += 5;
          if (s.justificacion) {
            const justLines = doc.splitTextToSize(
              s.justificacion,
              contentWidth - 8,
            );
            doc.setTextColor(100);
            for (const jl of justLines) {
              checkPageBreak(5);
              doc.text(jl, margin + 8, y);
              y += 4;
            }
            doc.setTextColor(0);
            y += 2;
          }
        }
      }

      // Recomendaciones
      if (evaluation.recomendaciones.length > 0) {
        checkPageBreak(15);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Recomendaciones:", margin + 4, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        for (const rec of evaluation.recomendaciones) {
          checkPageBreak(10);
          const recLines = doc.splitTextToSize(`• ${rec}`, contentWidth - 8);
          for (const rl of recLines) {
            checkPageBreak(5);
            doc.text(rl, margin + 4, y);
            y += 5;
          }
        }
      }
    }

    y += 8;
  }

  // Output
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  const safeName = (municipio?.nombre ?? "submission")
    .replace(/[^a-zA-Z0-9-]/g, "_")
    .toLowerCase();

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}_mga.pdf"`,
    },
  });
}
