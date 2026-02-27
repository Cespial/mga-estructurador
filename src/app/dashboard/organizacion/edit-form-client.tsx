"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateOrganization, type UpdateOrgState } from "./actions";

interface EditFormProps {
  orgId: string;
  defaultValues: {
    name: string;
    nit: string;
    municipality: string;
    department: string;
  };
}

export function OrganizacionEditForm({ orgId, defaultValues }: EditFormProps) {
  const boundAction = updateOrganization.bind(null, orgId);
  const [state, formAction, isPending] = useActionState<UpdateOrgState, FormData>(
    boundAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div className="rounded-[var(--radius-input)] border border-danger/30 bg-danger-muted p-3">
          <p className="text-sm text-danger">{state.error}</p>
        </div>
      )}

      {state.success && (
        <div className="rounded-[var(--radius-input)] border border-success/30 bg-success-muted p-3">
          <p className="text-sm text-success">Organizacion actualizada correctamente.</p>
        </div>
      )}

      <Input
        id="edit_name"
        name="name"
        label="Nombre de la organizacion"
        defaultValue={defaultValues.name}
        required
        error={state.fieldErrors?.name?.[0]}
      />

      <Input
        id="edit_nit"
        name="nit"
        label="NIT"
        defaultValue={defaultValues.nit}
        placeholder="Ej: 900.123.456-7"
        error={state.fieldErrors?.nit?.[0]}
      />

      <Input
        id="edit_department"
        name="department"
        label="Departamento"
        defaultValue={defaultValues.department}
        placeholder="Ej: Antioquia"
        error={state.fieldErrors?.department?.[0]}
      />

      <Input
        id="edit_municipality"
        name="municipality"
        label="Municipio"
        defaultValue={defaultValues.municipality}
        placeholder="Ej: Medellin"
        error={state.fieldErrors?.municipality?.[0]}
      />

      <div className="flex items-center justify-end pt-2">
        <Button variant="primary" size="md" type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Guardando...
            </>
          ) : (
            "Guardar Cambios"
          )}
        </Button>
      </div>
    </form>
  );
}
