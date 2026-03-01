import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { createLlmAdapter } from "@/lib/ai/adapter";
import { findSimilarSubmissions } from "@/lib/ai/project-embedding";

/**
 * POST /api/ai/compare-field
 *
 * Compares a field value from the current submission against a similar
 * high-scoring submission's same field. Returns anonymized comparison
 * with AI annotation explaining the reference project's strengths.
 *
 * Body: { convocatoria_id, submission_id, etapa_id, campo_id, campo_nombre, current_value }
 */
export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body: {
    convocatoria_id: string;
    submission_id: string;
    etapa_id: string;
    campo_id: string;
    campo_nombre: string;
    current_value: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body invalido" }, { status: 400 });
  }

  const { convocatoria_id, submission_id, etapa_id, campo_id, campo_nombre, current_value } = body;
  const supabase = await createClient();

  // Find similar submissions (excluding current one)
  const similar = await findSimilarSubmissions(
    current_value || campo_nombre,
    convocatoria_id,
    10,
    0.5,
  );

  const otherSubmissions = similar.filter(
    (s) => s.submission_id !== submission_id,
  );

  if (otherSubmissions.length === 0) {
    return NextResponse.json({
      available: false,
      message: "No hay proyectos similares evaluados para comparar",
    });
  }

  // Find one with evaluation scores (prefer highest scoring)
  let referenceSubmissionId: string | null = null;
  let referenceScore: number | null = null;

  for (const sub of otherSubmissions) {
    const { data: evaluation } = await supabase
      .from("evaluations")
      .select("total_score, scores_json")
      .eq("submission_id", sub.submission_id)
      .eq("etapa_id", etapa_id)
      .maybeSingle();

    if (evaluation && (referenceScore === null || evaluation.total_score > referenceScore)) {
      referenceSubmissionId = sub.submission_id;
      referenceScore = evaluation.total_score;
    }
  }

  if (!referenceSubmissionId) {
    return NextResponse.json({
      available: false,
      message: "No hay proyectos evaluados para comparar en esta etapa",
    });
  }

  // Fetch reference submission data
  const { data: refSubmission } = await supabase
    .from("submissions")
    .select("data_json")
    .eq("id", referenceSubmissionId)
    .single();

  const refData = (refSubmission?.data_json ?? {}) as Record<string, string>;
  const referenceValue = refData[campo_id] ?? "";

  if (!referenceValue.trim()) {
    return NextResponse.json({
      available: false,
      message: "El proyecto de referencia no tiene contenido para este campo",
    });
  }

  // Get evaluation score for this specific field
  const { data: refEvaluation } = await supabase
    .from("evaluations")
    .select("scores_json")
    .eq("submission_id", referenceSubmissionId)
    .eq("etapa_id", etapa_id)
    .maybeSingle();

  const fieldScore = (refEvaluation?.scores_json as Array<{ campo_id: string; score: number; max_score: number }> ?? []).find(
    (s) => s.campo_id === campo_id,
  );

  // Generate AI annotation
  let annotation = "";
  try {
    const adapter = createLlmAdapter();
    const response = await adapter.chat([
      {
        role: "system",
        content: "Eres un evaluador de proyectos MGA. Genera una anotacion corta (maximo 2 oraciones) explicando por que el texto de referencia es fuerte. No menciones nombres de municipios. Responde solo con la anotacion, sin formato JSON.",
      },
      {
        role: "user",
        content: `Campo: ${campo_nombre}\n\nTexto actual del usuario:\n"${current_value}"\n\nTexto del proyecto de referencia (score ${fieldScore?.score ?? "?"}/${fieldScore?.max_score ?? "?"}):\n"${referenceValue}"`,
      },
    ]);
    annotation = response.content;
  } catch {
    annotation = "Este proyecto de referencia obtuvo un score alto en este criterio.";
  }

  // Anonymize: replace specific municipality references
  const anonymizedReference = referenceValue
    .replace(/municipio\s+de\s+\w+/gi, "[Municipio referente]")
    .replace(/alcald[ií]a\s+de\s+\w+/gi, "[Entidad referente]");

  return NextResponse.json({
    available: true,
    reference_text: anonymizedReference,
    reference_score: fieldScore
      ? { score: fieldScore.score, max_score: fieldScore.max_score }
      : null,
    annotation,
    similarity: otherSubmissions[0]?.similarity ?? 0,
  });
}
