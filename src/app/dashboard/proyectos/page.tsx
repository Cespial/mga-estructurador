import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { Project, PublitecConvocatoria } from "@/lib/types/database";

interface ProjectWithConvocatoria extends Project {
  convocatorias_v2: Pick<PublitecConvocatoria, "id" | "name"> | null;
}

export default async function ProyectosPage() {
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

  // Fetch projects for the user's organization
  const { data: projects } = await supabase
    .from("projects")
    .select("*, convocatorias_v2(id, name)")
    .eq("organization_id", org.id)
    .order("created_at", { ascending: false });

  const items = (projects ?? []) as ProjectWithConvocatoria[];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Mis Proyectos</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Gestiona tus proyectos y aplica a nuevas convocatorias.
          </p>
        </div>
        <Link href="/dashboard/convocatorias/explorar">
          <Button variant="primary">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Aplicar a Convocatoria
          </Button>
        </Link>
      </div>

      {/* Projects Grid */}
      {items.length === 0 ? (
        <EmptyState
          icon={
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          }
          title="No tienes proyectos aun"
          description="Explora las convocatorias disponibles y comienza a estructurar tu primer proyecto con asistencia de IA."
          action={
            <Link href="/dashboard/convocatorias/explorar">
              <Button variant="primary" size="lg">
                Explorar Convocatorias
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 stagger-children">
          {items.map((project) => (
            <Link key={project.id} href={`/dashboard/proyectos/${project.id}`}>
              <Card variant="interactive" className="h-full group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-input)] bg-accent-muted text-accent shrink-0">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                    </svg>
                  </div>
                  <Badge status={project.status} />
                </div>

                <h3 className="text-base font-semibold text-text-primary line-clamp-2 group-hover:text-accent transition-colors">
                  {project.title || "Proyecto sin titulo"}
                </h3>

                {project.convocatorias_v2 && (
                  <p className="mt-1.5 text-xs text-text-muted line-clamp-1">
                    {project.convocatorias_v2.name}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-sm font-medium text-text-primary">
                    {project.budget_requested
                      ? `$${Number(project.budget_requested).toLocaleString("es-CO")}`
                      : "Sin presupuesto"}
                  </span>
                  <span className="text-xs text-text-muted">
                    {new Date(project.created_at).toLocaleDateString("es-CO", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {/* Continue wizard link for drafts */}
                {project.status === "draft" && (
                  <div className="mt-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent group-hover:underline">
                      Continuar estructuracion
                      <svg className="h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </span>
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
