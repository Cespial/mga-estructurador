import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import type { Convocatoria, MgaTemplate, Submission, Evaluation } from "@/lib/types/database";

export default async function MunicipioConvocatoriaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getProfile();
  if (!profile || profile.role !== "municipio_user") {
    redirect("/dashboard");
  }

  const { id } = await params;
  const supabase = await createClient();

  const { data: conv } = await supabase
    .from("convocatorias")
    .select("*")
    .eq("id", id)
    .single();

  if (!conv) notFound();
  const convocatoria = conv as Convocatoria;

  const { data: template } = await supabase
    .from("mga_templates")
    .select("*")
    .eq("convocatoria_id", id)
    .maybeSingle();

  const mgaTemplate = template as MgaTemplate | null;
  const etapas = mgaTemplate?.etapas_json ?? [];

  // Get existing submission if any
  const { data: sub } = await supabase
    .from("submissions")
    .select("*")
    .eq("convocatoria_id", id)
    .maybeSingle();

  const submission = sub as Submission | null;

  // Fetch evaluations for this submission
  const evalMap = new Map<string, Evaluation>();
  if (submission) {
    const { data: evals } = await supabase
      .from("evaluations")
      .select("*")
      .eq("submission_id", submission.id);

    for (const ev of (evals ?? []) as Evaluation[]) {
      evalMap.set(ev.etapa_id, ev);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-fade-in">
      <div>
        <Link
          href="/dashboard/municipio"
          className="text-[12px] text-accent hover:text-accent-hover transition-colors"
        >
          &larr; Volver al panel
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-text-primary">
            {convocatoria.nombre}
          </h1>
          {convocatoria.descripcion && (
            <p className="mt-2 text-[13px] text-text-muted">
              {convocatoria.descripcion}
            </p>
          )}
        </div>
        {etapas.length > 0 && convocatoria.estado === "abierta" && (
          <Link href={`/dashboard/municipio/convocatorias/${id}/wizard`}>
            <Button variant="primary">
              {submission ? "Continuar diligenciamiento" : "Comenzar MGA"}
            </Button>
          </Link>
        )}
      </div>

      {convocatoria.requisitos && (
        <div className="rounded-[8px] border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-amber-700">
            Requisitos
          </p>
          <p className="mt-1 text-[13px] text-amber-800">
            {convocatoria.requisitos}
          </p>
        </div>
      )}

      <div className="flex items-center gap-4 text-[13px] text-text-muted">
        {convocatoria.fecha_inicio && (
          <span>Inicio: {convocatoria.fecha_inicio}</span>
        )}
        {convocatoria.fecha_cierre && (
          <span>Cierre: {convocatoria.fecha_cierre}</span>
        )}
      </div>

      {/* Progress summary */}
      {submission && (
        <div className="card-premium px-5 py-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
              Tu progreso
            </p>
            <p className="text-[22px] font-semibold tracking-tight text-accent tabular-nums">
              {Math.round(submission.progress)}%
            </p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-bg-elevated">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${submission.progress}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-[11px] text-text-muted">
              Ultima actualizacion:{" "}
              {new Date(submission.updated_at).toLocaleString("es-CO")}
            </p>
            <a
              href={`/api/submissions/${submission.id}/pdf`}
              download
              aria-label="Descargar resumen en PDF"
              className="rounded-[var(--radius-button)] border border-accent/20 bg-accent/5 px-3 py-1.5 text-[11px] font-medium text-accent hover:bg-accent/10 transition-colors"
            >
              Descargar PDF
            </a>
          </div>
        </div>
      )}

      {/* MGA Etapas overview */}
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted mb-4">Etapas MGA</p>

        {etapas.length === 0 ? (
          <p className="text-[13px] text-text-muted">
            La entidad aun no ha configurado las etapas para esta convocatoria.
          </p>
        ) : (
          <div className="space-y-2">
            {etapas.map((etapa) => {
              const requiredFields = etapa.campos.filter((c) => c.requerido);
              const filledRequired = submission
                ? requiredFields.filter(
                    (c) => String(submission.data_json[c.id] ?? "").trim(),
                  ).length
                : 0;
              const etapaProgress =
                requiredFields.length > 0
                  ? Math.round(
                      (filledRequired / requiredFields.length) * 100,
                    )
                  : 0;

              const evaluation = evalMap.get(etapa.id);

              return (
                <div
                  key={etapa.id}
                  className="card-premium"
                >
                  <div className="flex items-center gap-3 px-5 py-3.5">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                        etapaProgress === 100
                          ? "bg-emerald-50 text-emerald-600"
                          : etapaProgress > 0
                            ? "bg-amber-50 text-amber-600"
                            : "bg-bg-elevated text-text-muted"
                      }`}
                    >
                      {etapaProgress === 100 ? "\u2713" : etapa.orden}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-text-primary">
                        {etapa.nombre}
                      </p>
                      <p className="text-[11px] text-text-muted">
                        {etapa.campos.length} campos
                        {requiredFields.length > 0 &&
                          ` (${filledRequired}/${requiredFields.length} requeridos)`}
                      </p>
                    </div>
                    {evaluation && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                          evaluation.total_score >= 80
                            ? "bg-emerald-50 text-emerald-600"
                            : evaluation.total_score >= 60
                              ? "bg-amber-50 text-amber-600"
                              : evaluation.total_score >= 40
                                ? "bg-orange-50 text-orange-600"
                                : "bg-red-50 text-red-600"
                        }`}
                      >
                        {Math.round(evaluation.total_score)}pts
                      </span>
                    )}
                    <div className="w-20">
                      <div className="h-1.5 overflow-hidden rounded-full bg-bg-elevated">
                        <div
                          className={`h-full rounded-full transition-all ${
                            etapaProgress === 100
                              ? "bg-emerald-500"
                              : "bg-accent"
                          }`}
                          style={{ width: `${etapaProgress}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-10 text-right text-[11px] text-text-muted tabular-nums">
                      {etapaProgress}%
                    </span>
                  </div>

                  {/* Evaluation feedback */}
                  {evaluation && evaluation.recomendaciones.length > 0 && (
                    <div className="border-t border-border px-5 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-accent">
                        Recomendaciones
                      </p>
                      <ul className="mt-1 space-y-0.5">
                        {evaluation.recomendaciones.map((rec, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-1.5 text-[12px] text-text-secondary"
                          >
                            <span className="mt-0.5 text-accent">
                              &bull;
                            </span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
