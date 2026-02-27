"use client";

import { useActionState, useCallback, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createConvocatoria, type CreateConvocatoriaState } from "./actions";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CreateConvocatoriaForm() {
  const [state, formAction, isPending] = useActionState<CreateConvocatoriaState, FormData>(
    createConvocatoria,
    {},
  );
  const [slug, setSlug] = useState("");
  const [nameValue, setNameValue] = useState("");

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setNameValue(name);
    setSlug(slugify(name));
  }, []);

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div className="rounded-[var(--radius-input)] border border-danger/30 bg-danger-muted p-3">
          <p className="text-sm text-danger">{state.error}</p>
        </div>
      )}

      <Input
        id="name"
        name="name"
        label="Nombre de la convocatoria"
        placeholder="Ej: Convocatoria de Cultura 2026"
        required
        value={nameValue}
        onChange={handleNameChange}
        error={state.fieldErrors?.name?.[0]}
      />

      <Input
        id="slug"
        name="slug"
        label="Slug (URL amigable)"
        placeholder="convocatoria-cultura-2026"
        required
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        hint="Se usa en la URL publica. Solo letras minusculas, numeros y guiones."
        error={state.fieldErrors?.slug?.[0]}
      />

      <Textarea
        id="description"
        name="description"
        label="Descripcion"
        placeholder="Describe el objetivo y alcance de esta convocatoria..."
        rows={4}
        error={state.fieldErrors?.description?.[0]}
      />

      <Input
        id="budget"
        name="budget"
        label="Presupuesto total"
        type="number"
        placeholder="0"
        min={0}
        step={1000}
        hint="Monto total disponible para esta convocatoria (COP)."
        error={state.fieldErrors?.budget?.[0]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          id="open_date"
          name="open_date"
          label="Fecha de apertura"
          type="date"
          error={state.fieldErrors?.open_date?.[0]}
        />
        <Input
          id="close_date"
          name="close_date"
          label="Fecha de cierre"
          type="date"
          error={state.fieldErrors?.close_date?.[0]}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <Link href="/dashboard/convocatorias">
          <Button variant="ghost" size="md" type="button">
            Cancelar
          </Button>
        </Link>
        <Button variant="primary" size="md" type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creando...
            </>
          ) : (
            "Crear Convocatoria"
          )}
        </Button>
      </div>
    </form>
  );
}
