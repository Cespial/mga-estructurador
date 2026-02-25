# AI_PROMPTS — Prompts del asistente MGA

## System prompt base (v1)

```
Eres un asistente especializado en la Metodología General Ajustada (MGA) para
la estructuración de proyectos de inversión pública en Colombia.

Tu objetivo es ayudar a municipios a diligenciar correctamente los campos de una
convocatoria específica. Debes:

1. Ser claro, conciso y orientado a la acción.
2. Basarte SOLO en la información disponible (plantilla MGA, contexto de la
   convocatoria, y documentos indexados si los hay).
3. Si no tienes suficiente información para responder, di explícitamente:
   "No tengo fuentes suficientes para esta sección" y formula preguntas
   específicas para obtener la información faltante.
4. Nunca inventar datos, cifras o fuentes.
5. Responder SIEMPRE en el formato JSON especificado.
```

**Archivo fuente**: `src/lib/ai/prompts.ts` → `buildSystemPrompt()`

## Schema de salida (Zod)

```typescript
import { z } from "zod";

export const aiAssistResponseSchema = z.object({
  suggested_text: z.string().describe("Texto sugerido para el campo MGA"),
  bullets: z.array(z.string()).describe("Puntos clave resumidos"),
  risks: z.array(z.string()).describe("Riesgos identificados"),
  missing_info_questions: z.array(z.string()).describe("Preguntas sobre info faltante"),
  citations: z.array(
    z.object({
      source: z.string(),
      chunk_text: z.string(),
      relevance_score: z.number().optional(),
    })
  ).describe("Fuentes citadas del RAG (si aplica)"),
});
```

**Archivo fuente**: `src/lib/ai/schemas.ts`

## Formato de contexto al LLM (user prompt)

```
<convocatoria>
Nombre: {nombre}
Descripción: {descripcion}
Requisitos: {requisitos}
</convocatoria>

<etapa_mga>
Etapa: {etapa_nombre} ({orden} de la plantilla)
Campo: {campo_nombre}
Tipo de campo: {tipo}
Descripción: {campo_descripcion}
Requerido: {Sí/No}
</etapa_mga>

<instruccion>
Ayuda al municipio a completar el campo "{campo_nombre}" de la etapa "{etapa_nombre}".

[Si hay texto actual del municipio:]
El municipio ya ha escrito lo siguiente (mejora y complementa, no reemplaces completamente):
<texto_actual>
{currentText}
</texto_actual>

Responde ÚNICAMENTE con el JSON especificado, sin texto adicional antes o después.
</instruccion>
```

**Archivo fuente**: `src/lib/ai/prompts.ts` → `buildUserPrompt()`

## Adapter pattern

| Provider | Implementación | Config env vars |
|----------|---------------|-----------------|
| OpenAI (default) | SDK `openai`, `json_object` response_format | `OPENAI_API_KEY`, `OPENAI_MODEL` |
| Anthropic | fetch directo a API | `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` |

Selección via `LLM_PROVIDER` env var (default: `openai`).

**Archivo fuente**: `src/lib/ai/adapter.ts`

## Flujo completo (API route)

1. Auth check (requiere sesión activa)
2. Validar request con Zod (`aiAssistRequestSchema`)
3. Rate limit: máx 10 req/min por usuario (via audit_logs count)
4. Fetch convocatoria + template + etapa + campo
5. Build system prompt + user prompt
6. Hash del prompt (SHA-256, primeros 16 chars)
7. Call LLM via adapter
8. Validar respuesta con Zod (fallback graceful)
9. Write audit_log (actor, action, prompt_hash, response, duration)
10. Return response + `_meta` (model, duration_ms)

**Archivo fuente**: `src/app/api/ai/assist/route.ts`
