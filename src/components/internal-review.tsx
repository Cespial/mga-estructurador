"use client";

import { useState } from "react";

/**
 * Internal Review
 *
 * Optional step before submitting to the entity.
 * A designated internal reviewer can approve or request changes.
 */

interface InternalReviewProps {
  submissionId: string;
  status: "pending" | "approved" | "changes_requested";
  reviewerName?: string;
  reviewComments?: string;
  onRequestReview?: () => void;
  onApprove?: () => void;
  isReviewer?: boolean;
}

export function InternalReview({
  status,
  reviewerName,
  reviewComments,
  onRequestReview,
  onApprove,
  isReviewer,
}: InternalReviewProps) {
  const [comments, setComments] = useState("");
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="rounded-[14px] border border-border bg-bg-card">
      <div className="border-b border-border px-5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 text-text-secondary"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
            <h3 className="text-[13px] font-semibold text-text-primary">
              Revision interna
            </h3>
          </div>

          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
              status === "approved"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : status === "changes_requested"
                  ? "bg-orange-50 text-orange-700 border border-orange-200"
                  : "bg-slate-50 text-slate-600 border border-slate-200"
            }`}
          >
            {status === "approved"
              ? "Aprobado internamente"
              : status === "changes_requested"
                ? "Cambios solicitados"
                : "Pendiente"}
          </span>
        </div>
      </div>

      <div className="px-5 py-4">
        {status === "pending" && !isReviewer && (
          <div className="space-y-3">
            <p className="text-[12px] text-text-secondary leading-relaxed">
              Antes de enviar a la entidad, puedes solicitar una revision
              interna por parte del lider del equipo.
            </p>
            {onRequestReview && (
              <button
                onClick={onRequestReview}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[11px] font-medium text-text-secondary hover:bg-bg-hover transition-colors"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                  />
                </svg>
                Solicitar revision interna
              </button>
            )}
          </div>
        )}

        {status === "pending" && isReviewer && (
          <div className="space-y-3">
            <p className="text-[12px] text-text-secondary leading-relaxed">
              Este proyecto esta esperando tu revision. Revisa el contenido y
              aprueba o solicita cambios.
            </p>
            <div className="flex gap-2">
              {onApprove && (
                <button
                  onClick={onApprove}
                  className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-emerald-700 transition-colors"
                >
                  Aprobar
                </button>
              )}
              <button
                onClick={() => setShowForm(!showForm)}
                className="inline-flex items-center gap-1.5 rounded-md border border-orange-300 px-3 py-1.5 text-[11px] font-medium text-orange-700 hover:bg-orange-50 transition-colors"
              >
                Solicitar cambios
              </button>
            </div>

            {showForm && (
              <div className="space-y-2">
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Describe los cambios necesarios..."
                  className="w-full rounded-lg border border-border bg-bg-app px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                  rows={3}
                />
                <button
                  disabled={!comments.trim()}
                  className="rounded-md bg-orange-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-orange-700 disabled:opacity-50 transition-colors"
                >
                  Enviar solicitud de cambios
                </button>
              </div>
            )}
          </div>
        )}

        {status === "approved" && (
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <svg
                className="h-4 w-4 text-emerald-600"
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
            </div>
            <div>
              <p className="text-[12px] font-medium text-emerald-700">
                Aprobado internamente
                {reviewerName && ` por ${reviewerName}`}
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">
                El proyecto fue revisado y aprobado. Puedes proceder con el
                envio a la entidad.
              </p>
            </div>
          </div>
        )}

        {status === "changes_requested" && (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100">
                <svg
                  className="h-4 w-4 text-orange-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-[12px] font-medium text-orange-700">
                  Cambios solicitados
                  {reviewerName && ` por ${reviewerName}`}
                </p>
                {reviewComments && (
                  <p className="mt-1 text-[11px] text-text-secondary leading-relaxed">
                    {reviewComments}
                  </p>
                )}
              </div>
            </div>
            {onRequestReview && (
              <button
                onClick={onRequestReview}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[11px] font-medium text-text-secondary hover:bg-bg-hover transition-colors"
              >
                Re-solicitar revision
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
