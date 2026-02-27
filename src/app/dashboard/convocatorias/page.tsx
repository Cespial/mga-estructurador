import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export default async function ConvocatoriasPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  // Get user's organization
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("owner_id", profile.id)
    .single();

  if (!org) redirect("/dashboard/onboarding");

  // Fetch convocatorias with project count
  const { data: convocatorias, error } = await supabase
    .from("convocatorias_v2")
    .select("*, projects(count)")
    .eq("organization_id", org.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching convocatorias:", error);
  }

  const items = convocatorias ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Convocatorias</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Gestiona tus convocatorias y evalua los proyectos recibidos.
          </p>
        </div>
        <Link href="/dashboard/convocatorias/nueva">
          <Button variant="primary" size="md">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Crear Convocatoria
          </Button>
        </Link>
      </div>

      {/* Content */}
      {items.length === 0 ? (
        <EmptyState
          icon={
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          }
          title="No tienes convocatorias"
          description="Crea tu primera convocatoria para comenzar a recibir proyectos de municipios."
          action={
            <Link href="/dashboard/convocatorias/nueva">
              <Button variant="primary" size="lg">
                Crear primera convocatoria
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 stagger-children">
          {items.map((conv) => {
            const projectCount =
              Array.isArray(conv.projects) && conv.projects.length > 0
                ? (conv.projects[0] as { count: number }).count
                : 0;

            return (
              <Link key={conv.id} href={`/dashboard/convocatorias/${conv.id}`}>
                <Card variant="interactive" padding="lg" className="h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="line-clamp-2">{conv.name}</CardTitle>
                      <Badge status={conv.status} />
                    </div>
                    {conv.description && (
                      <CardDescription className="line-clamp-2">{conv.description}</CardDescription>
                    )}
                  </CardHeader>

                  <div className="space-y-3">
                    {/* Budget */}
                    {conv.budget && (
                      <div className="flex items-center gap-2 text-sm">
                        <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-text-secondary">
                          ${Number(conv.budget).toLocaleString("es-CO")}
                        </span>
                      </div>
                    )}

                    {/* Dates */}
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                      <span className="text-text-secondary">
                        {conv.open_date
                          ? new Date(conv.open_date).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })
                          : "Sin fecha de apertura"}
                      </span>
                    </div>

                    {/* Project count */}
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                      </svg>
                      <span className="text-text-secondary">
                        {projectCount} {projectCount === 1 ? "proyecto" : "proyectos"}
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-3 border-t border-border">
                    <p className="text-xs text-text-muted">
                      Creada el {new Date(conv.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
