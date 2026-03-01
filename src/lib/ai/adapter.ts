import { withRetry, fetchWithRetryInfo } from "./retry";

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmResponse {
  content: string;
  model: string;
  usage: { prompt_tokens: number; completion_tokens: number };
}

export interface LlmAdapter {
  chat(messages: LlmMessage[]): Promise<LlmResponse>;
  chatStream(messages: LlmMessage[]): Promise<ReadableStream<Uint8Array>>;
}

// ============================================================
// OpenAI adapter (works with OpenAI and compatible APIs)
// ============================================================

export function createOpenAiAdapter(): LlmAdapter {
  // OpenAI adapter kept for backwards compatibility but no longer default.
  // Requires OPENAI_API_KEY and the "openai" npm package.
  throw new Error(
    "OpenAI adapter is disabled. Set LLM_PROVIDER=anthropic and configure ANTHROPIC_API_KEY.",
  );
}

// ============================================================
// Anthropic adapter
// ============================================================

function getAnthropicConfig() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY no está configurada. Agrégala en .env.local o en Vercel.",
    );
  }
  return {
    apiKey,
    model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
    baseHeaders: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
  };
}

export function createAnthropicAdapter(): LlmAdapter {
  return {
    async chat(messages) {
      const config = getAnthropicConfig();
      const systemMsg = messages.find((m) => m.role === "system");
      const userMsgs = messages.filter((m) => m.role !== "system");

      const response = await withRetry(
        () =>
          fetchWithRetryInfo("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: config.baseHeaders,
            body: JSON.stringify({
              model: config.model,
              max_tokens: 2048,
              system: systemMsg?.content ?? "",
              messages: userMsgs.map((m) => ({
                role: m.role,
                content: m.content,
              })),
            }),
          }),
        { maxRetries: 3, baseMs: 1000 },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          `Anthropic API error: ${data.error?.message ?? response.statusText}`,
        );
      }

      const textBlock = data.content?.find(
        (b: { type: string }) => b.type === "text",
      );

      return {
        content: textBlock?.text ?? "{}",
        model: data.model ?? "claude",
        usage: {
          prompt_tokens: data.usage?.input_tokens ?? 0,
          completion_tokens: data.usage?.output_tokens ?? 0,
        },
      };
    },

    async chatStream(messages) {
      const config = getAnthropicConfig();
      const systemMsg = messages.find((m) => m.role === "system");
      const userMsgs = messages.filter((m) => m.role !== "system");

      const response = await withRetry(
        () =>
          fetchWithRetryInfo("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: config.baseHeaders,
            body: JSON.stringify({
              model: config.model,
              max_tokens: 2048,
              stream: true,
              system: systemMsg?.content ?? "",
              messages: userMsgs.map((m) => ({
                role: m.role,
                content: m.content,
              })),
            }),
          }),
        { maxRetries: 3, baseMs: 1000 },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          `Anthropic API error: ${(data as Record<string, Record<string, string>>).error?.message ?? response.statusText}`,
        );
      }

      if (!response.body) {
        throw new Error("No response body for streaming");
      }

      return response.body;
    },
  };
}

// ============================================================
// Factory: pick adapter based on env
// ============================================================

export function createLlmAdapter(): LlmAdapter {
  const provider = process.env.LLM_PROVIDER ?? "anthropic";

  switch (provider) {
    case "openai":
      return createOpenAiAdapter();
    case "anthropic":
    default:
      return createAnthropicAdapter();
  }
}
