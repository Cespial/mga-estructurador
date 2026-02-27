import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Convocatoria, Document } from "@/lib/types/database";
import { toRow, toRows } from "@/lib/supabase/helpers";
import { uploadDocuments, deleteDocument, processDocument } from "./actions";
import { UploadForm } from "./upload-form";
import { HelpButton } from "@/components/help-button";

export default async function DocumentosPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await getProfile();
  if (!profile || profile.role !== "entidad_admin") {
    redirect("/dashboard");
  }

  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: conv } = await supabase
    .from("convocatorias")
    .select("*")
    .eq("id", id)
    .single();

  const convocatoria = toRow<Convocatoria>(conv);
  if (!convocatoria) notFound();

  const { data: docs } = await supabase
    .from("documents")
    .select("*")
    .eq("convocatoria_id", id)
    .order("created_at", { ascending: false });

  const documents = toRows<Document>(docs);

  const uploadAction = uploadDocuments.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-fade-in">
      <div>
        <Link
          href={`/dashboard/entidad/convocatorias/${id}`}
          className="text-[12px] text-accent hover:text-accent-hover transition-colors"
        >
          &larr; Volver a {convocatoria.nombre}
        </Link>
      </div>

      {sp.error && (
        <div className="rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {sp.error}
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-semibold tracking-tight text-text-primary">
              Documentos — {convocatoria.nombre}
            </h1>
            <HelpButton section="documentos" label="Ayuda con documentos" />
          </div>
          <p className="mt-1 text-[13px] text-text-muted">
            Sube documentos de la convocatoria para que el asistente IA los use
            como contexto (RAG).
          </p>
        </div>
      </div>

      <UploadForm action={uploadAction} />

      {/* Documents list */}
      <div>
        {documents.length === 0 ? (
          <div className="rounded-[8px] border border-dashed border-border p-6 text-center">
            <p className="text-[13px] text-text-muted">
              No hay documentos subidos para esta convocatoria.
            </p>
            <p className="mt-1 text-[11px] text-text-muted">
              Sube documentos PDF, TXT o DOCX para enriquecer las respuestas del
              asistente IA.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                convocatoriaId={id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentCard({
  doc,
  convocatoriaId,
}: {
  doc: Document;
  convocatoriaId: string;
}) {
  const deleteWithIds = deleteDocument.bind(null, convocatoriaId, doc.id);
  const processWithIds = processDocument.bind(null, convocatoriaId, doc.id);

  const statusConfig: Record<
    string,
    { label: string; color: string }
  > = {
    pending: { label: "Pendiente", color: "bg-gray-50 text-gray-600" },
    processing: {
      label: "Procesando...",
      color: "bg-blue-50 text-blue-600",
    },
    ready: { label: "Listo", color: "bg-emerald-50 text-emerald-600" },
    error: { label: "Error", color: "bg-red-50 text-red-600" },
  };

  const status = statusConfig[doc.status] ?? statusConfig.pending;
  const fileSizeKb = (doc.file_size / 1024).toFixed(0);

  return (
    <div className="card-premium px-5 py-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <FileIcon mimeType={doc.mime_type} />
            <p className="truncate text-[13px] font-medium text-text-primary">
              {doc.file_name}
            </p>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.color}`}
            >
              {status.label}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-text-muted">
            <span className="tabular-nums">{fileSizeKb} KB</span>
            {doc.status === "ready" && (
              <span>{doc.chunk_count} fragmentos</span>
            )}
            <span>
              {new Date(doc.created_at).toLocaleDateString("es-CO")}
            </span>
          </div>
          {doc.status === "error" && doc.error_message && (
            <p className="mt-1 text-[11px] text-red-600">{doc.error_message}</p>
          )}
        </div>

        <div className="ml-4 flex items-center gap-2">
          {(doc.status === "pending" || doc.status === "error") && (
            <form action={processWithIds}>
              <button
                type="submit"
                aria-label={`Procesar ${doc.file_name}`}
                className="rounded-[var(--radius-button)] border border-accent/20 bg-accent/5 px-3 py-1.5 text-[11px] font-medium text-accent hover:bg-accent/10 transition-colors"
              >
                Procesar
              </button>
            </form>
          )}
          <form action={deleteWithIds}>
            <button
              type="submit"
              aria-label={`Eliminar ${doc.file_name}`}
              className="rounded-[var(--radius-button)] border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-medium text-red-700 hover:bg-red-100 transition-colors"
            >
              Eliminar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function FileIcon({ mimeType }: { mimeType: string }) {
  const isPdf = mimeType === "application/pdf";
  const isTxt = mimeType === "text/plain";
  return (
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] text-[10px] font-bold ${
        isPdf
          ? "bg-red-50 text-red-600"
          : isTxt
            ? "bg-gray-50 text-gray-600"
            : "bg-blue-50 text-blue-600"
      }`}
    >
      {isPdf ? "PDF" : isTxt ? "TXT" : "DOC"}
    </span>
  );
}
