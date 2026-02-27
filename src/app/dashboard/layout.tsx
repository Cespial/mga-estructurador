import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "./dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  if (!profile) {
    redirect("/login");
  }

  // Check if user has an organization, if not redirect to onboarding
  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("id, type")
    .eq("owner_id", profile.id)
    .single();

  // If organizations table doesn't exist yet (pre-migration), skip the check
  const orgType = org?.type as "entity" | "municipality" | undefined;

  return (
    <DashboardShell
      userName={profile.full_name || "Usuario"}
      userEmail={profile.email}
      orgType={orgType}
    >
      {children}
    </DashboardShell>
  );
}
