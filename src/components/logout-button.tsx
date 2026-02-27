"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-[var(--radius-button)] border border-border px-3 py-1.5 text-sm text-text-secondary hover:bg-white/5 hover:text-text-primary transition-colors"
    >
      Cerrar sesion
    </button>
  );
}
