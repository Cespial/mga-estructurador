import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { PolytechConvocatoria, Organization } from "@/lib/types/database";

interface ConvocatoriaWithOrg extends PolytechConvocatoria {
  organizations: Pick<Organization, "id" | "name"> | null;
}

export default async function ExplorarConvocatoriasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  // Build query
  let query = supabase
    .from("convocatorias_v2")
    .select("*, organizations(id, name)")
    .order("created_at", { ascending: false });

  // Filter by status (default: show open)
  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  // Search by name
  if (params.q) {
    query = query.ilike("name", `%${params.q}%`);
  }

  const { data: convocatorias } = await query;
  const items = (convocatorias ?? []) as ConvocatoriaWithOrg[];

  const activeStatus = params.status ?? "all";

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-text-primary">Explorar Convocatorias</h1>
        <p className="mt-1 text-[13px] text-text-muted">
          Encuentra convocatorias abiertas y comienza a estructurar tus proyectos.
        </p>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <form className="flex-1" method="GET">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              type="text"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Buscar convocatorias..."
              className="block w-full rounded-[var(--radius-input)] border border-border bg-bg-input pl-10 pr-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted transition-colors duration-200 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/8"
            />
            {params.status && (
              <input type="hidden" name="status" value={params.status} />
            )}
          </div>
        </form>

        {/* Status filter pills */}
        <div className="flex items-center gap-2">
          {[
            { value: "all", label: "Todas" },
            { value: "open", label: "Abiertas" },
            { value: "closed", label: "Cerradas" },
            { value: "evaluating", label: "En evaluacion" },
          ].map((filter) => (
            <Link
              key={filter.value}
              href={`/dashboard/convocatorias/explorar?status=${filter.value}${params.q ? `&q=${params.q}` : ""}`}
              className={`rounded-full px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.04em] transition-all duration-200 ${
                activeStatus === filter.value
                  ? "bg-accent text-white shadow-sm"
                  : "bg-bg-elevated text-text-muted hover:bg-border hover:text-text-secondary"
              }`}
            >
              {filter.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Results */}
      {items.length === 0 ? (
        <EmptyState
          icon={
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
              />
            </svg>
          }
          title="No se encontraron convocatorias"
          description={
            params.q
              ? `No hay resultados para "${params.q}". Intenta con otros terminos de busqueda.`
              : "No hay convocatorias disponibles en este momento."
          }
          action={
            params.q ? (
              <Link href="/dashboard/convocatorias/explorar">
                <Button variant="secondary">Limpiar busqueda</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 stagger-children">
          {items.map((conv) => {
            const isOpen = conv.status === "open";
            const daysLeft = conv.close_date
              ? Math.max(
                  0,
                  Math.ceil(
                    (new Date(conv.close_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  )
                )
              : null;

            return (
              <Card key={conv.id} variant="interactive" padding="none" className="group flex flex-col">
                <div className="px-6 pt-5 pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-accent/8 text-accent shrink-0">
                      <svg
                        className="h-[18px] w-[18px]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                        />
                      </svg>
                    </div>
                    <Badge status={conv.status} />
                  </div>

                  <h3 className="text-[15px] font-semibold text-text-primary line-clamp-2 group-hover:text-accent transition-colors">
                    {conv.name}
                  </h3>

                  {conv.organizations && (
                    <p className="mt-1 text-[11px] uppercase tracking-[0.04em] text-text-muted">
                      {conv.organizations.name}
                    </p>
                  )}

                  {conv.description && (
                    <p className="mt-2 text-[13px] text-text-secondary line-clamp-3 flex-1">
                      {conv.description}
                    </p>
                  )}
                </div>

                <div className="mt-auto border-t border-border px-6 py-3 flex items-center justify-between text-[11px] text-text-muted">
                  <div className="flex items-center gap-3">
                    {conv.budget && (
                      <span className="tabular-nums">${Number(conv.budget).toLocaleString("es-CO")}</span>
                    )}
                    {daysLeft !== null && isOpen && (
                      <span className={daysLeft <= 7 ? "text-warning font-medium" : ""}>
                        {daysLeft} dias restantes
                      </span>
                    )}
                    {conv.close_date && !isOpen && (
                      <span>
                        Cierre:{" "}
                        {new Date(conv.close_date).toLocaleDateString("es-CO")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Apply button */}
                <div className="px-6 pb-5">
                  {isOpen ? (
                    <Link href={`/dashboard/proyectos/aplicar/${conv.id}`} className="block">
                      <button className="w-full rounded-[var(--radius-button)] bg-accent px-4 py-2.5 text-[13px] font-medium text-white hover:bg-accent-hover transition-all duration-200">
                        Aplicar
                      </button>
                    </Link>
                  ) : (
                    <Link href={`/dashboard/convocatorias/${conv.id}`} className="block">
                      <button className="w-full rounded-[var(--radius-button)] border border-border px-4 py-2.5 text-[13px] font-medium text-text-secondary hover:bg-bg-hover transition-all duration-200">
                        Ver detalles
                      </button>
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
