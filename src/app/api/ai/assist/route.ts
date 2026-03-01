import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { createLlmAdapter } from "@/lib/ai/adapter";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/ai/prompts";
import { retrieveContext } from "@/lib/ai/retrieval";
import { createSSEStream } from "@/lib/ai/stream-adapter";
import {
  aiAssistRequestSchema,
  aiAssistResponseSchema,
} from "@/lib/ai/schemas";
import type {
  Convocatoria,
  MgaTemplate,
  MgaEtapa,
  MgaCampo,
} from "@/lib/types/database";
import crypto from "crypto";

export async function POST(request: Request) {
  const startTime = Date.now();
  const wantsStream =
    request.headers.get("accept")?.includes("text/event-stream") ?? false;

  // 1. Auth check
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // 2. Parse and validate request
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body inválido" },
      { status: 400 },
    );
  }

  const parsed = aiAssistRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const { convocatoria_id, etapa_id, campo_id, current_text } = parsed.data;

  // 3. Rate limiting (simple: check audit_logs count in last minute)
  const supabase = await createClient();
  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  const { count } = await supabase
    .from("audit_logs")
    .select("*", { count: "exact", head: true })
    .eq("actor_user_id", profile.id)
    .eq("action", "ai_assist")
    .gte("created_at", oneMinuteAgo);

  if ((count ?? 0) >= 10) {
    return NextResponse.json(
      { error: "Límite de solicitudes alcanzado. Intenta en un minuto." },
      { status: 429 },
    );
  }

  // 4. Fetch convocatoria + template
  const { data: conv } = await supabase
    .from("convocatorias")
    .select("*")
    .eq("id", convocatoria_id)
    .single();

  if (!conv) {
    return NextResponse.json(
      { error: "Convocatoria no encontrada" },
      { status: 404 },
    );
  }
  const convocatoria = conv as Convocatoria;

  const { data: tmpl } = await supabase
    .from("mga_templates")
    .select("*")
    .eq("convocatoria_id", convocatoria_id)
    .maybeSingle();

  if (!tmpl) {
    return NextResponse.json(
      { error: "Plantilla MGA no encontrada" },
      { status: 404 },
    );
  }
  const template = tmpl as MgaTemplate;

  // 5. Find etapa and campo
  const etapa = template.etapas_json.find(
    (e: MgaEtapa) => e.id === etapa_id,
  );
  if (!etapa) {
    return NextResponse.json(
      { error: "Etapa no encontrada" },
      { status: 404 },
    );
  }

  const campo = etapa.campos.find((c: MgaCampo) => c.id === campo_id);
  if (!campo) {
    return NextResponse.json(
      { error: "Campo no encontrado" },
      { status: 404 },
    );
  }

  // 6. RAG: retrieve relevant document chunks
  let ragChunks: Awaited<ReturnType<typeof retrieveContext>> = [];
  try {
    const query = `${etapa.nombre} - ${campo.nombre}: ${campo.descripcion}`;
    ragChunks = await retrieveContext(convocatoria_id, query, 5, 0.7);
  } catch {
    // RAG is best-effort; continue without context if it fails
  }

  // 7. Build prompt
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt({
    convocatoria,
    etapa,
    campo,
    currentText: current_text,
    ragChunks: ragChunks.length > 0 ? ragChunks : undefined,
  });

  const promptHash = crypto
    .createHash("sha256")
    .update(systemPrompt + userPrompt)
    .digest("hex")
    .slice(0, 16);

  // 7b. Cache check: look for same prompt_hash in audit_logs from last 24h
  const twentyFourHoursAgo = new Date(
    Date.now() - 24 * 60 * 60 * 1000,
  ).toISOString();
  const { data: cachedLog } = await supabase
    .from("audit_logs")
    .select("response_json, duration_ms")
    .eq("action", "ai_assist")
    .eq("prompt_hash", promptHash)
    .gte("created_at", twentyFourHoursAgo)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (cachedLog?.response_json) {
    const cachedResponse = cachedLog.response_json;
    const durationMs = Date.now() - startTime;

    // Write audit log for the cached hit too
    await supabase.from("audit_logs").insert({
      actor_user_id: profile.id,
      tenant_id: profile.tenant_id,
      action: "ai_assist",
      convocatoria_id,
      campo_id,
      prompt_hash: promptHash,
      sources_used: ragChunks.map((c) => ({
        file_name: c.file_name,
        chunk_index: c.chunk_index,
        similarity: c.similarity,
      })),
      response_json: cachedResponse,
      duration_ms: durationMs,
    });

    return NextResponse.json({
      ...cachedResponse,
      _meta: {
        model: "cached",
        duration_ms: durationMs,
        cached: true,
      },
    });
  }

  // 8. Call LLM — streaming or buffered
  const adapter = createLlmAdapter();

  if (wantsStream) {
    // Streaming path
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
      const message =
        err instanceof Error ? err.message : "Error al llamar al LLM";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  // Non-streaming path (default)
  let llmContent: string;
  let llmModel = "unknown";
  try {
    const llmResponse = await adapter.chat([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);
    llmContent = llmResponse.content;
    llmModel = llmResponse.model;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al llamar al LLM";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // 9. Parse and validate LLM response
  let assistResponse;
  try {
    const raw = JSON.parse(llmContent);
    const validated = aiAssistResponseSchema.safeParse(raw);
    if (!validated.success) {
      // Try to salvage: use raw content as suggested_text
      assistResponse = {
        suggested_text: raw.suggested_text ?? llmContent,
        bullets: raw.bullets ?? [],
        risks: raw.risks ?? [],
        missing_info_questions: raw.missing_info_questions ?? [],
        citations: [],
        confidence: raw.confidence ?? null,
      };
    } else {
      assistResponse = validated.data;
    }
  } catch {
    // LLM returned non-JSON — wrap it
    assistResponse = {
      suggested_text: llmContent,
      bullets: [],
      risks: [],
      missing_info_questions: [],
      citations: [],
      confidence: null,
    };
  }

  // 9b. Compute hybrid confidence score
  const llmConfidence =
    typeof assistResponse.confidence === "number"
      ? assistResponse.confidence
      : 0.7;
  const avgRagSimilarity =
    ragChunks.length > 0
      ? ragChunks.reduce((sum, c) => sum + c.similarity, 0) / ragChunks.length
      : 0.5;
  const hybridConfidence =
    ragChunks.length > 0
      ? 0.6 * llmConfidence + 0.4 * avgRagSimilarity
      : llmConfidence;

  assistResponse.confidence = Math.round(hybridConfidence * 100) / 100;

  const durationMs = Date.now() - startTime;

  // 10. Write audit log
  await supabase.from("audit_logs").insert({
    actor_user_id: profile.id,
    tenant_id: profile.tenant_id,
    action: "ai_assist",
    convocatoria_id,
    campo_id,
    prompt_hash: promptHash,
    sources_used: ragChunks.map((c) => ({
      file_name: c.file_name,
      chunk_index: c.chunk_index,
      similarity: c.similarity,
    })),
    response_json: assistResponse,
    duration_ms: durationMs,
  });

  // 11. Return response
  return NextResponse.json({
    ...assistResponse,
    _meta: {
      model: llmModel,
      duration_ms: durationMs,
      cached: false,
    },
  });
}
