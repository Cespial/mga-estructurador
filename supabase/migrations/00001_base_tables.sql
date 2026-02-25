-- ============================================================
-- Migration 00001: Base tables — tenants, profiles, municipios
-- Wave 1: Auth + Roles + RLS
-- ============================================================

-- 1) Custom types
CREATE TYPE user_role AS ENUM ('platform_admin', 'entidad_admin', 'municipio_user');

-- 2) Tenants (entidades: ministerio/gobernación)
CREATE TABLE tenants (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  slug       text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3) Municipios (catálogo nacional)
CREATE TABLE municipios (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_dane     text UNIQUE,
  nombre          text NOT NULL,
  departamento    text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 4) Profiles (extends auth.users)
CREATE TABLE profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text NOT NULL,
  full_name     text,
  role          user_role NOT NULL DEFAULT 'municipio_user',
  tenant_id     uuid REFERENCES tenants(id),
  municipio_id  uuid REFERENCES municipios(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Index for common lookups
CREATE INDEX idx_profiles_tenant ON profiles(tenant_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- ============================================================
-- 5) Helper functions (used in RLS policies)
-- ============================================================

-- Get the role of the current authenticated user
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- Get the tenant_id of the current authenticated user
CREATE OR REPLACE FUNCTION auth_user_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid();
$$;

-- Get the municipio_id of the current authenticated user
CREATE OR REPLACE FUNCTION auth_user_municipio_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT municipio_id FROM profiles WHERE id = auth.uid();
$$;

-- ============================================================
-- 6) Row Level Security
-- ============================================================

-- TENANTS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_admin_all_tenants" ON tenants
  FOR ALL
  USING (auth_user_role() = 'platform_admin');

CREATE POLICY "entidad_admin_own_tenant" ON tenants
  FOR SELECT
  USING (id = auth_user_tenant_id());

-- MUNICIPIOS (read-only catalog for all authenticated users)
ALTER TABLE municipios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_municipios" ON municipios
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "platform_admin_manage_municipios" ON municipios
  FOR ALL
  USING (auth_user_role() = 'platform_admin');

-- PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_profile" ON profiles
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "platform_admin_all_profiles" ON profiles
  FOR ALL
  USING (auth_user_role() = 'platform_admin');

CREATE POLICY "entidad_admin_read_tenant_profiles" ON profiles
  FOR SELECT
  USING (
    auth_user_role() = 'entidad_admin'
    AND tenant_id = auth_user_tenant_id()
  );

-- ============================================================
-- 7) Auto-create profile on signup (trigger)
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(
      (NEW.raw_user_meta_data ->> 'role')::public.user_role,
      'municipio_user'
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 8) Updated_at trigger
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at_tenants
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
