import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PortfolioClient } from "./portfolio-client";

export default async function PortafolioPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "municipio_user") {
    redirect("/dashboard");
  }

  if (!profile.municipio_id) {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  // Fetch all submissions for this municipio
  const { data: submissions } = await supabase
    .from("submissions")
    .select(
      "id, convocatoria_id, progress, status, created_at, updated_at, completed_at, submitted_at",
    )
    .eq("municipio_id", profile.municipio_id)
    .order("created_at", { ascending: false });

  // Fetch evaluations for scores
  const { data: evaluations } = await supabase
    .from("evaluations")
    .select("id, submission_id, total_score, max_score, created_at")
    .eq("municipio_id", profile.municipio_id)
    .order("created_at", { ascending: false });

  // Fetch convocatoria details
  const convIds = [
    ...new Set((submissions ?? []).map((s) => s.convocatoria_id)),
  ];
  const { data: convocatorias } =
    convIds.length > 0
      ? await supabase
          .from("convocatorias")
          .select("id, nombre, estado, fecha_cierre")
          .in("id", convIds)
      : { data: [] };

  const convMap: Record<
    string,
    { nombre: string; estado: string; fecha_cierre: string | null }
  > = {};
  for (const c of convocatorias ?? []) {
    convMap[c.id] = {
      nombre: c.nombre,
      estado: c.estado,
      fecha_cierre: c.fecha_cierre,
    };
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
          Mi Portafolio de Proyectos
        </h1>
        <p className="mt-1 text-[13px] text-text-muted">
          Vista unificada de todos tus proyectos en diferentes convocatorias.
        </p>
      </div>

      <PortfolioClient
        submissions={
          (submissions ?? []) as Array<{
            id: string;
            convocatoria_id: string;
            progress: number;
            status: string;
            created_at: string;
            updated_at: string;
            completed_at: string | null;
            submitted_at: string | null;
          }>
        }
        evaluations={
          (evaluations ?? []) as Array<{
            id: string;
            submission_id: string;
            total_score: number;
            max_score: number;
            created_at: string;
          }>
        }
        convocatoriaMap={convMap}
      />
    </div>
  );
}
