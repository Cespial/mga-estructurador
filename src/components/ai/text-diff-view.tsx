"use client";

interface TextChange {
  type: "added" | "reworded" | "removed";
  description: string;
}

interface TextDiffViewProps {
  originalText: string;
  improvedText: string;
  changes: TextChange[];
  onAccept: (text: string) => void;
  onDismiss: () => void;
}

/**
 * Displays a visual diff between original and improved text,
 * with a list of changes and accept/dismiss actions.
 */
export function TextDiffView({
  originalText,
  improvedText,
  changes,
  onAccept,
  onDismiss,
}: TextDiffViewProps) {
  return (
    <div className="mt-3 rounded-lg border border-purple-200 bg-purple-50/50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-purple-100 px-4 py-2">
        <span className="text-xs font-semibold text-purple-700">
          Texto mejorado por IA
        </span>
        <button
          onClick={onDismiss}
          className="text-purple-400 hover:text-purple-600"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Changes list */}
        {changes.length > 0 && (
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-purple-500">
              Cambios realizados
            </p>
            <ul className="space-y-1">
              {changes.map((change, i) => (
                <li
                  key={i}
                  className="flex items-start gap-1.5 text-xs"
                >
                  <span
                    className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                      change.type === "added"
                        ? "bg-emerald-100 text-emerald-700"
                        : change.type === "removed"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {change.type === "added"
                      ? "+"
                      : change.type === "removed"
                        ? "-"
                        : "~"}
                  </span>
                  <span className="text-text-secondary">
                    {change.description}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Improved text */}
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-purple-500">
            Texto mejorado
          </p>
          <div className="rounded-md border border-emerald-200 bg-emerald-50/50 p-3 text-[13px] text-text-primary">
            {improvedText}
          </div>
        </div>

        {/* Original text (collapsed) */}
        <details className="group">
          <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-wider text-text-muted hover:text-text-secondary">
            Ver texto original
          </summary>
          <div className="mt-1 rounded-md border border-border bg-bg-elevated p-3 text-[13px] text-text-muted line-through decoration-red-300">
            {originalText}
          </div>
        </details>

        {/* Actions */}
        <div className="flex items-center gap-2 border-t border-purple-100 pt-3">
          <button
            onClick={() => onAccept(improvedText)}
            className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700"
          >
            Aceptar mejora
          </button>
          <button
            onClick={onDismiss}
            className="rounded-[var(--radius-button)] border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-bg-hover transition-colors"
          >
            Descartar
          </button>
        </div>
      </div>
    </div>
  );
}
