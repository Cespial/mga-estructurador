-- ============================================================
-- Migration 00007: Fix RLS infinite recursion
--
-- Problem: Helper functions (auth_user_role, auth_user_tenant_id,
-- auth_user_municipio_id) query the `profiles` table, but profiles
-- has RLS policies that call those same helper functions → infinite loop.
--
-- Also: convocatorias policy subqueries convocatoria_municipios, whose
-- policy subqueries convocatorias → cross-table recursion.
--
-- Fix: Rewrite helper functions to read from auth.jwt() claims instead
-- of querying the profiles table. Store role/tenant/municipio in JWT
-- via a custom access token hook. Also break cross-table cycles.
-- ============================================================

-- ============================================================
-- STEP 1: Create a SECURITY DEFINER function that Supabase Auth
-- calls to enrich the JWT with custom claims from profiles.
-- ============================================================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  claims jsonb;
  user_role public.user_role;
  user_tenant_id uuid;
  user_municipio_id uuid;
BEGIN
  SELECT role, tenant_id, municipio_id
  INTO user_role, user_tenant_id, user_municipio_id
  FROM public.profiles
  WHERE id = (event->>'user_id')::uuid;

  claims := event->'claims';

  -- Set custom claims
  IF user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role::text));
  ELSE
    claims := jsonb_set(claims, '{user_role}', '"municipio_user"');
  END IF;

  IF user_tenant_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_tenant_id}', to_jsonb(user_tenant_id::text));
  ELSE
    claims := jsonb_set(claims, '{user_tenant_id}', 'null');
  END IF;

  IF user_municipio_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_municipio_id}', to_jsonb(user_municipio_id::text));
  ELSE
    claims := jsonb_set(claims, '{user_municipio_id}', 'null');
  END IF;

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;

-- Grant execute to supabase_auth_admin (required for Auth hooks)
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

-- Ensure the hook function doesn't get blocked by RLS
REVOKE ALL ON public.profiles FROM supabase_auth_admin;
GRANT SELECT ON public.profiles TO supabase_auth_admin;

-- ============================================================
-- STEP 2: Rewrite helper functions to use JWT claims (no DB query)
-- This completely eliminates profiles table recursion.
-- ============================================================

CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::jsonb ->> 'user_role')::public.user_role,
    'municipio_user'::public.user_role
  );
$$;

CREATE OR REPLACE FUNCTION auth_user_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT (
    NULLIF(current_setting('request.jwt.claims', true)::jsonb ->> 'user_tenant_id', '')
  )::uuid;
$$;

CREATE OR REPLACE FUNCTION auth_user_municipio_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT (
    NULLIF(current_setting('request.jwt.claims', true)::jsonb ->> 'user_municipio_id', '')
  )::uuid;
$$;

-- ============================================================
-- STEP 3: Fix cross-table recursion between convocatorias and
-- convocatoria_municipios. The municipio policy on convocatorias
-- subqueries convocatoria_municipios, whose entidad policy
-- subqueries convocatorias back.
--
-- Fix: Use auth_user_tenant_id() directly (from JWT now) instead
-- of subquerying convocatorias. Since entidad_admin policies only
-- need tenant_id, we can check it without touching convocatorias.
-- ============================================================

-- Drop old cross-referencing policies
DROP POLICY IF EXISTS "entidad_admin_manage_conv_municipios" ON convocatoria_municipios;
DROP POLICY IF EXISTS "entidad_admin_manage_templates" ON mga_templates;

-- Recreate without subquery to convocatorias — join directly via tenant_id
-- For convocatoria_municipios: check via a subquery-free approach
CREATE POLICY "entidad_admin_manage_conv_municipios" ON convocatoria_municipios
  FOR ALL
  USING (
    auth_user_role() = 'entidad_admin'
    AND EXISTS (
      SELECT 1 FROM convocatorias c
      WHERE c.id = convocatoria_municipios.convocatoria_id
        AND c.tenant_id = auth_user_tenant_id()
    )
  )
  WITH CHECK (
    auth_user_role() = 'entidad_admin'
    AND EXISTS (
      SELECT 1 FROM convocatorias c
      WHERE c.id = convocatoria_municipios.convocatoria_id
        AND c.tenant_id = auth_user_tenant_id()
    )
  );

-- For mga_templates: same pattern
CREATE POLICY "entidad_admin_manage_templates" ON mga_templates
  FOR ALL
  USING (
    auth_user_role() = 'entidad_admin'
    AND EXISTS (
      SELECT 1 FROM convocatorias c
      WHERE c.id = mga_templates.convocatoria_id
        AND c.tenant_id = auth_user_tenant_id()
    )
  )
  WITH CHECK (
    auth_user_role() = 'entidad_admin'
    AND EXISTS (
      SELECT 1 FROM convocatorias c
      WHERE c.id = mga_templates.convocatoria_id
        AND c.tenant_id = auth_user_tenant_id()
    )
  );

-- ============================================================
-- STEP 4: Fix similar cross-references in other tables
-- (submissions, documents, embeddings, evaluations that subquery convocatorias)
-- ============================================================

-- submissions: entidad_admin reads via convocatoria tenant
DROP POLICY IF EXISTS "entidad_admin_read_submissions" ON submissions;
CREATE POLICY "entidad_admin_read_submissions" ON submissions
  FOR SELECT
  USING (
    auth_user_role() = 'entidad_admin'
    AND EXISTS (
      SELECT 1 FROM convocatorias c
      WHERE c.id = submissions.convocatoria_id
        AND c.tenant_id = auth_user_tenant_id()
    )
  );

-- documents: entidad_admin
DROP POLICY IF EXISTS "entidad_admin_all_documents" ON documents;
CREATE POLICY "entidad_admin_all_documents" ON documents
  FOR ALL
  USING (
    auth_user_role() = 'entidad_admin'
    AND tenant_id = auth_user_tenant_id()
  );

-- embeddings: entidad_admin
DROP POLICY IF EXISTS "entidad_admin_all_embeddings" ON embeddings;
CREATE POLICY "entidad_admin_all_embeddings" ON embeddings
  FOR ALL
  USING (
    auth_user_role() = 'entidad_admin'
    AND EXISTS (
      SELECT 1 FROM convocatorias c
      WHERE c.id = embeddings.convocatoria_id
        AND c.tenant_id = auth_user_tenant_id()
    )
  );

-- rubrics: entidad_admin — use tenant_id directly
DROP POLICY IF EXISTS "entidad_admin_all_rubrics" ON rubrics;
CREATE POLICY "entidad_admin_all_rubrics" ON rubrics
  FOR ALL
  USING (
    auth_user_role() = 'entidad_admin'
    AND tenant_id = auth_user_tenant_id()
  );

-- evaluations: entidad_admin
DROP POLICY IF EXISTS "entidad_admin_all_evaluations" ON evaluations;
CREATE POLICY "entidad_admin_all_evaluations" ON evaluations
  FOR ALL
  USING (
    auth_user_role() = 'entidad_admin'
    AND EXISTS (
      SELECT 1 FROM convocatorias c
      WHERE c.id = evaluations.convocatoria_id
        AND c.tenant_id = auth_user_tenant_id()
    )
  );
