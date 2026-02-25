import { redirect } from "next/navigation";
import { getProfile, getRoleDashboardPath } from "@/lib/auth";

export default async function DashboardPage() {
  const profile = await getProfile();

  if (!profile) {
    redirect("/login");
  }

  redirect(getRoleDashboardPath(profile.role));
}
