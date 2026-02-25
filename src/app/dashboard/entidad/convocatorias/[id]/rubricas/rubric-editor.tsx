"use client";

import { useState } from "react";
import type { RubricCriterio, RubricNivel, MgaEtapa } from "@/lib/types/database";
import { saveRubric } from "./actions";

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

  // Calculate total weight
  const totalPeso = criterios.reduce((sum, c) => sum + c.peso, 0);

  return (
    <div>
      {message && (
        <div
          className={`mb-4 rounded-md p-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Add criterion selector */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">
              Agregar criterio para campo
            </label>
            <select
              id="add-campo"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
          <p className="mt-2 text-xs text-gray-500">
            {criterios.length} criterio{criterios.length !== 1 ? "s" : ""} · Peso
            total: {totalPeso}
          </p>
        )}
      </div>

      {/* Criterios list */}
      {criterios.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
          <p className="text-sm text-gray-500">
            No hay criterios de evaluación definidos.
          </p>
          <p className="mt-1 text-xs text-gray-400">
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
                className="rounded-lg border border-gray-200 bg-white"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {campo?.nombre ?? criterio.campo_id}
                    </p>
                    <p className="text-xs text-gray-500">
                      {campo?.etapa_nombre}
                    </p>
                  </div>
                  <button
                    onClick={() => removeCriterio(ci)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Eliminar
                  </button>
                </div>

                <div className="space-y-3 px-4 py-3">
                  {/* Description + weight */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="col-span-3">
                      <label className="block text-xs font-medium text-gray-600">
                        Descripción del criterio
                      </label>
                      <input
                        type="text"
                        value={criterio.descripcion}
                        onChange={(e) =>
                          updateCriterio(ci, { descripcion: e.target.value })
                        }
                        className="mt-1 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600">
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
                        className="mt-1 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Niveles */}
                  <div>
                    <p className="mb-1 text-xs font-medium text-gray-600">
                      Niveles de evaluación
                    </p>
                    <div className="space-y-1.5">
                      {criterio.niveles.map((nivel, ni) => (
                        <div
                          key={ni}
                          className="flex items-center gap-2 rounded bg-gray-50 px-2.5 py-1.5"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                            {nivel.score}
                          </span>
                          <input
                            type="text"
                            value={nivel.label}
                            onChange={(e) =>
                              updateNivel(ci, ni, { label: e.target.value })
                            }
                            placeholder="Etiqueta"
                            className="w-28 shrink-0 rounded border border-gray-200 px-2 py-1 text-xs"
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
                            className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs"
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

      {/* Save button */}
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar rúbrica"}
        </button>
      </div>
    </div>
  );
}
