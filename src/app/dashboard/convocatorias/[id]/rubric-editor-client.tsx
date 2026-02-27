"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { addRubricCriterion, deleteRubricCriterion, updateRubricCriterion } from "./actions";
import type { RubricCriterion } from "@/lib/types/database";

interface RubricEditorProps {
  rubricId: string;
  convocatoriaId: string;
  criteria: RubricCriterion[];
}

export function RubricEditor({ rubricId, convocatoriaId, criteria }: RubricEditorProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleAdd(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await addRubricCriterion(rubricId, convocatoriaId, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setShowAddForm(false);
      }
    });
  }

  function handleDelete(criterionId: string) {
    if (!confirm("Estas seguro de eliminar este criterio?")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteRubricCriterion(criterionId, convocatoriaId);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  function handleUpdate(criterionId: string, formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateRubricCriterion(criterionId, convocatoriaId, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setEditingId(null);
      }
    });
  }

  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  const totalMaxScore = criteria.reduce((sum, c) => sum + c.max_score, 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-text-muted">Criterios:</span>
          <span className="font-medium text-text-primary">{criteria.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-text-muted">Puntaje total:</span>
          <span className="font-medium text-text-primary">{totalMaxScore}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-text-muted">Peso total:</span>
          <span className={`font-medium ${totalWeight === 100 ? "text-success" : "text-warning"}`}>
            {totalWeight}%
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-[var(--radius-input)] border border-danger/30 bg-danger-muted p-3">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {/* Criteria List */}
      {criteria.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-text-muted">No hay criterios definidos aun.</p>
          <p className="text-xs text-text-muted mt-1">Agrega criterios para definir como se evaluaran los proyectos.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {criteria
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((criterion) => (
              <Card key={criterion.id} variant="default" padding="md">
                {editingId === criterion.id ? (
                  <CriterionEditForm
                    criterion={criterion}
                    onSubmit={(fd) => handleUpdate(criterion.id, fd)}
                    onCancel={() => setEditingId(null)}
                    isPending={isPending}
                  />
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-muted text-xs font-medium text-accent">
                          {criterion.sort_order}
                        </span>
                        <h4 className="text-sm font-semibold text-text-primary">
                          {criterion.criterion_name}
                        </h4>
                      </div>
                      <div className="ml-9 flex items-center gap-4 text-xs text-text-muted">
                        <span>Max: {criterion.max_score} pts</span>
                        <span>Peso: {criterion.weight}%</span>
                      </div>
                      {criterion.evaluation_guide && (
                        <p className="ml-9 mt-1 text-xs text-text-secondary line-clamp-2">
                          {criterion.evaluation_guide}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(criterion.id)}
                        disabled={isPending}
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(criterion.id)}
                        disabled={isPending}
                        className="text-danger hover:text-danger"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
        </div>
      )}

      {/* Add Form */}
      {showAddForm ? (
        <Card variant="elevated" padding="md">
          <h4 className="text-sm font-semibold text-text-primary mb-4">Nuevo Criterio</h4>
          <CriterionAddForm
            onSubmit={handleAdd}
            onCancel={() => setShowAddForm(false)}
            isPending={isPending}
            nextSortOrder={criteria.length + 1}
          />
        </Card>
      ) : (
        <Button
          variant="outline"
          size="md"
          onClick={() => setShowAddForm(true)}
          disabled={isPending}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Agregar Criterio
        </Button>
      )}
    </div>
  );
}

// ── Add Form ──
function CriterionAddForm({
  onSubmit,
  onCancel,
  isPending,
  nextSortOrder,
}: {
  onSubmit: (fd: FormData) => void;
  onCancel: () => void;
  isPending: boolean;
  nextSortOrder: number;
}) {
  return (
    <form action={onSubmit} className="space-y-4">
      <input type="hidden" name="sort_order" value={nextSortOrder} />

      <Input
        id="criterion_name"
        name="criterion_name"
        label="Nombre del criterio"
        placeholder="Ej: Pertinencia del proyecto"
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="max_score"
          name="max_score"
          label="Puntaje maximo"
          type="number"
          placeholder="20"
          min={1}
          required
        />
        <Input
          id="weight"
          name="weight"
          label="Peso (%)"
          type="number"
          placeholder="25"
          min={1}
          max={100}
          required
        />
      </div>

      <Textarea
        id="evaluation_guide"
        name="evaluation_guide"
        label="Guia de evaluacion"
        placeholder="Describe como se debe evaluar este criterio..."
        rows={3}
      />

      <div className="flex items-center justify-end gap-3">
        <Button variant="ghost" size="sm" type="button" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button variant="primary" size="sm" type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : "Agregar"}
        </Button>
      </div>
    </form>
  );
}

// ── Edit Form ──
function CriterionEditForm({
  criterion,
  onSubmit,
  onCancel,
  isPending,
}: {
  criterion: RubricCriterion;
  onSubmit: (fd: FormData) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <form action={onSubmit} className="space-y-4">
      <input type="hidden" name="sort_order" value={criterion.sort_order} />

      <Input
        id={`edit_name_${criterion.id}`}
        name="criterion_name"
        label="Nombre del criterio"
        defaultValue={criterion.criterion_name}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          id={`edit_max_${criterion.id}`}
          name="max_score"
          label="Puntaje maximo"
          type="number"
          defaultValue={criterion.max_score}
          min={1}
          required
        />
        <Input
          id={`edit_weight_${criterion.id}`}
          name="weight"
          label="Peso (%)"
          type="number"
          defaultValue={criterion.weight}
          min={1}
          max={100}
          required
        />
      </div>

      <Textarea
        id={`edit_guide_${criterion.id}`}
        name="evaluation_guide"
        label="Guia de evaluacion"
        defaultValue={criterion.evaluation_guide ?? ""}
        rows={3}
      />

      <div className="flex items-center justify-end gap-3">
        <Button variant="ghost" size="sm" type="button" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button variant="primary" size="sm" type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>
    </form>
  );
}
