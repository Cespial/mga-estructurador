import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { createAnthropicAdapter } from "@/lib/ai/adapter";
import type { EvaluationScore } from "@/lib/types/database";

/**
 * POST /api/reports/[convocatoriaId]/ai-report
 *
 * Generates an AI executive report for a complete convocatoria
 * with comparative analysis across all municipalities.
 * Results are cached in convocatoria_reports table.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const profile = await getProfile();
  if (!profile || profile.role !== "entidad_admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id: convocatoriaId } = await params;

  const supabase = await createClient();

  // Check cache first (reports generated today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { data: cached } = await supabase
    .from("convocatoria_reports")
    .select("*")
    .eq("convocatoria_id", convocatoriaId)
    .eq("report_type", "ai_executive")
    .gte("created_at", today.toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (cached) {
    return NextResponse.json({
      report: cached.content_json,
      cached: true,
      generated_at: cached.created_at,
    });
  }

  // Fetch convocatoria
  const { data: conv } = await supabase
    .from("convocatorias")
    .select("nombre, descripcion, estado, fecha_cierre")
    .eq("id", convocatoriaId)
    .single();

  if (!conv) {
    return NextResponse.json(
      { error: "Convocatoria no encontrada" },
      { status: 404 },
    );
  }

  // Fetch submissions with municipio info
  const { data: submissions } = await supabase
    .from("submissions")
    .select("id, municipio_id, progress, data_json, updated_at")
    .eq("convocatoria_id", convocatoriaId);

  // Fetch evaluations
  const { data: evaluations } = await supabase
    .from("evaluations")
    .select("*")
    .eq("convocatoria_id", convocatoriaId);

  // Fetch municipio names
  const munIds = [
    ...new Set((submissions ?? []).map((s) => s.municipio_id)),
  ];
  const { data: municipios } = await supabase
    .from("municipios")
    .select("id, nombre, departamento")
    .in("id", munIds.length > 0 ? munIds : ["_none_"]);

  const munMap = new Map(
    (municipios ?? []).map((m) => [m.id, m]),
  );

  // Build summary data for the LLM
  const projectSummaries = (submissions ?? []).map((sub) => {
    const mun = munMap.get(sub.municipio_id);
    const subEvals = (evaluations ?? []).filter(
      (e) => e.submission_id === sub.id,
    );

    const totalScore = subEvals.reduce(
      (sum, e) => sum + e.total_score,
      0,
    );
    const maxScore = subEvals.reduce(
      (sum, e) => sum + e.max_score,
      0,
    );

    const criterioScores: Array<{ campo: string; score: number; max: number }> = [];
    for (const ev of subEvals) {
      const scores = ev.scores_json as EvaluationScore[];
      if (!scores) continue;
      for (const s of scores) {
        criterioScores.push({
          campo: s.campo_nombre,
          score: s.score,
          max: s.max_score,
        });
      }
    }

    return {
      municipio: mun?.nombre ?? "Desconocido",
      departamento: mun?.departamento ?? "",
      progreso: sub.progress,
      puntaje_total: totalScore,
      puntaje_maximo: maxScore,
      porcentaje: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
      criterios: criterioScores,
    };
  });

  const adapter = createAnthropicAdapter();
  const startMs = Date.now();

  const response = await adapter.chat([
    {
      role: "system",
      content: `Eres un analista experto en evaluacion de proyectos de inversion publica en Colombia.
Genera un informe ejecutivo completo en formato JSON con la siguiente estructura:

{
  "titulo": "Informe de Convocatoria: [nombre]",
  "resumen_ejecutivo": "Parrafo de 3-5 oraciones resumiendo el estado general.",
  "estadisticas": {
    "total_municipios": number,
    "promedio_progreso": number,
    "promedio_puntaje": number,
    "municipios_completados": number
  },
  "evaluacion_por_municipio": [
    {
      "municipio": "string",
      "puntaje": number,
      "fortalezas": ["string"],
      "debilidades": ["string"],
      "recomendacion": "string"
    }
  ],
  "analisis_comparativo": {
    "mejor_municipio": "string",
    "areas_fuertes": ["criterios donde la mayoria destaca"],
    "areas_debiles": ["criterios donde la mayoria falla"],
    "brechas": "Descripcion de las brechas entre los mejores y los peores"
  },
  "recomendaciones_futuras": [
    "Recomendacion accionable 1",
    "Recomendacion accionable 2"
  ]
}

Se conciso pero completo. Basa tu analisis estrictamente en los datos proporcionados.`,
    },
    {
      role: "user",
      content: `Convocatoria: ${conv.nombre}
Descripcion: ${conv.descripcion ?? "N/A"}
Estado: ${conv.estado}
Fecha cierre: ${conv.fecha_cierre ?? "N/A"}

Datos de municipios (${projectSummaries.length} proyectos):

${JSON.stringify(projectSummaries, null, 2)}

Genera el informe ejecutivo.`,
    },
  ]);

  const durationMs = Date.now() - startMs;

  // Parse report
  let reportJson;
  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    reportJson = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: response.content };
  } catch {
    reportJson = { raw: response.content };
  }

  // Cache the report
  await supabase.from("convocatoria_reports").insert({
    convocatoria_id: convocatoriaId,
    report_type: "ai_executive",
    content_json: reportJson,
    generated_by: profile.id,
    llm_model: response.model,
    duration_ms: durationMs,
  });

  return NextResponse.json({
    report: reportJson,
    cached: false,
    model: response.model,
    duration_ms: durationMs,
  });
}
