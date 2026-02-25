import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type {
  Convocatoria,
  MgaTemplate,
  Municipio,
  Submission,
  ConvocatoriaMunicipio,
  Evaluation,
  Rubric,
} from "@/lib/types/database";
import { toRow, toRows } from "@/lib/supabase/helpers";
import { MonitoreoTable } from "./monitoreo-table";
import { HelpButton } from "@/components/help-button";

export default async function MonitoreoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getProfile();
  if (!profile || profile.role !== "entidad_admin") {
    redirect("/dashboard");
  }

  const { id } = await params;
  const supabase = await createClient();

  const { data: conv } = await supabase
    .from("convocatorias")
    .select("*")
    .eq("id", id)
    .single();

  const convocatoria = toRow<Convocatoria>(conv);
  if (!convocatoria) notFound();

  // Fetch template
  const { data: tmpl } = await supabase
    .from("mga_templates")
    .select("*")
    .eq("convocatoria_id", id)
    .maybeSingle();

  const template = toRow<MgaTemplate>(tmpl);
  const etapas = template?.etapas_json ?? [];

  // Fetch rubric
  const { data: rubricData } = await supabase
    .from("rubrics")
    .select("*")
    .eq("convocatoria_id", id)
    .maybeSingle();
  const rubric = toRow<Rubric>(rubricData);
  const hasRubric = (rubric?.criterios_json?.length ?? 0) > 0;

  // Fetch assigned municipios
  const { data: assignments } = await supabase
    .from("convocatoria_municipios")
    .select("*, municipios(*)")
    .eq("convocatoria_id", id);

  const assignmentList = toRows<ConvocatoriaMunicipio & { municipios: Municipio }>(assignments);

  // Fetch all submissions for this convocatoria
  const { data: submissions } = await supabase
    .from("submissions")
    .select("*")
    .eq("convocatoria_id", id);

  const submissionsByMunicipio = new Map<string, Submission>();
  for (const sub of toRows<Submission>(submissions)) {
    submissionsByMunicipio.set(sub.municipio_id, sub);
  }

  // Fetch all evaluations
  const { data: evaluations } = await supabase
    .from("evaluations")
    .select("*")
    .eq("convocatoria_id", id);

  // Map evaluations by submission_id + etapa_id
  const evalMap = new Map<string, Evaluation>();
  for (const ev of toRows<Evaluation>(evaluations)) {
    evalMap.set(`${ev.submission_id}:${ev.etapa_id}`, ev);
  }

  // Compute totalPeso per etapa from rubric criterios
  const criterios = rubric?.criterios_json ?? [];
  const campoToEtapa = new Map<string, string>();
  for (const etapa of etapas) {
    for (const campo of etapa.campos) {
      campoToEtapa.set(campo.id, etapa.id);
    }
  }

  const etapaTotalPeso = new Map<string, number>();
  for (const c of criterios) {
    const etapaId = campoToEtapa.get(c.campo_id);
    if (etapaId) {
      etapaTotalPeso.set(etapaId, (etapaTotalPeso.get(etapaId) ?? 0) + c.peso);
    }
  }

  // Build monitoring rows
  const rows = assignmentList.map((a) => {
    const sub = submissionsByMunicipio.get(a.municipio_id) ?? null;
    const perEtapa = etapas.map((etapa) => {
      const requiredFields = etapa.campos.filter((c) => c.requerido);
      let progress = 0;
      if (requiredFields.length > 0 && sub) {
        const filled = requiredFields.filter(
          (c) => String(sub.data_json[c.id] ?? "").trim(),
        ).length;
        progress = Math.round((filled / requiredFields.length) * 100);
      }

      const evaluation = sub
        ? evalMap.get(`${sub.id}:${etapa.id}`) ?? null
        : null;

      return {
        etapaId: etapa.id,
        nombre: etapa.nombre,
        progress,
        score: evaluation?.total_score ?? null,
        totalPeso: etapaTotalPeso.get(etapa.id) ?? 0,
        scoresJson: evaluation?.scores_json ?? null,
        recomendaciones: evaluation?.recomendaciones ?? [],
      };
    });

    return {
      municipio: a.municipios,
      assignmentEstado: a.estado,
      submissionId: sub?.id ?? null,
      overallProgress: sub?.progress ?? 0,
      perEtapa,
    };
  });

  const avgProgress =
    rows.length > 0
      ? Math.round(
          rows.reduce((acc, r) => acc + r.overallProgress, 0) / rows.length,
        )
      : 0;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <Link
          href={`/dashboard/entidad/convocatorias/${id}`}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          &larr; Volver a {convocatoria.nombre}
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">
              Monitoreo de avance
            </h2>
            <HelpButton section="monitoreo" label="Ayuda con monitoreo" />
          </div>
          <p className="mt-1 text-sm text-gray-500">{convocatoria.nombre}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-blue-600">{avgProgress}%</p>
          <p className="text-xs text-gray-400">avance promedio</p>
        </div>
      </div>

      {!hasRubric && (
        <div className="mt-4 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-700">
          No hay rúbrica definida.{" "}
          <Link
            href={`/dashboard/entidad/convocatorias/${id}/rubricas`}
            className="font-medium text-amber-800 underline"
          >
            Definir rúbrica
          </Link>{" "}
          para habilitar evaluaciones.
        </div>
      )}

      {rows.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-500">
            No hay municipios asignados a esta convocatoria.
          </p>
        </div>
      ) : (
        <div className="mt-6">
          <MonitoreoTable
            rows={rows}
            etapas={etapas.map((e) => ({ id: e.id, nombre: e.nombre }))}
            hasRubric={hasRubric}
          />
        </div>
      )}
    </div>
  );
}
