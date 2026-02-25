import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
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
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href="/dashboard/municipio"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          &larr; Volver al panel
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {convocatoria.nombre}
          </h2>
          {convocatoria.descripcion && (
            <p className="mt-2 text-sm text-gray-600">
              {convocatoria.descripcion}
            </p>
          )}
        </div>
        {etapas.length > 0 && convocatoria.estado === "abierta" && (
          <Link
            href={`/dashboard/municipio/convocatorias/${id}/wizard`}
            className="shrink-0 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {submission ? "Continuar diligenciamiento" : "Comenzar MGA"}
          </Link>
        )}
      </div>

      {convocatoria.requisitos && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-medium uppercase text-amber-700">
            Requisitos
          </p>
          <p className="mt-1 text-sm text-amber-800">
            {convocatoria.requisitos}
          </p>
        </div>
      )}

      <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
        {convocatoria.fecha_inicio && (
          <span>Inicio: {convocatoria.fecha_inicio}</span>
        )}
        {convocatoria.fecha_cierre && (
          <span>Cierre: {convocatoria.fecha_cierre}</span>
        )}
      </div>

      {/* Progress summary */}
      {submission && (
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">
              Tu progreso
            </p>
            <p className="text-lg font-bold text-blue-600">
              {Math.round(submission.progress)}%
            </p>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${submission.progress}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Última actualización:{" "}
              {new Date(submission.updated_at).toLocaleString("es-CO")}
            </p>
            <a
              href={`/api/submissions/${submission.id}/pdf`}
              download
              aria-label="Descargar resumen en PDF"
              className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
            >
              Descargar PDF
            </a>
          </div>
        </div>
      )}

      {/* MGA Etapas overview */}
      <div className="mt-6">
        <h3 className="text-base font-semibold text-gray-900">Etapas MGA</h3>

        {etapas.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">
            La entidad aún no ha configurado las etapas para esta convocatoria.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
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
                  className="rounded-lg border border-gray-200 bg-white"
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        etapaProgress === 100
                          ? "bg-green-100 text-green-700"
                          : etapaProgress > 0
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {etapaProgress === 100 ? "\u2713" : etapa.orden}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {etapa.nombre}
                      </p>
                      <p className="text-xs text-gray-400">
                        {etapa.campos.length} campos
                        {requiredFields.length > 0 &&
                          ` (${filledRequired}/${requiredFields.length} requeridos)`}
                      </p>
                    </div>
                    {evaluation && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          evaluation.total_score >= 80
                            ? "bg-green-100 text-green-700"
                            : evaluation.total_score >= 60
                              ? "bg-yellow-100 text-yellow-700"
                              : evaluation.total_score >= 40
                                ? "bg-orange-100 text-orange-700"
                                : "bg-red-100 text-red-700"
                        }`}
                      >
                        {Math.round(evaluation.total_score)}pts
                      </span>
                    )}
                    <div className="w-20">
                      <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`h-full rounded-full transition-all ${
                            etapaProgress === 100
                              ? "bg-green-500"
                              : "bg-blue-500"
                          }`}
                          style={{ width: `${etapaProgress}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-10 text-right text-xs text-gray-500">
                      {etapaProgress}%
                    </span>
                  </div>

                  {/* Evaluation feedback */}
                  {evaluation && evaluation.recomendaciones.length > 0 && (
                    <div className="border-t border-gray-100 px-4 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600">
                        Recomendaciones
                      </p>
                      <ul className="mt-1 space-y-0.5">
                        {evaluation.recomendaciones.map((rec, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-1.5 text-xs text-gray-700"
                          >
                            <span className="mt-0.5 text-indigo-400">
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
