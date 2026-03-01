import { NextResponse } from "next/server";
import { createAnthropicAdapter } from "@/lib/ai/adapter";
import { getProfile } from "@/lib/auth";
import { healthCheckSchema, parseBody } from "@/lib/ai/validation";

/**
 * POST /api/ai/health-check
 *
 * Lightweight endpoint (max_tokens=100) that returns a brief AI assessment
 * of project quality. Called periodically from the health score widget.
 *
 * Body: { fields: Record<string, string>, step_name: string, project_title: string }
 */
export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const parsed = await parseBody(request, healthCheckSchema);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }

  const { fields, step_name, project_title } = parsed.data;

  const filledFields = Object.entries(fields)
    .filter(([, v]) => v && String(v).trim().length > 0)
    .map(([k, v]) => `${k}: ${String(v).slice(0, 200)}`)
    .join("\n");

  try {
    const adapter = createAnthropicAdapter();

    const response = await adapter.chat([
      {
        role: "system",
        content: `Eres un evaluador rapido de proyectos. Evalua la calidad del paso actual del proyecto.
Responde SOLO con JSON: { "score": 0-100, "tip": "consejo breve de mejora en 1 linea" }
Score: 0-30 = muy debil, 30-60 = necesita trabajo, 60-80 = aceptable, 80-100 = muy bueno.
max_tokens es 100, se extremadamente conciso.`,
      },
      {
        role: "user",
        content: `Proyecto: ${project_title}
Paso: ${step_name}
Campos:
${filledFields || "(todos vacios)"}`,
      },
    ]);

    const jsonMatch = response.content.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return NextResponse.json({
        score: Math.min(100, Math.max(0, result.score ?? 0)),
        tip: result.tip ?? null,
      });
    }
  } catch {
    // fallback on any error
  }

  return NextResponse.json({ score: 0, tip: null });
}
