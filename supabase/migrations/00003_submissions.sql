-- ============================================================
-- Migration 00003: Submissions (diligenciamiento MGA)
-- Wave 3: Wizard MGA
-- ============================================================

-- 1) Submissions table
-- data_json: { [campo_id]: value } for all campos across all etapas
-- etapa_actual: id of the current etapa the user is working on
CREATE TABLE submissions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  convocatoria_id   uuid NOT NULL REFERENCES convocatorias(id) ON DELETE CASCADE,
  municipio_id      uuid NOT NULL REFERENCES municipios(id) ON DELETE CASCADE,
  data_json         jsonb NOT NULL DEFAULT '{}'::jsonb,
  etapa_actual      text,
  progress          real NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  completed_at      timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE(convocatoria_id, municipio_id)
);

CREATE INDEX idx_submissions_convocatoria ON submissions(convocatoria_id);
CREATE INDEX idx_submissions_municipio ON submissions(municipio_id);

-- 2) Updated_at trigger
CREATE TRIGGER set_updated_at_submissions
  BEFORE UPDATE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 3) Row Level Security
-- ============================================================

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- platform_admin: full access
CREATE POLICY "platform_admin_all_submissions" ON submissions
  FOR ALL
  USING (auth_user_role() = 'platform_admin');

-- entidad_admin: read submissions of their tenant's convocatorias
CREATE POLICY "entidad_admin_read_submissions" ON submissions
  FOR SELECT
  USING (
    auth_user_role() = 'entidad_admin'
    AND convocatoria_id IN (
      SELECT id FROM convocatorias WHERE tenant_id = auth_user_tenant_id()
    )
  );

-- municipio_user: full CRUD on own submissions
CREATE POLICY "municipio_manage_own_submissions" ON submissions
  FOR ALL
  USING (municipio_id = auth_user_municipio_id())
  WITH CHECK (municipio_id = auth_user_municipio_id());

-- ============================================================
-- 4) Function: sync progress to convocatoria_municipios
-- Called after saving submission data
-- ============================================================

CREATE OR REPLACE FUNCTION sync_submission_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE convocatoria_municipios
  SET progress = NEW.progress
  WHERE convocatoria_id = NEW.convocatoria_id
    AND municipio_id = NEW.municipio_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_progress_on_submission_update
  AFTER INSERT OR UPDATE OF progress ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION sync_submission_progress();
