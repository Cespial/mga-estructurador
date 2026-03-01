import { NextResponse } from "next/server";
import { createAnthropicAdapter } from "@/lib/ai/adapter";
import { getProfile } from "@/lib/auth";

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

  let body: {
    fields: Record<string, string>;
    step_name: string;
    project_title: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request invalido" }, { status: 400 });
  }

  const { fields, step_name, project_title } = body;

  if (!fields || !step_name) {
    return NextResponse.json(
      { error: "fields y step_name son requeridos" },
      { status: 400 },
    );
  }

  const filledFields = Object.entries(fields)
    .filter(([, v]) => v && String(v).trim().length > 0)
    .map(([k, v]) => `${k}: ${String(v).slice(0, 200)}`)
    .join("\n");

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
      content: `Proyecto: ${project_title ?? "Sin titulo"}
Paso: ${step_name}
Campos:
${filledFields || "(todos vacios)"}`,
    },
  ]);

  try {
    const jsonMatch = response.content.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return NextResponse.json({
        score: Math.min(100, Math.max(0, parsed.score ?? 0)),
        tip: parsed.tip ?? null,
      });
    }
  } catch {
    // fallback
  }

  return NextResponse.json({ score: 0, tip: null });
}
