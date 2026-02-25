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

-- Convocatoria demo
INSERT INTO convocatorias (id, tenant_id, nombre, descripcion, requisitos, fecha_inicio, fecha_cierre, estado) VALUES
  (
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Mejoramiento de vías terciarias 2026',
    'Convocatoria para la estructuración de proyectos de mejoramiento de vías terciarias en municipios priorizados.',
    'Municipio categoría 4, 5 o 6. Plan de desarrollo vigente con componente vial. Disponibilidad de cofinanciación mínima del 20%.',
    '2026-03-01',
    '2026-06-30',
    'abierta'
  ),
  (
    'c0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000002',
    'Infraestructura educativa rural 2026',
    'Convocatoria para estructuración de proyectos de infraestructura educativa en zonas rurales del Guaviare.',
    'Municipio del departamento del Guaviare. Institución educativa identificada con necesidad de mejoramiento.',
    '2026-04-01',
    '2026-08-31',
    'borrador'
  )
ON CONFLICT (id) DO NOTHING;

-- Plantilla MGA demo (para la convocatoria de vías terciarias)
INSERT INTO mga_templates (id, convocatoria_id, etapas_json) VALUES
  (
    'd0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    '[
      {
        "id": "etapa-1",
        "nombre": "Identificación",
        "orden": 1,
        "campos": [
          {"id": "campo-1-1", "nombre": "Problema central", "tipo": "textarea", "descripcion": "Describa el problema central que el proyecto busca resolver.", "requerido": true},
          {"id": "campo-1-2", "nombre": "Árbol de problemas", "tipo": "textarea", "descripcion": "Identifique causas directas e indirectas, y efectos directos e indirectos.", "requerido": true},
          {"id": "campo-1-3", "nombre": "Participantes y beneficiarios", "tipo": "textarea", "descripcion": "Identifique los actores involucrados y la población beneficiaria.", "requerido": true},
          {"id": "campo-1-4", "nombre": "Análisis de participantes", "tipo": "textarea", "descripcion": "Describa intereses, expectativas y contribución de cada actor.", "requerido": false}
        ]
      },
      {
        "id": "etapa-2",
        "nombre": "Preparación",
        "orden": 2,
        "campos": [
          {"id": "campo-2-1", "nombre": "Análisis técnico de alternativas", "tipo": "textarea", "descripcion": "Describa las alternativas de solución evaluadas.", "requerido": true},
          {"id": "campo-2-2", "nombre": "Alternativa seleccionada", "tipo": "textarea", "descripcion": "Justifique la alternativa seleccionada.", "requerido": true},
          {"id": "campo-2-3", "nombre": "Localización", "tipo": "text", "descripcion": "Ubicación geográfica del proyecto (municipio, vereda, coordenadas).", "requerido": true},
          {"id": "campo-2-4", "nombre": "Cadena de valor", "tipo": "textarea", "descripcion": "Describa actividades, productos y resultados esperados.", "requerido": true}
        ]
      },
      {
        "id": "etapa-3",
        "nombre": "Evaluación",
        "orden": 3,
        "campos": [
          {"id": "campo-3-1", "nombre": "Flujo económico", "tipo": "textarea", "descripcion": "Presente los costos y beneficios del proyecto.", "requerido": true},
          {"id": "campo-3-2", "nombre": "Indicadores de rentabilidad", "tipo": "textarea", "descripcion": "Calcule VPN, TIR y relación beneficio/costo.", "requerido": true},
          {"id": "campo-3-3", "nombre": "Análisis de riesgos", "tipo": "textarea", "descripcion": "Identifique riesgos y medidas de mitigación.", "requerido": true}
        ]
      },
      {
        "id": "etapa-4",
        "nombre": "Programación",
        "orden": 4,
        "campos": [
          {"id": "campo-4-1", "nombre": "Marco lógico", "tipo": "textarea", "descripcion": "Presente la matriz de marco lógico del proyecto.", "requerido": true},
          {"id": "campo-4-2", "nombre": "Cronograma", "tipo": "textarea", "descripcion": "Defina el cronograma de ejecución con hitos principales.", "requerido": true},
          {"id": "campo-4-3", "nombre": "Fuentes de financiación", "tipo": "textarea", "descripcion": "Detalle las fuentes y montos de financiación.", "requerido": true}
        ]
      }
    ]'::jsonb
  )
ON CONFLICT (convocatoria_id) DO NOTHING;

-- Asignar municipios a convocatoria demo
INSERT INTO convocatoria_municipios (convocatoria_id, municipio_id, estado) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'activo'),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'activo')
ON CONFLICT (convocatoria_id, municipio_id) DO NOTHING;

-- NOTE: Profiles are created automatically by the on_auth_user_created trigger.
-- After creating users via Supabase Auth, update their profiles:
--
-- UPDATE profiles SET role = 'platform_admin' WHERE email = 'admin@mga.local';
-- UPDATE profiles SET role = 'entidad_admin', tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE email = 'entidad@mga.local';
-- UPDATE profiles SET role = 'municipio_user', tenant_id = 'a0000000-0000-0000-0000-000000000001', municipio_id = 'b0000000-0000-0000-0000-000000000001' WHERE email = 'municipio@mga.local';
