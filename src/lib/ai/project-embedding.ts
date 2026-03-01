import { createClient } from "@/lib/supabase/server";
import { generateEmbedding } from "./embeddings";

/**
 * Generates and stores an embedding for a submission's etapa data.
 * Called lazily when wizard data is saved (background, non-blocking).
 */
export async function generateProjectEmbedding(
  submissionId: string,
  etapaId: string,
  dataJson: Record<string, string>,
): Promise<void> {
  // Concatenate all field values into a single text
  const values = Object.values(dataJson).filter(
    (v) => typeof v === "string" && v.trim().length > 0,
  );

  if (values.length === 0) return;

  const text = values.join("\n\n");

  try {
    const embedding = await generateEmbedding(text);
    if (!embedding || embedding.every((v) => v === 0)) return;

    const supabase = await createClient();

    // Upsert: delete existing embedding for this submission+etapa, then insert new one
    await supabase
      .from("project_embeddings")
      .delete()
      .eq("submission_id", submissionId)
      .eq("etapa_id", etapaId);

    await supabase.from("project_embeddings").insert({
      submission_id: submissionId,
      etapa_id: etapaId,
      embedding: JSON.stringify(embedding),
    });
  } catch (err) {
    // Non-critical — log and continue
    console.error("[project-embedding] Error generating embedding:", err);
  }
}

/**
 * Find similar submissions for a given query text within a convocatoria.
 */
export async function findSimilarSubmissions(
  queryText: string,
  convocatoriaId: string,
  topK: number = 5,
  threshold: number = 0.6,
): Promise<
  Array<{ submission_id: string; etapa_id: string; similarity: number }>
> {
  try {
    const queryEmbedding = await generateEmbedding(queryText);
    if (!queryEmbedding || queryEmbedding.every((v) => v === 0)) return [];

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("match_similar_submissions", {
      query_embedding: JSON.stringify(queryEmbedding),
      p_convocatoria_id: convocatoriaId,
      match_threshold: threshold,
      top_k: topK,
    });

    if (error) {
      console.error("[project-embedding] RPC error:", error);
      return [];
    }

    return (data ?? []) as Array<{
      submission_id: string;
      etapa_id: string;
      similarity: number;
    }>;
  } catch (err) {
    console.error("[project-embedding] Error finding similar:", err);
    return [];
  }
}
