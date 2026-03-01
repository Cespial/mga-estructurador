"use client";

import { useState, useCallback, useRef } from "react";

interface UseAiStreamOptions {
  onDone?: (fullText: string, meta: StreamMeta) => void;
  onError?: (message: string) => void;
}

interface StreamMeta {
  model: string;
  usage: { prompt_tokens: number; completion_tokens: number };
  cached?: boolean;
}

interface UseAiStreamReturn {
  text: string;
  isStreaming: boolean;
  meta: StreamMeta | null;
  error: string | null;
  startStream: (url: string, body: Record<string, unknown>) => Promise<void>;
  cancel: () => void;
}

/**
 * React hook for consuming SSE streams from AI endpoints.
 * Reads event-stream chunks and updates text state incrementally.
 */
export function useAiStream(options?: UseAiStreamOptions): UseAiStreamReturn {
  const [text, setText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [meta, setMeta] = useState<StreamMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const startStream = useCallback(
    async (url: string, body: Record<string, unknown>) => {
      // Reset state
      setText("");
      setMeta(null);
      setError(null);
      setIsStreaming(true);

      // Cancel previous stream if any
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      let accumulatedText = "";

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        // If the response is JSON (non-streaming / cached), handle it directly
        const contentType = response.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          const json = await response.json();
          if (!response.ok) {
            throw new Error(json.error ?? "Error del servidor");
          }
          // Cached or non-streaming response
          const fullText = json.suggested_text ?? json.content ?? JSON.stringify(json);
          setText(fullText);
          const streamMeta: StreamMeta = {
            model: json._meta?.model ?? json.model ?? "claude",
            usage: { prompt_tokens: 0, completion_tokens: 0 },
            cached: json._meta?.cached ?? false,
          };
          setMeta(streamMeta);
          options?.onDone?.(fullText, streamMeta);
          setIsStreaming(false);
          return;
        }

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let sseBuffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          sseBuffer += decoder.decode(value, { stream: true });

          // Process complete SSE messages
          const messages = sseBuffer.split("\n\n");
          sseBuffer = messages.pop() ?? "";

          for (const message of messages) {
            const lines = message.split("\n");
            let eventType = "";
            let eventData = "";

            for (const line of lines) {
              if (line.startsWith("event: ")) {
                eventType = line.slice(7).trim();
              } else if (line.startsWith("data: ")) {
                eventData = line.slice(6).trim();
              }
            }

            if (!eventType || !eventData) continue;

            try {
              const parsed = JSON.parse(eventData);

              if (eventType === "delta") {
                accumulatedText += parsed.text;
                setText(accumulatedText);
              } else if (eventType === "done") {
                const streamMeta: StreamMeta = {
                  model: parsed.model ?? "claude",
                  usage: parsed.usage ?? {
                    prompt_tokens: 0,
                    completion_tokens: 0,
                  },
                };
                setMeta(streamMeta);
                options?.onDone?.(accumulatedText, streamMeta);
              } else if (eventType === "error") {
                setError(parsed.message ?? "Error desconocido");
                options?.onError?.(parsed.message ?? "Error desconocido");
              }
            } catch {
              // Skip malformed event data
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Cancelled by user — not an error
          return;
        }
        const message =
          err instanceof Error
            ? err.message
            : "Error de conexion con el asistente IA";
        setError(message);
        options?.onError?.(message);
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [options],
  );

  return { text, isStreaming, meta, error, startStream, cancel };
}
