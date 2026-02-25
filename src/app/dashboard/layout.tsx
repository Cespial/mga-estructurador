import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile, getRoleLabel } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();

  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-gray-900">
              Estructurador MGA
            </h1>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
              {getRoleLabel(profile.role)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/ayuda"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Ayuda
            </Link>
            <span className="text-sm text-gray-600">
              {profile.full_name || profile.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
