/**
 * Submission Status Machine
 *
 * State flow:
 *   draft → submitted → under_review → needs_revision → submitted (re-submit)
 *                                    → approved
 *                                    → rejected
 */

export type SubmissionStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "needs_revision"
  | "approved"
  | "rejected";

/** Valid transitions from each status */
const TRANSITIONS: Record<SubmissionStatus, SubmissionStatus[]> = {
  draft: ["submitted"],
  submitted: ["under_review"],
  under_review: ["needs_revision", "approved", "rejected"],
  needs_revision: ["submitted"], // re-submit after fixing
  approved: [],
  rejected: [],
};

/** Check if a status transition is valid */
export function canTransition(
  from: SubmissionStatus,
  to: SubmissionStatus,
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

/** Get valid next statuses from current status */
export function getNextStatuses(current: SubmissionStatus): SubmissionStatus[] {
  return TRANSITIONS[current] ?? [];
}

/** Whether the form should be locked (not editable) */
export function isFormLocked(status: SubmissionStatus): boolean {
  return status !== "draft" && status !== "needs_revision";
}

/** Whether this is a terminal/final status */
export function isTerminalStatus(status: SubmissionStatus): boolean {
  return status === "approved" || status === "rejected";
}

/** Status display metadata */
export interface StatusMeta {
  label: string;
  color: string; // tailwind color class
  bgColor: string;
  borderColor: string;
  description: string;
}

export const STATUS_META: Record<SubmissionStatus, StatusMeta> = {
  draft: {
    label: "Borrador",
    color: "text-slate-600",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
    description: "El proyecto esta en proceso de diligenciamiento.",
  },
  submitted: {
    label: "Enviado",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    description: "El proyecto fue enviado y espera revision.",
  },
  under_review: {
    label: "En revision",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    description: "Un evaluador esta revisando tu proyecto.",
  },
  needs_revision: {
    label: "Requiere cambios",
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    description: "La entidad solicito cambios. Revisa los comentarios y re-envia.",
  },
  approved: {
    label: "Aprobado",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    description: "Tu proyecto fue aprobado.",
  },
  rejected: {
    label: "No aprobado",
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    description: "Tu proyecto no fue aprobado en esta convocatoria.",
  },
};

/** Get the status badge CSS classes */
export function getStatusBadgeClasses(status: SubmissionStatus): string {
  const meta = STATUS_META[status];
  return `${meta.bgColor} ${meta.color} ${meta.borderColor}`;
}
