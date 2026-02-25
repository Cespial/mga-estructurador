"use client";

import { useActionState } from "react";

interface UploadFormProps {
  action: (state: { error?: string } | null, formData: FormData) => Promise<{ error?: string } | null>;
}

export function UploadForm({ action }: UploadFormProps) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="text-base font-semibold text-gray-900">
        Subir documentos
      </h3>
      <p className="mt-1 text-xs text-gray-500">
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
            className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "Subiendo..." : "Subir archivos"}
        </button>
      </form>
    </div>
  );
}
