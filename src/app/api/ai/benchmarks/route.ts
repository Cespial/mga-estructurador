import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";

/**
 * GET /api/ai/benchmarks?convocatoria_id=xxx&submission_id=yyy
 *
 * Returns benchmark statistics for a convocatoria:
 * - Average, median, top quartile scores
 * - Position of the requesting municipality's submission
 * - Per-criteria aggregates
 */
export async function GET(request: Request) {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const convocatoriaId = searchParams.get("convocatoria_id");
  const submissionId = searchParams.get("submission_id");

  if (!convocatoriaId) {
    return NextResponse.json(
      { error: "convocatoria_id es requerido" },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  // Fetch all evaluations for this convocatoria
  const { data: evaluations, error } = await supabase
    .from("evaluations")
    .select("submission_id, etapa_id, total_score, max_score, scores_json")
    .eq("convocatoria_id", convocatoriaId);

  if (error || !evaluations || evaluations.length === 0) {
    return NextResponse.json({
      available: false,
      message: "No hay evaluaciones disponibles para esta convocatoria",
    });
  }

  // Aggregate total scores per submission (sum across etapas)
  const submissionScores = new Map<string, number>();
  const submissionMaxScores = new Map<string, number>();

  for (const evaluation of evaluations) {
    const current = submissionScores.get(evaluation.submission_id) ?? 0;
    submissionScores.set(
      evaluation.submission_id,
      current + (evaluation.total_score ?? 0),
    );
    const currentMax = submissionMaxScores.get(evaluation.submission_id) ?? 0;
    submissionMaxScores.set(
      evaluation.submission_id,
      currentMax + (evaluation.max_score ?? 0),
    );
  }

  // Convert to percentage scores
  const percentScores: number[] = [];
  const submissionPctMap = new Map<string, number>();

  for (const [subId, score] of submissionScores.entries()) {
    const maxScore = submissionMaxScores.get(subId) ?? 100;
    const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    percentScores.push(pct);
    submissionPctMap.set(subId, pct);
  }

  percentScores.sort((a, b) => a - b);

  const count = percentScores.length;
  const average = Math.round(
    percentScores.reduce((a, b) => a + b, 0) / count,
  );
  const median =
    count % 2 === 0
      ? Math.round((percentScores[count / 2 - 1] + percentScores[count / 2]) / 2)
      : percentScores[Math.floor(count / 2)];
  const topQuartile = percentScores[Math.floor(count * 0.75)] ?? 0;

  // Current submission position
  let position: number | null = null;
  let myScore: number | null = null;
  let percentile: number | null = null;

  if (submissionId && submissionPctMap.has(submissionId)) {
    myScore = submissionPctMap.get(submissionId) ?? 0;
    const belowCount = percentScores.filter((s) => s < myScore!).length;
    position = count - belowCount; // 1 = best
    percentile = Math.round((belowCount / count) * 100);
  }

  // Per-criteria breakdown (aggregate across all evaluations)
  const criteriaMap = new Map<
    string,
    { campo_nombre: string; scores: number[]; max_score: number }
  >();

  for (const evaluation of evaluations) {
    const scores = evaluation.scores_json as Array<{
      campo_id: string;
      campo_nombre: string;
      score: number;
      max_score: number;
    }> ?? [];

    for (const s of scores) {
      if (!criteriaMap.has(s.campo_id)) {
        criteriaMap.set(s.campo_id, {
          campo_nombre: s.campo_nombre,
          scores: [],
          max_score: s.max_score,
        });
      }
      criteriaMap.get(s.campo_id)!.scores.push(s.score);
    }
  }

  const criteriaStats = Array.from(criteriaMap.entries()).map(
    ([campo_id, data]) => ({
      campo_id,
      campo_nombre: data.campo_nombre,
      average: Math.round(
        (data.scores.reduce((a, b) => a + b, 0) / data.scores.length) * 10,
      ) / 10,
      max_score: data.max_score,
      count: data.scores.length,
    }),
  );

  return NextResponse.json({
    available: true,
    summary: {
      total_submissions: count,
      average,
      median,
      top_quartile: topQuartile,
      min: percentScores[0],
      max: percentScores[count - 1],
    },
    my_position: submissionId
      ? { score: myScore, position, percentile, of: count }
      : null,
    distribution: percentScores,
    criteria: criteriaStats,
  });
}
