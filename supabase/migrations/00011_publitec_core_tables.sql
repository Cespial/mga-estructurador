-- ============================================================
-- Migration 00011: Publitec Core Tables
-- 12 new tables for the Publitec platform
-- ============================================================

-- ============================================================
-- 1) organizations
-- ============================================================
CREATE TABLE organizations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     uuid NOT NULL REFERENCES auth.users(id),
  name         text NOT NULL,
  type         text NOT NULL CHECK (type IN ('entity', 'municipality')),
  nit          text,
  municipality text,
  department   text,
  logo_url     text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_organizations_owner    ON organizations(owner_id);
CREATE INDEX idx_organizations_type     ON organizations(type);
CREATE INDEX idx_organizations_department ON organizations(department);

CREATE TRIGGER set_updated_at_organizations
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 2) convocatorias_v2
-- ============================================================
CREATE TABLE convocatorias_v2 (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  name            text NOT NULL,
  slug            text NOT NULL UNIQUE,
  description     text,
  status          text DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed', 'evaluating', 'resolved')),
  budget          numeric,
  open_date       timestamptz,
  close_date      timestamptz,
  form_schema     jsonb DEFAULT '[]'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_convocatorias_v2_org    ON convocatorias_v2(organization_id);
CREATE INDEX idx_convocatorias_v2_status ON convocatorias_v2(status);
CREATE INDEX idx_convocatorias_v2_slug   ON convocatorias_v2(slug);

CREATE TRIGGER set_updated_at_convocatorias_v2
  BEFORE UPDATE ON convocatorias_v2
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 3) rubrics_v2
-- ============================================================
CREATE TABLE rubrics_v2 (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  convocatoria_id uuid NOT NULL REFERENCES convocatorias_v2(id),
  name            text NOT NULL DEFAULT 'Rubrica Principal',
  total_score     numeric DEFAULT 100,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_rubrics_v2_convocatoria ON rubrics_v2(convocatoria_id);

-- ============================================================
-- 4) rubric_criteria
-- ============================================================
CREATE TABLE rubric_criteria (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rubric_id        uuid NOT NULL REFERENCES rubrics_v2(id),
  criterion_name   text NOT NULL,
  max_score        numeric NOT NULL,
  weight           numeric NOT NULL DEFAULT 1,
  evaluation_guide text,
  sort_order       int DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_rubric_criteria_rubric ON rubric_criteria(rubric_id);
CREATE INDEX idx_rubric_criteria_sort   ON rubric_criteria(rubric_id, sort_order);

-- ============================================================
-- 5) convocatoria_stages
-- ============================================================
CREATE TABLE convocatoria_stages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  convocatoria_id uuid NOT NULL REFERENCES convocatorias_v2(id),
  name            text NOT NULL,
  start_date      timestamptz,
  end_date        timestamptz,
  sort_order      int DEFAULT 0,
  status          text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_conv_stages_convocatoria ON convocatoria_stages(convocatoria_id);
CREATE INDEX idx_conv_stages_status       ON convocatoria_stages(status);

-- ============================================================
-- 6) projects
-- ============================================================
CREATE TABLE projects (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  convocatoria_id uuid NOT NULL REFERENCES convocatorias_v2(id),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  title           text NOT NULL,
  description     text,
  budget_requested numeric,
  status          text DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'scored', 'approved', 'rejected')),
  submitted_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_convocatoria ON projects(convocatoria_id);
CREATE INDEX idx_projects_organization ON projects(organization_id);
CREATE INDEX idx_projects_status       ON projects(status);

CREATE TRIGGER set_updated_at_projects
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 7) project_forms
-- ============================================================
CREATE TABLE project_forms (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     uuid NOT NULL REFERENCES projects(id),
  step_number    int NOT NULL,
  step_name      text NOT NULL,
  form_data      jsonb DEFAULT '{}'::jsonb,
  ai_suggestions jsonb DEFAULT '[]'::jsonb,
  completed      boolean DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, step_number)
);

CREATE INDEX idx_project_forms_project ON project_forms(project_id);

CREATE TRIGGER set_updated_at_project_forms
  BEFORE UPDATE ON project_forms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 8) project_documents
-- ============================================================
CREATE TABLE project_documents (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid NOT NULL REFERENCES projects(id),
  filename     text NOT NULL,
  storage_path text NOT NULL,
  mime_type    text,
  file_size    bigint,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_documents_project ON project_documents(project_id);

-- ============================================================
-- 9) project_scores
-- ============================================================
CREATE TABLE project_scores (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id           uuid NOT NULL REFERENCES projects(id),
  rubric_id            uuid NOT NULL REFERENCES rubrics_v2(id),
  evaluator_type       text DEFAULT 'ai' CHECK (evaluator_type IN ('ai', 'human')),
  total_score          numeric,
  total_weighted_score numeric,
  ai_summary           text,
  status               text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_scores_project ON project_scores(project_id);
CREATE INDEX idx_project_scores_rubric  ON project_scores(rubric_id);
CREATE INDEX idx_project_scores_status  ON project_scores(status);

CREATE TRIGGER set_updated_at_project_scores
  BEFORE UPDATE ON project_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 10) criteria_scores
-- ============================================================
CREATE TABLE criteria_scores (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_score_id  uuid NOT NULL REFERENCES project_scores(id),
  rubric_criteria_id uuid NOT NULL REFERENCES rubric_criteria(id),
  score             numeric NOT NULL,
  max_score         numeric NOT NULL,
  weight            numeric NOT NULL DEFAULT 1,
  weighted_score    numeric,
  justification     text,
  ai_rationale      text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_criteria_scores_project_score ON criteria_scores(project_score_id);
CREATE INDEX idx_criteria_scores_rubric_criteria ON criteria_scores(rubric_criteria_id);

-- ============================================================
-- 11) scoring_jobs
-- ============================================================
CREATE TABLE scoring_jobs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_score_id uuid NOT NULL REFERENCES project_scores(id) UNIQUE,
  engine_version   text DEFAULT 'v1',
  config           jsonb DEFAULT '{}'::jsonb,
  status           text DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'processing', 'completed', 'failed')),
  claimed_at       timestamptz,
  started_at       timestamptz,
  completed_at     timestamptz,
  error_message    text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_scoring_jobs_status  ON scoring_jobs(status);
CREATE INDEX idx_scoring_jobs_engine  ON scoring_jobs(engine_version, status);

CREATE TRIGGER set_updated_at_scoring_jobs
  BEFORE UPDATE ON scoring_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 12) ai_chat_messages
-- ============================================================
CREATE TABLE ai_chat_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES projects(id),
  role        text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content     text NOT NULL,
  step_number int,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_chat_messages_project ON ai_chat_messages(project_id);
CREATE INDEX idx_ai_chat_messages_project_step ON ai_chat_messages(project_id, step_number);
