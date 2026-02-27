import { type ReactNode } from "react";

type BadgeVariant = "default" | "accent" | "success" | "danger" | "warning" | "info";

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-white/8 text-text-secondary border-border",
  accent: "bg-accent-muted text-accent border-accent/20",
  success: "bg-success-muted text-success border-success/20",
  danger: "bg-danger-muted text-danger border-danger/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  info: "bg-info/10 text-info border-info/20",
};

// Map project/convocatoria statuses to badge variants
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
    <span className={`inline-flex items-center rounded-[var(--radius-pill)] border px-2.5 py-0.5 text-xs font-medium ${variantStyles[resolvedVariant]} ${className}`}>
      {label}
    </span>
  );
}
