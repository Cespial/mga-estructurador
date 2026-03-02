"use client";

import { useState, useEffect } from "react";
import type { MgaEtapa } from "@/lib/types/database";

/**
 * Pre-Submit Checklist
 *
 * Quality gate before submission. Validates:
 * - Required fields are complete
 * - Pre-evaluation score above threshold
 * - Entity comments resolved
 * - Minimum character counts for text fields
 *
 * Critical items block submission. Recommended items show warnings.
 */

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  status: "pass" | "fail" | "warning";
  /** If true, blocks submission when failed */
  blocking: boolean;
}

interface PreSubmitChecklistProps {
  submissionId: string;
  etapas: MgaEtapa[];
  data: Record<string, string>;
  progress: number;
  preEvalScore: number | null;
  onAllPassed: (passed: boolean) => void;
  onClose: () => void;
}

const MIN_TEXTAREA_CHARS = 50;
const MIN_PRE_EVAL_SCORE = 40;

export function PreSubmitChecklist({
  submissionId,
  etapas,
  data,
  progress,
  preEvalScore,
  onAllPassed,
  onClose,
}: PreSubmitChecklistProps) {
  const [unresolvedCount, setUnresolvedCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch unresolved comments count
  useEffect(() => {
    async function fetchComments() {
      try {
        const res = await fetch(
          `/api/comments?submission_id=${submissionId}`,
        );
        if (res.ok) {
          const json = await res.json();
          const unresolved = (json.comments ?? []).filter(
            (c: { resolved: boolean; author_role: string }) =>
              !c.resolved && c.author_role === "entidad_admin",
          );
          setUnresolvedCount(unresolved.length);
        }
      } catch {
        setUnresolvedCount(0);
      } finally {
        setLoading(false);
      }
    }
    fetchComments();
  }, [submissionId]);

  // Build checklist items
  const items: ChecklistItem[] = [];

  // 1. Required fields complete
  const requiredFields: { campo: string; etapa: string }[] = [];
  for (const etapa of etapas) {
    for (const campo of etapa.campos) {
      if (campo.requerido && !data[campo.id]?.trim()) {
        requiredFields.push({ campo: campo.nombre, etapa: etapa.nombre });
      }
    }
  }
  items.push({
    id: "required-fields",
    label: "Campos requeridos completos",
    description:
      requiredFields.length === 0
        ? "Todos los campos requeridos tienen contenido."
        : `${requiredFields.length} campo${requiredFields.length !== 1 ? "s" : ""} requerido${requiredFields.length !== 1 ? "s" : ""} sin completar: ${requiredFields.slice(0, 3).map((f) => f.campo).join(", ")}${requiredFields.length > 3 ? "..." : ""}.`,
    status: requiredFields.length === 0 ? "pass" : "fail",
    blocking: true,
  });

  // 2. Progress at 100%
  items.push({
    id: "progress",
    label: "Progreso al 100%",
    description:
      progress >= 100
        ? "Todas las etapas estan diligenciadas."
        : `Progreso actual: ${progress}%. Completa las etapas faltantes.`,
    status: progress >= 100 ? "pass" : "fail",
    blocking: true,
  });

  // 3. Pre-evaluation score
  items.push({
    id: "pre-eval-score",
    label: `Score de pre-evaluacion >= ${MIN_PRE_EVAL_SCORE}`,
    description:
      preEvalScore === null
        ? "Ejecuta la pre-evaluacion antes de enviar para conocer tu score estimado."
        : preEvalScore >= MIN_PRE_EVAL_SCORE
          ? `Score actual: ${Math.round(preEvalScore)}/100. Cumple el umbral minimo.`
          : `Score actual: ${Math.round(preEvalScore)}/100. Se recomienda mejorar antes de enviar.`,
    status:
      preEvalScore === null
        ? "warning"
        : preEvalScore >= MIN_PRE_EVAL_SCORE
          ? "pass"
          : "warning",
    blocking: false,
  });

  // 4. Entity comments resolved
  if (!loading) {
    items.push({
      id: "comments-resolved",
      label: "Comentarios de la entidad atendidos",
      description:
        unresolvedCount === 0 || unresolvedCount === null
          ? "No hay comentarios pendientes de la entidad."
          : `${unresolvedCount} comentario${unresolvedCount !== 1 ? "s" : ""} sin resolver. Revisa y atiende antes de enviar.`,
      status:
        unresolvedCount === 0 || unresolvedCount === null ? "pass" : "warning",
      blocking: false,
    });
  }

  // 5. Minimum character counts for textarea fields
  const shortFields: string[] = [];
  for (const etapa of etapas) {
    for (const campo of etapa.campos) {
      if (
        campo.tipo === "textarea" &&
        data[campo.id]?.trim() &&
        data[campo.id].trim().length < MIN_TEXTAREA_CHARS
      ) {
        shortFields.push(campo.nombre);
      }
    }
  }
  items.push({
    id: "min-chars",
    label: "Minimo de contenido en campos de texto",
    description:
      shortFields.length === 0
        ? "Todos los campos de texto tienen contenido suficiente."
        : `${shortFields.length} campo${shortFields.length !== 1 ? "s" : ""} con menos de ${MIN_TEXTAREA_CHARS} caracteres: ${shortFields.slice(0, 3).join(", ")}${shortFields.length > 3 ? "..." : ""}.`,
    status: shortFields.length === 0 ? "pass" : "warning",
    blocking: false,
  });

  const blockingFails = items.filter(
    (i) => i.blocking && i.status === "fail",
  );
  const allCriticalPassed = blockingFails.length === 0;

  // Notify parent
  useEffect(() => {
    onAllPassed(allCriticalPassed);
  }, [allCriticalPassed, onAllPassed]);

  const passCount = items.filter((i) => i.status === "pass").length;
  const warnCount = items.filter((i) => i.status === "warning").length;
  const failCount = items.filter((i) => i.status === "fail").length;

  return (
    <div className="rounded-[14px] border border-border bg-bg-card">
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
              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
          <span className="text-sm font-semibold text-text-primary">
            Checklist pre-envio
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="text-emerald-600 font-medium">{passCount} ok</span>
            {warnCount > 0 && (
              <span className="text-amber-600 font-medium">
                {warnCount} aviso{warnCount !== 1 ? "s" : ""}
              </span>
            )}
            {failCount > 0 && (
              <span className="text-red-600 font-medium">
                {failCount} bloqueante{failCount !== 1 ? "s" : ""}
              </span>
            )}
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
      </div>

      <div className="divide-y divide-border">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-3 px-5 py-3">
            <div className="mt-0.5">
              {item.status === "pass" ? (
                <svg
                  className="h-5 w-5 text-emerald-500"
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
              ) : item.status === "fail" ? (
                <svg
                  className="h-5 w-5 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 text-amber-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                  />
                </svg>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={`text-[13px] font-medium ${
                  item.status === "pass"
                    ? "text-text-primary"
                    : item.status === "fail"
                      ? "text-red-700"
                      : "text-amber-700"
                }`}
              >
                {item.label}
                {item.blocking && item.status === "fail" && (
                  <span className="ml-1.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-semibold text-red-700 border border-red-200">
                    Bloqueante
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-[11px] text-text-muted">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {!allCriticalPassed && (
        <div className="border-t border-border px-5 py-3">
          <p className="text-[11px] text-red-600">
            Resuelve los items bloqueantes antes de poder enviar el proyecto.
          </p>
        </div>
      )}
    </div>
  );
}
