"use client";

import { useState, useCallback, useEffect } from "react";
import type { MgaEtapa, MgaCampo } from "@/lib/types/database";
import type { AiAssistResponse } from "@/lib/ai/schemas";
import { saveSubmissionData } from "./actions";

interface WizardProps {
  convocatoriaId: string;
  submissionId: string;
  etapas: MgaEtapa[];
  initialData: Record<string, string>;
  initialEtapa: string | null;
  initialProgress: number;
}

export function WizardClient({
  convocatoriaId,
  submissionId,
  etapas,
  initialData,
  initialEtapa,
  initialProgress,
}: WizardProps) {
  const [currentEtapaIndex, setCurrentEtapaIndex] = useState(() => {
    if (initialEtapa) {
      const idx = etapas.findIndex((e) => e.id === initialEtapa);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  });
  const [data, setData] = useState<Record<string, string>>(initialData);
  const [progress, setProgress] = useState(initialProgress);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [pendingFields, setPendingFields] = useState<Record<string, string>>(
    {},
  );

  // AI assist state
  const [aiLoading, setAiLoading] = useState<string | null>(null); // campo_id being loaded
  const [aiResponse, setAiResponse] = useState<{
    campoId: string;
    data: AiAssistResponse & { _meta?: { model: string; duration_ms: number } };
  } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const currentEtapa = etapas[currentEtapaIndex];

  const doSave = useCallback(
    async (fields: Record<string, string>, etapaId: string) => {
      if (Object.keys(fields).length === 0) return;

      setSaving(true);
      const result = await saveSubmissionData(
        submissionId,
        fields,
        etapaId,
        etapas,
      );

      if (result.success) {
        setProgress(result.progress);
        setLastSaved(new Date().toLocaleTimeString("es-CO"));
      }
      setSaving(false);
      setDirty(false);
    },
    [submissionId, etapas],
  );

  // Debounced autosave: whenever pendingFields changes
  useEffect(() => {
    if (!dirty || Object.keys(pendingFields).length === 0) return;

    const timer = setTimeout(() => {
      const fieldsToSave = { ...pendingFields };
      setPendingFields({});
      doSave(fieldsToSave, etapas[currentEtapaIndex].id);
    }, 1500);

    return () => clearTimeout(timer);
  }, [pendingFields, dirty, doSave, etapas, currentEtapaIndex]);

  function handleFieldChange(campoId: string, value: string) {
    setData((prev) => ({ ...prev, [campoId]: value }));
    setPendingFields((prev) => ({ ...prev, [campoId]: value }));
    setDirty(true);
  }

  async function goToEtapa(index: number) {
    // Flush pending save before navigating
    if (Object.keys(pendingFields).length > 0) {
      const fieldsToSave = { ...pendingFields };
      setPendingFields({});
      await doSave(fieldsToSave, etapas[currentEtapaIndex].id);
    }
    setCurrentEtapaIndex(index);
    // Clear AI panel when changing etapa
    setAiResponse(null);
    setAiError(null);
  }

  async function requestAiAssist(campo: MgaCampo) {
    setAiLoading(campo.id);
    setAiError(null);
    setAiResponse(null);

    try {
      const res = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          convocatoria_id: convocatoriaId,
          etapa_id: currentEtapa.id,
          campo_id: campo.id,
          current_text: data[campo.id] || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setAiError(json.error ?? "Error al consultar el asistente IA");
        return;
      }

      setAiResponse({ campoId: campo.id, data: json });
    } catch {
      setAiError("Error de conexión al consultar el asistente IA");
    } finally {
      setAiLoading(null);
    }
  }

  function applyAiSuggestion() {
    if (!aiResponse) return;
    handleFieldChange(aiResponse.campoId, aiResponse.data.suggested_text);
    setAiResponse(null);
  }

  function getEtapaStatus(etapa: MgaEtapa): "empty" | "partial" | "complete" {
    const requiredFields = etapa.campos.filter((c) => c.requerido);
    if (requiredFields.length === 0) {
      const anyFilled = etapa.campos.some((c) => data[c.id]?.trim());
      return anyFilled ? "complete" : "empty";
    }
    const filledRequired = requiredFields.filter(
      (c) => data[c.id]?.trim(),
    ).length;
    if (filledRequired === 0) return "empty";
    if (filledRequired === requiredFields.length) return "complete";
    return "partial";
  }

  function getValidationErrors(): string[] {
    const errors: string[] = [];
    for (const campo of currentEtapa.campos) {
      if (campo.requerido && !data[campo.id]?.trim()) {
        errors.push(`"${campo.nombre}" es requerido`);
      }
    }
    return errors;
  }

  const validationErrors = getValidationErrors();

  return (
    <div className="flex gap-6">
      {/* Sidebar: etapa navigation */}
      <div className="w-56 shrink-0">
        <div className="sticky top-6">
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>Progreso general</span>
              <span className="font-semibold text-text-primary">{progress}%</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  progress === 100
                    ? "bg-green-500 animate-shimmer"
                    : "bg-accent"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            {progress === 100 && (
              <div className="mt-2 animate-fade-in-up rounded-md bg-green-50 px-3 py-2 text-center">
                <p className="text-xs font-semibold text-green-700">
                  Completado
                </p>
                <p className="text-[10px] text-green-600">
                  Todas las etapas diligenciadas
                </p>
              </div>
            )}
          </div>

          <nav className="space-y-1">
            {etapas.map((etapa, i) => {
              const status = getEtapaStatus(etapa);
              const isCurrent = i === currentEtapaIndex;
              return (
                <button
                  key={etapa.id}
                  onClick={() => goToEtapa(i)}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] transition ${
                    isCurrent
                      ? "bg-accent/5 font-medium text-accent"
                      : "text-text-secondary hover:bg-bg-hover"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      status === "complete"
                        ? "bg-green-100 text-green-700"
                        : status === "partial"
                          ? "bg-yellow-100 text-yellow-700"
                          : isCurrent
                            ? "bg-accent/8 text-accent"
                            : "bg-gray-100 text-text-muted"
                    }`}
                  >
                    {status === "complete" ? "\u2713" : etapa.orden}
                  </span>
                  <span className="truncate">{etapa.nombre}</span>
                </button>
              );
            })}
          </nav>

          {/* Save status */}
          <div className="mt-4 text-xs text-text-muted">
            {saving ? (
              <span className="text-accent">Guardando...</span>
            ) : lastSaved ? (
              <span>Guardado a las {lastSaved}</span>
            ) : (
              <span>Autoguardado activo</span>
            )}
          </div>
        </div>
      </div>

      {/* Main content: current etapa fields */}
      <div className="min-w-0 flex-1">
        <div className="rounded-[14px] border border-border bg-bg-card">
          <div className="border-b border-border px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/8 text-sm font-bold text-accent">
                {currentEtapa.orden}
              </span>
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  {currentEtapa.nombre}
                </h3>
                <p className="text-xs text-text-muted">
                  {currentEtapa.campos.length} campo
                  {currentEtapa.campos.length !== 1 ? "s" : ""}
                  {validationErrors.length > 0 && (
                    <span className="ml-2 text-amber-600">
                      ({validationErrors.length} pendiente
                      {validationErrors.length !== 1 ? "s" : ""})
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-border px-6">
            {currentEtapa.campos.map((campo) => (
              <div key={campo.id} className="py-4">
                <div className="mb-1 flex items-center justify-between">
                  <label
                    htmlFor={campo.id}
                    className="flex items-center gap-2 text-[13px] font-medium text-text-primary"
                  >
                    {campo.nombre}
                    {campo.requerido && (
                      <span className="text-xs text-red-500">*</span>
                    )}
                  </label>
                  {(campo.tipo === "textarea" || campo.tipo === "text") && (
                    <button
                      type="button"
                      onClick={() => requestAiAssist(campo)}
                      disabled={aiLoading !== null}
                      className="inline-flex items-center gap-1.5 rounded-md border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700 transition hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {aiLoading === campo.id ? (
                        <>
                          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-purple-300 border-t-purple-700" />
                          Consultando...
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
                              d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z"
                            />
                          </svg>
                          Asistente IA
                        </>
                      )}
                    </button>
                  )}
                </div>
                {campo.descripcion && (
                  <p className="mb-2 text-xs text-text-muted">
                    {campo.descripcion}
                  </p>
                )}
                <FieldInput
                  campo={campo}
                  value={data[campo.id] ?? ""}
                  onChange={(val) => handleFieldChange(campo.id, val)}
                />

                {/* AI Response Panel — inline below the field */}
                {aiResponse && aiResponse.campoId === campo.id && (
                  <AiResponsePanel
                    response={aiResponse.data}
                    onApply={applyAiSuggestion}
                    onDismiss={() => setAiResponse(null)}
                  />
                )}
                {aiError && aiLoading === null && aiResponse === null && (
                  <div className="mt-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
                    {aiError}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => goToEtapa(currentEtapaIndex - 1)}
            disabled={currentEtapaIndex === 0}
            className="rounded-[var(--radius-button)] border border-border px-4 py-2 text-[13px] font-medium text-text-secondary hover:bg-bg-hover transition-colors disabled:cursor-not-allowed disabled:opacity-30"
          >
            &larr; Anterior
          </button>
          <span className="text-xs text-text-muted">
            Etapa {currentEtapaIndex + 1} de {etapas.length}
          </span>
          <button
            onClick={() => goToEtapa(currentEtapaIndex + 1)}
            disabled={currentEtapaIndex === etapas.length - 1}
            className="rounded-[var(--radius-button)] bg-accent px-4 py-2 text-[13px] font-medium text-white hover:bg-accent-hover transition-colors disabled:cursor-not-allowed disabled:opacity-30"
          >
            Siguiente &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// AI Response Panel
// ============================================================

function AiResponsePanel({
  response,
  onApply,
  onDismiss,
}: {
  response: AiAssistResponse & {
    _meta?: { model: string; duration_ms: number };
  };
  onApply: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="mt-3 rounded-lg border border-purple-200 bg-purple-50/50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-purple-100 px-4 py-2">
        <span className="text-xs font-semibold text-purple-700">
          Sugerencia del Asistente IA
        </span>
        <div className="flex items-center gap-2">
          {response._meta && (
            <span className="text-[10px] text-purple-400">
              {response._meta.model} &middot;{" "}
              {(response._meta.duration_ms / 1000).toFixed(1)}s
            </span>
          )}
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
      </div>

      <div className="space-y-3 px-4 py-3">
        {/* Suggested text */}
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-purple-500">
            Texto sugerido
          </p>
          <div className="rounded-md bg-bg-card p-3 text-[13px] text-text-primary shadow-sm">
            {response.suggested_text}
          </div>
        </div>

        {/* Bullets */}
        {response.bullets.length > 0 && (
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-purple-500">
              Puntos clave
            </p>
            <ul className="space-y-1">
              {response.bullets.map((b, i) => (
                <li
                  key={i}
                  className="flex items-start gap-1.5 text-xs text-text-secondary"
                >
                  <span className="mt-0.5 text-purple-400">&bull;</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Risks */}
        {response.risks.length > 0 && (
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-amber-600">
              Riesgos identificados
            </p>
            <ul className="space-y-1">
              {response.risks.map((r, i) => (
                <li
                  key={i}
                  className="flex items-start gap-1.5 text-xs text-amber-700"
                >
                  <span className="mt-0.5">&#9888;</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Missing info questions */}
        {response.missing_info_questions.length > 0 && (
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-accent">
              Informacion faltante
            </p>
            <ul className="space-y-1">
              {response.missing_info_questions.map((q, i) => (
                <li
                  key={i}
                  className="flex items-start gap-1.5 text-xs text-accent"
                >
                  <span className="mt-0.5">?</span>
                  {q}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Citations */}
        {response.citations && response.citations.length > 0 && (
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-teal-600">
              Fuentes citadas
            </p>
            <div className="space-y-2">
              {response.citations.map((cite, i) => (
                <div
                  key={i}
                  className="rounded-md border border-teal-100 bg-teal-50/50 px-3 py-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-teal-700">
                      {cite.source}
                    </span>
                    {cite.relevance_score != null && (
                      <span className="text-[10px] text-teal-500">
                        {(cite.relevance_score * 100).toFixed(0)}% relevancia
                      </span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-3 text-[11px] text-teal-800">
                    {cite.chunk_text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 border-t border-purple-100 pt-3">
          <button
            onClick={onApply}
            className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700"
          >
            Usar sugerencia
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

// ============================================================
// Field Input
// ============================================================

function FieldInput({
  campo,
  value,
  onChange,
}: {
  campo: { id: string; tipo: string };
  value: string;
  onChange: (val: string) => void;
}) {
  const baseClass =
    "block w-full rounded-[var(--radius-input)] border border-border bg-bg-input px-3 py-2.5 text-[13px] text-text-primary shadow-sm placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/8";

  switch (campo.tipo) {
    case "textarea":
      return (
        <textarea
          id={campo.id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={5}
          className={baseClass}
          placeholder="Escriba aqui..."
        />
      );
    case "number":
      return (
        <input
          id={campo.id}
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
          placeholder="0"
        />
      );
    case "date":
      return (
        <input
          id={campo.id}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
        />
      );
    default:
      return (
        <input
          id={campo.id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
          placeholder="Escriba aqui..."
        />
      );
  }
}
