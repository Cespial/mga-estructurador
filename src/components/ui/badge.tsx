import { type ReactNode } from "react";

type BadgeVariant = "default" | "accent" | "success" | "danger" | "warning" | "info";

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-bg-app text-text-muted border-border",
  accent: "bg-accent/5 text-accent border-accent/20",
  success: "bg-emerald-50 text-emerald-700 border-emerald-100",
  danger: "bg-red-50 text-red-700 border-red-100",
  warning: "bg-amber-50 text-amber-700 border-amber-100",
  info: "bg-sky-50 text-sky-700 border-sky-100",
};

const statusVariantMap: Record<string, BadgeVariant> = {
  draft: "default",
  open: "success",
  closed: "danger",
  evaluating: "warning",
  resolved: "info",
  submitted: "accent",
  under_review: "warning",
  scored: "info",
  approved: "success",
  rejected: "danger",
  pending: "default",
  processing: "warning",
  completed: "success",
  failed: "danger",
  claimed: "warning",
  active: "success",
};

const statusLabelMap: Record<string, string> = {
  draft: "Borrador",
  open: "Abierta",
  closed: "Cerrada",
  evaluating: "Evaluando",
  resolved: "Resuelta",
  submitted: "Enviado",
  under_review: "En Revision",
  scored: "Calificado",
  approved: "Aprobado",
  rejected: "Rechazado",
  pending: "Pendiente",
  processing: "Procesando",
  completed: "Completado",
  failed: "Fallido",
  claimed: "Reclamado",
  active: "Activo",
};

interface BadgeProps {
  children?: ReactNode;
  variant?: BadgeVariant;
  status?: string;
  className?: string;
}

export function Badge({ children, variant, status, className = "" }: BadgeProps) {
  const resolvedVariant = variant ?? (status ? statusVariantMap[status] ?? "default" : "default");
  const label = children ?? (status ? statusLabelMap[status] ?? status : "");
  return (
    <span className={`inline-flex items-center rounded-[var(--radius-pill)] border px-2.5 py-0.5 text-[11px] font-medium ${variantStyles[resolvedVariant]} ${className}`}>
      {label}
    </span>
  );
}
