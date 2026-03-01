import type { Convocatoria, MgaEtapa, MgaCampo } from "@/lib/types/database";
import type { RetrievedChunk } from "./retrieval";

const SYSTEM_PROMPT = `Eres un asistente especializado en la Metodología General Ajustada (MGA) para la estructuración de proyectos de inversión pública en Colombia.

Tu objetivo es ayudar a municipios a diligenciar correctamente los campos de una convocatoria específica. Debes:

1. Ser claro, conciso y orientado a la acción.
2. Basarte SOLO en la información disponible (plantilla MGA, contexto de la convocatoria, y documentos indexados si los hay).
3. Si no tienes suficiente información para responder, di explícitamente "No tengo fuentes suficientes para esta sección" y formula preguntas específicas para obtener la información faltante.
4. Nunca inventar datos, cifras o fuentes.
5. Responder SIEMPRE en formato JSON válido con esta estructura exacta:
{
  "suggested_text": "texto sugerido para el campo",
  "bullets": ["punto clave 1", "punto clave 2"],
  "risks": ["riesgo identificado 1"],
  "missing_info_questions": ["pregunta 1 sobre info faltante"],
  "citations": [{"source": "nombre_documento.pdf", "chunk_text": "texto relevante citado", "relevance_score": 0.85}],
  "confidence": 0.85
}

IMPORTANTE sobre el campo "confidence":
- Es un número entre 0.0 y 1.0 que refleja tu nivel de confianza en la sugerencia.
- 0.9-1.0: Muy alta confianza — la respuesta está directamente respaldada por documentos de la convocatoria.
- 0.7-0.89: Alta confianza — la respuesta se basa en buenas prácticas y contexto sólido.
- 0.5-0.69: Confianza media — la respuesta es razonable pero faltan datos específicos.
- <0.5: Baja confianza — la respuesta es especulativa y necesita validación.

Si recibes contexto de documentos (sección <contexto_rag>), utilízalo como fuente principal para tu respuesta y cita las fuentes en el campo "citations". Si no hay contexto de documentos, deja "citations" vacío.`;

export function buildSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

export function buildUserPrompt({
  convocatoria,
  etapa,
  campo,
  currentText,
  ragChunks,
}: {
  convocatoria: Convocatoria;
  etapa: MgaEtapa;
  campo: MgaCampo;
  currentText?: string;
  ragChunks?: RetrievedChunk[];
}): string {
  let prompt = `<convocatoria>
Nombre: ${convocatoria.nombre}
Descripción: ${convocatoria.descripcion ?? "No especificada"}
Requisitos: ${convocatoria.requisitos ?? "No especificados"}
</convocatoria>

<etapa_mga>
Etapa: ${etapa.nombre} (${etapa.orden} de la plantilla)
Campo: ${campo.nombre}
Tipo de campo: ${campo.tipo}
Descripción: ${campo.descripcion}
Requerido: ${campo.requerido ? "Sí" : "No"}
</etapa_mga>`;

  if (ragChunks && ragChunks.length > 0) {
    prompt += `

<contexto_rag>
Los siguientes fragmentos provienen de documentos oficiales de la convocatoria. Úsalos como fuente principal:

${ragChunks
  .map(
    (chunk, i) =>
      `[Fuente ${i + 1}: ${chunk.file_name} (relevancia: ${(chunk.similarity * 100).toFixed(0)}%)]
${chunk.chunk_text}`,
  )
  .join("\n\n")}
</contexto_rag>`;
  }

  prompt += `

<instruccion>
Ayuda al municipio a completar el campo "${campo.nombre}" de la etapa "${etapa.nombre}".`;

  if (currentText?.trim()) {
    prompt += `

El municipio ya ha escrito lo siguiente (mejora y complementa, no reemplaces completamente):
<texto_actual>
${currentText}
</texto_actual>`;
  }

  prompt += `

Responde ÚNICAMENTE con el JSON especificado, sin texto adicional antes o después.
</instruccion>`;

  return prompt;
}
