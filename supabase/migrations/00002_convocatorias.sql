-- ============================================================
-- Migration 00002: Convocatorias + Plantillas MGA
-- Wave 2: Convocatorias + Plantilla MGA
-- ============================================================

-- 1) Estado de convocatoria
CREATE TYPE convocatoria_estado AS ENUM ('borrador', 'abierta', 'cerrada', 'evaluacion');

-- 2) Convocatorias
CREATE TABLE convocatorias (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nombre        text NOT NULL,
  descripcion   text,
  requisitos    text,
  fecha_inicio  date,
  fecha_cierre  date,
  estado        convocatoria_estado NOT NULL DEFAULT 'borrador',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_convocatorias_tenant ON convocatorias(tenant_id);
CREATE INDEX idx_convocatorias_estado ON convocatorias(estado);

-- 3) Plantillas MGA (una por convocatoria)
-- etapas_json: array de etapas, cada una con campos
-- Estructura: [{ id, nombre, orden, campos: [{ id, nombre, tipo, descripcion, requerido }] }]
CREATE TABLE mga_templates (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  convocatoria_id   uuid NOT NULL UNIQUE REFERENCES convocatorias(id) ON DELETE CASCADE,
  etapas_json       jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- 4) Relación convocatoria-municipios
CREATE TYPE convocatoria_municipio_estado AS ENUM ('invitado', 'activo', 'completado', 'retirado');

CREATE TABLE convocatoria_municipios (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  convocatoria_id   uuid NOT NULL REFERENCES convocatorias(id) ON DELETE CASCADE,
  municipio_id      uuid NOT NULL REFERENCES municipios(id) ON DELETE CASCADE,
  estado            convocatoria_municipio_estado NOT NULL DEFAULT 'invitado',
  progress          real NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE(convocatoria_id, municipio_id)
);

CREATE INDEX idx_conv_muni_convocatoria ON convocatoria_municipios(convocatoria_id);
CREATE INDEX idx_conv_muni_municipio ON convocatoria_municipios(municipio_id);

-- ============================================================
-- 5) Updated_at triggers
-- ============================================================

CREATE TRIGGER set_updated_at_convocatorias
  BEFORE UPDATE ON convocatorias
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_mga_templates
  BEFORE UPDATE ON mga_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_conv_municipios
  BEFORE UPDATE ON convocatoria_municipios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 6) Row Level Security
-- ============================================================

-- CONVOCATORIAS
ALTER TABLE convocatorias ENABLE ROW LEVEL SECURITY;

-- platform_admin: full access
CREATE POLICY "platform_admin_all_convocatorias" ON convocatorias
  FOR ALL
  USING (auth_user_role() = 'platform_admin');

-- entidad_admin: CRUD on own tenant's convocatorias
CREATE POLICY "entidad_admin_manage_convocatorias" ON convocatorias
  FOR ALL
  USING (tenant_id = auth_user_tenant_id())
  WITH CHECK (tenant_id = auth_user_tenant_id());

-- municipio_user: read convocatorias they are assigned to
CREATE POLICY "municipio_read_assigned_convocatorias" ON convocatorias
  FOR SELECT
  USING (
    auth_user_role() = 'municipio_user'
    AND id IN (
      SELECT convocatoria_id FROM convocatoria_municipios
      WHERE municipio_id = auth_user_municipio_id()
    )
  );

-- MGA_TEMPLATES
ALTER TABLE mga_templates ENABLE ROW LEVEL SECURITY;

-- platform_admin: full access
CREATE POLICY "platform_admin_all_templates" ON mga_templates
  FOR ALL
  USING (auth_user_role() = 'platform_admin');

-- entidad_admin: manage templates of own convocatorias
CREATE POLICY "entidad_admin_manage_templates" ON mga_templates
  FOR ALL
  USING (
    convocatoria_id IN (
      SELECT id FROM convocatorias WHERE tenant_id = auth_user_tenant_id()
    )
  )
  WITH CHECK (
    convocatoria_id IN (
      SELECT id FROM convocatorias WHERE tenant_id = auth_user_tenant_id()
    )
  );

-- municipio_user: read templates of assigned convocatorias
CREATE POLICY "municipio_read_assigned_templates" ON mga_templates
  FOR SELECT
  USING (
    auth_user_role() = 'municipio_user'
    AND convocatoria_id IN (
      SELECT convocatoria_id FROM convocatoria_municipios
      WHERE municipio_id = auth_user_municipio_id()
    )
  );

-- CONVOCATORIA_MUNICIPIOS
ALTER TABLE convocatoria_municipios ENABLE ROW LEVEL SECURITY;

-- platform_admin: full access
CREATE POLICY "platform_admin_all_conv_municipios" ON convocatoria_municipios
  FOR ALL
  USING (auth_user_role() = 'platform_admin');

-- entidad_admin: manage assignments of own convocatorias
CREATE POLICY "entidad_admin_manage_conv_municipios" ON convocatoria_municipios
  FOR ALL
  USING (
    convocatoria_id IN (
      SELECT id FROM convocatorias WHERE tenant_id = auth_user_tenant_id()
    )
  )
  WITH CHECK (
    convocatoria_id IN (
      SELECT id FROM convocatorias WHERE tenant_id = auth_user_tenant_id()
    )
  );

-- municipio_user: read own assignments
CREATE POLICY "municipio_read_own_assignments" ON convocatoria_municipios
  FOR SELECT
  USING (
    auth_user_role() = 'municipio_user'
    AND municipio_id = auth_user_municipio_id()
  );
