import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createLlmAdapter } from "@/lib/ai/adapter";
import { retrieveContext } from "@/lib/ai/retrieval";

export interface TextChange {
  type: "added" | "reworded" | "removed";
  description: string;
}

/**
 * POST /api/ai/improve
 *
 * Takes existing text and improves it in clarity, formality, and completeness.
 *
 * Body: { texto_actual, campo_nombre, campo_descripcion, convocatoria_id?, recomendacion? }
 * Returns: { improved_text, changes: TextChange[] }
 */
export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body: {
    texto_actual: string;
    campo_nombre: string;
    campo_descripcion: string;
    convocatoria_id?: string;
    recomendacion?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body invalido" }, { status: 400 });
  }

  const { texto_actual, campo_nombre, campo_descripcion, convocatoria_id, recomendacion } = body;

  if (!texto_actual || !campo_nombre) {
    return NextResponse.json(
      { error: "Faltan campos: texto_actual, campo_nombre" },
      { status: 400 },
    );
  }

  // Optional RAG context
  let ragContext = "";
  if (convocatoria_id) {
    try {
      const chunks = await retrieveContext(convocatoria_id, `${campo_nombre}: ${texto_actual}`, 3, 0.7);
      if (chunks.length > 0) {
        ragContext = `\n<documentos_referencia>\n${chunks.map((c, i) => `[${i + 1}] ${c.file_name}: ${c.chunk_text}`).join("\n\n")}\n</documentos_referencia>`;
      }
    } catch {
      // best-effort
    }
  }

  const systemPrompt = `Eres un editor profesional de proyectos de inversion publica colombiana.

Tu tarea es mejorar el texto dado en:
1. Claridad: lenguaje preciso y profesional
2. Formalidad: tono institucional apropiado
3. Completitud: agregar informacion relevante faltante
4. Coherencia: alineacion con requisitos del campo

REGLAS:
- Responde SIEMPRE en JSON: { "improved_text": "...", "changes": [{ "type": "added"|"reworded"|"removed", "description": "que cambio" }] }
- Mantén la estructura y el sentido original
- No inventes datos especificos (cifras, fechas)
- Maximo 3-5 cambios significativos`;

  let userPrompt = `<campo>
Nombre: ${campo_nombre}
Descripcion: ${campo_descripcion}
</campo>

<texto_actual>
${texto_actual}
</texto_actual>`;

  if (recomendacion) {
    userPrompt += `

<recomendacion_evaluador>
${recomendacion}
</recomendacion_evaluador>

Ten en cuenta la recomendacion del evaluador al mejorar el texto.`;
  }

  if (ragContext) {
    userPrompt += ragContext;
  }

  userPrompt += `

Mejora el texto y retorna UNICAMENTE el JSON especificado.`;

  try {
    const adapter = createLlmAdapter();
    const llmResponse = await adapter.chat([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    let result: { improved_text: string; changes: TextChange[] };
    try {
      result = JSON.parse(llmResponse.content);
    } catch {
      result = {
        improved_text: llmResponse.content,
        changes: [{ type: "reworded", description: "Texto mejorado" }],
      };
    }

    return NextResponse.json({
      ...result,
      _meta: { model: llmResponse.model },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al mejorar texto";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
