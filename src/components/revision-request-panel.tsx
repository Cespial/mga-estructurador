"use client";

import { useState, useEffect } from "react";

/**
 * Revision Request Panel
 *
 * Shows active revision requests from the entity.
 * Highlights which fields need attention.
 */

interface RevisionRequest {
  id: string;
  campos: string[];
  message: string;
  deadline: string | null;
  status: string;
  round: number;
  created_at: string;
}

interface RevisionRequestPanelProps {
  submissionId: string;
  onNavigateToField?: (campoId: string) => void;
}

export function RevisionRequestPanel({
  submissionId,
  onNavigateToField,
}: RevisionRequestPanelProps) {
  const [requests, setRequests] = useState<RevisionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/revision-requests?submission_id=${submissionId}`)
      .then((r) => (r.ok ? r.json() : { requests: [] }))
      .then((json) => setRequests(json.requests ?? []))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, [submissionId]);

  const openRequests = requests.filter((r) => r.status === "open");

  if (loading || openRequests.length === 0) return null;

  return (
    <div className="rounded-[14px] border border-orange-200 bg-orange-50/30">
      <div className="border-b border-orange-200 px-5 py-3">
        <div className="flex items-center gap-2">
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
          <span className="text-sm font-semibold text-orange-800">
            Solicitud de revision
          </span>
          <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-700">
            Ronda {openRequests[0].round}
          </span>
        </div>
      </div>

      {openRequests.map((req) => (
        <div key={req.id} className="px-5 py-3 border-b border-orange-100 last:border-b-0">
          <p className="text-[12px] text-orange-800 leading-relaxed">
            {req.message}
          </p>

          {req.deadline && (
            <p className="mt-1 text-[10px] text-orange-600">
              Fecha limite:{" "}
              {new Date(req.deadline).toLocaleDateString("es-CO", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}

          {req.campos.length > 0 && (
            <div className="mt-2">
              <p className="text-[10px] font-semibold text-orange-700 mb-1">
                Campos a revisar:
              </p>
              <div className="flex flex-wrap gap-1">
                {req.campos.map((campoId) => (
                  <button
                    key={campoId}
                    onClick={() => onNavigateToField?.(campoId)}
                    className="rounded-full border border-orange-200 bg-white px-2 py-0.5 text-[10px] text-orange-700 hover:bg-orange-100 transition-colors"
                  >
                    {campoId}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
