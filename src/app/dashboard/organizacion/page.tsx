import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrganizacionEditForm } from "./edit-form-client";

export default async function OrganizacionPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  const { data: org, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("owner_id", profile.id)
    .single();

  if (!org) redirect("/dashboard/onboarding");

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Organizacion</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Administra la informacion de tu organizacion.
        </p>
      </div>

      {/* Current Info Card */}
      <Card variant="elevated" padding="lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Informacion General</CardTitle>
            <Badge status={org.type === "entity" ? "active" : "active"}>
              {org.type === "entity" ? "Entidad" : "Municipio"}
            </Badge>
          </div>
          <CardDescription>
            Estos datos identifican tu organizacion en la plataforma Polytech.
          </CardDescription>
        </CardHeader>

        {/* Read-only summary */}
        <div className="mb-6 grid grid-cols-1 gap-4 rounded-[var(--radius-input)] bg-bg-app p-4 sm:grid-cols-2">
          <SummaryItem label="Nombre" value={org.name} />
          <SummaryItem label="Tipo" value={org.type === "entity" ? "Entidad" : "Municipio"} />
          <SummaryItem label="NIT" value={org.nit || "No registrado"} />
          <SummaryItem label="Departamento" value={org.department || "No registrado"} />
          <SummaryItem label="Municipio" value={org.municipality || "No registrado"} />
          <SummaryItem
            label="Miembro desde"
            value={new Date(org.created_at).toLocaleDateString("es-CO", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          />
        </div>

        {/* Edit Form */}
        <div className="border-t border-border pt-6">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Editar Informacion</h3>
          <OrganizacionEditForm
            orgId={org.id}
            defaultValues={{
              name: org.name,
              nit: org.nit ?? "",
              municipality: org.municipality ?? "",
              department: org.department ?? "",
            }}
          />
        </div>
      </Card>

      {/* Danger Zone */}
      <Card variant="default" padding="lg" className="border-danger/20">
        <CardHeader>
          <CardTitle className="text-danger">Zona de Peligro</CardTitle>
          <CardDescription>
            Estas acciones son irreversibles. Ten cuidado al realizarlas.
          </CardDescription>
        </CardHeader>
        <p className="text-sm text-text-muted">
          Si necesitas eliminar tu organizacion o transferir la propiedad, contacta al equipo de soporte de Polytech.
        </p>
      </Card>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-text-primary">{value}</p>
    </div>
  );
}
