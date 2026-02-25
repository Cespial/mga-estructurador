-- ============================================================
-- Migration 00006: Rubrics + Evaluations
-- Wave 6: Rúbricas + Evaluación en vivo
-- ============================================================

-- 1) Rubrics table (criteria per convocatoria)
-- criterios_json structure:
-- [
--   {
--     "campo_id": "uuid-string",
--     "peso": 0.25,
--     "descripcion": "Claridad del planteamiento del problema",
--     "niveles": [
--       { "score": 1, "label": "Insuficiente", "descripcion": "No define el problema" },
--       { "score": 2, "label": "Básico", "descripcion": "Define parcialmente" },
--       { "score": 3, "label": "Bueno", "descripcion": "Define adecuadamente" },
--       { "score": 4, "label": "Excelente", "descripcion": "Definición clara y completa" }
--     ]
--   }
-- ]

CREATE TABLE rubrics (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  convocatoria_id uuid NOT NULL REFERENCES convocatorias(id) ON DELETE CASCADE,
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  criterios_json  jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(convocatoria_id)
);

CREATE INDEX idx_rubrics_convocatoria ON rubrics(convocatoria_id);

CREATE TRIGGER set_rubrics_updated_at
  BEFORE UPDATE ON rubrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 2) Evaluations table (scores per submission per etapa)
-- scores_json structure:
-- [
--   {
--     "campo_id": "uuid-string",
--     "campo_nombre": "Nombre del campo",
--     "score": 3,
--     "max_score": 4,
--     "justificacion": "Razón del score asignado"
--   }
-- ]

CREATE TABLE evaluations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id   uuid NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  convocatoria_id uuid NOT NULL REFERENCES convocatorias(id) ON DELETE CASCADE,
  municipio_id    uuid NOT NULL REFERENCES municipios(id),
  etapa_id        text NOT NULL,
  scores_json     jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_score     numeric(5,2) NOT NULL DEFAULT 0,
  max_score       numeric(5,2) NOT NULL DEFAULT 0,
  recomendaciones text[] NOT NULL DEFAULT '{}',
  evaluated_by    uuid REFERENCES auth.users(id),
  llm_model       text,
  duration_ms     integer,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_evaluations_submission ON evaluations(submission_id);
CREATE INDEX idx_evaluations_convocatoria ON evaluations(convocatoria_id);
CREATE INDEX idx_evaluations_municipio ON evaluations(municipio_id);
CREATE UNIQUE INDEX idx_evaluations_unique_etapa
  ON evaluations(submission_id, etapa_id);

CREATE TRIGGER set_evaluations_updated_at
  BEFORE UPDATE ON evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- == Rubrics ==

-- platform_admin: full access
CREATE POLICY "platform_admin_all_rubrics" ON rubrics
  FOR ALL
  USING (auth_user_role() = 'platform_admin');

-- entidad_admin: full CRUD on own tenant rubrics
CREATE POLICY "entidad_admin_all_rubrics" ON rubrics
  FOR ALL
  USING (
    auth_user_role() = 'entidad_admin'
    AND tenant_id = auth_user_tenant_id()
  )
  WITH CHECK (
    auth_user_role() = 'entidad_admin'
    AND tenant_id = auth_user_tenant_id()
  );

-- municipio_user: read rubrics of assigned convocatorias
CREATE POLICY "municipio_read_rubrics" ON rubrics
  FOR SELECT
  USING (
    auth_user_role() = 'municipio_user'
    AND convocatoria_id IN (
      SELECT cm.convocatoria_id
      FROM convocatoria_municipios cm
      WHERE cm.municipio_id = auth_user_municipio_id()
    )
  );

-- == Evaluations ==

-- platform_admin: full access
CREATE POLICY "platform_admin_all_evaluations" ON evaluations
  FOR ALL
  USING (auth_user_role() = 'platform_admin');

-- entidad_admin: full CRUD on own tenant evaluations
CREATE POLICY "entidad_admin_all_evaluations" ON evaluations
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

-- municipio_user: read own evaluations
CREATE POLICY "municipio_read_evaluations" ON evaluations
  FOR SELECT
  USING (
    auth_user_role() = 'municipio_user'
    AND municipio_id = auth_user_municipio_id()
  );
