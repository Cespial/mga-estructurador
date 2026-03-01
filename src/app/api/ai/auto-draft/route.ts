import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { createLlmAdapter } from "@/lib/ai/adapter";
import { createSSEStream } from "@/lib/ai/stream-adapter";
import { retrieveContext } from "@/lib/ai/retrieval";
import { autoDraftSchema, parseBody } from "@/lib/ai/validation";
import type {
  Convocatoria,
  MgaTemplate,
  MgaEtapa,
  MgaCampo,
} from "@/lib/types/database";

/**
 * POST /api/ai/auto-draft
 *
 * Auto-completes all empty fields in a given etapa.
 * Receives: { convocatoria_id, submission_id, etapa_id }
 * Returns JSON { [campo_id]: "generated content" } or streams SSE.
 */
export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const parsed = await parseBody(request, autoDraftSchema);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }

  const { convocatoria_id, submission_id, etapa_id } = parsed.data;

  const supabase = await createClient();

  // Verify ownership of submission
  const { data: subCheck } = await supabase
    .from("submissions")
    .select("municipio_id")
    .eq("id", submission_id)
    .single();

  if (!subCheck || subCheck.municipio_id !== profile.municipio_id) {
    return NextResponse.json({ error: "No autorizado para este submission" }, { status: 403 });
  }

  // Fetch convocatoria + template
  const { data: conv } = await supabase
    .from("convocatorias")
    .select("*")
    .eq("id", convocatoria_id)
    .single();

  if (!conv) {
    return NextResponse.json({ error: "Convocatoria no encontrada" }, { status: 404 });
  }
  const convocatoria = conv as Convocatoria;

  const { data: tmpl } = await supabase
    .from("mga_templates")
    .select("*")
    .eq("convocatoria_id", convocatoria_id)
    .maybeSingle();

  if (!tmpl) {
    return NextResponse.json({ error: "Plantilla MGA no encontrada" }, { status: 404 });
  }
  const template = tmpl as MgaTemplate;

  // Find etapa
  const etapa = template.etapas_json.find((e: MgaEtapa) => e.id === etapa_id);
  if (!etapa) {
    return NextResponse.json({ error: "Etapa no encontrada" }, { status: 404 });
  }

  // Fetch current submission data
  const { data: submission } = await supabase
    .from("submissions")
    .select("data_json")
    .eq("id", submission_id)
    .single();

  const existingData = (submission?.data_json ?? {}) as Record<string, string>;

  // Determine empty fields
  const emptyCampos = etapa.campos.filter(
    (c: MgaCampo) => !existingData[c.id]?.trim(),
  );

  if (emptyCampos.length === 0) {
    return NextResponse.json({ message: "Todos los campos ya tienen contenido" });
  }

  // RAG context
  let ragChunks: Awaited<ReturnType<typeof retrieveContext>> = [];
  try {
    const query = `${etapa.nombre}: ${emptyCampos.map((c: MgaCampo) => c.nombre).join(", ")}`;
    ragChunks = await retrieveContext(convocatoria_id, query, 8, 0.65);
  } catch {
    // best-effort
  }

  // Fetch other etapas data for inter-step context
  const otherEtapasContext = template.etapas_json
    .filter((e: MgaEtapa) => e.id !== etapa_id)
    .map((e: MgaEtapa) => {
      const filledFields = e.campos
        .filter((c: MgaCampo) => existingData[c.id]?.trim())
        .map((c: MgaCampo) => `  - ${c.nombre}: ${existingData[c.id]}`)
        .join("\n");
      return filledFields ? `${e.nombre}:\n${filledFields}` : null;
    })
    .filter(Boolean)
    .join("\n\n");

  // Build prompt
  const systemPrompt = `Eres un asistente especializado en la Metodologia General Ajustada (MGA) para proyectos de inversion publica en Colombia.

Tu tarea es generar contenido para TODOS los campos vacios de una etapa, produciendo texto coherente entre campos y con el resto del proyecto.

REGLAS:
- Responde SIEMPRE en formato JSON valido: { "campo_id": "contenido generado" }
- Genera contenido especifico y profesional, no generico
- Mantén coherencia entre los campos generados
- Si hay datos de otras etapas, usalos como contexto
- NO inventes cifras especificas — usa placeholders como "[valor a confirmar]"
- Cada campo debe tener contenido sustantivo (minimo 2-3 oraciones para textareas)`;

  const fieldsDescription = emptyCampos
    .map(
      (c: MgaCampo) =>
        `- campo_id: "${c.id}" | nombre: "${c.nombre}" | tipo: ${c.tipo} | descripcion: "${c.descripcion}" | requerido: ${c.requerido}`,
    )
    .join("\n");

  const filledFieldsInEtapa = etapa.campos
    .filter((c: MgaCampo) => existingData[c.id]?.trim())
    .map((c: MgaCampo) => `- ${c.nombre}: ${existingData[c.id]}`)
    .join("\n");

  let userPrompt = `<convocatoria>
Nombre: ${convocatoria.nombre}
Descripcion: ${convocatoria.descripcion ?? "No especificada"}
</convocatoria>

<etapa>
Nombre: ${etapa.nombre}
Campos ya completados:
${filledFieldsInEtapa || "(ninguno)"}

Campos VACIOS a generar:
${fieldsDescription}
</etapa>`;

  if (otherEtapasContext) {
    userPrompt += `

<contexto_otras_etapas>
${otherEtapasContext}
</contexto_otras_etapas>`;
  }

  if (ragChunks.length > 0) {
    userPrompt += `

<contexto_rag>
${ragChunks.map((c, i) => `[Fuente ${i + 1}: ${c.file_name}]\n${c.chunk_text}`).join("\n\n")}
</contexto_rag>`;
  }

  userPrompt += `

Genera contenido para TODOS los campos vacios listados. Responde UNICAMENTE con el JSON { "campo_id": "contenido" }.`;

  // Streaming path
  const wantsStream = request.headers.get("accept")?.includes("text/event-stream") ?? false;
  const adapter = createLlmAdapter();

  if (wantsStream) {
    try {
      const rawStream = await adapter.chatStream([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ]);
      const sseStream = createSSEStream(rawStream);
      return new Response(sseStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al generar borrador";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  // Non-streaming path
  try {
    const llmResponse = await adapter.chat([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    let draftFields: Record<string, string>;
    try {
      const jsonMatch = llmResponse.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      draftFields = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json(
        { error: "La IA no genero un JSON valido. Intenta de nuevo.", raw: llmResponse.content.slice(0, 500) },
        { status: 502 },
      );
    }

    return NextResponse.json({
      fields: draftFields,
      _meta: { model: llmResponse.model },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al generar borrador";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
