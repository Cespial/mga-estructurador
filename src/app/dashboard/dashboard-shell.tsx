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
      <main className="ml-[260px]">
        {/* Header — breadcrumb style, like reference */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-white/80 backdrop-blur-md px-8 py-3.5">
          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-text-muted">Dashboard</span>
            <span className="text-text-muted">&gt;</span>
            <span className="font-medium text-accent">
              {orgType === "entity" ? "Entidad" : orgType === "municipality" ? "Municipio" : "Overview"}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="h-2 w-2 rounded-full bg-success" />
            <span className="text-[12px] text-text-muted">Conectado</span>
          </div>
        </header>
        <div className="px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
