-- ============================================================
-- Migration 00020: Tighten RLS policies + Add performance indexes
-- ============================================================

-- ============================================================
-- Fix overly permissive system write policies
-- The scoring system runs via service_role which bypasses RLS,
-- so these authenticated insert/update policies are unnecessary
-- and create a security hole. Replace with owner-scoped policies.
-- ============================================================

-- PROJECT_SCORES: Only project org owner or entity owner can insert/update
DROP POLICY IF EXISTS "system_insert_project_scores" ON project_scores;
DROP POLICY IF EXISTS "system_update_project_scores" ON project_scores;

CREATE POLICY "scoring_insert_project_scores" ON project_scores
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_project_org_owner(project_id)
    OR is_project_entity_owner(project_id)
  );

CREATE POLICY "scoring_update_project_scores" ON project_scores
  FOR UPDATE
  TO authenticated
  USING (
    is_project_org_owner(project_id)
    OR is_project_entity_owner(project_id)
  )
  WITH CHECK (
    is_project_org_owner(project_id)
    OR is_project_entity_owner(project_id)
  );

-- CRITERIA_SCORES: Only project org owner or entity owner can insert
DROP POLICY IF EXISTS "system_insert_criteria_scores" ON criteria_scores;

CREATE POLICY "scoring_insert_criteria_scores" ON criteria_scores
  FOR INSERT
  TO authenticated
  WITH CHECK (
    project_score_id IN (
      SELECT ps.id FROM project_scores ps
      WHERE is_project_org_owner(ps.project_id)
         OR is_project_entity_owner(ps.project_id)
    )
  );

-- SCORING_JOBS: Only entity owner can insert/update
DROP POLICY IF EXISTS "system_insert_scoring_jobs" ON scoring_jobs;
DROP POLICY IF EXISTS "system_update_scoring_jobs" ON scoring_jobs;

CREATE POLICY "scoring_insert_scoring_jobs" ON scoring_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    project_score_id IN (
      SELECT ps.id FROM project_scores ps
      WHERE is_project_entity_owner(ps.project_id)
    )
  );

CREATE POLICY "scoring_update_scoring_jobs" ON scoring_jobs
  FOR UPDATE
  TO authenticated
  USING (
    project_score_id IN (
      SELECT ps.id FROM project_scores ps
      WHERE is_project_entity_owner(ps.project_id)
    )
  )
  WITH CHECK (
    project_score_id IN (
      SELECT ps.id FROM project_scores ps
      WHERE is_project_entity_owner(ps.project_id)
    )
  );

-- ============================================================
-- Performance indexes for common query patterns
-- ============================================================

-- Projects: lookup by organization + status (dashboard queries)
CREATE INDEX IF NOT EXISTS idx_projects_org_status
  ON projects (organization_id, status);

-- Projects: lookup by convocatoria (entity admin views)
CREATE INDEX IF NOT EXISTS idx_projects_convocatoria
  ON projects (convocatoria_id);

-- Project forms: lookup by project + step
CREATE INDEX IF NOT EXISTS idx_project_forms_project_step
  ON project_forms (project_id, step_number);

-- Evaluations: lookup by convocatoria + submission
CREATE INDEX IF NOT EXISTS idx_evaluations_conv_sub
  ON evaluations (convocatoria_id, submission_id);

-- Submissions: lookup by convocatoria + municipio
CREATE INDEX IF NOT EXISTS idx_submissions_conv_muni
  ON submissions (convocatoria_id, municipio_id);

-- Notifications: lookup by user + unread
CREATE INDEX IF NOT EXISTS idx_notifications_user_read
  ON notifications (user_id, read);

-- AI chat messages: lookup by project + ordering
CREATE INDEX IF NOT EXISTS idx_ai_chat_project_created
  ON ai_chat_messages (project_id, created_at);

-- Field comments: lookup by submission + field
CREATE INDEX IF NOT EXISTS idx_field_comments_sub_field
  ON field_comments (submission_id, field_id);

-- Audit logs: lookup by prompt_hash for caching
CREATE INDEX IF NOT EXISTS idx_audit_logs_prompt_hash
  ON audit_logs (prompt_hash)
  WHERE prompt_hash IS NOT NULL;

-- Project embeddings: lookup by submission
CREATE INDEX IF NOT EXISTS idx_project_embeddings_submission
  ON project_embeddings (submission_id);
