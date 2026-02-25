import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Convocatoria, Document } from "@/lib/types/database";
import { toRow, toRows } from "@/lib/supabase/helpers";
import { uploadDocuments, deleteDocument, processDocument } from "./actions";
import { UploadForm } from "./upload-form";

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
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href={`/dashboard/entidad/convocatorias/${id}`}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          &larr; Volver a {convocatoria.nombre}
        </Link>
      </div>

      {sp.error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {sp.error}
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Documentos — {convocatoria.nombre}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Sube documentos de la convocatoria para que el asistente IA los use
            como contexto (RAG).
          </p>
        </div>
      </div>

      <UploadForm action={uploadAction} />

      {/* Documents list */}
      <div className="mt-6">
        {documents.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
            <p className="text-sm text-gray-500">
              No hay documentos subidos para esta convocatoria.
            </p>
            <p className="mt-1 text-xs text-gray-400">
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
    pending: { label: "Pendiente", color: "bg-gray-100 text-gray-700" },
    processing: {
      label: "Procesando...",
      color: "bg-blue-100 text-blue-700",
    },
    ready: { label: "Listo", color: "bg-green-100 text-green-700" },
    error: { label: "Error", color: "bg-red-100 text-red-700" },
  };

  const status = statusConfig[doc.status] ?? statusConfig.pending;
  const fileSizeKb = (doc.file_size / 1024).toFixed(0);

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <FileIcon mimeType={doc.mime_type} />
            <p className="truncate text-sm font-medium text-gray-900">
              {doc.file_name}
            </p>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.color}`}
            >
              {status.label}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
            <span>{fileSizeKb} KB</span>
            {doc.status === "ready" && (
              <span>{doc.chunk_count} fragmentos</span>
            )}
            <span>
              {new Date(doc.created_at).toLocaleDateString("es-CO")}
            </span>
          </div>
          {doc.status === "error" && doc.error_message && (
            <p className="mt-1 text-xs text-red-600">{doc.error_message}</p>
          )}
        </div>

        <div className="ml-4 flex items-center gap-2">
          {(doc.status === "pending" || doc.status === "error") && (
            <form action={processWithIds}>
              <button
                type="submit"
                aria-label={`Procesar ${doc.file_name}`}
                className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
              >
                Procesar
              </button>
            </form>
          )}
          <form action={deleteWithIds}>
            <button
              type="submit"
              aria-label={`Eliminar ${doc.file_name}`}
              className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
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
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded text-[10px] font-bold ${
        isPdf
          ? "bg-red-100 text-red-600"
          : isTxt
            ? "bg-gray-100 text-gray-600"
            : "bg-blue-100 text-blue-600"
      }`}
    >
      {isPdf ? "PDF" : isTxt ? "TXT" : "DOC"}
    </span>
  );
}
