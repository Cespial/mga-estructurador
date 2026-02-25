export interface TextChunk {
  text: string;
  start: number;
  end: number;
}

interface ChunkOptions {
  maxTokens?: number;
  overlap?: number;
}

/**
 * Splits text into overlapping chunks of approximately `maxTokens` tokens.
 * Uses a simple character-based approximation (1 token ≈ 4 characters).
 * Tries to break at sentence boundaries when possible.
 */
export function chunkText(
  text: string,
  options: ChunkOptions = {},
): TextChunk[] {
  const { maxTokens = 500, overlap = 50 } = options;

  // Approximate characters per chunk (1 token ≈ 4 chars)
  const maxChars = maxTokens * 4;
  const overlapChars = overlap * 4;

  const cleanText = text.replace(/\r\n/g, "\n").trim();

  if (cleanText.length <= maxChars) {
    return [{ text: cleanText, start: 0, end: cleanText.length }];
  }

  const chunks: TextChunk[] = [];
  let start = 0;

  while (start < cleanText.length) {
    let end = Math.min(start + maxChars, cleanText.length);

    // Try to find a sentence boundary near the end
    if (end < cleanText.length) {
      const searchWindow = cleanText.slice(
        Math.max(end - 200, start),
        end,
      );
      const lastPeriod = searchWindow.lastIndexOf(". ");
      const lastNewline = searchWindow.lastIndexOf("\n");
      const breakPoint = Math.max(lastPeriod, lastNewline);

      if (breakPoint > 0) {
        end = Math.max(end - 200, start) + breakPoint + 1;
      }
    }

    const chunkText = cleanText.slice(start, end).trim();
    if (chunkText.length > 0) {
      chunks.push({ text: chunkText, start, end });
    }

    // Move start forward, subtracting overlap
    start = end - overlapChars;
    if (start <= chunks[chunks.length - 1]?.start) {
      start = end; // Prevent infinite loop
    }
  }

  return chunks;
}
