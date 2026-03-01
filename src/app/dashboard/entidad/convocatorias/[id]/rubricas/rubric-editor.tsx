"use client";

import { useState } from "react";
import type { RubricCriterio, RubricNivel, MgaEtapa } from "@/lib/types/database";
import { saveRubric } from "./actions";

interface SuggestedCriterio {
  campo_id: string;
  descripcion: string;
  peso: number;
  niveles: RubricNivel[];
}

interface RubricEditorProps {
  convocatoriaId: string;
  etapas: MgaEtapa[];
  initialCriterios: RubricCriterio[];
}

const DEFAULT_NIVELES: RubricNivel[] = [
  { score: 1, label: "Insuficiente", descripcion: "" },
  { score: 2, label: "Básico", descripcion: "" },
  { score: 3, label: "Bueno", descripcion: "" },
  { score: 4, label: "Excelente", descripcion: "" },
];

export function RubricEditor({
  convocatoriaId,
  etapas,
  initialCriterios,
}: RubricEditorProps) {
  const [criterios, setCriterios] = useState<RubricCriterio[]>(initialCriterios);
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Flatten all campos with etapa info for selection
  const allCampos = etapas.flatMap((etapa) =>
    etapa.campos.map((campo) => ({
      ...campo,
      etapa_nombre: etapa.nombre,
      etapa_id: etapa.id,
    })),
  );

  // Campos that already have a criterion
  const usedCampoIds = new Set(criterios.map((c) => c.campo_id));

  function addCriterio(campoId: string) {
    const campo = allCampos.find((c) => c.id === campoId);
    if (!campo) return;

    setCriterios((prev) => [
      ...prev,
      {
        campo_id: campoId,
        peso: 1,
        descripcion: `Evaluar la calidad del campo "${campo.nombre}"`,
        niveles: DEFAULT_NIVELES.map((n) => ({ ...n })),
      },
    ]);
  }

  function removeCriterio(index: number) {
    setCriterios((prev) => prev.filter((_, i) => i !== index));
  }

  function updateCriterio(index: number, updates: Partial<RubricCriterio>) {
    setCriterios((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...updates } : c)),
    );
  }

  function updateNivel(
    criterioIndex: number,
    nivelIndex: number,
    updates: Partial<RubricNivel>,
  ) {
    setCriterios((prev) =>
      prev.map((c, ci) =>
        ci === criterioIndex
          ? {
              ...c,
              niveles: c.niveles.map((n, ni) =>
                ni === nivelIndex ? { ...n, ...updates } : n,
              ),
            }
          : c,
      ),
    );
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const result = await saveRubric(convocatoriaId, criterios);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "Rúbrica guardada correctamente" });
    }
    setSaving(false);
  }

  async function handleSuggestWithAI() {
    setSuggesting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/ai/suggest-rubric", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          convocatoria_id: convocatoriaId,
          etapas: etapas.map((e) => ({
            id: e.id,
            nombre: e.nombre,
            campos: e.campos.map((c) => ({ id: c.id, nombre: c.nombre })),
          })),
        }),
      });

      if (!res.ok) throw new Error("Error");

      const data = await res.json();
      const suggested = (data.criterios ?? []) as SuggestedCriterio[];

      // Only add suggestions for campos that exist and don't already have criteria
      const newCriterios: RubricCriterio[] = [];
      for (const sc of suggested) {
        const campo = allCampos.find((c) => c.id === sc.campo_id);
        if (campo && !usedCampoIds.has(sc.campo_id)) {
          newCriterios.push({
            campo_id: sc.campo_id,
            descripcion: sc.descripcion,
            peso: sc.peso,
            niveles: sc.niveles,
          });
        }
      }

      if (newCriterios.length > 0) {
        setCriterios((prev) => [...prev, ...newCriterios]);
        setMessage({
          type: "success",
          text: `IA sugirio ${newCriterios.length} criterio${newCriterios.length !== 1 ? "s" : ""}. Revisa y ajusta antes de guardar.`,
        });
      } else {
        setMessage({
          type: "success",
          text: "La IA no encontro criterios nuevos para sugerir. Todos los campos relevantes ya tienen criterios.",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Error al obtener sugerencias de IA" });
    } finally {
      setSuggesting(false);
    }
  }

  // Calculate total weight
  const totalPeso = criterios.reduce((sum, c) => sum + c.peso, 0);

  return (
    <div>
      {message && (
        <div
          className={`mb-4 rounded-md p-3 text-sm ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Add criterion selector */}
      <div className="mb-6 rounded-[14px] border border-border bg-bg-card p-4">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-[13px] font-medium text-text-primary">
              Agregar criterio para campo
            </label>
            <select
              id="add-campo"
              className="mt-1 block w-full rounded-[var(--radius-input)] border border-border bg-bg-input px-3 py-2.5 text-[13px] text-text-primary shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/8"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  addCriterio(e.target.value);
                  e.target.value = "";
                }
              }}
            >
              <option value="" disabled>
                Seleccionar campo...
              </option>
              {allCampos
                .filter((c) => !usedCampoIds.has(c.id))
                .map((campo) => (
                  <option key={campo.id} value={campo.id}>
                    [{campo.etapa_nombre}] {campo.nombre}
                  </option>
                ))}
            </select>
          </div>
        </div>
        {criterios.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-text-muted">
              {criterios.length} criterio{criterios.length !== 1 ? "s" : ""} · Peso
              total: {totalPeso}
            </p>
            {/* Weight distribution bar */}
            {totalPeso > 0 && (
              <div className="mt-2">
                <div className="flex h-3 overflow-hidden rounded-full">
                  {criterios.map((c, i) => {
                    const pct = (c.peso / totalPeso) * 100;
                    const colors = [
                      "bg-accent", "bg-emerald-500", "bg-amber-500",
                      "bg-purple-500", "bg-rose-500", "bg-cyan-500",
                      "bg-orange-500", "bg-indigo-500",
                    ];
                    return (
                      <div
                        key={c.campo_id}
                        className={`${colors[i % colors.length]}`}
                        style={{ width: `${pct}%` }}
                        title={`${allCampos.find((ac) => ac.id === c.campo_id)?.nombre ?? c.campo_id}: ${pct.toFixed(1)}%`}
                      />
                    );
                  })}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                  {criterios.map((c, i) => {
                    const campo = allCampos.find((ac) => ac.id === c.campo_id);
                    const pct = (c.peso / totalPeso) * 100;
                    const dotColors = [
                      "bg-accent", "bg-emerald-500", "bg-amber-500",
                      "bg-purple-500", "bg-rose-500", "bg-cyan-500",
                      "bg-orange-500", "bg-indigo-500",
                    ];
                    return (
                      <span key={c.campo_id} className="flex items-center gap-1 text-[10px] text-text-secondary">
                        <span className={`inline-block h-2 w-2 rounded-full ${dotColors[i % dotColors.length]}`} />
                        {campo?.nombre ?? c.campo_id}: {pct.toFixed(1)}%
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Criterios list */}
      {criterios.length === 0 ? (
        <div className="rounded-[14px] border border-border bg-bg-app p-6 text-center">
          <p className="text-[13px] text-text-muted">
            No hay criterios de evaluación definidos.
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Selecciona campos MGA para crear criterios de evaluación.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {criterios.map((criterio, ci) => {
            const campo = allCampos.find((c) => c.id === criterio.campo_id);
            return (
              <div
                key={criterio.campo_id}
                className="rounded-[14px] border border-border bg-bg-card"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <div>
                    <p className="text-[13px] font-semibold text-text-primary">
                      {campo?.nombre ?? criterio.campo_id}
                      {totalPeso > 0 && (
                        <span className="ml-2 text-xs font-normal text-text-muted">
                          {((criterio.peso / totalPeso) * 100).toFixed(1)}%
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-text-muted">
                      {campo?.etapa_nombre}
                    </p>
                  </div>
                  <button
                    onClick={() => removeCriterio(ci)}
                    aria-label={`Eliminar criterio ${campo?.nombre ?? criterio.campo_id}`}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Eliminar
                  </button>
                </div>

                <div className="space-y-3 px-4 py-3">
                  {/* Description + weight */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="col-span-3">
                      <label className="block text-[11px] font-medium text-text-secondary">
                        Descripción del criterio
                      </label>
                      <input
                        type="text"
                        value={criterio.descripcion}
                        onChange={(e) =>
                          updateCriterio(ci, { descripcion: e.target.value })
                        }
                        className="mt-1 block w-full rounded-[var(--radius-input)] border border-border bg-bg-input px-2.5 py-1.5 text-[13px] text-text-primary shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/8"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-text-secondary">
                        Peso
                      </label>
                      <input
                        type="number"
                        min={0.1}
                        step={0.1}
                        value={criterio.peso}
                        onChange={(e) =>
                          updateCriterio(ci, {
                            peso: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="mt-1 block w-full rounded-[var(--radius-input)] border border-border bg-bg-input px-2.5 py-1.5 text-[13px] text-text-primary shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/8"
                      />
                    </div>
                  </div>

                  {/* Niveles */}
                  <div>
                    <p className="mb-1 text-[11px] font-medium text-text-secondary">
                      Niveles de evaluación
                    </p>
                    <div className="space-y-1.5">
                      {criterio.niveles.map((nivel, ni) => (
                        <div
                          key={ni}
                          className="flex items-center gap-2 rounded-[8px] bg-bg-app px-2.5 py-1.5"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/8 text-[10px] font-bold text-accent">
                            {nivel.score}
                          </span>
                          <input
                            type="text"
                            value={nivel.label}
                            onChange={(e) =>
                              updateNivel(ci, ni, { label: e.target.value })
                            }
                            placeholder="Etiqueta"
                            className="w-28 shrink-0 rounded-[var(--radius-input)] border border-border bg-bg-input px-2 py-1 text-xs text-text-primary"
                          />
                          <input
                            type="text"
                            value={nivel.descripcion}
                            onChange={(e) =>
                              updateNivel(ci, ni, {
                                descripcion: e.target.value,
                              })
                            }
                            placeholder="Descripción del nivel"
                            className="flex-1 rounded-[var(--radius-input)] border border-border bg-bg-input px-2 py-1 text-xs text-text-primary"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Save button + AI suggest */}
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-[var(--radius-button)] bg-accent px-4 py-2 text-[13px] font-medium text-white hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar rúbrica"}
        </button>
        <button
          onClick={handleSuggestWithAI}
          disabled={suggesting}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-button)] border border-purple-300 bg-purple-50 px-4 py-2 text-[13px] font-medium text-purple-700 hover:bg-purple-100 transition-colors disabled:opacity-50"
        >
          {suggesting ? (
            <>
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-purple-300 border-t-purple-600" />
              Sugiriendo...
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
              Sugerir criterios con IA
            </>
          )}
        </button>
      </div>
    </div>
  );
}
