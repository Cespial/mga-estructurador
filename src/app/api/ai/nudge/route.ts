import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { nudgeSchema, parseBody } from "@/lib/ai/validation";

/**
 * POST /api/ai/nudge
 *
 * Lightweight endpoint: returns a short contextual tip for a field.
 * max_tokens=100, fast response, returns string or null.
 *
 * Body: { campo_nombre, campo_descripcion, texto_actual, criterio_rubrica? }
 */
export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const parsed = await parseBody(request, nudgeSchema);
  if (!parsed.success) {
    return NextResponse.json({ nudge: null });
  }

  const { campo_nombre, campo_descripcion, texto_actual, criterio_rubrica } = parsed.data;

  // Skip nudge for very short text (user is still typing)
  if (texto_actual.length < 15) {
    return NextResponse.json({ nudge: null });
  }

  const systemPrompt = `Eres un asistente de proyectos MGA. Da UN consejo corto (maximo 1 oracion) para mejorar el campo que el usuario esta escribiendo. Si el texto ya es bueno, responde exactamente "null" (sin comillas). No uses formato JSON, solo texto plano o null.`;

  const userPrompt = `Campo: ${campo_nombre}
Descripcion: ${campo_descripcion}
${criterio_rubrica ? `Criterio de evaluacion: ${criterio_rubrica}` : ""}
Texto actual: "${texto_actual}"

Da un consejo breve o responde null si el texto ya esta bien.`;

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ nudge: null });
    }

    // Use direct fetch with low max_tokens for speed
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
        max_tokens: 100,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ nudge: null });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text?.trim() ?? "";

    if (!text || text === "null" || text.toLowerCase() === "null") {
      return NextResponse.json({ nudge: null });
    }

    return NextResponse.json({ nudge: text });
  } catch {
    return NextResponse.json({ nudge: null });
  }
}
