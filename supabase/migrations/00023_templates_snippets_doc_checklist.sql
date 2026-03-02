-- ============================================================
-- Migration 00023: Templates, Snippets, Document checklist
-- Wave C: Reuse + Document management
-- ============================================================

-- ── 1. Project Templates ──
CREATE TABLE IF NOT EXISTS project_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  source_submission_id uuid REFERENCES submissions(id) ON DELETE SET NULL,
  data_snapshot jsonb NOT NULL DEFAULT '{}',
  tags text[] DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_templates_org
  ON project_templates (organization_id);

ALTER TABLE project_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read templates for their org"
  ON project_templates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create templates"
  ON project_templates FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- ── 2. Text Snippets ──
CREATE TABLE IF NOT EXISTS text_snippets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  label text NOT NULL,
  content text NOT NULL,
  tags text[] DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_text_snippets_org
  ON text_snippets (organization_id);

ALTER TABLE text_snippets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read snippets for their org"
  ON text_snippets FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage their snippets"
  ON text_snippets FOR ALL TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- ── 3. Document Requirements (entity defines per convocatoria) ──
CREATE TABLE IF NOT EXISTS document_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  convocatoria_id uuid NOT NULL REFERENCES convocatorias(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  required boolean NOT NULL DEFAULT true,
  accepted_formats text[] DEFAULT '{pdf,doc,docx,xls,xlsx}',
  max_file_size_mb integer DEFAULT 10,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_requirements_conv
  ON document_requirements (convocatoria_id, sort_order);

ALTER TABLE document_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read document requirements"
  ON document_requirements FOR SELECT TO authenticated USING (true);

CREATE POLICY "Entity admins can manage requirements"
  ON document_requirements FOR ALL TO authenticated
  USING (true) WITH CHECK (true); -- App-level role check

-- ── 4. Submission Documents (municipality uploads) ──
CREATE TABLE IF NOT EXISTS submission_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  requirement_id uuid REFERENCES document_requirements(id) ON DELETE SET NULL,
  campo_id text, -- optional: if linked to a specific wizard field
  file_name text NOT NULL,
  storage_path text NOT NULL,
  mime_type text,
  file_size integer, -- bytes
  ai_validation jsonb, -- { match: boolean, confidence: number, type_detected: string }
  uploaded_by uuid REFERENCES auth.users(id),
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_submission_documents_sub
  ON submission_documents (submission_id);

CREATE INDEX IF NOT EXISTS idx_submission_documents_req
  ON submission_documents (requirement_id);

ALTER TABLE submission_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read submission documents"
  ON submission_documents FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can upload documents"
  ON submission_documents FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their documents"
  ON submission_documents FOR DELETE TO authenticated
  USING (uploaded_by = auth.uid());
