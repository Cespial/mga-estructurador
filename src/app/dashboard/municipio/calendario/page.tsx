import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CalendarClient } from "./calendar-client";

export default async function CalendarioPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "municipio_user") {
    redirect("/dashboard");
  }

  if (!profile.municipio_id) {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  // Fetch all convocatoria assignments with deadlines
  const { data: assignments } = await supabase
    .from("convocatoria_municipios")
    .select("*, convocatorias(id, nombre, fecha_inicio, fecha_cierre, estado)")
    .eq("municipio_id", profile.municipio_id)
    .order("created_at", { ascending: false });

  // Fetch revision requests with deadlines
  const { data: submissions } = await supabase
    .from("submissions")
    .select("id, convocatoria_id, status, progress")
    .eq("municipio_id", profile.municipio_id);

  const submissionIds = (submissions ?? []).map((s) => s.id);
  const { data: revisionRequests } =
    submissionIds.length > 0
      ? await supabase
          .from("revision_requests")
          .select("id, submission_id, deadline, status, round, created_at")
          .in("submission_id", submissionIds)
          .eq("status", "open")
      : { data: [] };

  // Build events
  interface CalendarEvent {
    id: string;
    title: string;
    date: string;
    type: "deadline" | "revision" | "start";
    convocatoriaId: string;
    progress?: number;
  }

  const events: CalendarEvent[] = [];

  for (const a of assignments ?? []) {
    const conv = a.convocatorias as {
      id: string;
      nombre: string;
      fecha_inicio: string | null;
      fecha_cierre: string | null;
      estado: string;
    };
    if (conv.fecha_cierre) {
      events.push({
        id: `deadline-${conv.id}`,
        title: conv.nombre,
        date: conv.fecha_cierre,
        type: "deadline",
        convocatoriaId: conv.id,
        progress: a.progress,
      });
    }
    if (conv.fecha_inicio) {
      events.push({
        id: `start-${conv.id}`,
        title: conv.nombre,
        date: conv.fecha_inicio,
        type: "start",
        convocatoriaId: conv.id,
      });
    }
  }

  for (const rr of revisionRequests ?? []) {
    if (rr.deadline) {
      const sub = submissions?.find((s) => s.id === rr.submission_id);
      const convId = sub?.convocatoria_id ?? "";
      const conv = (assignments ?? []).find(
        (a) =>
          (a.convocatorias as { id: string }).id === convId,
      );
      events.push({
        id: `revision-${rr.id}`,
        title: `Revision R${rr.round}: ${(conv?.convocatorias as { nombre: string })?.nombre ?? "Proyecto"}`,
        date: rr.deadline,
        type: "revision",
        convocatoriaId: convId,
      });
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Link
          href="/dashboard/municipio"
          className="text-[12px] text-accent hover:text-accent-hover transition-colors"
        >
          &larr; Volver al panel
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-tight text-text-primary">
          Calendario de Fechas
        </h1>
        <p className="mt-1 text-[13px] text-text-muted">
          Vista consolidada de deadlines, revisiones e hitos.
        </p>
      </div>

      <CalendarClient events={events} />
    </div>
  );
}
