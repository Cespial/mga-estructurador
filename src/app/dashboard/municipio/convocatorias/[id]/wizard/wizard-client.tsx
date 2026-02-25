"use client";

import { useState, useCallback, useEffect } from "react";
import type { MgaEtapa } from "@/lib/types/database";
import { saveSubmissionData } from "./actions";

interface WizardProps {
  submissionId: string;
  etapas: MgaEtapa[];
  initialData: Record<string, string>;
  initialEtapa: string | null;
  initialProgress: number;
}

export function WizardClient({
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
  const [pendingFields, setPendingFields] = useState<Record<string, string>>({});

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
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Progreso general</span>
              <span className="font-semibold text-gray-900">{progress}%</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <nav className="space-y-1">
            {etapas.map((etapa, i) => {
              const status = getEtapaStatus(etapa);
              const isCurrent = i === currentEtapaIndex;
              return (
                <button
                  key={etapa.id}
                  onClick={() => goToEtapa(i)}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition ${
                    isCurrent
                      ? "bg-blue-50 font-medium text-blue-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      status === "complete"
                        ? "bg-green-100 text-green-700"
                        : status === "partial"
                          ? "bg-yellow-100 text-yellow-700"
                          : isCurrent
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-500"
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
          <div className="mt-4 text-xs text-gray-400">
            {saving ? (
              <span className="text-blue-500">Guardando...</span>
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
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                {currentEtapa.orden}
              </span>
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  {currentEtapa.nombre}
                </h3>
                <p className="text-xs text-gray-500">
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

          <div className="divide-y divide-gray-50 px-6">
            {currentEtapa.campos.map((campo) => (
              <div key={campo.id} className="py-4">
                <label
                  htmlFor={campo.id}
                  className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700"
                >
                  {campo.nombre}
                  {campo.requerido && (
                    <span className="text-xs text-red-500">*</span>
                  )}
                </label>
                {campo.descripcion && (
                  <p className="mb-2 text-xs text-gray-500">
                    {campo.descripcion}
                  </p>
                )}
                <FieldInput
                  campo={campo}
                  value={data[campo.id] ?? ""}
                  onChange={(val) => handleFieldChange(campo.id, val)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => goToEtapa(currentEtapaIndex - 1)}
            disabled={currentEtapaIndex === 0}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
          >
            &larr; Anterior
          </button>
          <span className="text-xs text-gray-400">
            Etapa {currentEtapaIndex + 1} de {etapas.length}
          </span>
          <button
            onClick={() => goToEtapa(currentEtapaIndex + 1)}
            disabled={currentEtapaIndex === etapas.length - 1}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Siguiente &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}

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
    "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

  switch (campo.tipo) {
    case "textarea":
      return (
        <textarea
          id={campo.id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={5}
          className={baseClass}
          placeholder="Escriba aquí..."
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
          placeholder="Escriba aquí..."
        />
      );
  }
}
