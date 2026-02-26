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
        <p className="mt-1 text-sm text-green-700">
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
          className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="contact-nombre"
            className="block text-sm font-medium text-gray-700"
          >
            Nombre *
          </label>
          <input
            id="contact-nombre"
            name="nombre"
            type="text"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Tu nombre"
          />
        </div>
        <div>
          <label
            htmlFor="contact-email"
            className="block text-sm font-medium text-gray-700"
          >
            Correo electronico *
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="correo@ejemplo.com"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="contact-entidad"
          className="block text-sm font-medium text-gray-700"
        >
          Entidad u organizacion{" "}
          <span className="text-gray-400">(opcional)</span>
        </label>
        <input
          id="contact-entidad"
          name="entidad"
          type="text"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Gobernacion, Alcaldia, Secretaria..."
        />
      </div>

      <div>
        <label
          htmlFor="contact-mensaje"
          className="block text-sm font-medium text-gray-700"
        >
          Mensaje *
        </label>
        <textarea
          id="contact-mensaje"
          name="mensaje"
          required
          rows={5}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Cuentanos que necesitas..."
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "Enviando..." : "Enviar mensaje"}
        </button>
      </div>
    </form>
  );
}
