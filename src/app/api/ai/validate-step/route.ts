import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { createLlmAdapter } from "@/lib/ai/adapter";
import { retrieveContext } from "@/lib/ai/retrieval";
import type {
  Convocatoria,
  MgaTemplate,
  MgaEtapa,
  MgaCampo,
} from "@/lib/types/database";

export interface ValidationIssue {
  field_id: string;
  severity: "error" | "warning" | "info";
  message: string;
  suggestion: string | null;
}

/**
 * POST /api/ai/validate-step
 *
 * Validates all fields in a step before advancing.
 * Returns issues with severity levels and suggestions.
 */
export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body: {
    convocatoria_id: string;
    submission_id: string;
    etapa_id: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body invalido" }, { status: 400 });
  }

  const { convocatoria_id, submission_id, etapa_id } = body;
  const supabase = await createClient();

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
    return NextResponse.json({ error: "Plantilla no encontrada" }, { status: 404 });
  }
  const template = tmpl as MgaTemplate;

  const etapa = template.etapas_json.find((e: MgaEtapa) => e.id === etapa_id);
  if (!etapa) {
    return NextResponse.json({ error: "Etapa no encontrada" }, { status: 404 });
  }

  // Fetch submission data
  const { data: submission } = await supabase
    .from("submissions")
    .select("data_json")
    .eq("id", submission_id)
    .single();

  const existingData = (submission?.data_json ?? {}) as Record<string, string>;

  // Fetch rubric criteria if available
  const { data: rubric } = await supabase
    .from("rubrics")
    .select("criterios_json")
    .eq("convocatoria_id", convocatoria_id)
    .maybeSingle();

  const rubricCriteria = rubric?.criterios_json ?? [];

  // RAG context
  let ragChunks: Awaited<ReturnType<typeof retrieveContext>> = [];
  try {
    const query = `requisitos evaluacion ${etapa.nombre}`;
    ragChunks = await retrieveContext(convocatoria_id, query, 5, 0.7);
  } catch {
    // best-effort
  }

  // Build field data for prompt
  const fieldsData = etapa.campos
    .map((c: MgaCampo) => {
      const value = existingData[c.id]?.trim() || "(vacio)";
      const criterion = rubricCriteria.find(
        (r: { campo_id: string }) => r.campo_id === c.id,
      );
      return `- campo_id: "${c.id}" | nombre: "${c.nombre}" | requerido: ${c.requerido} | valor: "${value}"${
        criterion
          ? ` | criterio_rubrica: "${criterion.descripcion}" (peso: ${criterion.peso})`
          : ""
      }`;
    })
    .join("\n");

  const systemPrompt = `Eres un evaluador de proyectos de inversion publica en Colombia (metodologia MGA).

Tu tarea es revisar los campos de una etapa y detectar problemas, inconsistencias o mejoras necesarias.

REGLAS:
- Responde SIEMPRE en JSON valido: un array de issues
- Formato: [{ "field_id": "xxx", "severity": "error"|"warning"|"info", "message": "descripcion del problema", "suggestion": "como corregirlo" | null }]
- "error": campo requerido vacio o con error critico que impide la evaluacion
- "warning": campo con contenido insuficiente, generico, o inconsistente
- "info": sugerencia de mejora opcional
- Se especifico en los mensajes — referencia el contenido real del campo
- Si el campo esta bien, NO lo incluyas en la lista
- Retorna array vacio [] si todo esta correcto`;

  let userPrompt = `<convocatoria>
Nombre: ${convocatoria.nombre}
Descripcion: ${convocatoria.descripcion ?? "N/A"}
</convocatoria>

<etapa>
Nombre: ${etapa.nombre}
Campos:
${fieldsData}
</etapa>`;

  if (ragChunks.length > 0) {
    userPrompt += `

<documentos_referencia>
${ragChunks.map((c, i) => `[${i + 1}] ${c.file_name}: ${c.chunk_text}`).join("\n\n")}
</documentos_referencia>`;
  }

  userPrompt += `

Revisa cada campo y retorna UNICAMENTE el array JSON de issues encontrados.`;

  try {
    const adapter = createLlmAdapter();
    const llmResponse = await adapter.chat([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    let issues: ValidationIssue[] = [];
    try {
      const parsed = JSON.parse(llmResponse.content);
      issues = Array.isArray(parsed) ? parsed : [];
    } catch {
      issues = [];
    }

    return NextResponse.json({
      issues,
      _meta: { model: llmResponse.model },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al validar";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
