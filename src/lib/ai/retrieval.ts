import { createClient } from "@/lib/supabase/server";
import { generateQueryEmbedding } from "./embeddings";

export interface RetrievedChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  chunk_text: string;
  file_name: string;
  similarity: number;
}

/**
 * Retrieves the most relevant document chunks for a given query,
 * isolated by convocatoria_id (multi-tenant RAG).
 */
export async function retrieveContext(
  convocatoriaId: string,
  query: string,
  topK: number = 5,
  threshold: number = 0.7,
): Promise<RetrievedChunk[]> {
  // 1. Generate query embedding
  const queryEmbedding = await generateQueryEmbedding(query);

  // 2. Call the match_embeddings function via Supabase RPC
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("match_embeddings", {
    query_embedding: JSON.stringify(queryEmbedding),
    p_convocatoria_id: convocatoriaId,
    match_count: topK,
    match_threshold: threshold,
  });

  if (error) {
    console.error("Error in match_embeddings RPC:", error);
    return [];
  }

  return (data ?? []) as RetrievedChunk[];
}
