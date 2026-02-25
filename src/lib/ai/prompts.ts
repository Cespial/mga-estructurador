import type { Convocatoria, MgaEtapa, MgaCampo } from "@/lib/types/database";

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
  "citations": []
}`;

export function buildSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

export function buildUserPrompt({
  convocatoria,
  etapa,
  campo,
  currentText,
}: {
  convocatoria: Convocatoria;
  etapa: MgaEtapa;
  campo: MgaCampo;
  currentText?: string;
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
</etapa_mga>

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
