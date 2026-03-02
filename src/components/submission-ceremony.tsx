"use client";

import { useState } from "react";
import type { MgaEtapa } from "@/lib/types/database";
import { STATUS_META } from "@/lib/submission-status";

/**
 * Submission Ceremony
 *
 * Final confirmation screen after checklist passes.
 * Shows:
 * - Summary of stages and progress
 * - Pre-evaluation score
 * - Sworn declaration checkbox
 * - "Submit project" button
 *
 * On submit: changes status to 'submitted', locks form, sends confirmation email.
 */

interface SubmissionCeremonyProps {
  submissionId: string;
  convocatoriaId: string;
  convocatoriaNombre: string;
  etapas: MgaEtapa[];
  data: Record<string, string>;
  progress: number;
  preEvalScore: number | null;
  onSubmitted: () => void;
  onClose: () => void;
}

export function SubmissionCeremony({
  submissionId,
  convocatoriaId,
  convocatoriaNombre,
  etapas,
  data,
  progress,
  preEvalScore,
  onSubmitted,
  onClose,
}: SubmissionCeremonyProps) {
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Calculate etapa completion
  const etapaStats = etapas.map((etapa) => {
    const total = etapa.campos.length;
    const filled = etapa.campos.filter((c) => data[c.id]?.trim()).length;
    return { nombre: etapa.nombre, filled, total };
  });

  async function handleSubmit() {
    if (!accepted) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/submissions/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: submissionId,
          convocatoria_id: convocatoriaId,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? "Error al enviar el proyecto");
        return;
      }

      setSubmitted(true);
      onSubmitted();
    } catch {
      setError("Error de conexion. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    const meta = STATUS_META.submitted;
    return (
      <div className="rounded-[14px] border border-border bg-bg-card">
        <div className="px-8 py-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <svg
              className="h-8 w-8 text-emerald-600"
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
          <h3 className="text-lg font-semibold text-text-primary">
            Proyecto enviado exitosamente
          </h3>
          <p className="mt-2 text-sm text-text-muted">
            Tu proyecto para <strong>{convocatoriaNombre}</strong> ha sido
            enviado. Recibiras una confirmacion por email.
          </p>
          <div
            className={`mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 ${meta.bgColor} ${meta.color} ${meta.borderColor}`}
          >
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-sm font-medium">{meta.label}</span>
          </div>
          <p className="mt-4 text-xs text-text-muted">
            {meta.description}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[14px] border border-border bg-bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <svg
            className="h-4 w-4 text-accent"
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
          <span className="text-sm font-semibold text-text-primary">
            Enviar proyecto
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-text-muted hover:text-text-primary"
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

      <div className="px-5 py-4 space-y-5">
        {/* Convocatoria info */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            Convocatoria
          </p>
          <p className="mt-0.5 text-sm font-medium text-text-primary">
            {convocatoriaNombre}
          </p>
        </div>

        {/* Etapa summary */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">
            Resumen de etapas
          </p>
          <div className="space-y-1.5">
            {etapaStats.map((e, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-[12px] text-text-secondary">
                  {e.nombre}
                </span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-bg-elevated">
                    <div
                      className={`h-full rounded-full ${
                        e.filled === e.total
                          ? "bg-emerald-500"
                          : e.filled > 0
                            ? "bg-amber-400"
                            : "bg-slate-300"
                      }`}
                      style={{
                        width: `${e.total > 0 ? (e.filled / e.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-[11px] tabular-nums text-text-muted">
                    {e.filled}/{e.total}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Score */}
        <div className="flex items-center gap-3 rounded-lg bg-bg-elevated px-4 py-3">
          <div className="text-center">
            <p className="text-2xl font-bold tabular-nums text-accent">
              {progress}%
            </p>
            <p className="text-[10px] text-text-muted">Progreso</p>
          </div>
          <div className="h-10 w-px bg-border" />
          <div className="text-center">
            <p className="text-2xl font-bold tabular-nums text-purple-700">
              {preEvalScore != null ? Math.round(preEvalScore) : "—"}
            </p>
            <p className="text-[10px] text-text-muted">Score IA</p>
          </div>
        </div>

        {/* Sworn declaration */}
        <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-border p-3 hover:bg-bg-hover transition-colors">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border text-accent focus:ring-accent/30"
          />
          <div>
            <p className="text-[12px] font-medium text-text-primary">
              Declaracion de veracidad
            </p>
            <p className="mt-0.5 text-[11px] text-text-muted leading-relaxed">
              Declaro que la informacion contenida en este proyecto es veraz y
              verificable. Entiendo que una vez enviado, el formulario se
              bloqueara y solo podra ser modificado si la entidad solicita
              revision.
            </p>
          </div>
        </label>

        {/* Error */}
        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 border border-red-200">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={onClose}
            className="rounded-[var(--radius-button)] border border-border px-4 py-2 text-[13px] font-medium text-text-secondary hover:bg-bg-hover transition-colors"
          >
            Volver al formulario
          </button>
          <button
            onClick={handleSubmit}
            disabled={!accepted || submitting}
            className="inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-accent px-5 py-2 text-[13px] font-medium text-white hover:bg-accent-hover transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Enviando...
              </>
            ) : (
              <>
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
                    d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                  />
                </svg>
                Enviar proyecto
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
