import { createAdminClient } from "@/lib/supabase/admin";
import { createAnthropicAdapter } from "@/lib/ai/adapter";
import { buildScoringMessages } from "./scoring-prompt";
import { parseScoringResponse } from "./parse-scoring";
import type {
  Project,
  ProjectForm,
  PuBlitecConvocatoria,
  RubricCriterion,
  Rubric,
  ScoringJob,
  ProjectScore,
} from "@/lib/types/database";

const ENGINE_VERSION = "publitec-scoring-v1";

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

/**
 * Orchestrates the full scoring pipeline for a single project job:
 *
 * 1. Fetch project + forms + convocatoria + rubric + criteria
 * 2. Build a structured prompt with all project data and rubric criteria
 * 3. Call Claude to evaluate each criterion
 * 4. Parse response into criteria_scores
 * 5. Calculate weighted totals
 * 6. Update project_scores
 * 7. Mark job complete
 */
export async function scoreProject(jobId: string): Promise<void> {
  const supabase = createAdminClient();

  // ------------------------------------------------------------------
  // 0. Mark job as processing
  // ------------------------------------------------------------------
  const { data: job, error: jobError } = await supabase
    .from("scoring_jobs")
    .update({ status: "processing", started_at: new Date().toISOString() })
    .eq("id", jobId)
    .select("*, project_scores(*)")
    .single<ScoringJob & { project_scores: ProjectScore }>();

  if (jobError || !job) {
    throw new Error(`No se pudo obtener el scoring job ${jobId}: ${jobError?.message}`);
  }

  const projectScoreId = job.project_score_id;

  // Also set the project_score status to processing
  await supabase
    .from("project_scores")
    .update({ status: "processing" })
    .eq("id", projectScoreId);

  // ------------------------------------------------------------------
  // 1. Fetch all related data
  // ------------------------------------------------------------------
  const { projectScore, project, forms, convocatoria, rubric, criteria } =
    await fetchScoringData(supabase, projectScoreId);

  // ------------------------------------------------------------------
  // 2. Build prompt
  // ------------------------------------------------------------------
  const messages = buildScoringMessages({
    convocatoria,
    projectTitle: project.title,
    projectDescription: project.description,
    forms,
    criteria,
  });

  // ------------------------------------------------------------------
  // 3. Call Claude
  // ------------------------------------------------------------------
  const adapter = createAnthropicAdapter();
  const llmResponse = await adapter.chat(messages);

  // ------------------------------------------------------------------
  // 4. Parse response
  // ------------------------------------------------------------------
  const parsed = parseScoringResponse(llmResponse.content, criteria);

  // ------------------------------------------------------------------
  // 5. Calculate weighted totals and persist criteria_scores
  // ------------------------------------------------------------------
  const criteriaRows = parsed.criteria.map((c) => {
    const criterion = criteria.find((rc) => rc.id === c.criterion_id)!;
    const weightedScore = (c.score / c.max_score) * criterion.weight;

    return {
      project_score_id: projectScoreId,
      rubric_criteria_id: c.criterion_id,
      score: c.score,
      max_score: c.max_score,
      weight: criterion.weight,
      weighted_score: Math.round(weightedScore * 100) / 100,
      justification: c.justification,
      ai_rationale: c.rationale,
    };
  });

  const totalScore = criteriaRows.reduce((sum, r) => sum + r.score, 0);
  const totalWeightedScore = criteriaRows.reduce(
    (sum, r) => sum + (r.weighted_score ?? 0),
    0,
  );

  // Insert all criteria scores
  const { error: insertError } = await supabase
    .from("criteria_scores")
    .insert(criteriaRows);

  if (insertError) {
    throw new Error(
      `Error al insertar criteria_scores: ${insertError.message}`,
    );
  }

  // ------------------------------------------------------------------
  // 6. Update project_scores
  // ------------------------------------------------------------------
  const { error: scoreUpdateError } = await supabase
    .from("project_scores")
    .update({
      total_score: totalScore,
      total_weighted_score: Math.round(totalWeightedScore * 100) / 100,
      ai_summary: parsed.summary,
      status: "completed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectScoreId);

  if (scoreUpdateError) {
    throw new Error(
      `Error al actualizar project_scores: ${scoreUpdateError.message}`,
    );
  }

  // Also update project status to "scored"
  await supabase
    .from("projects")
    .update({ status: "scored", updated_at: new Date().toISOString() })
    .eq("id", project.id);

  // ------------------------------------------------------------------
  // 7. Mark job complete
  // ------------------------------------------------------------------
  await supabase
    .from("scoring_jobs")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      engine_version: ENGINE_VERSION,
      config: {
        model: llmResponse.model,
        prompt_tokens: llmResponse.usage.prompt_tokens,
        completion_tokens: llmResponse.usage.completion_tokens,
      },
    })
    .eq("id", jobId);
}

// ---------------------------------------------------------------------------
// Data fetching helper
// ---------------------------------------------------------------------------

interface ScoringData {
  projectScore: ProjectScore;
  project: Project;
  forms: ProjectForm[];
  convocatoria: PuBlitecConvocatoria;
  rubric: Rubric;
  criteria: RubricCriterion[];
}

async function fetchScoringData(
  supabase: ReturnType<typeof createAdminClient>,
  projectScoreId: string,
): Promise<ScoringData> {
  // Fetch project_score
  const { data: projectScore, error: psError } = await supabase
    .from("project_scores")
    .select("*")
    .eq("id", projectScoreId)
    .single<ProjectScore>();

  if (psError || !projectScore) {
    throw new Error(
      `No se encontro el project_score ${projectScoreId}: ${psError?.message}`,
    );
  }

  // Fetch project
  const { data: project, error: projError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectScore.project_id)
    .single<Project>();

  if (projError || !project) {
    throw new Error(
      `No se encontro el proyecto ${projectScore.project_id}: ${projError?.message}`,
    );
  }

  // Fetch project forms
  const { data: forms, error: formsError } = await supabase
    .from("project_forms")
    .select("*")
    .eq("project_id", project.id)
    .order("step_number", { ascending: true });

  if (formsError) {
    throw new Error(
      `Error al obtener formularios del proyecto: ${formsError.message}`,
    );
  }

  // Fetch convocatoria
  const { data: convocatoria, error: convError } = await supabase
    .from("convocatorias_v2")
    .select("*")
    .eq("id", project.convocatoria_id)
    .single<PuBlitecConvocatoria>();

  if (convError || !convocatoria) {
    throw new Error(
      `No se encontro la convocatoria ${project.convocatoria_id}: ${convError?.message}`,
    );
  }

  // Fetch rubric
  const { data: rubric, error: rubricError } = await supabase
    .from("rubrics_v2")
    .select("*")
    .eq("id", projectScore.rubric_id)
    .single<Rubric>();

  if (rubricError || !rubric) {
    throw new Error(
      `No se encontro la rubrica ${projectScore.rubric_id}: ${rubricError?.message}`,
    );
  }

  // Fetch criteria
  const { data: criteria, error: criteriaError } = await supabase
    .from("rubric_criteria")
    .select("*")
    .eq("rubric_id", rubric.id)
    .order("sort_order", { ascending: true });

  if (criteriaError) {
    throw new Error(
      `Error al obtener criterios de la rubrica: ${criteriaError.message}`,
    );
  }

  if (!criteria || criteria.length === 0) {
    throw new Error(
      `La rubrica ${rubric.id} no tiene criterios configurados.`,
    );
  }

  return {
    projectScore,
    project,
    forms: (forms ?? []) as ProjectForm[],
    convocatoria,
    rubric,
    criteria: criteria as RubricCriterion[],
  };
}
