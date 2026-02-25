-- ============================================================
-- Seed data for development/demo
-- Run AFTER creating auth users via Supabase dashboard or API
-- ============================================================

-- Tenants (entidades)
INSERT INTO tenants (id, name, slug) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Ministerio de Transporte', 'mintransporte'),
  ('a0000000-0000-0000-0000-000000000002', 'Gobernación del Guaviare', 'gob-guaviare')
ON CONFLICT (slug) DO NOTHING;

-- Municipios (catálogo parcial para demo)
INSERT INTO municipios (id, codigo_dane, nombre, departamento) VALUES
  ('b0000000-0000-0000-0000-000000000001', '95001', 'San José del Guaviare', 'Guaviare'),
  ('b0000000-0000-0000-0000-000000000002', '86568', 'Puerto Asís', 'Putumayo'),
  ('b0000000-0000-0000-0000-000000000003', '05001', 'Medellín', 'Antioquia'),
  ('b0000000-0000-0000-0000-000000000004', '11001', 'Bogotá D.C.', 'Bogotá'),
  ('b0000000-0000-0000-0000-000000000005', '76001', 'Cali', 'Valle del Cauca')
ON CONFLICT (codigo_dane) DO NOTHING;

-- NOTE: Profiles are created automatically by the on_auth_user_created trigger.
-- After creating users via Supabase Auth, update their profiles:
--
-- UPDATE profiles SET role = 'platform_admin' WHERE email = 'admin@mga.local';
-- UPDATE profiles SET role = 'entidad_admin', tenant_id = 'a0000000-...-000000000001' WHERE email = 'entidad@mga.local';
-- UPDATE profiles SET role = 'municipio_user', tenant_id = 'a0000000-...-000000000001', municipio_id = 'b0000000-...-000000000001' WHERE email = 'municipio@mga.local';
