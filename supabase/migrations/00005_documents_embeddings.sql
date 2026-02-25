-- ============================================================
-- Migration 00005: Documents + Embeddings (RAG)
-- Wave 5: Documentos + Vectorización por convocatoria
-- ============================================================

-- 1) Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2) Document status enum
CREATE TYPE document_status AS ENUM ('pending', 'processing', 'ready', 'error');

-- 3) Documents table (metadata for uploaded files)
CREATE TABLE documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  convocatoria_id uuid NOT NULL REFERENCES convocatorias(id) ON DELETE CASCADE,
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  file_name       text NOT NULL,
  file_path       text NOT NULL,
  file_size       integer NOT NULL,
  mime_type       text NOT NULL,
  status          document_status NOT NULL DEFAULT 'pending',
  chunk_count     integer NOT NULL DEFAULT 0,
  error_message   text,
  created_by      uuid NOT NULL REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_convocatoria ON documents(convocatoria_id);
CREATE INDEX idx_documents_tenant ON documents(tenant_id);
CREATE INDEX idx_documents_status ON documents(status);

-- 4) Embeddings table (chunks with vector embeddings)
CREATE TABLE embeddings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  convocatoria_id uuid NOT NULL REFERENCES convocatorias(id) ON DELETE CASCADE,
  chunk_index     integer NOT NULL,
  chunk_text      text NOT NULL,
  embedding       vector(1536),
  metadata        jsonb DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_embeddings_document ON embeddings(document_id);
CREATE INDEX idx_embeddings_convocatoria ON embeddings(convocatoria_id);

-- HNSW index for fast similarity search (cosine distance)
CREATE INDEX idx_embeddings_vector ON embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 5) Similarity search function (isolated by convocatoria)
CREATE OR REPLACE FUNCTION match_embeddings(
  query_embedding vector(1536),
  p_convocatoria_id uuid,
  match_count integer DEFAULT 5,
  match_threshold float DEFAULT 0.7
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  chunk_index integer,
  chunk_text text,
  file_name text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.document_id,
    e.chunk_index,
    e.chunk_text,
    d.file_name,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM embeddings e
  JOIN documents d ON d.id = e.document_id
  WHERE e.convocatoria_id = p_convocatoria_id
    AND d.status = 'ready'
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 6) Updated_at trigger for documents
CREATE TRIGGER set_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;

-- == Documents ==

-- platform_admin: full access
CREATE POLICY "platform_admin_all_documents" ON documents
  FOR ALL
  USING (auth_user_role() = 'platform_admin');

-- entidad_admin: full CRUD on own tenant documents
CREATE POLICY "entidad_admin_all_documents" ON documents
  FOR ALL
  USING (
    auth_user_role() = 'entidad_admin'
    AND tenant_id = auth_user_tenant_id()
  )
  WITH CHECK (
    auth_user_role() = 'entidad_admin'
    AND tenant_id = auth_user_tenant_id()
  );

-- municipio_user: read documents from assigned convocatorias
CREATE POLICY "municipio_read_documents" ON documents
  FOR SELECT
  USING (
    auth_user_role() = 'municipio_user'
    AND convocatoria_id IN (
      SELECT cm.convocatoria_id
      FROM convocatoria_municipios cm
      WHERE cm.municipio_id = auth_user_municipio_id()
    )
  );

-- == Embeddings ==

-- platform_admin: full access
CREATE POLICY "platform_admin_all_embeddings" ON embeddings
  FOR ALL
  USING (auth_user_role() = 'platform_admin');

-- entidad_admin: read + insert/delete own tenant embeddings
CREATE POLICY "entidad_admin_all_embeddings" ON embeddings
  FOR ALL
  USING (
    auth_user_role() = 'entidad_admin'
    AND convocatoria_id IN (
      SELECT c.id FROM convocatorias c
      WHERE c.tenant_id = auth_user_tenant_id()
    )
  )
  WITH CHECK (
    auth_user_role() = 'entidad_admin'
    AND convocatoria_id IN (
      SELECT c.id FROM convocatorias c
      WHERE c.tenant_id = auth_user_tenant_id()
    )
  );

-- municipio_user: read embeddings from assigned convocatorias
CREATE POLICY "municipio_read_embeddings" ON embeddings
  FOR SELECT
  USING (
    auth_user_role() = 'municipio_user'
    AND convocatoria_id IN (
      SELECT cm.convocatoria_id
      FROM convocatoria_municipios cm
      WHERE cm.municipio_id = auth_user_municipio_id()
    )
  );

-- ============================================================
-- Storage bucket (run manually or via Supabase dashboard)
-- Note: Supabase Storage buckets are managed via API/dashboard.
-- This is documented here for reference:
--   Bucket name: convocatoria-docs
--   Public: false
--   Allowed MIME types: application/pdf, text/plain,
--     application/vnd.openxmlformats-officedocument.wordprocessingml.document
--   Max file size: 10MB (10485760 bytes)
-- ============================================================
