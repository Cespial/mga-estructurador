-- ============================================================
-- Migration 00008: Fix helper functions with JWT + DB fallback
--
-- The pure JWT approach from 00007 requires the Auth Hook to be
-- enabled in Supabase Dashboard. Until then, we need a fallback
-- that queries profiles directly. SECURITY DEFINER + SET search_path
-- ensures the query bypasses RLS on profiles, preventing recursion.
-- ============================================================

CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  jwt_role text;
  db_role public.user_role;
BEGIN
  -- Try JWT claims first (set by custom_access_token_hook if enabled)
  jwt_role := current_setting('request.jwt.claims', true)::jsonb ->> 'user_role';
  IF jwt_role IS NOT NULL AND jwt_role != '' THEN
    RETURN jwt_role::public.user_role;
  END IF;
  -- Fallback: direct query (SECURITY DEFINER + SET search_path bypasses RLS)
  SELECT role INTO db_role FROM public.profiles WHERE id = auth.uid();
  RETURN COALESCE(db_role, 'municipio_user'::public.user_role);
END;
$$;

CREATE OR REPLACE FUNCTION auth_user_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  jwt_tid text;
  db_tid uuid;
BEGIN
  jwt_tid := current_setting('request.jwt.claims', true)::jsonb ->> 'user_tenant_id';
  IF jwt_tid IS NOT NULL AND jwt_tid != '' AND jwt_tid != 'null' THEN
    RETURN jwt_tid::uuid;
  END IF;
  SELECT tenant_id INTO db_tid FROM public.profiles WHERE id = auth.uid();
  RETURN db_tid;
END;
$$;

CREATE OR REPLACE FUNCTION auth_user_municipio_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  jwt_mid text;
  db_mid uuid;
BEGIN
  jwt_mid := current_setting('request.jwt.claims', true)::jsonb ->> 'user_municipio_id';
  IF jwt_mid IS NOT NULL AND jwt_mid != '' AND jwt_mid != 'null' THEN
    RETURN jwt_mid::uuid;
  END IF;
  SELECT municipio_id INTO db_mid FROM public.profiles WHERE id = auth.uid();
  RETURN db_mid;
END;
$$;
