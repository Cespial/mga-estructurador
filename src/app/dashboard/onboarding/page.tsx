import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { OnboardingForm } from "./onboarding-form-client";

export default async function OnboardingPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  // If user already has an org, redirect to dashboard
  const { data: existingOrg } = await supabase
    .from("organizations")
    .select("id")
    .eq("owner_id", profile.id)
    .single();

  if (existingOrg) redirect("/dashboard");

  return (
    <div className="flex min-h-[60vh] items-center justify-center animate-fade-in">
      <div className="w-full max-w-lg">
        {/* Logo / Welcome */}
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-muted text-accent mb-4">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Bienvenido a Publitec</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Configura tu organizacion para comenzar a usar la plataforma.
          </p>
        </div>

        <Card variant="elevated" padding="lg">
          <CardHeader>
            <CardTitle>Datos de la Organizacion</CardTitle>
            <CardDescription>
              Esta informacion se usara para identificar tu organizacion en la plataforma.
            </CardDescription>
          </CardHeader>
          <OnboardingForm />
        </Card>
      </div>
    </div>
  );
}
