"use client";

import { useState, useRef } from "react";

/**
 * Document Upload
 *
 * Upload zone for municipality documents in the wizard.
 * Supports drag-and-drop and file picker.
 */

interface UploadedDoc {
  id: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  ai_validation: { match: boolean; confidence: number; type_detected: string } | null;
  uploaded_at: string;
}

interface DocumentUploadProps {
  submissionId: string;
  campoId?: string;
  requirementId?: string;
  acceptedFormats?: string[];
  maxSizeMb?: number;
  existingDocs: UploadedDoc[];
  onUploaded: (doc: UploadedDoc) => void;
  onDeleted: (docId: string) => void;
  disabled?: boolean;
}

const MIME_MAP: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentUpload({
  submissionId,
  campoId,
  requirementId,
  acceptedFormats = ["pdf", "doc", "docx", "xls", "xlsx"],
  maxSizeMb = 10,
  existingDocs,
  onUploaded,
  onDeleted,
  disabled,
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptStr = acceptedFormats
    .map((f) => MIME_MAP[f] ?? `.${f}`)
    .join(",");

  async function handleUpload(file: File) {
    setError(null);

    // Validate size
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`El archivo excede el limite de ${maxSizeMb} MB.`);
      return;
    }

    // Validate extension
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext && !acceptedFormats.includes(ext)) {
      setError(
        `Formato no permitido. Formatos aceptados: ${acceptedFormats.join(", ")}.`,
      );
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("submission_id", submissionId);
      if (campoId) formData.append("campo_id", campoId);
      if (requirementId) formData.append("requirement_id", requirementId);

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? "Error al subir el documento.");
        return;
      }

      const json = await res.json();
      onUploaded(json.document);
    } catch {
      setError("Error de conexion.");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }

  async function handleDelete(docId: string) {
    try {
      const res = await fetch(`/api/documents/upload?id=${docId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onDeleted(docId);
      }
    } catch {
      // silent
    }
  }

  return (
    <div className="space-y-2">
      {/* Existing documents */}
      {existingDocs.length > 0 && (
        <div className="space-y-1">
          {existingDocs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <svg
                  className="h-4 w-4 shrink-0 text-text-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                  />
                </svg>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-text-primary truncate">
                    {doc.file_name}
                  </p>
                  <p className="text-[9px] text-text-muted">
                    {doc.file_size ? formatFileSize(doc.file_size) : ""}
                    {doc.ai_validation && (
                      <span
                        className={`ml-1 ${
                          doc.ai_validation.match
                            ? "text-emerald-600"
                            : "text-amber-600"
                        }`}
                      >
                        {doc.ai_validation.match ? "Validado" : "Revisar"} (
                        {Math.round(doc.ai_validation.confidence * 100)}%)
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {!disabled && (
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="text-text-muted hover:text-red-500 text-[10px]"
                >
                  Eliminar
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload zone */}
      {!disabled && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-md border-2 border-dashed px-4 py-4 text-center transition-colors ${
            dragOver
              ? "border-accent bg-accent/5"
              : "border-border hover:border-accent/30"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={acceptStr}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />
          {uploading ? (
            <div className="flex items-center justify-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
              <span className="text-[11px] text-accent">Subiendo...</span>
            </div>
          ) : (
            <>
              <svg
                className="mx-auto h-6 w-6 text-text-muted"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                />
              </svg>
              <p className="mt-1 text-[11px] text-text-muted">
                Arrastra un archivo o haz clic para seleccionar
              </p>
              <p className="text-[9px] text-text-muted">
                Formatos: {acceptedFormats.join(", ")} | Max: {maxSizeMb} MB
              </p>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-[11px] text-red-600">{error}</p>
      )}
    </div>
  );
}
