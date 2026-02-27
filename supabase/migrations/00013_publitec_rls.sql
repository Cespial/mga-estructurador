-- ============================================================
-- Migration 00013: Publitec Row Level Security
-- RLS policies for all 12 Publitec tables
-- ============================================================

-- ============================================================
-- Helper: check if current user owns a given organization
-- ============================================================
CREATE OR REPLACE FUNCTION is_org_owner(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organizations
    WHERE id = p_org_id AND owner_id = auth.uid()
  );
$$;

-- ============================================================
-- Helper: check if current user owns the entity that created a convocatoria
-- ============================================================
CREATE OR REPLACE FUNCTION is_convocatoria_entity_owner(p_convocatoria_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM convocatorias_v2 c
    JOIN organizations o ON o.id = c.organization_id
    WHERE c.id = p_convocatoria_id AND o.owner_id = auth.uid()
  );
$$;

-- ============================================================
-- Helper: check if current user owns the organization of a project
-- ============================================================
CREATE OR REPLACE FUNCTION is_project_org_owner(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects p
    JOIN organizations o ON o.id = p.organization_id
    WHERE p.id = p_project_id AND o.owner_id = auth.uid()
  );
$$;

-- ============================================================
-- Helper: check if current user is the entity owner for a project's convocatoria
-- ============================================================
CREATE OR REPLACE FUNCTION is_project_entity_owner(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects p
    JOIN convocatorias_v2 c ON c.id = p.convocatoria_id
    JOIN organizations o ON o.id = c.organization_id
    WHERE p.id = p_project_id AND o.owner_id = auth.uid()
  );
$$;

-- ============================================================
-- Enable RLS on all 12 tables
-- ============================================================
ALTER TABLE organizations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE convocatorias_v2    ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubrics_v2          ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubric_criteria     ENABLE ROW LEVEL SECURITY;
ALTER TABLE convocatoria_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects            ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_forms       ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_documents   ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_scores      ENABLE ROW LEVEL SECURITY;
ALTER TABLE criteria_scores     ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_jobs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages    ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ORGANIZATIONS
-- Owner can perform all operations
-- Authenticated users can read all organizations
-- ============================================================
CREATE POLICY "org_owner_all" ON organizations
  FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "authenticated_read_orgs" ON organizations
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- CONVOCATORIAS_V2
-- Public read for open convocatorias (anyone can browse)
-- Organization owner can CRUD
-- ============================================================
CREATE POLICY "public_read_open_convocatorias" ON convocatorias_v2
  FOR SELECT
  USING (status = 'open');

CREATE POLICY "authenticated_read_all_convocatorias" ON convocatorias_v2
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "org_owner_manage_convocatorias" ON convocatorias_v2
  FOR ALL
  TO authenticated
  USING (is_org_owner(organization_id))
  WITH CHECK (is_org_owner(organization_id));

-- ============================================================
-- RUBRICS_V2
-- Public read for rubrics of open convocatorias
-- Convocatoria entity owner can CRUD
-- ============================================================
CREATE POLICY "public_read_rubrics" ON rubrics_v2
  FOR SELECT
  USING (
    convocatoria_id IN (
      SELECT id FROM convocatorias_v2 WHERE status = 'open'
    )
  );

CREATE POLICY "entity_owner_manage_rubrics" ON rubrics_v2
  FOR ALL
  TO authenticated
  USING (is_convocatoria_entity_owner(convocatoria_id))
  WITH CHECK (is_convocatoria_entity_owner(convocatoria_id));

-- ============================================================
-- RUBRIC_CRITERIA
-- Public read for criteria of open convocatorias
-- Convocatoria entity owner can CRUD
-- ============================================================
CREATE POLICY "public_read_rubric_criteria" ON rubric_criteria
  FOR SELECT
  USING (
    rubric_id IN (
      SELECT r.id FROM rubrics_v2 r
      JOIN convocatorias_v2 c ON c.id = r.convocatoria_id
      WHERE c.status = 'open'
    )
  );

CREATE POLICY "entity_owner_manage_rubric_criteria" ON rubric_criteria
  FOR ALL
  TO authenticated
  USING (
    rubric_id IN (
      SELECT r.id FROM rubrics_v2 r
      WHERE is_convocatoria_entity_owner(r.convocatoria_id)
    )
  )
  WITH CHECK (
    rubric_id IN (
      SELECT r.id FROM rubrics_v2 r
      WHERE is_convocatoria_entity_owner(r.convocatoria_id)
    )
  );

-- ============================================================
-- CONVOCATORIA_STAGES
-- Public read for stages of open convocatorias
-- Convocatoria entity owner can CRUD
-- ============================================================
CREATE POLICY "public_read_conv_stages" ON convocatoria_stages
  FOR SELECT
  USING (
    convocatoria_id IN (
      SELECT id FROM convocatorias_v2 WHERE status = 'open'
    )
  );

CREATE POLICY "entity_owner_manage_conv_stages" ON convocatoria_stages
  FOR ALL
  TO authenticated
  USING (is_convocatoria_entity_owner(convocatoria_id))
  WITH CHECK (is_convocatoria_entity_owner(convocatoria_id));

-- ============================================================
-- PROJECTS
-- Organization owner can CRUD their own projects
-- Entity owner can read submitted projects for their convocatorias
-- ============================================================
CREATE POLICY "project_org_owner_all" ON projects
  FOR ALL
  TO authenticated
  USING (is_org_owner(organization_id))
  WITH CHECK (is_org_owner(organization_id));

CREATE POLICY "entity_owner_read_submitted_projects" ON projects
  FOR SELECT
  TO authenticated
  USING (
    status NOT IN ('draft')
    AND is_convocatoria_entity_owner(convocatoria_id)
  );

-- ============================================================
-- PROJECT_FORMS
-- Project organization owner can CRUD
-- Entity owner can read forms of submitted projects
-- ============================================================
CREATE POLICY "project_org_owner_all_forms" ON project_forms
  FOR ALL
  TO authenticated
  USING (is_project_org_owner(project_id))
  WITH CHECK (is_project_org_owner(project_id));

CREATE POLICY "entity_owner_read_project_forms" ON project_forms
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE status NOT IN ('draft')
        AND is_convocatoria_entity_owner(convocatoria_id)
    )
  );

-- ============================================================
-- PROJECT_DOCUMENTS
-- Project organization owner can CRUD
-- Entity owner can read documents of submitted projects
-- ============================================================
CREATE POLICY "project_org_owner_all_docs" ON project_documents
  FOR ALL
  TO authenticated
  USING (is_project_org_owner(project_id))
  WITH CHECK (is_project_org_owner(project_id));

CREATE POLICY "entity_owner_read_project_docs" ON project_documents
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE status NOT IN ('draft')
        AND is_convocatoria_entity_owner(convocatoria_id)
    )
  );

-- ============================================================
-- PROJECT_SCORES
-- Project owner can read their scores
-- Entity owner can read scores for their convocatoria projects
-- System (service_role) can insert — no explicit policy needed
--   as service_role bypasses RLS
-- ============================================================
CREATE POLICY "project_owner_read_scores" ON project_scores
  FOR SELECT
  TO authenticated
  USING (is_project_org_owner(project_id));

CREATE POLICY "entity_owner_read_project_scores" ON project_scores
  FOR SELECT
  TO authenticated
  USING (is_project_entity_owner(project_id));

-- Allow service_role inserts/updates (bypasses RLS by default)
-- For edge functions or backend workers using anon/authenticated,
-- grant explicit insert for the scoring system
CREATE POLICY "system_insert_project_scores" ON project_scores
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "system_update_project_scores" ON project_scores
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- CRITERIA_SCORES
-- Project owner can read
-- Entity owner can read
-- System can insert
-- ============================================================
CREATE POLICY "project_owner_read_criteria_scores" ON criteria_scores
  FOR SELECT
  TO authenticated
  USING (
    project_score_id IN (
      SELECT ps.id FROM project_scores ps
      WHERE is_project_org_owner(ps.project_id)
    )
  );

CREATE POLICY "entity_owner_read_criteria_scores" ON criteria_scores
  FOR SELECT
  TO authenticated
  USING (
    project_score_id IN (
      SELECT ps.id FROM project_scores ps
      WHERE is_project_entity_owner(ps.project_id)
    )
  );

CREATE POLICY "system_insert_criteria_scores" ON criteria_scores
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================
-- SCORING_JOBS
-- System-only write (service_role bypasses RLS)
-- Entity owner can read jobs for their convocatoria projects
-- Project owner can read their own scoring jobs
-- ============================================================
CREATE POLICY "entity_owner_read_scoring_jobs" ON scoring_jobs
  FOR SELECT
  TO authenticated
  USING (
    project_score_id IN (
      SELECT ps.id FROM project_scores ps
      WHERE is_project_entity_owner(ps.project_id)
    )
  );

CREATE POLICY "project_owner_read_scoring_jobs" ON scoring_jobs
  FOR SELECT
  TO authenticated
  USING (
    project_score_id IN (
      SELECT ps.id FROM project_scores ps
      WHERE is_project_org_owner(ps.project_id)
    )
  );

-- Scoring jobs are written by the system (service_role bypasses RLS)
-- For workers that use authenticated role, allow insert/update
CREATE POLICY "system_insert_scoring_jobs" ON scoring_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "system_update_scoring_jobs" ON scoring_jobs
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- AI_CHAT_MESSAGES
-- Project organization owner can CRUD
-- ============================================================
CREATE POLICY "project_org_owner_all_chat" ON ai_chat_messages
  FOR ALL
  TO authenticated
  USING (is_project_org_owner(project_id))
  WITH CHECK (is_project_org_owner(project_id));
