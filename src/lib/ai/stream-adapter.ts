/**
 * Server-side streaming adapter.
 * Transforms Anthropic SSE stream into a clean text/event-stream
 * that the client can consume via ReadableStream.
 */

/**
 * Transforms the raw Anthropic SSE stream into a simplified SSE stream
 * that emits: data chunks (text deltas), done event, and error events.
 *
 * Events emitted:
 * - `event: delta\ndata: {"text":"..."}\n\n` — text delta
 * - `event: done\ndata: {"model":"...","usage":{...}}\n\n` — stream complete
 * - `event: error\ndata: {"message":"..."}\n\n` — error
 */
export function createSSEStream(
  anthropicStream: ReadableStream<Uint8Array>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  let buffer = "";
  let model = "claude";
  let inputTokens = 0;
  let outputTokens = 0;

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = anthropicStream.getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE lines from Anthropic
          const lines = buffer.split("\n");
          // Keep last potentially incomplete line in buffer
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const jsonStr = line.slice(6).trim();
              if (jsonStr === "[DONE]") continue;

              try {
                const event = JSON.parse(jsonStr);

                if (event.type === "content_block_delta") {
                  const text = event.delta?.text;
                  if (text) {
                    const sseMsg = `event: delta\ndata: ${JSON.stringify({ text })}\n\n`;
                    controller.enqueue(encoder.encode(sseMsg));
                  }
                } else if (event.type === "message_start") {
                  model = event.message?.model ?? "claude";
                  inputTokens =
                    event.message?.usage?.input_tokens ?? 0;
                } else if (event.type === "message_delta") {
                  outputTokens =
                    event.usage?.output_tokens ?? 0;
                } else if (event.type === "message_stop") {
                  const doneMsg = `event: done\ndata: ${JSON.stringify({
                    model,
                    usage: {
                      prompt_tokens: inputTokens,
                      completion_tokens: outputTokens,
                    },
                  })}\n\n`;
                  controller.enqueue(encoder.encode(doneMsg));
                } else if (event.type === "error") {
                  const errorMsg = `event: error\ndata: ${JSON.stringify({
                    message: event.error?.message ?? "Unknown error",
                  })}\n\n`;
                  controller.enqueue(encoder.encode(errorMsg));
                }
              } catch {
                // Skip malformed JSON lines
              }
            }
          }
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Stream error";
        const errorMsg = `event: error\ndata: ${JSON.stringify({ message })}\n\n`;
        controller.enqueue(encoder.encode(errorMsg));
      } finally {
        controller.close();
      }
    },
  });
}
