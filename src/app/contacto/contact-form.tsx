"use client";

import { useActionState } from "react";
import { submitContact } from "./actions";

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContact, null);

  if (state?.success) {
    return (
      <div className="animate-fade-in-up rounded-lg border border-green-200 bg-green-50 p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-6 w-6 text-green-600"
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
        </div>
        <h3 className="text-lg font-semibold text-green-900">
          Mensaje enviado
        </h3>
        <p className="mt-1 text-[13px] text-green-700">
          Gracias por tu interes. Te responderemos pronto.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div
          role="alert"
          className="rounded-md bg-red-50 px-4 py-3 text-[13px] text-red-700"
        >
          {state.error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="contact-nombre"
            className="block text-[13px] font-medium text-text-secondary"
          >
            Nombre *
          </label>
          <input
            id="contact-nombre"
            name="nombre"
            type="text"
            required
            className="mt-1 block w-full rounded-[var(--radius-input)] border border-border bg-bg-input px-3 py-2.5 text-[13px] text-text-primary shadow-sm placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/8"
            placeholder="Tu nombre"
          />
        </div>
        <div>
          <label
            htmlFor="contact-email"
            className="block text-[13px] font-medium text-text-secondary"
          >
            Correo electronico *
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            className="mt-1 block w-full rounded-[var(--radius-input)] border border-border bg-bg-input px-3 py-2.5 text-[13px] text-text-primary shadow-sm placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/8"
            placeholder="correo@ejemplo.com"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="contact-entidad"
          className="block text-[13px] font-medium text-text-secondary"
        >
          Entidad u organizacion{" "}
          <span className="text-text-muted">(opcional)</span>
        </label>
        <input
          id="contact-entidad"
          name="entidad"
          type="text"
          className="mt-1 block w-full rounded-[var(--radius-input)] border border-border bg-bg-input px-3 py-2.5 text-[13px] text-text-primary shadow-sm placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/8"
          placeholder="Gobernacion, Alcaldia, Secretaria..."
        />
      </div>

      <div>
        <label
          htmlFor="contact-mensaje"
          className="block text-[13px] font-medium text-text-secondary"
        >
          Mensaje *
        </label>
        <textarea
          id="contact-mensaje"
          name="mensaje"
          required
          rows={5}
          className="mt-1 block w-full rounded-[var(--radius-input)] border border-border bg-bg-input px-3 py-2.5 text-[13px] text-text-primary shadow-sm placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/8"
          placeholder="Cuentanos que necesitas..."
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-[var(--radius-button)] bg-accent px-6 py-2.5 text-[13px] font-medium text-white shadow-sm hover:bg-accent-hover disabled:opacity-50 transition-colors"
        >
          {pending ? "Enviando..." : "Enviar mensaje"}
        </button>
      </div>
    </form>
  );
}
