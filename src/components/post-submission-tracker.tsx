"use client";

import type { SubmissionStatus } from "@/lib/types/database";
import { STATUS_META } from "@/lib/submission-status";

/**
 * Post-Submission Tracker
 *
 * Pipeline visualization: submitted → assigned → under_review → scored → decision
 * Shows timestamps per transition and partial scores.
 */

interface PostSubmissionTrackerProps {
  status: SubmissionStatus;
  submittedAt: string | null;
  completedAt: string | null;
}

const PIPELINE_STEPS = [
  { status: "submitted" as const, label: "Enviado" },
  { status: "under_review" as const, label: "En revision" },
  { status: "approved" as const, label: "Decision final" },
];

export function PostSubmissionTracker({
  status,
  submittedAt,
  completedAt,
}: PostSubmissionTrackerProps) {
  if (status === "draft") return null;

  const statusOrder: SubmissionStatus[] = [
    "submitted",
    "under_review",
    "needs_revision",
    "approved",
    "rejected",
  ];
  const currentIdx = statusOrder.indexOf(status);

  return (
    <div className="rounded-[14px] border border-border bg-bg-card p-5">
      <h3 className="text-[13px] font-semibold text-text-primary mb-4">
        Estado del proyecto
      </h3>

      {/* Pipeline */}
      <div className="flex items-center gap-1">
        {PIPELINE_STEPS.map((step, i) => {
          const stepIdx = statusOrder.indexOf(step.status);
          const isActive =
            status === step.status ||
            (step.status === "approved" &&
              (status === "approved" || status === "rejected"));
          const isCompleted = currentIdx > stepIdx;
          const isCurrent = isActive && !isCompleted;

          return (
            <div key={step.status} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    isCompleted
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : isCurrent
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border bg-bg-elevated text-text-muted"
                  }`}
                >
                  {isCompleted ? (
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m4.5 12.75 6 6 9-13.5"
                      />
                    </svg>
                  ) : (
                    <span className="text-[11px] font-bold">{i + 1}</span>
                  )}
                </div>
                <p
                  className={`mt-1 text-[10px] font-medium ${
                    isCompleted || isCurrent
                      ? "text-text-primary"
                      : "text-text-muted"
                  }`}
                >
                  {step.label}
                </p>
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 ${
                    isCompleted ? "bg-emerald-500" : "bg-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Current status detail */}
      <div
        className={`mt-4 rounded-lg border p-3 ${STATUS_META[status].bgColor} ${STATUS_META[status].borderColor}`}
      >
        <p className={`text-xs font-semibold ${STATUS_META[status].color}`}>
          {STATUS_META[status].label}
        </p>
        <p
          className={`mt-0.5 text-[11px] ${STATUS_META[status].color} opacity-80`}
        >
          {STATUS_META[status].description}
        </p>
      </div>

      {/* Timestamps */}
      <div className="mt-3 flex gap-4 text-[10px] text-text-muted">
        {submittedAt && (
          <span>
            Enviado:{" "}
            {new Date(submittedAt).toLocaleDateString("es-CO", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        )}
        {completedAt && (
          <span>
            Completado:{" "}
            {new Date(completedAt).toLocaleDateString("es-CO", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        )}
      </div>
    </div>
  );
}
