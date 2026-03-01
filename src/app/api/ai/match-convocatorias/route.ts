import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { createAnthropicAdapter } from "@/lib/ai/adapter";

/**
 * GET /api/ai/match-convocatorias
 *
 * Recommends open convocatorias for a municipality based on profile,
 * location, sector, and past project experience.
 */
export async function GET() {
  const profile = await getProfile();
  if (!profile || !profile.municipio_id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const supabase = await createClient();

  // Get municipio info
  const { data: mun } = await supabase
    .from("municipios")
    .select("id, nombre, departamento, categoria, poblacion")
    .eq("id", profile.municipio_id)
    .single();

  if (!mun) {
    return NextResponse.json(
      { error: "Municipio no encontrado" },
      { status: 404 },
    );
  }

  // Get past projects for context
  const { data: pastProjects } = await supabase
    .from("projects")
    .select("title, description, status")
    .eq("municipio_id", mun.id)
    .limit(5);

  // Fetch open convocatorias (both MGA and Polytech)
  const { data: mgaConvs } = await supabase
    .from("convocatorias")
    .select("id, nombre, descripcion, fecha_cierre, estado")
    .eq("estado", "abierta");

  const { data: polConvs } = await supabase
    .from("convocatorias_v2")
    .select("id, name, description, deadline, status")
    .eq("status", "open");

  const allConvocatorias = [
    ...(mgaConvs ?? []).map((c) => ({
      id: c.id,
      nombre: c.nombre,
      descripcion: c.descripcion ?? "",
      fecha_cierre: c.fecha_cierre,
      tipo: "MGA" as const,
    })),
    ...(polConvs ?? []).map((c) => ({
      id: c.id,
      nombre: c.name,
      descripcion: c.description ?? "",
      fecha_cierre: c.deadline,
      tipo: "Polytech" as const,
    })),
  ];

  if (allConvocatorias.length === 0) {
    return NextResponse.json({ recommendations: [] });
  }

  // Build profile description for matching
  const pastProjectsDesc = (pastProjects ?? [])
    .map((p) => `- ${p.title}: ${p.description ?? "Sin descripcion"} (${p.status})`)
    .join("\n");

  const adapter = createAnthropicAdapter();

  const response = await adapter.chat([
    {
      role: "system",
      content: `Eres un asesor de proyectos de inversion publica en Colombia.
Analiza el perfil del municipio y recomienda las convocatorias mas adecuadas.

Responde SOLO con JSON valido:
{
  "recommendations": [
    {
      "convocatoria_id": "string",
      "match_score": 0.0-1.0,
      "razon": "Explicacion breve de por que es buena opcion",
      "probabilidad_exito": "alta|media|baja"
    }
  ]
}

Ordena por match_score descendente. Incluye TODAS las convocatorias con score > 0.3.`,
    },
    {
      role: "user",
      content: `PERFIL DEL MUNICIPIO:
- Nombre: ${mun.nombre}
- Departamento: ${mun.departamento}
- Categoria: ${mun.categoria ?? "No especificada"}
- Poblacion: ${mun.poblacion ?? "No especificada"}

PROYECTOS PREVIOS:
${pastProjectsDesc || "Sin proyectos previos"}

CONVOCATORIAS ABIERTAS:
${allConvocatorias.map((c) => `- ID: ${c.id} | ${c.nombre} (${c.tipo}) | ${c.descripcion} | Cierra: ${c.fecha_cierre ?? "Sin fecha"}`).join("\n")}

Recomienda las convocatorias mas adecuadas para este municipio.`,
    },
  ]);

  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ recommendations: [] });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const recommendations = (parsed.recommendations ?? []).map(
      (rec: { convocatoria_id: string; match_score: number; razon: string; probabilidad_exito: string }) => {
        const conv = allConvocatorias.find((c) => c.id === rec.convocatoria_id);
        return {
          ...rec,
          convocatoria_nombre: conv?.nombre ?? "Desconocida",
          convocatoria_tipo: conv?.tipo ?? "MGA",
          fecha_cierre: conv?.fecha_cierre,
        };
      },
    );

    return NextResponse.json({ recommendations });
  } catch {
    return NextResponse.json({ recommendations: [] });
  }
}
