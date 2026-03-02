-- ============================================================
-- Migration 00025: Revision Requests + Portfolio index
-- Wave E: Post-submission + revision workflow
-- ============================================================

-- ── 1. Revision Requests ──
CREATE TABLE IF NOT EXISTS revision_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES auth.users(id),
  campos text[] NOT NULL DEFAULT '{}', -- list of campo_ids that need revision
  message text NOT NULL,
  deadline timestamptz,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'resolved', 'cancelled')),
  round integer NOT NULL DEFAULT 1,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_revision_requests_submission
  ON revision_requests (submission_id, status);

ALTER TABLE revision_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read revision requests for their submissions"
  ON revision_requests FOR SELECT TO authenticated USING (true);

CREATE POLICY "Entity admins can create revision requests"
  ON revision_requests FOR INSERT TO authenticated
  WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Users can update revision requests"
  ON revision_requests FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

-- ── 2. Portfolio index on submissions ──
CREATE INDEX IF NOT EXISTS idx_submissions_org_status_portfolio
  ON submissions (municipio_id, status, created_at DESC);
