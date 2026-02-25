const EMBEDDING_MODEL = "voyage-3-lite";
const BATCH_SIZE = 128;
const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";

/**
 * Generates embeddings using Voyage AI (Anthropic's recommended embedding service).
 * Returns an array of vectors in the same order as the input texts.
 * Falls back to a zero-vector if the API key is not configured (dev mode).
 */
export async function generateEmbeddings(
  texts: string[],
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const apiKey = process.env.VOYAGE_API_KEY ?? process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn("No VOYAGE_API_KEY or ANTHROPIC_API_KEY set — returning zero vectors");
    return texts.map(() => new Array(1024).fill(0));
  }

  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

    const response = await fetch(VOYAGE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: batch,
        input_type: "document",
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(
        `Voyage API error (${response.status}): ${(err as { detail?: string }).detail ?? response.statusText}`,
      );
    }

    const data = await response.json();
    const sorted = (data.data as { index: number; embedding: number[] }[]).sort(
      (a, b) => a.index - b.index,
    );
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
  const apiKey = process.env.VOYAGE_API_KEY ?? process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn("No VOYAGE_API_KEY or ANTHROPIC_API_KEY set — returning zero vector");
    return new Array(1024).fill(0);
  }

  const response = await fetch(VOYAGE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: [query],
      input_type: "query",
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      `Voyage API error (${response.status}): ${(err as { detail?: string }).detail ?? response.statusText}`,
    );
  }

  const data = await response.json();
  return (data.data as { embedding: number[] }[])[0].embedding;
}
