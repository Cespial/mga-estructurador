-- ============================================================
-- Migration 00022: Field change history
-- Wave B: Track all field value changes for version history
-- ============================================================

CREATE TABLE IF NOT EXISTS field_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  campo_id text NOT NULL,
  old_value text,
  new_value text,
  changed_by uuid REFERENCES auth.users(id),
  source text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'ai_assist', 'auto_draft', 'improve', 'restore')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_field_changes_submission_campo
  ON field_changes (submission_id, campo_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_field_changes_submission
  ON field_changes (submission_id, created_at DESC);

-- RLS
ALTER TABLE field_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read field changes for their submissions"
  ON field_changes FOR SELECT
  TO authenticated
  USING (true); -- App-level filtering; RLS simplified

CREATE POLICY "Authenticated users can insert field changes"
  ON field_changes FOR INSERT
  TO authenticated
  WITH CHECK (changed_by = auth.uid());
