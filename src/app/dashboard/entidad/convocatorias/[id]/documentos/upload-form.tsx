"use client";

import { useActionState } from "react";

interface UploadFormProps {
  action: (state: { error?: string } | null, formData: FormData) => Promise<{ error?: string } | null>;
}

export function UploadForm({ action }: UploadFormProps) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <div className="mt-6 rounded-[14px] border border-border bg-bg-card p-6">
      <h3 className="text-base font-semibold text-text-primary">
        Subir documentos
      </h3>
      <p className="mt-1 text-xs text-text-muted">
        Formatos permitidos: PDF, TXT, DOCX. Tamaño maximo: 10MB por archivo.
      </p>

      {state?.error && (
        <div role="alert" className="mt-3 rounded-md bg-red-50 p-2.5 text-xs text-red-700">
          {state.error}
        </div>
      )}

      <form action={formAction} className="mt-4 flex items-end gap-3">
        <div className="flex-1">
          <label htmlFor="files" className="sr-only">
            Seleccionar archivos
          </label>
          <input
            id="files"
            name="files"
            type="file"
            multiple
            accept=".pdf,.txt,.docx,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            required
            className="block w-full text-[13px] text-text-muted file:mr-4 file:rounded-[var(--radius-button)] file:border-0 file:bg-accent/5 file:px-4 file:py-2 file:text-[13px] file:font-medium file:text-accent hover:file:bg-accent/8"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-[var(--radius-button)] bg-accent px-4 py-2 text-[13px] font-medium text-white hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {pending ? "Subiendo..." : "Subir archivos"}
        </button>
      </form>
    </div>
  );
}
