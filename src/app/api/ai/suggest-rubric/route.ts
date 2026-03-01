import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { createAnthropicAdapter } from "@/lib/ai/adapter";
import { retrieveContext } from "@/lib/ai/retrieval";

/**
 * POST /api/ai/suggest-rubric
 *
 * Uses AI to suggest evaluation criteria based on convocatoria description,
 * form schema, and RAG document context.
 *
 * Body: { convocatoria_id, etapas: [{ id, nombre, campos: [{ id, nombre }] }] }
 */
export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile || profile.role !== "entidad_admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  let body: {
    convocatoria_id: string;
    etapas: Array<{
      id: string;
      nombre: string;
      campos: Array<{ id: string; nombre: string }>;
    }>;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request invalido" }, { status: 400 });
  }

  const { convocatoria_id, etapas } = body;

  if (!convocatoria_id || !etapas?.length) {
    return NextResponse.json(
      { error: "convocatoria_id y etapas son requeridos" },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  // Fetch convocatoria info
  const { data: conv } = await supabase
    .from("convocatorias")
    .select("nombre, descripcion")
    .eq("id", convocatoria_id)
    .single();

  if (!conv) {
    return NextResponse.json(
      { error: "Convocatoria no encontrada" },
      { status: 404 },
    );
  }

  // Get RAG context
  const ragChunks = await retrieveContext(
    convocatoria_id,
    `criterios de evaluacion rubrica ${conv.nombre} ${conv.descripcion ?? ""}`,
  );

  const ragContext = ragChunks.length > 0
    ? `\n<documentos_referencia>\n${ragChunks.map((c) => c.chunk_text).join("\n---\n")}\n</documentos_referencia>`
    : "";

  const camposDescription = etapas
    .map(
      (e) =>
        `Etapa "${e.nombre}": ${e.campos.map((c) => c.nombre).join(", ")}`,
    )
    .join("\n");

  const adapter = createAnthropicAdapter();

  const startMs = Date.now();

  const response = await adapter.chat([
    {
      role: "system",
      content: `Eres un experto en evaluacion de proyectos de inversion publica en Colombia (MGA).
Tu tarea es sugerir criterios de evaluacion (rubrica) para una convocatoria.

Genera criterios concretos, medibles y relevantes. Cada criterio debe tener:
- campo_id: el id del campo al que aplica
- descripcion: que se evalua exactamente
- peso: peso relativo (numeros que sumen coherencia, no necesariamente 100)
- niveles: 4 niveles de evaluacion (Insuficiente=1, Basico=2, Bueno=3, Excelente=4) con descripcion especifica

Responde SOLO con JSON valido en este formato:
{
  "criterios": [
    {
      "campo_id": "string",
      "descripcion": "string",
      "peso": number,
      "niveles": [
        { "score": 1, "label": "Insuficiente", "descripcion": "..." },
        { "score": 2, "label": "Basico", "descripcion": "..." },
        { "score": 3, "label": "Bueno", "descripcion": "..." },
        { "score": 4, "label": "Excelente", "descripcion": "..." }
      ]
    }
  ]
}

Selecciona entre 3 y 8 criterios priorizando los campos mas relevantes para la evaluacion.`,
    },
    {
      role: "user",
      content: `Convocatoria: ${conv.nombre}
Descripcion: ${conv.descripcion ?? "Sin descripcion"}

Campos disponibles por etapa:
${camposDescription}
${ragContext}

Sugiere los criterios de evaluacion mas apropiados para esta convocatoria.`,
    },
  ]);

  const durationMs = Date.now() - startMs;

  // Parse response
  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Respuesta IA invalida" },
        { status: 500 },
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      criterios: parsed.criterios ?? [],
      model: response.model,
      duration_ms: durationMs,
    });
  } catch {
    return NextResponse.json(
      { error: "Error parseando respuesta IA" },
      { status: 500 },
    );
  }
}
