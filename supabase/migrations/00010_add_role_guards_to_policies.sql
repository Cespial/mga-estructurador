-- ============================================================
-- Migration 00010: Add role guards to all entidad_admin policies
--
-- Problem: Several "entidad_admin" policies only check tenant_id
-- without verifying the user's role. Since municipio_users share
-- the same tenant_id, they can slip through entidad_admin policies
-- (PostgreSQL evaluates ALL policies with OR logic).
--
-- Fix: Add auth_user_role() = 'entidad_admin' to every entidad
-- policy. Also add role guard to municipio_manage_own_submissions.
-- ============================================================

-- === CONVOCATORIAS ===
DROP POLICY IF EXISTS "entidad_admin_manage_convocatorias" ON convocatorias;
CREATE POLICY "entidad_admin_manage_convocatorias" ON convocatorias
  FOR ALL
  USING (
    auth_user_role() = 'entidad_admin'
    AND tenant_id = auth_user_tenant_id()
  )
  WITH CHECK (
    auth_user_role() = 'entidad_admin'
    AND tenant_id = auth_user_tenant_id()
  );

-- === MGA_TEMPLATES ===
DROP POLICY IF EXISTS "entidad_admin_manage_templates" ON mga_templates;
CREATE POLICY "entidad_admin_manage_templates" ON mga_templates
  FOR ALL
  USING (
    auth_user_role() = 'entidad_admin'
    AND get_convocatoria_tenant_id(convocatoria_id) = auth_user_tenant_id()
  )
  WITH CHECK (
    auth_user_role() = 'entidad_admin'
    AND get_convocatoria_tenant_id(convocatoria_id) = auth_user_tenant_id()
  );

-- === SUBMISSIONS ===
DROP POLICY IF EXISTS "entidad_admin_read_submissions" ON submissions;
CREATE POLICY "entidad_admin_read_submissions" ON submissions
  FOR SELECT
  USING (
    auth_user_role() = 'entidad_admin'
    AND get_convocatoria_tenant_id(convocatoria_id) = auth_user_tenant_id()
  );

DROP POLICY IF EXISTS "municipio_manage_own_submissions" ON submissions;
CREATE POLICY "municipio_manage_own_submissions" ON submissions
  FOR ALL
  USING (
    auth_user_role() = 'municipio_user'
    AND municipio_id = auth_user_municipio_id()
  );

-- === DOCUMENTS ===
DROP POLICY IF EXISTS "entidad_admin_all_documents" ON documents;
CREATE POLICY "entidad_admin_all_documents" ON documents
  FOR ALL
  USING (
    auth_user_role() = 'entidad_admin'
    AND tenant_id = auth_user_tenant_id()
  );

-- === EMBEDDINGS ===
DROP POLICY IF EXISTS "entidad_admin_all_embeddings" ON embeddings;
CREATE POLICY "entidad_admin_all_embeddings" ON embeddings
  FOR ALL
  USING (
    auth_user_role() = 'entidad_admin'
    AND get_convocatoria_tenant_id(convocatoria_id) = auth_user_tenant_id()
  );

-- === RUBRICS ===
DROP POLICY IF EXISTS "entidad_admin_all_rubrics" ON rubrics;
CREATE POLICY "entidad_admin_all_rubrics" ON rubrics
  FOR ALL
  USING (
    auth_user_role() = 'entidad_admin'
    AND tenant_id = auth_user_tenant_id()
  );

-- === EVALUATIONS ===
DROP POLICY IF EXISTS "entidad_admin_all_evaluations" ON evaluations;
CREATE POLICY "entidad_admin_all_evaluations" ON evaluations
  FOR ALL
  USING (
    auth_user_role() = 'entidad_admin'
    AND get_convocatoria_tenant_id(convocatoria_id) = auth_user_tenant_id()
  );

-- === TENANTS ===
DROP POLICY IF EXISTS "entidad_admin_own_tenant" ON tenants;
CREATE POLICY "entidad_admin_own_tenant" ON tenants
  FOR SELECT
  USING (
    auth_user_role() = 'entidad_admin'
    AND id = auth_user_tenant_id()
  );
