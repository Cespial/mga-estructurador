import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createProjectForConvocatoria } from "./actions";

export default async function AplicarConvocatoriaPage({
  params,
}: {
  params: Promise<{ convocatoriaId: string }>;
}) {
  const { convocatoriaId } = await params;
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  // Get user's organization
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("owner_id", profile.id)
    .single();

  if (!org) {
    redirect("/dashboard/onboarding");
  }

  // Check if user already has a project for this convocatoria
  const { data: existing } = await supabase
    .from("projects")
    .select("id")
    .eq("convocatoria_id", convocatoriaId)
    .eq("organization_id", org.id)
    .single();

  if (existing) {
    redirect(`/dashboard/proyectos/${existing.id}/wizard`);
  }

  // Fetch convocatoria to display confirmation
  const { data: convocatoria } = await supabase
    .from("convocatorias_v2")
    .select("id, name, description, status, close_date, budget")
    .eq("id", convocatoriaId)
    .single();

  if (!convocatoria) {
    redirect("/dashboard/convocatorias/explorar");
  }

  return (
    <div className="mx-auto max-w-xl py-12 animate-fade-in">
      <div className="text-center mb-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-muted text-accent mb-4">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-text-primary">Aplicar a Convocatoria</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Vas a crear un nuevo proyecto para esta convocatoria.
        </p>
      </div>

      <div className="card-premium p-6 mb-6">
        <h2 className="text-lg font-semibold text-text-primary">{convocatoria.name}</h2>
        {convocatoria.description && (
          <p className="mt-2 text-sm text-text-secondary line-clamp-3">
            {convocatoria.description}
          </p>
        )}
        <div className="mt-4 flex items-center gap-4 text-xs text-text-muted">
          {convocatoria.budget && (
            <span>Presupuesto: ${Number(convocatoria.budget).toLocaleString("es-CO")}</span>
          )}
          {convocatoria.close_date && (
            <span>Cierre: {new Date(convocatoria.close_date).toLocaleDateString("es-CO")}</span>
          )}
        </div>
      </div>

      <div className="card-premium p-5 mb-6">
        <h3 className="text-sm font-semibold text-text-primary mb-3">El asistente te guiara en:</h3>
        <div className="space-y-2">
          {[
            "Identificacion y descripcion del proyecto",
            "Presupuesto y fuentes de financiacion",
            "Impacto y beneficiarios",
            "Cronograma de actividades",
            "Documentos de soporte",
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-muted text-accent text-xs font-bold">
                {i + 1}
              </div>
              <span className="text-sm text-text-secondary">{step}</span>
            </div>
          ))}
        </div>
      </div>

      <form
        action={async () => {
          "use server";
          await createProjectForConvocatoria(convocatoriaId);
        }}
      >
        <button
          type="submit"
          className="w-full rounded-[var(--radius-button)] bg-accent px-6 py-3 text-base font-semibold text-white hover:bg-accent-hover transition-all duration-200 shadow-lg hover:shadow-xl glow-accent"
        >
          Comenzar Estructuracion con IA
        </button>
      </form>
    </div>
  );
}
