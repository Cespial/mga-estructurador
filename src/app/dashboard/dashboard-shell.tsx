"use client";

import { type ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";

interface DashboardShellProps {
  children: ReactNode;
  userName: string;
  userEmail: string;
  orgType?: "entity" | "municipality";
}

export function DashboardShell({ children, userName, userEmail, orgType }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-bg-app">
      <Sidebar userName={userName} userEmail={userEmail} orgType={orgType} />
      <main className="ml-64">
        {/* Header bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-white/80 backdrop-blur-sm px-6 py-3">
          <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {orgType === "entity" ? "Entidad" : orgType === "municipality" ? "Municipio" : ""}
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-success" />
            <span className="text-xs text-text-muted">Conectado</span>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
