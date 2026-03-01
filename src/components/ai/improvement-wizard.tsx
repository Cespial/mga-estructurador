"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface ImprovementStep {
  campo_id: string;
  campo_nombre: string;
  current_text: string;
  score: number;
  max_score: number;
  recomendacion: string;
  weight: number;
  impact: number; // (max_score - score) * weight
}

interface ImprovementWizardProps {
  steps: ImprovementStep[];
  convocatoriaId: string;
  onFieldUpdate: (campoId: string, newText: string) => void;
  onClose: () => void;
}

/**
 * Modal wizard that walks through fields sorted by improvement impact.
 * Each step shows current text, score, recommendation, and "Auto-fix" button.
 * Counter shows estimated points gained.
 */
export function ImprovementWizard({
  steps,
  convocatoriaId,
  onFieldUpdate,
  onClose,
}: ImprovementWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [pointsGained, setPointsGained] = useState(0);
  const [improving, setImproving] = useState(false);
  const [improvedText, setImprovedText] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // ESC to close + focus trap
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    dialogRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Sort by impact desc
  const sortedSteps = [...steps].sort((a, b) => b.impact - a.impact);
  const step = sortedSteps[currentStep];

  const autoFix = useCallback(async () => {
    if (!step) return;
    setImproving(true);
    setImprovedText(null);

    try {
      const res = await fetch("/api/ai/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texto_actual: step.current_text,
          campo_nombre: step.campo_nombre,
          campo_descripcion: step.recomendacion,
          convocatoria_id: convocatoriaId,
          recomendacion: step.recomendacion,
        }),
      });

      if (!res.ok) throw new Error("Error");

      const data = await res.json();
      setImprovedText(data.improved_text ?? step.current_text);
    } catch {
      setImprovedText(null);
    } finally {
      setImproving(false);
    }
  }, [step, convocatoriaId]);

  const acceptFix = useCallback(() => {
    if (!step || !improvedText) return;
    onFieldUpdate(step.campo_id, improvedText);

    // Estimate points gained (rough)
    const potentialPoints = Math.round(step.impact * 10);
    setPointsGained((prev) => prev + potentialPoints);
    setImprovedText(null);

    // Move to next step
    if (currentStep < sortedSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [step, improvedText, onFieldUpdate, currentStep, sortedSteps.length]);

  if (!step) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
        <div className="w-full max-w-lg rounded-[14px] bg-bg-card p-6 shadow-xl" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
          <p className="text-center text-sm text-text-primary">
            No hay mejoras pendientes.
          </p>
          <button
            onClick={onClose}
            className="mt-4 w-full rounded-[var(--radius-button)] bg-accent px-4 py-2 text-sm font-medium text-white"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Wizard de mejora"
        tabIndex={-1}
        className="w-full max-w-2xl rounded-[14px] border border-border bg-bg-card shadow-xl outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              Wizard de Mejora
            </h3>
            <p className="text-xs text-text-muted">
              Paso {currentStep + 1} de {sortedSteps.length} &middot; Mayor
              impacto primero
            </p>
          </div>
          <div className="flex items-center gap-3">
            {pointsGained > 0 && (
              <div className="rounded-full bg-emerald-100 px-3 py-1">
                <span className="text-xs font-bold text-emerald-700 tabular-nums">
                  +{pointsGained} puntos ganados
                </span>
              </div>
            )}
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-secondary"
            >
              <svg
                className="h-5 w-5"
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
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Field info */}
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-text-primary">
              {step.campo_nombre}
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">
                Score: {step.score}/{step.max_score}
              </span>
              <div className="h-2 w-16 overflow-hidden rounded-full bg-bg-elevated">
                <div
                  className={`h-full rounded-full ${
                    step.score / step.max_score >= 0.75
                      ? "bg-emerald-500"
                      : step.score / step.max_score >= 0.5
                        ? "bg-amber-500"
                        : "bg-red-400"
                  }`}
                  style={{
                    width: `${(step.score / step.max_score) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
            <p className="text-xs text-amber-800">
              <span className="font-semibold">Recomendacion:</span>{" "}
              {step.recomendacion}
            </p>
          </div>

          {/* Current text */}
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Texto actual
            </p>
            <div className="rounded-md border border-border bg-bg-elevated p-3 text-[13px] text-text-secondary">
              {step.current_text || (
                <span className="text-text-muted italic">(campo vacio)</span>
              )}
            </div>
          </div>

          {/* Improved text */}
          {improvedText && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                Texto mejorado por IA
              </p>
              <div className="rounded-md border border-emerald-200 bg-emerald-50/50 p-3 text-[13px] text-text-primary">
                {improvedText}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <button
            onClick={() =>
              setCurrentStep((prev) => Math.max(0, prev - 1))
            }
            disabled={currentStep === 0}
            className="rounded-[var(--radius-button)] border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-bg-hover disabled:opacity-30"
          >
            Anterior
          </button>

          <div className="flex items-center gap-2">
            {!improvedText ? (
              <button
                onClick={autoFix}
                disabled={improving}
                className="inline-flex items-center gap-1.5 rounded-md bg-purple-600 px-4 py-2 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {improving ? (
                  <>
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-purple-300 border-t-white" />
                    Mejorando...
                  </>
                ) : (
                  <>
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
                    Auto-fix con IA
                  </>
                )}
              </button>
            ) : (
              <>
                <button
                  onClick={acceptFix}
                  className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700"
                >
                  Aceptar mejora
                </button>
                <button
                  onClick={() => setImprovedText(null)}
                  className="rounded-[var(--radius-button)] border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-bg-hover"
                >
                  Descartar
                </button>
              </>
            )}

            <button
              onClick={() => {
                setImprovedText(null);
                if (currentStep < sortedSteps.length - 1) {
                  setCurrentStep((prev) => prev + 1);
                } else {
                  onClose();
                }
              }}
              className="text-xs text-text-muted hover:text-text-secondary"
            >
              Saltar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
