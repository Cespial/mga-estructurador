"use client";

import { useState } from "react";

/**
 * Field History
 *
 * Shows timeline of changes for a specific field with restore capability.
 * Fetches data from /api/field-changes.
 */

interface FieldChange {
  id: string;
  old_value: string | null;
  new_value: string | null;
  source: string;
  created_at: string;
}

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  manual: { label: "Manual", color: "text-text-muted" },
  ai_assist: { label: "Asistente IA", color: "text-purple-600" },
  auto_draft: { label: "Auto-borrador", color: "text-purple-600" },
  improve: { label: "Texto mejorado", color: "text-emerald-600" },
  restore: { label: "Restaurado", color: "text-blue-600" },
};

interface FieldHistoryProps {
  submissionId: string;
  campoId: string;
  campoNombre: string;
  currentValue: string;
  onRestore: (value: string) => void;
}

export function FieldHistory({
  submissionId,
  campoId,
  campoNombre,
  currentValue,
  onRestore,
}: FieldHistoryProps) {
  const [open, setOpen] = useState(false);
  const [changes, setChanges] = useState<FieldChange[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadHistory() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/field-changes?submission_id=${submissionId}&campo_id=${campoId}`,
      );
      if (res.ok) {
        const json = await res.json();
        setChanges(json.changes ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={loadHistory}
        className="inline-flex items-center gap-1 text-[10px] text-text-muted hover:text-text-primary transition-colors"
      >
        <svg
          className="h-3 w-3"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
        {open ? "Cerrar historial" : "Historial"}
      </button>

      {open && (
        <div className="mt-2 rounded-lg border border-border bg-bg-card p-3 animate-fade-in">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">
            Historial de cambios — {campoNombre}
          </p>

          {loading && (
            <p className="text-[11px] text-text-muted">Cargando...</p>
          )}

          {!loading && changes.length === 0 && (
            <p className="text-[11px] text-text-muted">
              No hay cambios registrados.
            </p>
          )}

          {!loading && changes.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {changes.map((change) => {
                const source =
                  SOURCE_LABELS[change.source] ?? SOURCE_LABELS.manual;
                const date = new Date(change.created_at).toLocaleString(
                  "es-CO",
                  {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                );
                const isCurrentValue =
                  change.new_value === currentValue;

                return (
                  <div
                    key={change.id}
                    className="rounded-md border border-border bg-bg-elevated px-3 py-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-medium ${source.color}`}
                        >
                          {source.label}
                        </span>
                        <span className="text-[10px] text-text-muted">
                          {date}
                        </span>
                      </div>
                      {!isCurrentValue && change.new_value && (
                        <button
                          type="button"
                          onClick={() => onRestore(change.new_value!)}
                          className="text-[10px] text-accent hover:text-accent-hover font-medium"
                        >
                          Restaurar
                        </button>
                      )}
                      {isCurrentValue && (
                        <span className="text-[10px] text-emerald-600 font-medium">
                          Actual
                        </span>
                      )}
                    </div>
                    {change.new_value && (
                      <p className="mt-1 text-[11px] text-text-secondary line-clamp-3">
                        {change.new_value}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
