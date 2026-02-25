-- ============================================================
-- Migration 00004: Audit logs (interacciones IA)
-- Wave 4: Asistente IA
-- ============================================================

CREATE TABLE audit_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id   uuid NOT NULL REFERENCES auth.users(id),
  tenant_id       uuid REFERENCES tenants(id),
  action          text NOT NULL,
  convocatoria_id uuid REFERENCES convocatorias(id) ON DELETE SET NULL,
  campo_id        text,
  prompt_hash     text,
  sources_used    jsonb DEFAULT '[]'::jsonb,
  response_json   jsonb,
  duration_ms     integer,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_convocatoria ON audit_logs(convocatoria_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- platform_admin: full access
CREATE POLICY "platform_admin_all_audit_logs" ON audit_logs
  FOR ALL
  USING (auth_user_role() = 'platform_admin');

-- entidad_admin: read audit logs of their tenant
CREATE POLICY "entidad_admin_read_audit_logs" ON audit_logs
  FOR SELECT
  USING (
    auth_user_role() = 'entidad_admin'
    AND tenant_id = auth_user_tenant_id()
  );

-- municipio_user: read own audit logs + insert
CREATE POLICY "municipio_read_own_audit_logs" ON audit_logs
  FOR SELECT
  USING (
    auth_user_role() = 'municipio_user'
    AND actor_user_id = auth.uid()
  );

CREATE POLICY "municipio_insert_audit_logs" ON audit_logs
  FOR INSERT
  WITH CHECK (
    auth_user_role() = 'municipio_user'
    AND actor_user_id = auth.uid()
  );
