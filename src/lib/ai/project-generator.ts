import { createAnthropicAdapter } from "./adapter";
import { retrieveContext } from "./retrieval";
import type { LlmMessage } from "./adapter";

/**
 * Step-by-step project generation orchestrator.
 * Generates content for each step sequentially, using previous steps
 * as context to ensure coherence across the entire project.
 */

interface GenerationStep {
  step_number: number;
  step_name: string;
  fields: Array<{
    id: string;
    label: string;
    type: string;
    description?: string;
    required?: boolean;
  }>;
}

interface GenerationResult {
  step_number: number;
  step_name: string;
  data: Record<string, string>;
}

interface GenerationOptions {
  convocatoria_id: string;
  convocatoria_nombre: string;
  convocatoria_descripcion: string;
  municipio_nombre: string;
  departamento: string;
  proyecto_titulo: string;
  proyecto_descripcion: string;
  steps: GenerationStep[];
  onStepComplete?: (result: GenerationResult) => void;
}

const SYSTEM_PROMPT = `Eres un experto en formulacion de proyectos de inversion publica en Colombia (MGA).
Tu tarea es generar contenido de alta calidad para los campos de un formulario de proyecto.

REGLAS:
- Genera contenido realista, especifico y profesional
- NO inventes datos numericos sin base — usa rangos razonables
- Cada campo debe ser coherente con los demas campos del proyecto
- Usa terminologia tecnica apropiada para proyectos de inversion publica
- El contenido debe estar listo para revision, no ser un borrador preliminar
- Responde SOLO con JSON valido: { "fields": { "field_id": "contenido generado" } }
- Para campos numericos, usa solo numeros
- Para campos de texto largo, genera al menos 2-3 parrafos detallados
- Para campos de seleccion, usa una de las opciones validas si las conoces`;

export async function generateProject(
  options: GenerationOptions,
): Promise<GenerationResult[]> {
  const adapter = createAnthropicAdapter();
  const results: GenerationResult[] = [];

  for (const step of options.steps) {
    // Build context from previous steps
    const previousContext = results
      .map(
        (r) =>
          `Paso ${r.step_number} (${r.step_name}):\n${Object.entries(r.data)
            .map(([k, v]) => `  ${k}: ${v}`)
            .join("\n")}`,
      )
      .join("\n\n");

    // Get RAG context for this step
    let ragContext = "";
    try {
      const ragQuery = `${step.step_name} ${step.fields.map((f) => f.label).join(" ")}`;
      const chunks = await retrieveContext(
        options.convocatoria_id,
        ragQuery,
        3,
      );
      if (chunks.length > 0) {
        ragContext = `\n<documentos_referencia>\n${chunks.map((c) => c.chunk_text).join("\n---\n")}\n</documentos_referencia>`;
      }
    } catch {
      // RAG is best-effort
    }

    const fieldsDescription = step.fields
      .map(
        (f) =>
          `- "${f.id}" (${f.label}): ${f.description ?? "Sin descripcion"} [${f.type}${f.required ? ", requerido" : ""}]`,
      )
      .join("\n");

    const messages: LlmMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Proyecto: ${options.proyecto_titulo}
Descripcion: ${options.proyecto_descripcion}
Municipio: ${options.municipio_nombre}, ${options.departamento}
Convocatoria: ${options.convocatoria_nombre}
Descripcion convocatoria: ${options.convocatoria_descripcion}

${previousContext ? `PASOS YA COMPLETADOS:\n${previousContext}\n` : ""}
PASO ACTUAL (${step.step_number}): ${step.step_name}
Campos a generar:
${fieldsDescription}
${ragContext}

Genera contenido de alta calidad para TODOS los campos de este paso. Asegura coherencia con los pasos anteriores.`,
      },
    ];

    const response = await adapter.chat(messages);

    // Parse response
    let stepData: Record<string, string> = {};
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        stepData = parsed.fields ?? parsed;
      }
    } catch {
      // If parsing fails, try to extract field values
      for (const field of step.fields) {
        stepData[field.id] = "";
      }
    }

    const result: GenerationResult = {
      step_number: step.step_number,
      step_name: step.step_name,
      data: stepData,
    };

    results.push(result);

    // Notify progress callback
    if (options.onStepComplete) {
      options.onStepComplete(result);
    }
  }

  return results;
}
