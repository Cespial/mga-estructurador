import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { createLlmAdapter } from "@/lib/ai/adapter";
import { retrieveContext } from "@/lib/ai/retrieval";
import type {
  Submission,
  LegacyRubric as Rubric,
  RubricCriterio,
  MgaTemplate,
  MgaEtapa,
  EvaluationScore,
} from "@/lib/types/database";

interface EtapaResult {
  etapa_id: string;
  etapa_nombre: string;
  score: number;
  scores: (EvaluationScore & { recomendacion: string | null })[];
}

export async function POST(request: Request) {
  const startTime = Date.now();

  // 1. Auth check — accepts municipio_user
  const profile = await getProfile();
  if (!profile || profile.role !== "municipio_user") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // 2. Parse request
  let body: { submission_id: string; convocatoria_id: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request inválido" }, { status: 400 });
  }

  if (!body.submission_id || !body.convocatoria_id) {
    return NextResponse.json(
      { error: "submission_id y convocatoria_id requeridos" },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  // 3. Fetch submission and verify ownership via municipio_id
  const { data: sub } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", body.submission_id)
    .eq("convocatoria_id", body.convocatoria_id)
    .single();

  if (!sub) {
    return NextResponse.json(
      { error: "Submission no encontrada" },
      { status: 404 },
    );
  }
  const submission = sub as Submission;

  if (submission.municipio_id !== profile.municipio_id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // 4. Fetch rubric
  const { data: rub } = await supabase
    .from("rubrics")
    .select("*")
    .eq("convocatoria_id", body.convocatoria_id)
    .single();

  if (!rub) {
    return NextResponse.json(
      { error: "No hay rúbrica definida para esta convocatoria" },
      { status: 404 },
    );
  }
  const rubric = rub as Rubric;

  // 5. Fetch MGA template
  const { data: tmpl } = await supabase
    .from("mga_templates")
    .select("*")
    .eq("convocatoria_id", body.convocatoria_id)
    .single();

  if (!tmpl) {
    return NextResponse.json(
      { error: "Plantilla MGA no encontrada" },
      { status: 404 },
    );
  }
  const template = tmpl as MgaTemplate;

  // 6. For EACH etapa with rubric criteria, evaluate in batch (1 LLM call per etapa)
  const etapas: EtapaResult[] = [];
  const allRecomendaciones: string[] = [];
  let llmModel = "unknown";

  try {
    const adapter = createLlmAdapter();

    const systemPrompt = `Eres un evaluador experto de proyectos MGA (Metodología General Ajustada) para inversión pública en Colombia.

Tu tarea es evaluar TODAS las respuestas de un municipio para una etapa completa del proyecto MGA, usando la rúbrica proporcionada.

Responde SIEMPRE en formato JSON válido con esta estructura exacta:
{
  "criterios": [
    {
      "campo_id": "<id del campo evaluado>",
      "score": <número del nivel asignado>,
      "justificacion": "<explicación breve de por qué se asignó este score>",
      "recomendacion": "<recomendación específica para mejorar, o null si el score es máximo>"
    }
  ]
}

Evalúa TODOS los criterios proporcionados. Se preciso y constructivo en las recomendaciones.`;

    for (const etapa of template.etapas_json) {
      const etapaCampoIds = new Set(etapa.campos.map((c) => c.id));
      const relevantCriteria = rubric.criterios_json.filter(
        (c: RubricCriterio) => etapaCampoIds.has(c.campo_id),
      );

      if (relevantCriteria.length === 0) continue;

      // Build batch prompt with ALL criteria for this etapa
      const criteriosText = relevantCriteria
        .map((criterio: RubricCriterio) => {
          const campo = etapa.campos.find((c) => c.id === criterio.campo_id);
          const campoValue = submission.data_json[criterio.campo_id] ?? "";
          const campoNombre = campo?.nombre ?? criterio.campo_id;

          const nivelesText = criterio.niveles
            .map(
              (n) => `    - Score ${n.score} (${n.label}): ${n.descripcion}`,
            )
            .join("\n");

          return `<criterio campo_id="${criterio.campo_id}">
  Campo: ${campoNombre}
  Descripción del criterio: ${criterio.descripcion}
  Peso: ${criterio.peso}

  Niveles de evaluación:
${nivelesText}

  Respuesta del municipio:
  ${campoValue.trim() || "(Campo vacío — el municipio no ha respondido)"}
</criterio>`;
        })
        .join("\n\n");

      // RAG: retrieve reference documents for this etapa
      let ragSection = "";
      try {
        const ragQuery = `evaluacion ${etapa.nombre} requisitos criterios`;
        const ragChunks = await retrieveContext(body.convocatoria_id, ragQuery, 5, 0.65);
        if (ragChunks.length > 0) {
          ragSection = `\n\n<documentos_referencia>\nUsa estos documentos como contexto para evaluar si las respuestas cumplen con los requisitos de la convocatoria:\n\n${ragChunks.map((c, i) => `[${i + 1}] ${c.file_name}: ${c.chunk_text}`).join("\n\n")}\n</documentos_referencia>`;
        }
      } catch {
        // best-effort
      }

      const userPrompt = `Evalúa la siguiente etapa "${etapa.nombre}" con ${relevantCriteria.length} criterios.

${criteriosText}${ragSection}

Evalúa CADA criterio según sus niveles definidos. Responde ÚNICAMENTE con el JSON especificado.`;

      const llmResponse = await adapter.chat([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ]);
      llmModel = llmResponse.model;

      let parsed: { criterios: Array<{ campo_id: string; score: number; justificacion: string; recomendacion: string | null }> };
      try {
        parsed = JSON.parse(llmResponse.content);
      } catch {
        // Fallback: assign score 1 to all criteria in this etapa
        parsed = {
          criterios: relevantCriteria.map((c: RubricCriterio) => ({
            campo_id: c.campo_id,
            score: 1,
            justificacion: "Error al evaluar este criterio",
            recomendacion: null,
          })),
        };
      }

      // Map parsed results to scores
      const etapaScores: (EvaluationScore & { recomendacion: string | null })[] = [];
      for (const criterio of relevantCriteria) {
        const campo = etapa.campos.find((c) => c.id === criterio.campo_id);
        const campoNombre = campo?.nombre ?? criterio.campo_id;
        const maxScore = Math.max(...criterio.niveles.map((n) => n.score));
        const parsedCriterio = parsed.criterios?.find(
          (p) => p.campo_id === criterio.campo_id,
        );

        const score = parsedCriterio?.score ?? 1;
        const justificacion = parsedCriterio?.justificacion ?? "Sin evaluación";
        const recomendacion = parsedCriterio?.recomendacion ?? null;

        etapaScores.push({
          campo_id: criterio.campo_id,
          campo_nombre: campoNombre,
          score,
          max_score: maxScore,
          justificacion,
          recomendacion,
        });

        if (recomendacion) {
          allRecomendaciones.push(`[${campoNombre}] ${recomendacion}`);
        }
      }

      // Calculate weighted score for this etapa
      const totalWeight = relevantCriteria.reduce(
        (sum: number, c: RubricCriterio) => sum + c.peso,
        0,
      );
      const weightedScore = relevantCriteria.reduce(
        (sum: number, c: RubricCriterio) => {
          const maxScore = Math.max(...c.niveles.map((n) => n.score));
          const campoScore = etapaScores.find((s) => s.campo_id === c.campo_id)?.score ?? 0;
          const normalizedScore = maxScore > 0 ? campoScore / maxScore : 0;
          return sum + normalizedScore * c.peso;
        },
        0,
      );
      const etapaScore = totalWeight > 0
        ? Math.round((weightedScore / totalWeight) * 100 * 100) / 100
        : 0;

      etapas.push({
        etapa_id: etapa.id,
        etapa_nombre: etapa.nombre,
        score: etapaScore,
        scores: etapaScores,
      });
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al pre-evaluar";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // 7. Calculate total score across all etapas
  const allCriteria = rubric.criterios_json;
  const totalWeight = allCriteria.reduce(
    (sum: number, c: RubricCriterio) => sum + c.peso,
    0,
  );
  const allScores = etapas.flatMap((e) => e.scores);
  const totalWeightedScore = allCriteria.reduce(
    (sum: number, c: RubricCriterio) => {
      const scoreEntry = allScores.find((s) => s.campo_id === c.campo_id);
      if (!scoreEntry) return sum;
      const normalizedScore = scoreEntry.max_score > 0 ? scoreEntry.score / scoreEntry.max_score : 0;
      return sum + normalizedScore * c.peso;
    },
    0,
  );
  const totalScore = totalWeight > 0
    ? Math.round((totalWeightedScore / totalWeight) * 100 * 100) / 100
    : 0;

  // 8. Generate executive summary (1 extra LLM call)
  let resumen = `Tu proyecto sacaría ~${Math.round(totalScore)}/100.`;
  try {
    const adapter = createLlmAdapter();
    const summaryResponse = await adapter.chat([
      {
        role: "system",
        content: "Eres un asesor de proyectos MGA. Genera un resumen ejecutivo breve (2-3 oraciones) del estado del proyecto basado en los scores. Sé constructivo y específico. Responde solo con el texto del resumen, sin formato JSON.",
      },
      {
        role: "user",
        content: `Score total: ${totalScore}/100\n\nScores por etapa:\n${etapas.map((e) => `- ${e.etapa_nombre}: ${e.score}/100`).join("\n")}\n\nRecomendaciones:\n${allRecomendaciones.map((r, i) => `${i + 1}. ${r}`).join("\n")}`,
      },
    ]);
    resumen = summaryResponse.content;
  } catch {
    // Keep default summary if this call fails
  }

  const durationMs = Date.now() - startTime;

  // 9. Return results WITHOUT persisting to any table
  return NextResponse.json({
    total_score: totalScore,
    etapas,
    recomendaciones_generales: allRecomendaciones,
    resumen,
    _meta: { model: llmModel, duration_ms: durationMs },
  });
}
