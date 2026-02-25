import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createBrowserClient } from "@supabase/supabase-js";
import { getProfile } from "@/lib/auth";
import { chunkText } from "@/lib/ai/chunker";
import { generateEmbeddings } from "@/lib/ai/embeddings";
// pdf-parse v1 is imported dynamically to avoid its test file import at module load

export async function POST(request: Request) {
  // 1. Auth check — supports cookie auth OR service role key for server-to-server calls
  const serviceKey = request.headers.get("x-service-role-key");
  const isServiceCall = serviceKey && serviceKey === process.env.SUPABASE_SERVICE_ROLE_KEY;

  let callerTenantId: string | null = null;

  if (!isServiceCall) {
    const profile = await getProfile();
    if (!profile || profile.role !== "entidad_admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    callerTenantId = profile.tenant_id;
  }

  // 2. Parse request
  let body: { document_id: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request inválido" }, { status: 400 });
  }

  if (!body.document_id) {
    return NextResponse.json(
      { error: "document_id requerido" },
      { status: 400 },
    );
  }

  // Use service role client for server-to-server, or cookie client for direct calls
  const supabase = isServiceCall
    ? createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      )
    : await createServerClient();

  // 3. Fetch document
  const { data: doc } = await supabase
    .from("documents")
    .select("*")
    .eq("id", body.document_id)
    .single();

  if (!doc) {
    return NextResponse.json(
      { error: "Documento no encontrado" },
      { status: 404 },
    );
  }

  // For direct calls, verify tenant ownership (service calls are trusted)
  if (!isServiceCall && doc.tenant_id !== callerTenantId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // 4. Update status to processing
  await supabase
    .from("documents")
    .update({ status: "processing" })
    .eq("id", doc.id);

  try {
    // 5. Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("convocatoria-docs")
      .download(doc.file_path);

    if (downloadError || !fileData) {
      throw new Error(
        `Error descargando archivo: ${downloadError?.message ?? "no data"}`,
      );
    }

    // 6. Extract text based on mime type
    let text: string;
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (doc.mime_type === "application/pdf") {
      const pdfParse = (await import("pdf-parse")).default;
      const pdfData = await pdfParse(buffer);
      text = pdfData.text;
    } else if (doc.mime_type === "text/plain") {
      text = buffer.toString("utf-8");
    } else if (
      doc.mime_type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      // Basic DOCX extraction: read the document.xml from the ZIP
      // For MVP, we extract raw text without formatting
      text = await extractDocxText(buffer);
    } else {
      throw new Error(`Tipo de archivo no soportado: ${doc.mime_type}`);
    }

    if (!text.trim()) {
      throw new Error("No se pudo extraer texto del documento");
    }

    // 7. Chunk the text
    const chunks = chunkText(text, { maxTokens: 500, overlap: 50 });

    // 8. Generate embeddings
    const embeddingVectors = await generateEmbeddings(
      chunks.map((c) => c.text),
    );

    // 9. Delete old embeddings for this document
    await supabase.from("embeddings").delete().eq("document_id", doc.id);

    // 10. Insert new embeddings in batches
    const BATCH_SIZE = 50;
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE).map((chunk, idx) => ({
        document_id: doc.id,
        convocatoria_id: doc.convocatoria_id,
        chunk_index: i + idx,
        chunk_text: chunk.text,
        embedding: JSON.stringify(embeddingVectors[i + idx]),
        metadata: { char_start: chunk.start, char_end: chunk.end },
      }));

      const { error: insertError } = await supabase
        .from("embeddings")
        .insert(batch);

      if (insertError) {
        throw new Error(`Error insertando embeddings: ${insertError.message}`);
      }
    }

    // 11. Update document status
    await supabase
      .from("documents")
      .update({
        status: "ready",
        chunk_count: chunks.length,
        error_message: null,
      })
      .eq("id", doc.id);

    return NextResponse.json({
      success: true,
      chunk_count: chunks.length,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error procesando documento";

    await supabase
      .from("documents")
      .update({ status: "error", error_message: message })
      .eq("id", doc.id);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Basic DOCX text extraction by reading document.xml from the ZIP archive.
 * For MVP — strips XML tags and returns raw text.
 */
async function extractDocxText(buffer: Buffer): Promise<string> {
  // DOCX is a ZIP containing XML. For MVP, we do rough text extraction
  // by stripping XML tags from the buffer content.
  const textContent = buffer
    .toString("utf-8")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Filter to only printable characters (Latin + extended)
  return textContent
    .replace(/[^\x20-\x7E\xA0-\xFF\u00C0-\u024F\u1E00-\u1EFF]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
