import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { generateProject } from "@/lib/ai/project-generator";

/**
 * POST /api/ai/generate-project
 *
 * Generates a complete project from a single input description.
 * Uses sequential LLM calls with context chaining for coherence.
 * Streams progress step by step via SSE.
 *
 * Body: { project_id }
 */
export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body: { project_id: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request invalido" }, { status: 400 });
  }

  const { project_id } = body;
  if (!project_id) {
    return NextResponse.json(
      { error: "project_id es requerido" },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  // Fetch project + convocatoria
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", project_id)
    .single();

  if (!project) {
    return NextResponse.json(
      { error: "Proyecto no encontrado" },
      { status: 404 },
    );
  }

  const { data: conv } = await supabase
    .from("convocatorias_v2")
    .select("*")
    .eq("id", project.convocatoria_id)
    .single();

  if (!conv) {
    return NextResponse.json(
      { error: "Convocatoria no encontrada" },
      { status: 404 },
    );
  }

  // Get municipio info
  const { data: mun } = await supabase
    .from("municipios")
    .select("nombre, departamento")
    .eq("id", profile.municipio_id)
    .single();

  const formSchema = (conv.form_schema ?? []) as Array<{
    step_number: number;
    step_name: string;
    description: string;
    fields: Array<{
      id: string;
      label: string;
      type: string;
      description?: string;
      required?: boolean;
    }>;
  }>;

  // Use SSE to stream progress
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const results = await generateProject({
          convocatoria_id: project.convocatoria_id,
          convocatoria_nombre: conv.name ?? "",
          convocatoria_descripcion: conv.description ?? "",
          municipio_nombre: mun?.nombre ?? "Municipio",
          departamento: mun?.departamento ?? "",
          proyecto_titulo: project.title,
          proyecto_descripcion: project.description ?? "",
          steps: formSchema.map((s) => ({
            step_number: s.step_number,
            step_name: s.step_name,
            fields: s.fields,
          })),
          onStepComplete: (result) => {
            const event = `event: step_complete\ndata: ${JSON.stringify(result)}\n\n`;
            controller.enqueue(encoder.encode(event));
          },
        });

        // Save all generated data to project_forms
        const saveSupabase = await createClient();
        for (const result of results) {
          const stepDef = formSchema.find(
            (s) => s.step_number === result.step_number,
          );

          await saveSupabase.from("project_forms").upsert(
            {
              project_id,
              step_number: result.step_number,
              step_name: stepDef?.step_name ?? `Paso ${result.step_number}`,
              form_data: result.data,
              completed: false, // User must review and confirm
            },
            { onConflict: "project_id,step_number" },
          );
        }

        // Send completion event
        const doneEvent = `event: done\ndata: ${JSON.stringify({ total_steps: results.length })}\n\n`;
        controller.enqueue(encoder.encode(doneEvent));
        controller.close();
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Error generating project";
        const errorEvent = `event: error\ndata: ${JSON.stringify({ error: errorMsg })}\n\n`;
        controller.enqueue(encoder.encode(errorEvent));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
