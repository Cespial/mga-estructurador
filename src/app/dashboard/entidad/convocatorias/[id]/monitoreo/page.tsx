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
} from "@/lib/types/database";

interface MunicipioMonitorRow {
  municipio: Municipio;
  assignment: ConvocatoriaMunicipio;
  submission: Submission | null;
  perEtapa: { etapaId: string; nombre: string; progress: number }[];
}

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

  if (!conv) notFound();
  const convocatoria = conv as Convocatoria;

  // Fetch template
  const { data: tmpl } = await supabase
    .from("mga_templates")
    .select("*")
    .eq("convocatoria_id", id)
    .single();

  const template = tmpl as MgaTemplate | null;
  const etapas = template?.etapas_json ?? [];

  // Fetch assigned municipios
  const { data: assignments } = await supabase
    .from("convocatoria_municipios")
    .select("*, municipios(*)")
    .eq("convocatoria_id", id);

  const assignmentList = (assignments ?? []) as (ConvocatoriaMunicipio & { municipios: Municipio })[];

  // Fetch all submissions for this convocatoria
  const { data: submissions } = await supabase
    .from("submissions")
    .select("*")
    .eq("convocatoria_id", id);

  const submissionsByMunicipio = new Map<string, Submission>();
  for (const sub of (submissions ?? []) as Submission[]) {
    submissionsByMunicipio.set(sub.municipio_id, sub);
  }

  // Build monitoring rows
  const rows: MunicipioMonitorRow[] = assignmentList.map((a) => {
    const sub = submissionsByMunicipio.get(a.municipio_id) ?? null;
    const perEtapa = etapas.map((etapa) => {
      const requiredFields = etapa.campos.filter((c) => c.requerido);
      if (requiredFields.length === 0) {
        return { etapaId: etapa.id, nombre: etapa.nombre, progress: 0 };
      }
      const filled = sub
        ? requiredFields.filter(
            (c) => sub.data_json[c.id]?.trim(),
          ).length
        : 0;
      return {
        etapaId: etapa.id,
        nombre: etapa.nombre,
        progress: Math.round((filled / requiredFields.length) * 100),
      };
    });
    return {
      municipio: a.municipios,
      assignment: a,
      submission: sub,
      perEtapa,
    };
  });

  const avgProgress =
    rows.length > 0
      ? Math.round(
          rows.reduce((acc, r) => acc + (r.submission?.progress ?? 0), 0) /
            rows.length,
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
          <h2 className="text-xl font-semibold text-gray-900">
            Monitoreo de avance
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {convocatoria.nombre}
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-blue-600">{avgProgress}%</p>
          <p className="text-xs text-gray-400">avance promedio</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-500">
            No hay municipios asignados a esta convocatoria.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Municipio
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                  Estado
                </th>
                {etapas.map((etapa) => (
                  <th
                    key={etapa.id}
                    className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    {etapa.nombre}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((row) => (
                <tr key={row.municipio.id}>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">
                      {row.municipio.nombre}
                    </p>
                    <p className="text-xs text-gray-400">
                      {row.municipio.departamento}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.submission ? (
                      <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        En curso
                      </span>
                    ) : (
                      <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                        Sin iniciar
                      </span>
                    )}
                  </td>
                  {row.perEtapa.map((ep) => (
                    <td key={ep.etapaId} className="px-3 py-3 text-center">
                      <ProgressPill value={ep.progress} />
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-bold text-gray-900">
                      {Math.round(row.submission?.progress ?? 0)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ProgressPill({ value }: { value: number }) {
  let bg = "bg-gray-100 text-gray-500";
  if (value === 100) bg = "bg-green-100 text-green-700";
  else if (value > 0) bg = "bg-yellow-100 text-yellow-700";

  return (
    <span
      className={`inline-block min-w-[2.5rem] rounded-full px-2 py-0.5 text-xs font-medium ${bg}`}
    >
      {value}%
    </span>
  );
}
