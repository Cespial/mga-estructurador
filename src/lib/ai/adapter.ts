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

export function createAnthropicAdapter(): LlmAdapter {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  return {
    async chat(messages) {
      const systemMsg = messages.find((m) => m.role === "system");
      const userMsgs = messages.filter((m) => m.role !== "system");

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey ?? "",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
          max_tokens: 2048,
          system: systemMsg?.content ?? "",
          messages: userMsgs.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

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
