import { z } from "zod";

export const aiAssistResponseSchema = z.object({
  suggested_text: z.string().describe("Texto sugerido para el campo MGA"),
  bullets: z.array(z.string()).describe("Puntos clave resumidos"),
  risks: z.array(z.string()).describe("Riesgos identificados"),
  missing_info_questions: z
    .array(z.string())
    .describe("Preguntas sobre información faltante"),
  citations: z
    .array(
      z.object({
        source: z.string(),
        chunk_text: z.string(),
        relevance_score: z.number().optional(),
      }),
    )
    .describe("Fuentes citadas del RAG (si aplica)"),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .nullable()
    .describe("Score de confianza del 0.0 al 1.0"),
});

export type AiAssistResponse = z.infer<typeof aiAssistResponseSchema>;

export const aiAssistRequestSchema = z.object({
  convocatoria_id: z.string().min(1),
  etapa_id: z.string().min(1),
  campo_id: z.string().min(1),
  current_text: z.string().optional(),
});

export type AiAssistRequest = z.infer<typeof aiAssistRequestSchema>;
