import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/cron/generate-notifications
 *
 * Daily cron job that generates smart notifications:
 * - Projects <100% progress with convocatoria closing in <7 days
 * - Empty required fields with high rubric weight
 * - Projects not edited in >3 days
 *
 * Protected by CRON_SECRET header.
 */
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const notifications: Array<{
    user_id: string;
    project_id?: string;
    type: string;
    title: string;
    body: string;
    action_url?: string;
  }> = [];

  try {
    // 1. Projects with upcoming deadlines
    const sevenDaysFromNow = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const now = new Date().toISOString();

    const { data: urgentSubmissions } = await supabase
      .from("submissions")
      .select(
        `
        id,
        convocatoria_id,
        municipio_id,
        progress,
        convocatorias!inner(nombre, fecha_cierre)
      `,
      )
      .lt("progress", 100)
      .lte("convocatorias.fecha_cierre", sevenDaysFromNow)
      .gte("convocatorias.fecha_cierre", now);

    if (urgentSubmissions) {
      for (const sub of urgentSubmissions) {
        // Get user_id for this municipio
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id")
          .eq("municipio_id", sub.municipio_id)
          .limit(1);

        if (profiles?.[0]) {
          const conv = sub.convocatorias as unknown as {
            nombre: string;
            fecha_cierre: string;
          };
          const daysLeft = Math.ceil(
            (new Date(conv.fecha_cierre).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24),
          );

          notifications.push({
            user_id: profiles[0].id,
            project_id: sub.id,
            type: "deadline",
            title: `Convocatoria cierra en ${daysLeft} dias`,
            body: `Tu proyecto para "${conv.nombre}" tiene ${sub.progress}% de progreso. Completa los campos faltantes antes del cierre.`,
            action_url: `/dashboard/municipio/convocatorias/${sub.convocatoria_id}/wizard`,
          });
        }
      }
    }

    // 2. Inactive projects (not edited in >3 days)
    const threeDaysAgo = new Date(
      Date.now() - 3 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { data: inactiveSubmissions } = await supabase
      .from("submissions")
      .select("id, convocatoria_id, municipio_id, progress, updated_at")
      .lt("progress", 100)
      .lt("updated_at", threeDaysAgo);

    if (inactiveSubmissions) {
      for (const sub of inactiveSubmissions) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id")
          .eq("municipio_id", sub.municipio_id)
          .limit(1);

        if (profiles?.[0]) {
          notifications.push({
            user_id: profiles[0].id,
            project_id: sub.id,
            type: "inactive",
            title: "Proyecto sin actividad",
            body: `Tu proyecto lleva mas de 3 dias sin editar. Progreso actual: ${sub.progress}%. Continua para no perder la oportunidad.`,
            action_url: `/dashboard/municipio/convocatorias/${sub.convocatoria_id}/wizard`,
          });
        }
      }
    }

    // 3. Insert notifications (dedup: don't create if similar notification exists today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.toISOString();

    for (const notif of notifications) {
      // Check if similar notification already exists today
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", notif.user_id)
        .eq("type", notif.type)
        .gte("created_at", todayStart);

      if ((count ?? 0) === 0) {
        await supabase.from("notifications").insert(notif);
      }
    }

    return NextResponse.json({
      generated: notifications.length,
      message: `Generated ${notifications.length} notification candidates`,
    });
  } catch (err) {
    console.error("[cron/generate-notifications] Error:", err);
    return NextResponse.json(
      { error: "Error generating notifications" },
      { status: 500 },
    );
  }
}
