import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AnalyticsDashboard } from "./analytics-client";

export default async function AnaliticasPage() {
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
    .select("id, convocatoria_id, progress, status, data_json, created_at, updated_at, completed_at")
    .eq("municipio_id", profile.municipio_id)
    .order("created_at", { ascending: false });

  // Fetch evaluations
  const { data: evaluations } = await supabase
    .from("evaluations")
    .select("*")
    .eq("municipio_id", profile.municipio_id)
    .order("created_at", { ascending: false });

  // Fetch convocatoria names
  const convIds = [...new Set((submissions ?? []).map((s) => s.convocatoria_id))];
  const { data: convocatorias } = convIds.length > 0
    ? await supabase
        .from("convocatorias")
        .select("id, nombre")
        .in("id", convIds)
    : { data: [] };

  const convMap: Record<string, string> = {};
  for (const c of convocatorias ?? []) {
    convMap[c.id] = c.nombre;
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
          Analiticas de desempeno
        </h1>
        <p className="mt-1 text-[13px] text-text-muted">
          Visualiza tu trayectoria de mejora y patrones de desempeno.
        </p>
      </div>

      <AnalyticsDashboard
        submissions={(submissions ?? []) as Array<{
          id: string;
          convocatoria_id: string;
          progress: number;
          status: string;
          created_at: string;
          updated_at: string;
        }>}
        evaluations={(evaluations ?? []) as Array<{
          id: string;
          submission_id: string;
          convocatoria_id: string;
          total_score: number;
          max_score: number;
          scores_json: Array<{
            campo_id: string;
            campo_nombre: string;
            score: number;
            max_score: number;
          }>;
          created_at: string;
        }>}
        convocatoriaNames={convMap}
      />
    </div>
  );
}
