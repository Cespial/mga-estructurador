import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreateConvocatoriaForm } from "./create-form-client";

export default async function NuevaConvocatoriaPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("owner_id", profile.id)
    .single();

  if (!org) redirect("/dashboard/onboarding");

  return (
    <div className="mx-auto max-w-2xl space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-text-primary">Nueva Convocatoria</h1>
        <p className="mt-1 text-[13px] text-text-muted">
          Configura los detalles basicos de tu convocatoria. Podras agregar la rubrica y formularios despues.
        </p>
      </div>

      <Card variant="elevated" padding="lg">
        <CardHeader>
          <CardTitle>Informacion General</CardTitle>
          <CardDescription>
            Completa los campos requeridos para crear tu convocatoria.
          </CardDescription>
        </CardHeader>
        <CreateConvocatoriaForm />
      </Card>
    </div>
  );
}
