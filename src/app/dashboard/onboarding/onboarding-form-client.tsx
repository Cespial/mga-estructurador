"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createOrganization, type OnboardingState } from "./actions";

const ORG_TYPE_OPTIONS = [
  { value: "entity", label: "Entidad (crea convocatorias)" },
  { value: "municipality", label: "Municipio (aplica a convocatorias)" },
];

const DEPARTMENT_OPTIONS = [
  { value: "Amazonas", label: "Amazonas" },
  { value: "Antioquia", label: "Antioquia" },
  { value: "Arauca", label: "Arauca" },
  { value: "Atlantico", label: "Atlantico" },
  { value: "Bogota D.C.", label: "Bogota D.C." },
  { value: "Bolivar", label: "Bolivar" },
  { value: "Boyaca", label: "Boyaca" },
  { value: "Caldas", label: "Caldas" },
  { value: "Caqueta", label: "Caqueta" },
  { value: "Casanare", label: "Casanare" },
  { value: "Cauca", label: "Cauca" },
  { value: "Cesar", label: "Cesar" },
  { value: "Choco", label: "Choco" },
  { value: "Cordoba", label: "Cordoba" },
  { value: "Cundinamarca", label: "Cundinamarca" },
  { value: "Guainia", label: "Guainia" },
  { value: "Guaviare", label: "Guaviare" },
  { value: "Huila", label: "Huila" },
  { value: "La Guajira", label: "La Guajira" },
  { value: "Magdalena", label: "Magdalena" },
  { value: "Meta", label: "Meta" },
  { value: "Narino", label: "Narino" },
  { value: "Norte de Santander", label: "Norte de Santander" },
  { value: "Putumayo", label: "Putumayo" },
  { value: "Quindio", label: "Quindio" },
  { value: "Risaralda", label: "Risaralda" },
  { value: "San Andres y Providencia", label: "San Andres y Providencia" },
  { value: "Santander", label: "Santander" },
  { value: "Sucre", label: "Sucre" },
  { value: "Tolima", label: "Tolima" },
  { value: "Valle del Cauca", label: "Valle del Cauca" },
  { value: "Vaupes", label: "Vaupes" },
  { value: "Vichada", label: "Vichada" },
];

export function OnboardingForm() {
  const [state, formAction, isPending] = useActionState<OnboardingState, FormData>(
    createOrganization,
    {},
  );

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
        label="Nombre de la organizacion"
        placeholder="Ej: Ministerio de Cultura"
        required
        error={state.fieldErrors?.name?.[0]}
      />

      <Select
        id="type"
        name="type"
        label="Tipo de organizacion"
        options={ORG_TYPE_OPTIONS}
        placeholder="Selecciona el tipo"
        required
        error={state.fieldErrors?.type?.[0]}
      />

      <Input
        id="nit"
        name="nit"
        label="NIT"
        placeholder="Ej: 900.123.456-7"
        hint="Numero de Identificacion Tributaria de la organizacion."
        error={state.fieldErrors?.nit?.[0]}
      />

      <Select
        id="department"
        name="department"
        label="Departamento"
        options={DEPARTMENT_OPTIONS}
        placeholder="Selecciona el departamento"
        error={state.fieldErrors?.department?.[0]}
      />

      <Input
        id="municipality"
        name="municipality"
        label="Municipio"
        placeholder="Ej: Medellin"
        error={state.fieldErrors?.municipality?.[0]}
      />

      <div className="pt-4">
        <Button variant="primary" size="lg" type="submit" disabled={isPending} className="w-full">
          {isPending ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creando organizacion...
            </>
          ) : (
            "Crear Organizacion y Continuar"
          )}
        </Button>
      </div>
    </form>
  );
}
