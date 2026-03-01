"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface GenerationStep {
  step_number: number;
  step_name: string;
  data: Record<string, string>;
}

interface ProjectGenerationOverlayProps {
  projectId: string;
  totalSteps: number;
  onComplete: (steps: GenerationStep[]) => void;
  onClose: () => void;
}

/**
 * Full-screen overlay showing step-by-step project generation progress.
 * Connects to /api/ai/generate-project SSE endpoint.
 */
export function ProjectGenerationOverlay({
  projectId,
  totalSteps,
  onComplete,
  onClose,
}: ProjectGenerationOverlayProps) {
  const [generating, setGenerating] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<GenerationStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // ESC to close (only when not generating)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !generating) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    dialogRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, generating]);

  const startGeneration = useCallback(async () => {
    setGenerating(true);
    setError(null);
    setCompletedSteps([]);
    setDone(false);

    try {
      const res = await fetch("/api/ai/generate-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error generando proyecto");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let buffer = "";
      const allSteps: GenerationStep[] = [];

      while (true) {
        const { done: readerDone, value } = await reader.read();
        if (readerDone) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.startsWith("event: step_complete")) {
            const dataLine = lines[i + 1];
            if (dataLine?.startsWith("data: ")) {
              try {
                const step = JSON.parse(
                  dataLine.slice(6),
                ) as GenerationStep;
                allSteps.push(step);
                setCompletedSteps([...allSteps]);
              } catch {
                // skip parse errors
              }
              i++; // skip data line
            }
          } else if (line.startsWith("event: done")) {
            setDone(true);
            onComplete(allSteps);
          } else if (line.startsWith("event: error")) {
            const dataLine = lines[i + 1];
            if (dataLine?.startsWith("data: ")) {
              try {
                const err = JSON.parse(dataLine.slice(6));
                setError(err.error);
              } catch {
                setError("Error desconocido");
              }
              i++;
            }
          }
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error generando proyecto",
      );
    } finally {
      setGenerating(false);
    }
  }, [projectId, onComplete]);

  const progress =
    totalSteps > 0 ? (completedSteps.length / totalSteps) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => !generating && onClose()}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Generacion de proyecto"
        tabIndex={-1}
        className="w-full max-w-lg rounded-[14px] border border-border bg-bg-card shadow-2xl outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-border px-6 py-4">
          <h3 className="text-sm font-semibold text-text-primary">
            Generacion completa de proyecto
          </h3>
          <p className="text-xs text-text-muted">
            La IA generara contenido para todos los pasos del formulario.
          </p>
        </div>

        <div className="px-6 py-6 space-y-5">
          {!generating && !done && !error && (
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-purple-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z"
                />
              </svg>
              <p className="mt-3 text-sm text-text-primary font-medium">
                {totalSteps} pasos seran generados secuencialmente
              </p>
              <p className="mt-1 text-xs text-text-muted">
                Cada paso se construye sobre el anterior para mantener
                coherencia. Podras revisar y editar antes de guardar.
              </p>
            </div>
          )}

          {/* Progress */}
          {(generating || done) && (
            <>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-text-muted">Progreso</span>
                  <span className="text-xs font-bold text-text-primary tabular-nums">
                    {completedSteps.length}/{totalSteps}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-bg-elevated">
                  <div
                    className="h-full rounded-full bg-purple-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Step list */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {Array.from({ length: totalSteps }, (_, i) => {
                  const step = completedSteps.find(
                    (s) => s.step_number === i + 1,
                  );
                  const isActive =
                    generating && !step && completedSteps.length === i;

                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-2 rounded-md px-3 py-2 ${
                        step
                          ? "bg-emerald-50"
                          : isActive
                            ? "bg-purple-50"
                            : "bg-bg-elevated"
                      }`}
                    >
                      {step ? (
                        <svg
                          className="h-4 w-4 text-emerald-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                      ) : isActive ? (
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-purple-300 border-t-purple-600" />
                      ) : (
                        <span className="h-4 w-4 rounded-full border-2 border-border" />
                      )}
                      <span
                        className={`text-xs ${
                          step
                            ? "text-emerald-700 font-medium"
                            : isActive
                              ? "text-purple-700 font-medium"
                              : "text-text-muted"
                        }`}
                      >
                        Paso {i + 1}
                        {step ? `: ${step.step_name}` : ""}
                        {isActive ? " — Generando..." : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Done */}
          {done && (
            <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3 text-center">
              <p className="text-sm font-medium text-emerald-700">
                Proyecto generado exitosamente
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                Revisa cada paso y ajusta el contenido antes de enviarlo.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-[var(--radius-button)] border border-border px-4 py-2 text-xs font-medium text-text-secondary hover:bg-bg-hover"
          >
            {done ? "Cerrar" : "Cancelar"}
          </button>
          {!generating && !done && (
            <button
              onClick={startGeneration}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-button)] bg-purple-600 px-4 py-2 text-xs font-medium text-white hover:bg-purple-700"
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
                  d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
                />
              </svg>
              Generar proyecto completo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
