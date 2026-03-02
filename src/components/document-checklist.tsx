"use client";

import { useState, useEffect } from "react";
import { DocumentUpload } from "./document-upload";

/**
 * Document Checklist
 *
 * Shows required documents defined by the entity.
 * Municipality can upload files against each requirement.
 * Blocks submission if required documents are missing.
 */

interface DocRequirement {
  id: string;
  name: string;
  description: string | null;
  required: boolean;
  accepted_formats: string[];
  max_file_size_mb: number;
}

interface UploadedDoc {
  id: string;
  requirement_id: string | null;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  ai_validation: { match: boolean; confidence: number; type_detected: string } | null;
  uploaded_at: string;
}

interface DocumentChecklistProps {
  convocatoriaId: string;
  submissionId: string;
  disabled?: boolean;
}

export function DocumentChecklist({
  convocatoriaId,
  submissionId,
  disabled,
}: DocumentChecklistProps) {
  const [requirements, setRequirements] = useState<DocRequirement[]>([]);
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [reqRes, docRes] = await Promise.all([
          fetch(
            `/api/documents/requirements?convocatoria_id=${convocatoriaId}`,
          ),
          fetch(`/api/documents/list?submission_id=${submissionId}`),
        ]);

        if (reqRes.ok) {
          const json = await reqRes.json();
          setRequirements(json.requirements ?? []);
        }
        if (docRes.ok) {
          const json = await docRes.json();
          setDocuments(json.documents ?? []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [convocatoriaId, submissionId]);

  if (loading) {
    return (
      <div className="py-4 text-center text-[12px] text-text-muted">
        Cargando documentos...
      </div>
    );
  }

  if (requirements.length === 0) return null;

  const requiredMissing = requirements.filter(
    (r) =>
      r.required &&
      !documents.some((d) => d.requirement_id === r.id),
  );

  return (
    <div className="rounded-[14px] border border-border bg-bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          <span className="text-sm font-semibold text-text-primary">
            Documentos requeridos
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-emerald-600">
            {requirements.length - requiredMissing.length}/{requirements.length}
          </span>
          {requiredMissing.length > 0 && (
            <span className="text-red-500">
              {requiredMissing.length} pendiente{requiredMissing.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <div className="divide-y divide-border">
        {requirements.map((req) => {
          const docs = documents.filter(
            (d) => d.requirement_id === req.id,
          );
          const isComplete = docs.length > 0;

          return (
            <div key={req.id} className="px-5 py-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {isComplete ? (
                    <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  ) : (
                    <div className={`h-5 w-5 rounded-full border-2 ${req.required ? "border-red-300" : "border-border"}`} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-text-primary">
                    {req.name}
                    {req.required && (
                      <span className="ml-1 text-[10px] text-red-500">*</span>
                    )}
                    {!req.required && (
                      <span className="ml-1 text-[10px] text-text-muted">
                        (opcional)
                      </span>
                    )}
                  </p>
                  {req.description && (
                    <p className="mt-0.5 text-[10px] text-text-muted">
                      {req.description}
                    </p>
                  )}
                  <div className="mt-2">
                    <DocumentUpload
                      submissionId={submissionId}
                      requirementId={req.id}
                      acceptedFormats={req.accepted_formats}
                      maxSizeMb={req.max_file_size_mb}
                      existingDocs={docs}
                      onUploaded={(doc) =>
                        setDocuments((prev) => [...prev, { ...doc, requirement_id: req.id }])
                      }
                      onDeleted={(docId) =>
                        setDocuments((prev) =>
                          prev.filter((d) => d.id !== docId),
                        )
                      }
                      disabled={disabled}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
