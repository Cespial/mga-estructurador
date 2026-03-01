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

export async function POST(request: Request) {
  const startTime = Date.now();

  // 1. Auth check
  const profile = await getProfile();
  if (!profile || profile.role !== "entidad_admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // 2. Parse request
  let body: { submission_id: string; etapa_id: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request inválido" }, { status: 400 });
  }

  if (!body.submission_id || !body.etapa_id) {
    return NextResponse.json(
      { error: "submission_id y etapa_id requeridos" },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  // 3. Fetch submission
  const { data: sub } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", body.submission_id)
    .single();

  if (!sub) {
    return NextResponse.json(
      { error: "Submission no encontrada" },
      { status: 404 },
    );
  }
  const submission = sub as Submission;

  // 4. Fetch rubric
  const { data: rub } = await supabase
    .from("rubrics")
    .select("*")
    .eq("convocatoria_id", submission.convocatoria_id)
    .single();

  if (!rub) {
    return NextResponse.json(
      { error: "No hay rúbrica definida para esta convocatoria" },
      { status: 404 },
    );
  }
  const rubric = rub as Rubric;

  // 5. Fetch template to get etapa info
  const { data: tmpl } = await supabase
    .from("mga_templates")
    .select("*")
    .eq("convocatoria_id", submission.convocatoria_id)
    .single();

  if (!tmpl) {
    return NextResponse.json(
      { error: "Plantilla MGA no encontrada" },
      { status: 404 },
    );
  }
  const template = tmpl as MgaTemplate;
  const etapa = template.etapas_json.find(
    (e: MgaEtapa) => e.id === body.etapa_id,
  );

  if (!etapa) {
    return NextResponse.json(
      { error: "Etapa no encontrada" },
      { status: 404 },
    );
  }

  // 6. Filter criteria for this etapa's campos
  const etapaCampoIds = new Set(etapa.campos.map((c) => c.id));
  const relevantCriteria = rubric.criterios_json.filter(
    (c: RubricCriterio) => etapaCampoIds.has(c.campo_id),
  );

  if (relevantCriteria.length === 0) {
    return NextResponse.json(
      { error: "No hay criterios de evaluación para esta etapa" },
      { status: 400 },
    );
  }

  // 7. Build evaluation prompt and call LLM
  const scores: EvaluationScore[] = [];
  const recomendaciones: string[] = [];
  let llmModel = "unknown";

  try {
    const adapter = createLlmAdapter();

    const systemPrompt = `Eres un evaluador experto de proyectos MGA (Metodología General Ajustada) para inversión pública en Colombia.

Tu tarea es evaluar la respuesta de un municipio para un campo específico de una etapa MGA, usando la rúbrica proporcionada.

Responde SIEMPRE en formato JSON válido con esta estructura exacta:
{
  "score": <número del nivel asignado>,
  "justificacion": "<explicación breve de por qué se asignó este score>",
  "recomendacion": "<recomendación específica para mejorar, o null si el score es máximo>"
}`;

    for (const criterio of relevantCriteria) {
      const campo = etapa.campos.find((c) => c.id === criterio.campo_id);
      const campoValue = submission.data_json[criterio.campo_id] ?? "";
      const campoNombre = campo?.nombre ?? criterio.campo_id;

      const nivelesText = criterio.niveles
        .map(
          (n) => `  - Score ${n.score} (${n.label}): ${n.descripcion}`,
        )
        .join("\n");

      const maxScore = Math.max(...criterio.niveles.map((n) => n.score));

      // RAG: retrieve reference documents for this criterion
      let ragSection = "";
      try {
        const ragQuery = `${criterio.descripcion} ${campoNombre}`;
        const ragChunks = await retrieveContext(submission.convocatoria_id, ragQuery, 3, 0.7);
        if (ragChunks.length > 0) {
          ragSection = `\n\n<documentos_referencia>\n${ragChunks.map((c, i) => `[${i + 1}] ${c.file_name}: ${c.chunk_text}`).join("\n\n")}\n</documentos_referencia>\n\nUsa estos documentos como referencia para evaluar si la respuesta es coherente con los requisitos de la convocatoria.`;
        }
      } catch {
        // best-effort
      }

      const userPrompt = `<criterio>
Criterio: ${criterio.descripcion}
Campo: ${campoNombre}
Peso: ${criterio.peso}

Niveles de evaluación:
${nivelesText}
</criterio>

<respuesta_municipio>
${campoValue.trim() || "(Campo vacío — el municipio no ha respondido)"}
</respuesta_municipio>${ragSection}

Evalúa la respuesta del municipio según el criterio y los niveles definidos.
Responde ÚNICAMENTE con el JSON especificado.`;

      const llmResponse = await adapter.chat([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ]);
      llmModel = llmResponse.model;

      let parsed;
      try {
        parsed = JSON.parse(llmResponse.content);
      } catch {
        parsed = { score: 1, justificacion: "Error al evaluar", recomendacion: null };
      }

      scores.push({
        campo_id: criterio.campo_id,
        campo_nombre: campoNombre,
        score: parsed.score ?? 1,
        max_score: maxScore,
        justificacion: parsed.justificacion ?? "",
      });

      if (parsed.recomendacion) {
        recomendaciones.push(`[${campoNombre}] ${parsed.recomendacion}`);
      }
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al evaluar";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // 8. Calculate totals (weighted)
  const totalWeight = relevantCriteria.reduce(
    (sum: number, c: RubricCriterio) => sum + c.peso,
    0,
  );
  const weightedScore = relevantCriteria.reduce(
    (sum: number, c: RubricCriterio, i: number) => {
      const maxScore = Math.max(...c.niveles.map((n) => n.score));
      const normalizedScore = maxScore > 0 ? scores[i].score / maxScore : 0;
      return sum + normalizedScore * c.peso;
    },
    0,
  );
  const totalScore = totalWeight > 0
    ? Math.round((weightedScore / totalWeight) * 100 * 100) / 100
    : 0;

  const durationMs = Date.now() - startTime;

  // 9. Upsert evaluation
  const { data: existingEval } = await supabase
    .from("evaluations")
    .select("id")
    .eq("submission_id", body.submission_id)
    .eq("etapa_id", body.etapa_id)
    .single();

  const evalData = {
    submission_id: body.submission_id,
    convocatoria_id: submission.convocatoria_id,
    municipio_id: submission.municipio_id,
    etapa_id: body.etapa_id,
    scores_json: scores,
    total_score: totalScore,
    max_score: 100,
    recomendaciones,
    evaluated_by: profile.id,
    llm_model: llmModel,
    duration_ms: durationMs,
  };

  if (existingEval) {
    await supabase
      .from("evaluations")
      .update(evalData)
      .eq("id", existingEval.id);
  } else {
    await supabase.from("evaluations").insert(evalData);
  }

  return NextResponse.json({
    total_score: totalScore,
    scores,
    recomendaciones,
    _meta: { model: llmModel, duration_ms: durationMs },
  });
}
