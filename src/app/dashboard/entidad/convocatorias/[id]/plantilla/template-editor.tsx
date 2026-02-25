"use client";

import { useState } from "react";
import type { MgaEtapa, MgaCampo } from "@/lib/types/database";
import { saveTemplate } from "./actions";

function newId() {
  return "id-" + Math.random().toString(36).slice(2, 9);
}

function newCampo(): MgaCampo {
  return {
    id: newId(),
    nombre: "",
    tipo: "textarea",
    descripcion: "",
    requerido: false,
  };
}

function newEtapa(orden: number): MgaEtapa {
  return {
    id: newId(),
    nombre: "",
    orden,
    campos: [newCampo()],
  };
}

export function TemplateEditor({
  convocatoriaId,
  initialEtapas,
}: {
  convocatoriaId: string;
  initialEtapas: MgaEtapa[];
}) {
  const [etapas, setEtapas] = useState<MgaEtapa[]>(
    initialEtapas.length > 0 ? initialEtapas : [newEtapa(1)],
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function addEtapa() {
    setEtapas([...etapas, newEtapa(etapas.length + 1)]);
  }

  function removeEtapa(etapaId: string) {
    setEtapas(
      etapas
        .filter((e) => e.id !== etapaId)
        .map((e, i) => ({ ...e, orden: i + 1 })),
    );
  }

  function updateEtapa(etapaId: string, field: keyof MgaEtapa, value: string) {
    setEtapas(
      etapas.map((e) => (e.id === etapaId ? { ...e, [field]: value } : e)),
    );
  }

  function addCampo(etapaId: string) {
    setEtapas(
      etapas.map((e) =>
        e.id === etapaId ? { ...e, campos: [...e.campos, newCampo()] } : e,
      ),
    );
  }

  function removeCampo(etapaId: string, campoId: string) {
    setEtapas(
      etapas.map((e) =>
        e.id === etapaId
          ? { ...e, campos: e.campos.filter((c) => c.id !== campoId) }
          : e,
      ),
    );
  }

  function updateCampo(
    etapaId: string,
    campoId: string,
    field: keyof MgaCampo,
    value: string | boolean,
  ) {
    setEtapas(
      etapas.map((e) =>
        e.id === etapaId
          ? {
              ...e,
              campos: e.campos.map((c) =>
                c.id === campoId ? { ...c, [field]: value } : c,
              ),
            }
          : e,
      ),
    );
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    // Validate: all etapas must have a nombre
    const invalid = etapas.find((e) => !e.nombre.trim());
    if (invalid) {
      setMessage({ type: "error", text: "Todas las etapas deben tener un nombre" });
      setSaving(false);
      return;
    }

    const result = await saveTemplate(convocatoriaId, etapas);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "Plantilla guardada exitosamente" });
    }
    setSaving(false);
  }

  return (
    <div>
      {message && (
        <div
          className={`mb-4 rounded-md p-3 text-sm ${
            message.type === "error"
              ? "bg-red-50 text-red-700"
              : "bg-green-50 text-green-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {etapas.map((etapa) => (
          <div
            key={etapa.id}
            className="rounded-lg border border-gray-200 bg-white"
          >
            {/* Etapa header */}
            <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                {etapa.orden}
              </span>
              <input
                type="text"
                value={etapa.nombre}
                onChange={(e) => updateEtapa(etapa.id, "nombre", e.target.value)}
                placeholder="Nombre de la etapa (ej: Identificación)"
                className="flex-1 border-0 bg-transparent text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
              />
              {etapas.length > 1 && (
                <button
                  onClick={() => removeEtapa(etapa.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Eliminar etapa
                </button>
              )}
            </div>

            {/* Campos */}
            <div className="p-4">
              <div className="space-y-3">
                {etapa.campos.map((campo, ci) => (
                  <div
                    key={campo.id}
                    className="rounded-md border border-gray-100 bg-gray-50 p-3"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-1 text-xs text-gray-400">
                        {ci + 1}.
                      </span>
                      <div className="flex-1 space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={campo.nombre}
                            onChange={(e) =>
                              updateCampo(etapa.id, campo.id, "nombre", e.target.value)
                            }
                            placeholder="Nombre del campo"
                            className="flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <select
                            value={campo.tipo}
                            onChange={(e) =>
                              updateCampo(etapa.id, campo.id, "tipo", e.target.value)
                            }
                            className="rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="textarea">Texto largo</option>
                            <option value="text">Texto corto</option>
                            <option value="number">Número</option>
                            <option value="date">Fecha</option>
                          </select>
                        </div>
                        <input
                          type="text"
                          value={campo.descripcion}
                          onChange={(e) =>
                            updateCampo(etapa.id, campo.id, "descripcion", e.target.value)
                          }
                          placeholder="Descripción / instrucciones para el municipio"
                          className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-xs text-gray-600">
                            <input
                              type="checkbox"
                              checked={campo.requerido}
                              onChange={(e) =>
                                updateCampo(etapa.id, campo.id, "requerido", e.target.checked)
                              }
                              className="rounded border-gray-300"
                            />
                            Requerido
                          </label>
                          {etapa.campos.length > 1 && (
                            <button
                              onClick={() => removeCampo(etapa.id, campo.id)}
                              className="text-xs text-red-500 hover:text-red-700"
                            >
                              Eliminar campo
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => addCampo(etapa.id)}
                className="mt-3 text-sm text-blue-600 hover:text-blue-800"
              >
                + Agregar campo
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={addEtapa}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          + Agregar etapa
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar plantilla"}
        </button>
      </div>
    </div>
  );
}
