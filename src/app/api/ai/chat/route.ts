import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAnthropicAdapter } from "@/lib/ai/adapter";
import type { LlmMessage } from "@/lib/ai/adapter";
import type {
  Project,
  ProjectForm,
  PublitecConvocatoria,
  WizardStepDefinition,
  AiChatMessage,
} from "@/lib/types/database";

/**
 * POST /api/ai/chat
 *
 * AI chat assistant for the wizard. Helps municipalities fill out
 * project form fields by providing contextual guidance in Spanish.
 *
 * Body: { project_id: string, content: string, step_number: number }
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  // Verify authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body: { project_id: string; content: string; step_number: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Cuerpo de la solicitud invalido" },
      { status: 400 },
    );
  }

  const { project_id, content, step_number } = body;

  if (!project_id || !content || step_number == null) {
    return NextResponse.json(
      { error: "Faltan campos requeridos: project_id, content, step_number" },
      { status: 400 },
    );
  }

  try {
    // ------------------------------------------------------------------
    // 1. Fetch project context
    // ------------------------------------------------------------------
    const { data: project, error: projError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", project_id)
      .single<Project>();

    if (projError || !project) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 },
      );
    }

    // Fetch convocatoria for form_schema context
    const { data: convocatoria } = await supabase
      .from("convocatorias_v2")
      .select("*")
      .eq("id", project.convocatoria_id)
      .single<PublitecConvocatoria>();

    // Fetch current step data
    const { data: currentForm } = await supabase
      .from("project_forms")
      .select("*")
      .eq("project_id", project_id)
      .eq("step_number", step_number)
      .single<ProjectForm>();

    // Fetch all project forms for full context
    const { data: allForms } = await supabase
      .from("project_forms")
      .select("*")
      .eq("project_id", project_id)
      .order("step_number", { ascending: true });

    // Fetch conversation history for this step (last 10 messages)
    const { data: chatHistory } = await supabase
      .from("ai_chat_messages")
      .select("*")
      .eq("project_id", project_id)
      .eq("step_number", step_number)
      .order("created_at", { ascending: true })
      .limit(10);

    // ------------------------------------------------------------------
    // 2. Build system prompt
    // ------------------------------------------------------------------
    const stepDef = getStepDefinition(convocatoria, step_number);
    const systemPrompt = buildChatSystemPrompt(
      convocatoria,
      project,
      stepDef,
      currentForm,
      allForms as ProjectForm[] | null,
    );

    // ------------------------------------------------------------------
    // 3. Build messages array with history
    // ------------------------------------------------------------------
    const messages: LlmMessage[] = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history
    if (chatHistory && chatHistory.length > 0) {
      for (const msg of chatHistory as AiChatMessage[]) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    // Add current user message
    messages.push({ role: "user", content });

    // ------------------------------------------------------------------
    // 4. Call Claude
    // ------------------------------------------------------------------
    const adapter = createAnthropicAdapter();
    const llmResponse = await adapter.chat(messages);
    const assistantContent = llmResponse.content;

    // ------------------------------------------------------------------
    // 5. Save both messages to ai_chat_messages
    // ------------------------------------------------------------------
    const now = new Date().toISOString();

    await supabase.from("ai_chat_messages").insert([
      {
        project_id,
        role: "user" as const,
        content,
        step_number,
        created_at: now,
      },
      {
        project_id,
        role: "assistant" as const,
        content: assistantContent,
        step_number,
        created_at: now,
      },
    ]);

    // ------------------------------------------------------------------
    // 6. Return assistant message
    // ------------------------------------------------------------------
    return NextResponse.json({
      role: "assistant",
      content: assistantContent,
      model: llmResponse.model,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error interno del servidor";
    console.error("[ai/chat] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStepDefinition(
  convocatoria: PublitecConvocatoria | null,
  stepNumber: number,
): WizardStepDefinition | null {
  if (!convocatoria?.form_schema) return null;
  return (
    convocatoria.form_schema.find((s) => s.step_number === stepNumber) ?? null
  );
}

function buildChatSystemPrompt(
  convocatoria: PublitecConvocatoria | null,
  project: Project,
  stepDef: WizardStepDefinition | null,
  currentForm: ProjectForm | null,
  allForms: ProjectForm[] | null,
): string {
  const sections: string[] = [];

  sections.push(`Eres un asistente experto en formulacion de proyectos de inversion publica en Colombia. Tu rol es ayudar a funcionarios municipales a diligenciar correctamente los formularios de proyectos para convocatorias.

REGLAS IMPORTANTES:
- Responde SIEMPRE en espanol.
- Se claro, concreto y profesional.
- Ofrece sugerencias especificas, no genericas. Si el usuario pide ayuda con un campo, da un ejemplo concreto que pueda adaptar.
- Cuando sugieras texto para un campo, formatealo de manera que pueda copiarse directamente.
- Si no tienes suficiente informacion para dar una buena sugerencia, pide mas contexto al usuario.
- No inventes datos numericos (presupuestos, poblacion) -- pide al usuario que confirme.
- Usa un tono amigable pero profesional, tutea al usuario.
- Tus respuestas deben ser concisas (maximo 3-4 parrafos) a menos que el usuario pida algo mas elaborado.`);

  // Convocatoria context
  if (convocatoria) {
    sections.push(`
CONTEXTO DE LA CONVOCATORIA:
- Nombre: ${convocatoria.name}
- Descripcion: ${convocatoria.description ?? "No disponible"}
- Presupuesto: ${convocatoria.budget ? `$${convocatoria.budget.toLocaleString("es-CO")}` : "No especificado"}`);
  }

  // Project context
  sections.push(`
PROYECTO ACTUAL:
- Titulo: ${project.title}
- Descripcion: ${project.description ?? "Aun sin descripcion"}
- Estado: ${project.status}`);

  // Current step context
  if (stepDef) {
    const fieldDescriptions = stepDef.fields
      .map((f) => {
        const currentValue =
          currentForm?.form_data?.[f.id] != null
            ? String(currentForm.form_data[f.id])
            : "(vacio)";
        return `  - ${f.label} [${f.type}${f.required ? ", requerido" : ""}]: ${f.description ?? ""} | Valor actual: ${currentValue}`;
      })
      .join("\n");

    sections.push(`
PASO ACTUAL (${stepDef.step_number}): ${stepDef.step_name}
Descripcion: ${stepDef.description}
Campos:
${fieldDescriptions}`);
  }

  // Summary of other filled steps
  if (allForms && allForms.length > 0) {
    const otherSteps = allForms
      .filter((f) => f.step_number !== stepDef?.step_number)
      .map((f) => {
        const filledCount = Object.values(f.form_data ?? {}).filter(
          (v) => v !== null && v !== undefined && v !== "",
        ).length;
        return `  - Paso ${f.step_number} (${f.step_name}): ${filledCount} campos diligenciados, ${f.completed ? "completado" : "en progreso"}`;
      })
      .join("\n");

    if (otherSteps) {
      sections.push(`
PROGRESO DE OTROS PASOS:
${otherSteps}`);
    }
  }

  return sections.join("\n");
}
