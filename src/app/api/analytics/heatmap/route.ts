import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import type { EvaluationScore } from "@/lib/types/database";

/**
 * GET /api/analytics/heatmap?convocatoria_id=xxx
 *
 * Returns a matrix of municipios × criteria with scores,
 * plus AI-generated summary of patterns.
 */
export async function GET(request: Request) {
  const profile = await getProfile();
  if (!profile || profile.role !== "entidad_admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const convocatoriaId = searchParams.get("convocatoria_id");

  if (!convocatoriaId) {
    return NextResponse.json(
      { error: "convocatoria_id es requerido" },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  // Fetch evaluations with municipio info
  const { data: evaluations, error: evalError } = await supabase
    .from("evaluations")
    .select("*")
    .eq("convocatoria_id", convocatoriaId);

  if (evalError) {
    return NextResponse.json({ error: evalError.message }, { status: 500 });
  }

  if (!evaluations || evaluations.length === 0) {
    return NextResponse.json({
      matrix: [],
      municipios: [],
      criterios: [],
      summary: null,
    });
  }

  // Fetch municipio names
  const municipioIds = [...new Set(evaluations.map((e) => e.municipio_id))];
  const { data: municipios } = await supabase
    .from("municipios")
    .select("id, nombre, departamento")
    .in("id", municipioIds);

  const municipioMap = new Map(
    (municipios ?? []).map((m) => [m.id, m]),
  );

  // Extract all unique criterio names across evaluations
  const criterioSet = new Map<string, string>(); // campo_id → campo_nombre
  for (const ev of evaluations) {
    const scores = ev.scores_json as EvaluationScore[];
    if (!scores) continue;
    for (const s of scores) {
      if (!criterioSet.has(s.campo_id)) {
        criterioSet.set(s.campo_id, s.campo_nombre);
      }
    }
  }

  const criterios = Array.from(criterioSet.entries()).map(([id, nombre]) => ({
    campo_id: id,
    campo_nombre: nombre,
  }));

  // Build matrix: for each municipio, aggregate scores across etapas per criterio
  const matrix: Array<{
    municipio_id: string;
    municipio_nombre: string;
    departamento: string;
    scores: Array<{
      campo_id: string;
      score: number | null;
      max_score: number;
      percentage: number | null;
    }>;
  }> = [];

  for (const munId of municipioIds) {
    const mun = municipioMap.get(munId);
    if (!mun) continue;

    const munEvals = evaluations.filter((e) => e.municipio_id === munId);
    const scoresByCriterio = new Map<
      string,
      { total: number; max: number; count: number }
    >();

    for (const ev of munEvals) {
      const scores = ev.scores_json as EvaluationScore[];
      if (!scores) continue;
      for (const s of scores) {
        const existing = scoresByCriterio.get(s.campo_id) ?? {
          total: 0,
          max: 0,
          count: 0,
        };
        existing.total += s.score;
        existing.max += s.max_score;
        existing.count += 1;
        scoresByCriterio.set(s.campo_id, existing);
      }
    }

    const scores = criterios.map((c) => {
      const data = scoresByCriterio.get(c.campo_id);
      if (!data || data.count === 0) {
        return { campo_id: c.campo_id, score: null, max_score: 0, percentage: null };
      }
      const avgScore = data.total / data.count;
      const avgMax = data.max / data.count;
      return {
        campo_id: c.campo_id,
        score: Math.round(avgScore * 10) / 10,
        max_score: Math.round(avgMax * 10) / 10,
        percentage:
          avgMax > 0 ? Math.round((avgScore / avgMax) * 100) : null,
      };
    });

    matrix.push({
      municipio_id: munId,
      municipio_nombre: mun.nombre,
      departamento: mun.departamento,
      scores,
    });
  }

  // Generate summary of patterns
  const weakCriterios: Array<{ campo_nombre: string; weakCount: number; total: number }> = [];
  for (const c of criterios) {
    let weakCount = 0;
    let total = 0;
    for (const row of matrix) {
      const s = row.scores.find((sc) => sc.campo_id === c.campo_id);
      if (s?.percentage !== null && s?.percentage !== undefined) {
        total++;
        if (s.percentage < 50) weakCount++;
      }
    }
    if (weakCount > 0) {
      weakCriterios.push({ campo_nombre: c.campo_nombre, weakCount, total });
    }
  }

  weakCriterios.sort((a, b) => b.weakCount - a.weakCount);

  const summaryParts: string[] = [];
  for (const wc of weakCriterios.slice(0, 3)) {
    summaryParts.push(
      `${wc.weakCount} de ${wc.total} municipios sacaron <50% en "${wc.campo_nombre}"`,
    );
  }

  return NextResponse.json({
    matrix,
    municipios: municipioIds.map((id) => municipioMap.get(id)).filter(Boolean),
    criterios,
    summary: summaryParts.length > 0
      ? `Patrones detectados: ${summaryParts.join(". ")}. Considere talleres de fortalecimiento en estas areas.`
      : "No se detectaron patrones de debilidad sistematica.",
  });
}
