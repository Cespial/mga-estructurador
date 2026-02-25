import OpenAI from "openai";

const EMBEDDING_MODEL = "text-embedding-3-small";
const BATCH_SIZE = 100; // OpenAI allows up to 2048 inputs per request

/**
 * Generates embeddings for an array of text strings using OpenAI's embedding API.
 * Returns an array of 1536-dimensional vectors in the same order.
 */
export async function generateEmbeddings(
  texts: string[],
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
    });

    // Sort by index to ensure order matches input
    const sorted = response.data.sort((a, b) => a.index - b.index);
    for (const item of sorted) {
      allEmbeddings.push(item.embedding);
    }
  }

  return allEmbeddings;
}

/**
 * Generates a single embedding for a query string.
 */
export async function generateQueryEmbedding(
  query: string,
): Promise<number[]> {
  const [embedding] = await generateEmbeddings([query]);
  return embedding;
}
