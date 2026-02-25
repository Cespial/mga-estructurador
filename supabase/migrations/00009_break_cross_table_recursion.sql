-- ============================================================
-- Migration 00009: Break cross-table RLS recursion completely
--
-- Root cause: PostgreSQL evaluates ALL applicable RLS policies
-- with OR logic. Even when a user is entidad_admin, the
-- municipio_user policies on convocatorias still execute their
-- subqueries to convocatoria_municipios, whose entidad_admin
-- policies subquery convocatorias back → infinite loop.
--
-- Fix strategy:
-- 1. Add tenant_id to convocatoria_municipios (denormalized)
--    so entidad_admin policies don't need to join convocatorias.
-- 2. Rewrite municipio policies on convocatorias to NOT subquery
--    convocatoria_municipios (use a SECURITY DEFINER function).
-- ============================================================

-- ============================================================
-- STEP 1: Add tenant_id to convocatoria_municipios (denormalized)
-- ============================================================

ALTER TABLE convocatoria_municipios
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

-- Backfill from convocatorias
UPDATE convocatoria_municipios cm
SET tenant_id = c.tenant_id
FROM convocatorias c
WHERE cm.convocatoria_id = c.id
  AND cm.tenant_id IS NULL;

-- ============================================================
-- STEP 2: Create SECURITY DEFINER functions to check assignments
-- without triggering RLS on the target table.
-- ============================================================

-- Check if a convocatoria is assigned to a municipio (bypasses RLS on convocatoria_municipios)
CREATE OR REPLACE FUNCTION is_municipio_assigned_to_convocatoria(
  p_convocatoria_id uuid,
  p_municipio_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.convocatoria_municipios
    WHERE convocatoria_id = p_convocatoria_id
      AND municipio_id = p_municipio_id
  );
$$;

-- Get convocatoria IDs assigned to a municipio (bypasses RLS on convocatoria_municipios)
CREATE OR REPLACE FUNCTION get_municipio_convocatoria_ids(p_municipio_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT convocatoria_id FROM public.convocatoria_municipios
  WHERE municipio_id = p_municipio_id;
$$;

-- Get convocatoria tenant_id (bypasses RLS on convocatorias)
CREATE OR REPLACE FUNCTION get_convocatoria_tenant_id(p_convocatoria_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT tenant_id FROM public.convocatorias WHERE id = p_convocatoria_id;
$$;

-- ============================================================
-- STEP 3: Rewrite ALL policies to use SECURITY DEFINER functions
-- instead of direct subqueries. This breaks all cycles.
-- ============================================================

-- === CONVOCATORIAS ===
DROP POLICY IF EXISTS "platform_admin_all_convocatorias" ON convocatorias;
DROP POLICY IF EXISTS "entidad_admin_manage_convocatorias" ON convocatorias;
DROP POLICY IF EXISTS "municipio_read_assigned_convocatorias" ON convocatorias;

CREATE POLICY "platform_admin_all_convocatorias" ON convocatorias
  FOR ALL USING (auth_user_role() = 'platform_admin');

CREATE POLICY "entidad_admin_manage_convocatorias" ON convocatorias
  FOR ALL
  USING (tenant_id = auth_user_tenant_id())
  WITH CHECK (tenant_id = auth_user_tenant_id());

CREATE POLICY "municipio_read_assigned_convocatorias" ON convocatorias
  FOR SELECT
  USING (
    auth_user_role() = 'municipio_user'
    AND id IN (SELECT get_municipio_convocatoria_ids(auth_user_municipio_id()))
  );

-- === CONVOCATORIA_MUNICIPIOS ===
DROP POLICY IF EXISTS "platform_admin_all_conv_municipios" ON convocatoria_municipios;
DROP POLICY IF EXISTS "entidad_admin_manage_conv_municipios" ON convocatoria_municipios;
DROP POLICY IF EXISTS "municipio_read_own_assignments" ON convocatoria_municipios;

CREATE POLICY "platform_admin_all_conv_municipios" ON convocatoria_municipios
  FOR ALL USING (auth_user_role() = 'platform_admin');

-- Use denormalized tenant_id — no subquery to convocatorias needed
CREATE POLICY "entidad_admin_manage_conv_municipios" ON convocatoria_municipios
  FOR ALL
  USING (
    auth_user_role() = 'entidad_admin'
    AND tenant_id = auth_user_tenant_id()
  )
  WITH CHECK (
    auth_user_role() = 'entidad_admin'
    AND get_convocatoria_tenant_id(convocatoria_id) = auth_user_tenant_id()
  );

CREATE POLICY "municipio_read_own_assignments" ON convocatoria_municipios
  FOR SELECT
  USING (
    auth_user_role() = 'municipio_user'
    AND municipio_id = auth_user_municipio_id()
  );

-- === MGA_TEMPLATES ===
DROP POLICY IF EXISTS "platform_admin_all_templates" ON mga_templates;
DROP POLICY IF EXISTS "entidad_admin_manage_templates" ON mga_templates;
DROP POLICY IF EXISTS "municipio_read_assigned_templates" ON mga_templates;

CREATE POLICY "platform_admin_all_templates" ON mga_templates
  FOR ALL USING (auth_user_role() = 'platform_admin');

CREATE POLICY "entidad_admin_manage_templates" ON mga_templates
  FOR ALL
  USING (get_convocatoria_tenant_id(convocatoria_id) = auth_user_tenant_id())
  WITH CHECK (get_convocatoria_tenant_id(convocatoria_id) = auth_user_tenant_id());

CREATE POLICY "municipio_read_assigned_templates" ON mga_templates
  FOR SELECT
  USING (
    auth_user_role() = 'municipio_user'
    AND convocatoria_id IN (SELECT get_municipio_convocatoria_ids(auth_user_municipio_id()))
  );

-- === SUBMISSIONS ===
DROP POLICY IF EXISTS "platform_admin_all_submissions" ON submissions;
DROP POLICY IF EXISTS "entidad_admin_read_submissions" ON submissions;
DROP POLICY IF EXISTS "municipio_manage_own_submissions" ON submissions;

CREATE POLICY "platform_admin_all_submissions" ON submissions
  FOR ALL USING (auth_user_role() = 'platform_admin');

CREATE POLICY "entidad_admin_read_submissions" ON submissions
  FOR SELECT
  USING (get_convocatoria_tenant_id(convocatoria_id) = auth_user_tenant_id());

CREATE POLICY "municipio_manage_own_submissions" ON submissions
  FOR ALL USING (municipio_id = auth_user_municipio_id());

-- === DOCUMENTS ===
DROP POLICY IF EXISTS "platform_admin_all_documents" ON documents;
DROP POLICY IF EXISTS "entidad_admin_all_documents" ON documents;
DROP POLICY IF EXISTS "municipio_read_documents" ON documents;

CREATE POLICY "platform_admin_all_documents" ON documents
  FOR ALL USING (auth_user_role() = 'platform_admin');

CREATE POLICY "entidad_admin_all_documents" ON documents
  FOR ALL
  USING (tenant_id = auth_user_tenant_id());

CREATE POLICY "municipio_read_documents" ON documents
  FOR SELECT
  USING (
    auth_user_role() = 'municipio_user'
    AND convocatoria_id IN (SELECT get_municipio_convocatoria_ids(auth_user_municipio_id()))
  );

-- === EMBEDDINGS ===
DROP POLICY IF EXISTS "platform_admin_all_embeddings" ON embeddings;
DROP POLICY IF EXISTS "entidad_admin_all_embeddings" ON embeddings;
DROP POLICY IF EXISTS "municipio_read_embeddings" ON embeddings;

CREATE POLICY "platform_admin_all_embeddings" ON embeddings
  FOR ALL USING (auth_user_role() = 'platform_admin');

CREATE POLICY "entidad_admin_all_embeddings" ON embeddings
  FOR ALL
  USING (get_convocatoria_tenant_id(convocatoria_id) = auth_user_tenant_id());

CREATE POLICY "municipio_read_embeddings" ON embeddings
  FOR SELECT
  USING (
    auth_user_role() = 'municipio_user'
    AND convocatoria_id IN (SELECT get_municipio_convocatoria_ids(auth_user_municipio_id()))
  );

-- === RUBRICS ===
DROP POLICY IF EXISTS "platform_admin_all_rubrics" ON rubrics;
DROP POLICY IF EXISTS "entidad_admin_all_rubrics" ON rubrics;
DROP POLICY IF EXISTS "municipio_read_rubrics" ON rubrics;

CREATE POLICY "platform_admin_all_rubrics" ON rubrics
  FOR ALL USING (auth_user_role() = 'platform_admin');

CREATE POLICY "entidad_admin_all_rubrics" ON rubrics
  FOR ALL
  USING (tenant_id = auth_user_tenant_id());

CREATE POLICY "municipio_read_rubrics" ON rubrics
  FOR SELECT
  USING (
    auth_user_role() = 'municipio_user'
    AND convocatoria_id IN (SELECT get_municipio_convocatoria_ids(auth_user_municipio_id()))
  );

-- === EVALUATIONS ===
DROP POLICY IF EXISTS "platform_admin_all_evaluations" ON evaluations;
DROP POLICY IF EXISTS "entidad_admin_all_evaluations" ON evaluations;
DROP POLICY IF EXISTS "municipio_read_evaluations" ON evaluations;

CREATE POLICY "platform_admin_all_evaluations" ON evaluations
  FOR ALL USING (auth_user_role() = 'platform_admin');

CREATE POLICY "entidad_admin_all_evaluations" ON evaluations
  FOR ALL
  USING (get_convocatoria_tenant_id(convocatoria_id) = auth_user_tenant_id());

CREATE POLICY "municipio_read_evaluations" ON evaluations
  FOR SELECT
  USING (municipio_id = auth_user_municipio_id());

-- === AUDIT_LOGS ===
DROP POLICY IF EXISTS "platform_admin_all_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "entidad_admin_read_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "municipio_read_own_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "municipio_insert_audit_logs" ON audit_logs;

CREATE POLICY "platform_admin_all_audit_logs" ON audit_logs
  FOR ALL USING (auth_user_role() = 'platform_admin');

CREATE POLICY "entidad_admin_read_audit_logs" ON audit_logs
  FOR SELECT
  USING (
    auth_user_role() = 'entidad_admin'
    AND tenant_id = auth_user_tenant_id()
  );

CREATE POLICY "municipio_read_own_audit_logs" ON audit_logs
  FOR SELECT
  USING (actor_user_id = auth.uid());

CREATE POLICY "municipio_insert_audit_logs" ON audit_logs
  FOR INSERT
  WITH CHECK (actor_user_id = auth.uid());

-- === PROFILES (keep simple — no cross-table deps) ===
DROP POLICY IF EXISTS "users_read_own_profile" ON profiles;
DROP POLICY IF EXISTS "platform_admin_all_profiles" ON profiles;
DROP POLICY IF EXISTS "entidad_admin_read_tenant_profiles" ON profiles;

CREATE POLICY "users_read_own_profile" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "platform_admin_all_profiles" ON profiles
  FOR ALL USING (auth_user_role() = 'platform_admin');

CREATE POLICY "entidad_admin_read_tenant_profiles" ON profiles
  FOR SELECT
  USING (
    auth_user_role() = 'entidad_admin'
    AND tenant_id = auth_user_tenant_id()
  );

-- === TENANTS (no change needed but recreate for consistency) ===
DROP POLICY IF EXISTS "platform_admin_all_tenants" ON tenants;
DROP POLICY IF EXISTS "entidad_admin_own_tenant" ON tenants;

CREATE POLICY "platform_admin_all_tenants" ON tenants
  FOR ALL USING (auth_user_role() = 'platform_admin');

CREATE POLICY "entidad_admin_own_tenant" ON tenants
  FOR SELECT USING (id = auth_user_tenant_id());

-- ============================================================
-- STEP 4: Backfill tenant_id for convocatoria_municipios
-- and ensure future inserts populate it via trigger
-- ============================================================

CREATE OR REPLACE FUNCTION set_conv_muni_tenant_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    SELECT tenant_id INTO NEW.tenant_id
    FROM public.convocatorias
    WHERE id = NEW.convocatoria_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_tenant_id_on_conv_muni ON convocatoria_municipios;
CREATE TRIGGER set_tenant_id_on_conv_muni
  BEFORE INSERT OR UPDATE ON convocatoria_municipios
  FOR EACH ROW
  EXECUTE FUNCTION set_conv_muni_tenant_id();
