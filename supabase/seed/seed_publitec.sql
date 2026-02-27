-- ============================================================
-- Seed: Publitec Platform Sample Data
-- ============================================================
-- NOTE: This seed assumes the auth.users table has placeholder
-- user UUIDs. In a real environment, create users first via
-- Supabase Auth, then reference their IDs here.
-- ============================================================

-- ============================================================
-- Hardcoded User UUIDs (simulate auth.users)
-- ============================================================
-- User 1: IDEA admin
-- User 2: Gobernacion admin
-- User 3-7: Municipality users

-- ============================================================
-- 1) ORGANIZATIONS — 2 Entities + 5 Municipalities
-- ============================================================

-- Entity 1: IDEA (Instituto para el Desarrollo de Antioquia)
INSERT INTO organizations (id, owner_id, name, type, nit, department, logo_url, created_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'aaaa0001-0001-0001-0001-000000000001',
  'Instituto para el Desarrollo de Antioquia (IDEA)',
  'entity',
  '890.900.842-0',
  'Antioquia',
  'https://placeholder.co/idea-logo.png',
  now()
);

-- Entity 2: Gobernacion de Antioquia
INSERT INTO organizations (id, owner_id, name, type, nit, department, logo_url, created_at)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'aaaa0002-0002-0002-0002-000000000002',
  'Gobernacion de Antioquia',
  'entity',
  '890.982.112-1',
  'Antioquia',
  'https://placeholder.co/gobantioquia-logo.png',
  now()
);

-- Municipality 1: Medellin
INSERT INTO organizations (id, owner_id, name, type, nit, municipality, department, created_at)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'aaaa0003-0003-0003-0003-000000000003',
  'Alcaldia de Medellin',
  'municipality',
  '890.905.211-1',
  'Medellin',
  'Antioquia',
  now()
);

-- Municipality 2: Envigado
INSERT INTO organizations (id, owner_id, name, type, nit, municipality, department, created_at)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  'aaaa0004-0004-0004-0004-000000000004',
  'Alcaldia de Envigado',
  'municipality',
  '890.906.211-2',
  'Envigado',
  'Antioquia',
  now()
);

-- Municipality 3: Rionegro
INSERT INTO organizations (id, owner_id, name, type, nit, municipality, department, created_at)
VALUES (
  '55555555-5555-5555-5555-555555555555',
  'aaaa0005-0005-0005-0005-000000000005',
  'Alcaldia de Rionegro',
  'municipality',
  '890.907.211-3',
  'Rionegro',
  'Antioquia',
  now()
);

-- Municipality 4: Bello
INSERT INTO organizations (id, owner_id, name, type, nit, municipality, department, created_at)
VALUES (
  '66666666-6666-6666-6666-666666666666',
  'aaaa0006-0006-0006-0006-000000000006',
  'Alcaldia de Bello',
  'municipality',
  '890.908.211-4',
  'Bello',
  'Antioquia',
  now()
);

-- Municipality 5: Itagui
INSERT INTO organizations (id, owner_id, name, type, nit, municipality, department, created_at)
VALUES (
  '77777777-7777-7777-7777-777777777777',
  'aaaa0007-0007-0007-0007-000000000007',
  'Alcaldia de Itagui',
  'municipality',
  '890.909.211-5',
  'Itagui',
  'Antioquia',
  now()
);

-- ============================================================
-- 2) CONVOCATORIAS — 3 convocatorias
-- ============================================================

-- Convocatoria 1: IDEA — Infraestructura Vial (open)
INSERT INTO convocatorias_v2 (id, organization_id, name, slug, description, status, budget, open_date, close_date, form_schema, created_at)
VALUES (
  'cccc0001-0001-0001-0001-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'Programa de Infraestructura Vial Municipal 2026',
  'infraestructura-vial-2026',
  'Convocatoria para la mejora y pavimentacion de vias terciarias en municipios de Antioquia. Presupuesto total de $15.000 millones.',
  'open',
  15000000000,
  '2026-01-15T00:00:00Z',
  '2026-04-15T23:59:59Z',
  '[
    {"step": 1, "name": "Informacion General", "fields": ["titulo", "descripcion", "municipio", "ubicacion"]},
    {"step": 2, "name": "Diagnostico", "fields": ["problema", "poblacion_beneficiada", "indicadores_linea_base"]},
    {"step": 3, "name": "Propuesta Tecnica", "fields": ["objetivo_general", "objetivos_especificos", "metodologia", "cronograma"]},
    {"step": 4, "name": "Presupuesto", "fields": ["presupuesto_detallado", "contrapartida", "cofinanciacion"]},
    {"step": 5, "name": "Documentos de Soporte", "fields": ["certificaciones", "estudios_previos", "licencias"]}
  ]'::jsonb,
  now()
);

-- Convocatoria 2: Gobernacion — Transformacion Digital (open)
INSERT INTO convocatorias_v2 (id, organization_id, name, slug, description, status, budget, open_date, close_date, form_schema, created_at)
VALUES (
  'cccc0002-0002-0002-0002-000000000002',
  '22222222-2222-2222-2222-222222222222',
  'Transformacion Digital Municipal 2026',
  'transformacion-digital-2026',
  'Convocatoria para financiar proyectos de gobierno digital, conectividad y apropiacion tecnologica en municipios de Antioquia.',
  'open',
  5000000000,
  '2026-02-01T00:00:00Z',
  '2026-05-01T23:59:59Z',
  '[
    {"step": 1, "name": "Informacion del Proyecto", "fields": ["titulo", "descripcion", "municipio"]},
    {"step": 2, "name": "Justificacion", "fields": ["diagnostico_digital", "brechas", "poblacion_objetivo"]},
    {"step": 3, "name": "Plan de Implementacion", "fields": ["componentes", "actividades", "cronograma", "indicadores"]},
    {"step": 4, "name": "Presupuesto", "fields": ["presupuesto_total", "rubros", "contrapartida"]}
  ]'::jsonb,
  now()
);

-- Convocatoria 3: IDEA — Educacion (draft)
INSERT INTO convocatorias_v2 (id, organization_id, name, slug, description, status, budget, form_schema, created_at)
VALUES (
  'cccc0003-0003-0003-0003-000000000003',
  '11111111-1111-1111-1111-111111111111',
  'Mejoramiento de Infraestructura Educativa 2026',
  'infraestructura-educativa-2026',
  'Convocatoria para la construccion y mejoramiento de sedes educativas rurales en Antioquia.',
  'draft',
  8000000000,
  '[
    {"step": 1, "name": "Informacion General", "fields": ["titulo", "descripcion", "sede_educativa"]},
    {"step": 2, "name": "Diagnostico Infraestructura", "fields": ["estado_actual", "necesidades", "fotos"]},
    {"step": 3, "name": "Propuesta", "fields": ["intervencion_propuesta", "planos", "cronograma"]},
    {"step": 4, "name": "Presupuesto", "fields": ["presupuesto", "contrapartida"]}
  ]'::jsonb,
  now()
);

-- ============================================================
-- 3) RUBRICS — One per convocatoria
-- ============================================================

-- Rubric for Convocatoria 1 (Infraestructura Vial)
INSERT INTO rubrics_v2 (id, convocatoria_id, name, total_score, created_at)
VALUES (
  'rrrr0001-0001-0001-0001-000000000001',
  'cccc0001-0001-0001-0001-000000000001',
  'Rubrica Infraestructura Vial',
  100,
  now()
);

-- Rubric for Convocatoria 2 (Transformacion Digital)
INSERT INTO rubrics_v2 (id, convocatoria_id, name, total_score, created_at)
VALUES (
  'rrrr0002-0002-0002-0002-000000000002',
  'cccc0002-0002-0002-0002-000000000002',
  'Rubrica Transformacion Digital',
  100,
  now()
);

-- Rubric for Convocatoria 3 (Educacion — draft)
INSERT INTO rubrics_v2 (id, convocatoria_id, name, total_score, created_at)
VALUES (
  'rrrr0003-0003-0003-0003-000000000003',
  'cccc0003-0003-0003-0003-000000000003',
  'Rubrica Infraestructura Educativa',
  100,
  now()
);

-- ============================================================
-- 4) RUBRIC CRITERIA — 5-7 per rubric
-- ============================================================

-- Criteria for Rubric 1 (Infraestructura Vial) — 7 criteria
INSERT INTO rubric_criteria (id, rubric_id, criterion_name, max_score, weight, evaluation_guide, sort_order) VALUES
  ('crit0001-0001-0001-0001-000000000001', 'rrrr0001-0001-0001-0001-000000000001', 'Claridad del Diagnostico',           15, 1.0, 'Evaluar si el diagnostico identifica claramente el problema vial, con datos cuantitativos y cualitativos.', 1),
  ('crit0001-0001-0001-0001-000000000002', 'rrrr0001-0001-0001-0001-000000000001', 'Pertinencia de la Solucion',          20, 1.2, 'Verificar que la solucion propuesta aborda directamente el problema identificado y es tecnica mente viable.', 2),
  ('crit0001-0001-0001-0001-000000000003', 'rrrr0001-0001-0001-0001-000000000001', 'Impacto Social',                      15, 1.0, 'Evaluar el numero de beneficiarios, mejora en tiempos de desplazamiento y acceso a servicios.', 3),
  ('crit0001-0001-0001-0001-000000000004', 'rrrr0001-0001-0001-0001-000000000001', 'Viabilidad Presupuestal',             15, 1.0, 'Revisar coherencia entre actividades y costos. Verificar contrapartida municipal.', 4),
  ('crit0001-0001-0001-0001-000000000005', 'rrrr0001-0001-0001-0001-000000000001', 'Sostenibilidad',                      10, 0.8, 'Evaluar plan de mantenimiento post-obra y compromisos de la administracion municipal.', 5),
  ('crit0001-0001-0001-0001-000000000006', 'rrrr0001-0001-0001-0001-000000000001', 'Calidad de Documentacion Soporte',    15, 1.0, 'Verificar completitud de estudios previos, licencias, certificaciones y planos.', 6),
  ('crit0001-0001-0001-0001-000000000007', 'rrrr0001-0001-0001-0001-000000000001', 'Cronograma y Factibilidad Temporal',  10, 0.8, 'Evaluar realismo del cronograma y coherencia con la complejidad del proyecto.', 7);

-- Criteria for Rubric 2 (Transformacion Digital) — 6 criteria
INSERT INTO rubric_criteria (id, rubric_id, criterion_name, max_score, weight, evaluation_guide, sort_order) VALUES
  ('crit0002-0002-0002-0002-000000000001', 'rrrr0002-0002-0002-0002-000000000002', 'Diagnostico de Brecha Digital',       20, 1.2, 'Evaluar si se identifican claramente las brechas digitales del municipio con datos de soporte.', 1),
  ('crit0002-0002-0002-0002-000000000002', 'rrrr0002-0002-0002-0002-000000000002', 'Innovacion de la Propuesta',          15, 1.0, 'Verificar que la propuesta incorpora tecnologias actuales y soluciones innovadoras.', 2),
  ('crit0002-0002-0002-0002-000000000003', 'rrrr0002-0002-0002-0002-000000000002', 'Poblacion Beneficiada',               15, 1.0, 'Evaluar alcance poblacional, inclusion digital y enfoque diferencial.', 3),
  ('crit0002-0002-0002-0002-000000000004', 'rrrr0002-0002-0002-0002-000000000002', 'Plan de Apropiacion Tecnologica',     20, 1.2, 'Verificar estrategia de capacitacion, sensibilizacion y adopcion por parte de usuarios.', 4),
  ('crit0002-0002-0002-0002-000000000005', 'rrrr0002-0002-0002-0002-000000000002', 'Presupuesto y Cofinanciacion',        15, 1.0, 'Revisar coherencia presupuestal, fuentes de cofinanciacion y contrapartida.', 5),
  ('crit0002-0002-0002-0002-000000000006', 'rrrr0002-0002-0002-0002-000000000002', 'Sostenibilidad y Escalabilidad',      15, 1.0, 'Evaluar la estrategia de mantenimiento, actualizacion y posibilidad de replicacion.', 6);

-- Criteria for Rubric 3 (Educacion) — 5 criteria
INSERT INTO rubric_criteria (id, rubric_id, criterion_name, max_score, weight, evaluation_guide, sort_order) VALUES
  ('crit0003-0003-0003-0003-000000000001', 'rrrr0003-0003-0003-0003-000000000003', 'Estado Actual de Infraestructura',    20, 1.2, 'Evaluar la gravedad del deterioro y urgencia de intervencion con evidencia fotografica.', 1),
  ('crit0003-0003-0003-0003-000000000002', 'rrrr0003-0003-0003-0003-000000000003', 'Pertinencia de la Intervencion',      20, 1.2, 'Verificar que la intervencion propuesta responde a las necesidades mas criticas identificadas.', 2),
  ('crit0003-0003-0003-0003-000000000003', 'rrrr0003-0003-0003-0003-000000000003', 'Poblacion Estudiantil Beneficiada',   20, 1.0, 'Evaluar numero de estudiantes beneficiados y condiciones de vulnerabilidad.', 3),
  ('crit0003-0003-0003-0003-000000000004', 'rrrr0003-0003-0003-0003-000000000003', 'Viabilidad Tecnica y Presupuestal',   20, 1.0, 'Revisar planos, estudios de suelos, presupuesto detallado y cronograma.', 4),
  ('crit0003-0003-0003-0003-000000000005', 'rrrr0003-0003-0003-0003-000000000003', 'Contrapartida y Compromiso Local',    20, 1.0, 'Evaluar aporte del municipio, compromiso institucional y sostenibilidad.', 5);

-- ============================================================
-- 5) CONVOCATORIA STAGES
-- ============================================================

-- Stages for Convocatoria 1
INSERT INTO convocatoria_stages (id, convocatoria_id, name, start_date, end_date, sort_order, status) VALUES
  ('stge0001-0001-0001-0001-000000000001', 'cccc0001-0001-0001-0001-000000000001', 'Recepcion de Propuestas',    '2026-01-15T00:00:00Z', '2026-03-15T23:59:59Z', 1, 'active'),
  ('stge0001-0001-0001-0001-000000000002', 'cccc0001-0001-0001-0001-000000000001', 'Evaluacion Tecnica',          '2026-03-16T00:00:00Z', '2026-04-01T23:59:59Z', 2, 'pending'),
  ('stge0001-0001-0001-0001-000000000003', 'cccc0001-0001-0001-0001-000000000001', 'Publicacion de Resultados',   '2026-04-02T00:00:00Z', '2026-04-15T23:59:59Z', 3, 'pending');

-- Stages for Convocatoria 2
INSERT INTO convocatoria_stages (id, convocatoria_id, name, start_date, end_date, sort_order, status) VALUES
  ('stge0002-0002-0002-0002-000000000001', 'cccc0002-0002-0002-0002-000000000002', 'Inscripcion y Propuestas',    '2026-02-01T00:00:00Z', '2026-03-31T23:59:59Z', 1, 'active'),
  ('stge0002-0002-0002-0002-000000000002', 'cccc0002-0002-0002-0002-000000000002', 'Evaluacion IA + Comite',      '2026-04-01T00:00:00Z', '2026-04-20T23:59:59Z', 2, 'pending'),
  ('stge0002-0002-0002-0002-000000000003', 'cccc0002-0002-0002-0002-000000000002', 'Resultados Finales',          '2026-04-21T00:00:00Z', '2026-05-01T23:59:59Z', 3, 'pending');

-- ============================================================
-- 6) PROJECTS — 10 projects in various statuses
-- ============================================================

-- Project 1: Medellin — Vial — submitted
INSERT INTO projects (id, convocatoria_id, organization_id, title, description, budget_requested, status, submitted_at, created_at)
VALUES (
  'pppp0001-0001-0001-0001-000000000001',
  'cccc0001-0001-0001-0001-000000000001',
  '33333333-3333-3333-3333-333333333333',
  'Pavimentacion Via Terciaria Corregimiento San Cristobal',
  'Mejoramiento de 3.2 km de via terciaria que conecta 5 veredas del corregimiento San Cristobal con la cabecera municipal.',
  1200000000,
  'submitted',
  '2026-02-10T14:30:00Z',
  '2026-02-01T09:00:00Z'
);

-- Project 2: Envigado — Vial — under_review
INSERT INTO projects (id, convocatoria_id, organization_id, title, description, budget_requested, status, submitted_at, created_at)
VALUES (
  'pppp0002-0002-0002-0002-000000000002',
  'cccc0001-0001-0001-0001-000000000001',
  '44444444-4444-4444-4444-444444444444',
  'Rehabilitacion Via Las Palmas - Sector Rural',
  'Rehabilitacion y estabilizacion de 1.8 km de via rural en el sector Las Palmas, incluyendo obras de drenaje.',
  850000000,
  'under_review',
  '2026-02-08T10:00:00Z',
  '2026-01-28T11:30:00Z'
);

-- Project 3: Rionegro — Vial — scored
INSERT INTO projects (id, convocatoria_id, organization_id, title, description, budget_requested, status, submitted_at, created_at)
VALUES (
  'pppp0003-0003-0003-0003-000000000003',
  'cccc0001-0001-0001-0001-000000000001',
  '55555555-5555-5555-5555-555555555555',
  'Construccion Puente Vehicular Vereda El Capiro',
  'Construccion de puente vehicular de 25 metros sobre la quebrada La Mosca para conectar las veredas El Capiro y La Convención.',
  2100000000,
  'scored',
  '2026-02-05T16:00:00Z',
  '2026-01-20T08:00:00Z'
);

-- Project 4: Bello — Vial — draft
INSERT INTO projects (id, convocatoria_id, organization_id, title, description, budget_requested, status, created_at)
VALUES (
  'pppp0004-0004-0004-0004-000000000004',
  'cccc0001-0001-0001-0001-000000000001',
  '66666666-6666-6666-6666-666666666666',
  'Mejoramiento Via Vereda Hato Viejo',
  'Propuesta en borrador para el mejoramiento de acceso vial a la vereda Hato Viejo.',
  600000000,
  'draft',
  '2026-02-20T10:00:00Z'
);

-- Project 5: Itagui — Vial — submitted
INSERT INTO projects (id, convocatoria_id, organization_id, title, description, budget_requested, status, submitted_at, created_at)
VALUES (
  'pppp0005-0005-0005-0005-000000000005',
  'cccc0001-0001-0001-0001-000000000001',
  '77777777-7777-7777-7777-777777777777',
  'Estabilizacion de Taludes Via El Ajizal',
  'Obras de estabilizacion de taludes y muros de contencion en 800 metros de la via El Ajizal.',
  950000000,
  'submitted',
  '2026-02-15T09:00:00Z',
  '2026-02-05T14:00:00Z'
);

-- Project 6: Medellin — Digital — submitted
INSERT INTO projects (id, convocatoria_id, organization_id, title, description, budget_requested, status, submitted_at, created_at)
VALUES (
  'pppp0006-0006-0006-0006-000000000006',
  'cccc0002-0002-0002-0002-000000000002',
  '33333333-3333-3333-3333-333333333333',
  'Red de Conectividad Rural Corregimientos',
  'Implementacion de 15 puntos de acceso WiFi gratuito en corregimientos de Medellin con programa de alfabetizacion digital.',
  800000000,
  'submitted',
  '2026-02-20T11:00:00Z',
  '2026-02-10T08:00:00Z'
);

-- Project 7: Rionegro — Digital — under_review
INSERT INTO projects (id, convocatoria_id, organization_id, title, description, budget_requested, status, submitted_at, created_at)
VALUES (
  'pppp0007-0007-0007-0007-000000000007',
  'cccc0002-0002-0002-0002-000000000002',
  '55555555-5555-5555-5555-555555555555',
  'Plataforma Digital de Tramites Municipales',
  'Desarrollo e implementacion de plataforma web y movil para tramites municipales con firma digital.',
  450000000,
  'under_review',
  '2026-02-18T15:00:00Z',
  '2026-02-08T10:00:00Z'
);

-- Project 8: Envigado — Digital — approved
INSERT INTO projects (id, convocatoria_id, organization_id, title, description, budget_requested, status, submitted_at, created_at)
VALUES (
  'pppp0008-0008-0008-0008-000000000008',
  'cccc0002-0002-0002-0002-000000000002',
  '44444444-4444-4444-4444-444444444444',
  'Centro de Innovacion y Tecnologia Envigado',
  'Creacion de un centro de innovacion municipal con laboratorio de fabricacion digital, sala de capacitacion y coworking tecnologico.',
  1200000000,
  'approved',
  '2026-02-12T09:00:00Z',
  '2026-02-01T11:00:00Z'
);

-- Project 9: Bello — Digital — rejected
INSERT INTO projects (id, convocatoria_id, organization_id, title, description, budget_requested, status, submitted_at, created_at)
VALUES (
  'pppp0009-0009-0009-0009-000000000009',
  'cccc0002-0002-0002-0002-000000000002',
  '66666666-6666-6666-6666-666666666666',
  'Digitalizacion Archivo Historico Municipal',
  'Digitalizacion y catalogacion de 50.000 documentos del archivo historico municipal con OCR e indexacion.',
  350000000,
  'rejected',
  '2026-02-14T08:00:00Z',
  '2026-02-04T09:00:00Z'
);

-- Project 10: Itagui — Digital — draft
INSERT INTO projects (id, convocatoria_id, organization_id, title, description, budget_requested, status, created_at)
VALUES (
  'pppp0010-0010-0010-0010-000000000010',
  'cccc0002-0002-0002-0002-000000000002',
  '77777777-7777-7777-7777-777777777777',
  'Sistema de Monitoreo Ambiental IoT',
  'Borrador de propuesta para red de sensores IoT de calidad del aire y nivel de rios.',
  280000000,
  'draft',
  '2026-02-22T10:00:00Z'
);

-- ============================================================
-- 7) PROJECT_FORMS — sample form data for submitted projects
-- ============================================================

-- Forms for Project 1 (Medellin - Vial)
INSERT INTO project_forms (project_id, step_number, step_name, form_data, completed, created_at) VALUES
  ('pppp0001-0001-0001-0001-000000000001', 1, 'Informacion General', '{
    "titulo": "Pavimentacion Via Terciaria Corregimiento San Cristobal",
    "descripcion": "Mejoramiento de 3.2 km de via terciaria",
    "municipio": "Medellin",
    "ubicacion": "Corregimiento San Cristobal, veredas La Loma, El Llano, El Patio, Travesias, Boqueroncito"
  }'::jsonb, true, '2026-02-01T10:00:00Z'),
  ('pppp0001-0001-0001-0001-000000000001', 2, 'Diagnostico', '{
    "problema": "Las 5 veredas del sector sur del corregimiento no cuentan con via pavimentada, afectando a 2,300 habitantes.",
    "poblacion_beneficiada": 2300,
    "indicadores_linea_base": "Tiempo promedio de desplazamiento: 45 min. Acceso vehicular limitado en epoca de lluvias."
  }'::jsonb, true, '2026-02-03T11:00:00Z'),
  ('pppp0001-0001-0001-0001-000000000001', 3, 'Propuesta Tecnica', '{
    "objetivo_general": "Mejorar la conectividad vial del corregimiento San Cristobal mediante la pavimentacion de 3.2 km de via.",
    "objetivos_especificos": ["Reducir tiempo de desplazamiento en 60%", "Garantizar acceso vehicular permanente", "Mejorar condiciones de seguridad vial"],
    "metodologia": "Construccion en concreto rigido con obras de drenaje y senalizacion.",
    "cronograma": "6 meses de ejecucion"
  }'::jsonb, true, '2026-02-05T14:00:00Z'),
  ('pppp0001-0001-0001-0001-000000000001', 4, 'Presupuesto', '{
    "presupuesto_detallado": {"movimiento_tierras": 280000000, "pavimentacion": 650000000, "obras_drenaje": 150000000, "senalizacion": 40000000, "administracion": 80000000},
    "contrapartida": 200000000,
    "cofinanciacion": 1000000000
  }'::jsonb, true, '2026-02-07T16:00:00Z'),
  ('pppp0001-0001-0001-0001-000000000001', 5, 'Documentos de Soporte', '{
    "certificaciones": ["certificacion_uso_suelo.pdf", "certificacion_predial.pdf"],
    "estudios_previos": ["estudio_suelos.pdf", "diseno_geometrico.pdf"],
    "licencias": ["licencia_ambiental.pdf"]
  }'::jsonb, true, '2026-02-09T10:00:00Z');

-- Forms for Project 6 (Medellin - Digital)
INSERT INTO project_forms (project_id, step_number, step_name, form_data, completed, created_at) VALUES
  ('pppp0006-0006-0006-0006-000000000006', 1, 'Informacion del Proyecto', '{
    "titulo": "Red de Conectividad Rural Corregimientos",
    "descripcion": "15 puntos WiFi gratuito en corregimientos con programa de alfabetizacion digital.",
    "municipio": "Medellin"
  }'::jsonb, true, '2026-02-10T09:00:00Z'),
  ('pppp0006-0006-0006-0006-000000000006', 2, 'Justificacion', '{
    "diagnostico_digital": "Solo el 23% de hogares rurales tienen acceso a internet en los corregimientos.",
    "brechas": ["Conectividad", "Alfabetizacion digital", "Acceso a servicios gubernamentales en linea"],
    "poblacion_objetivo": "12,000 habitantes de 5 corregimientos"
  }'::jsonb, true, '2026-02-12T11:00:00Z'),
  ('pppp0006-0006-0006-0006-000000000006', 3, 'Plan de Implementacion', '{
    "componentes": ["Infraestructura de red", "Puntos de acceso", "Capacitacion", "Soporte tecnico"],
    "actividades": ["Instalacion de antenas", "Configuracion de equipos", "Talleres de formacion"],
    "cronograma": "8 meses",
    "indicadores": ["Cobertura WiFi en 15 puntos", "500 personas capacitadas", "80% satisfaccion"]
  }'::jsonb, true, '2026-02-15T14:00:00Z'),
  ('pppp0006-0006-0006-0006-000000000006', 4, 'Presupuesto', '{
    "presupuesto_total": 800000000,
    "rubros": {"infraestructura": 450000000, "equipos": 200000000, "capacitacion": 100000000, "admin": 50000000},
    "contrapartida": 150000000
  }'::jsonb, true, '2026-02-18T09:00:00Z');

-- ============================================================
-- 8) PROJECT_SCORES — scores for some projects
-- ============================================================

-- Score for Project 3 (Rionegro - Vial - scored)
INSERT INTO project_scores (id, project_id, rubric_id, evaluator_type, total_score, total_weighted_score, ai_summary, status, created_at)
VALUES (
  'scor0001-0001-0001-0001-000000000001',
  'pppp0003-0003-0003-0003-000000000003',
  'rrrr0001-0001-0001-0001-000000000001',
  'ai',
  78.5,
  82.3,
  'El proyecto del puente vehicular sobre la quebrada La Mosca presenta un diagnostico solido con datos tecnicos adecuados. La propuesta es pertinente y el impacto social es alto (conecta 2 veredas con 1,800 beneficiarios). El presupuesto es coherente aunque la contrapartida municipal podria ser mayor. Se recomienda fortalecer el plan de mantenimiento post-obra.',
  'completed',
  '2026-02-12T08:00:00Z'
);

-- Score for Project 8 (Envigado - Digital - approved)
INSERT INTO project_scores (id, project_id, rubric_id, evaluator_type, total_score, total_weighted_score, ai_summary, status, created_at)
VALUES (
  'scor0002-0002-0002-0002-000000000002',
  'pppp0008-0008-0008-0008-000000000008',
  'rrrr0002-0002-0002-0002-000000000002',
  'ai',
  91.0,
  93.5,
  'Excelente propuesta de centro de innovacion. El diagnostico de brecha digital es completo, la propuesta es altamente innovadora con componentes de fabricacion digital y coworking. El plan de apropiacion tecnologica incluye alianzas con universidades y empresas locales. Presupuesto bien estructurado con cofinanciacion significativa.',
  'completed',
  '2026-02-16T10:00:00Z'
);

-- Score for Project 2 (Envigado - Vial - under_review, processing)
INSERT INTO project_scores (id, project_id, rubric_id, evaluator_type, status, created_at)
VALUES (
  'scor0003-0003-0003-0003-000000000003',
  'pppp0002-0002-0002-0002-000000000002',
  'rrrr0001-0001-0001-0001-000000000001',
  'ai',
  'processing',
  '2026-02-22T14:00:00Z'
);

-- ============================================================
-- 9) CRITERIA_SCORES — detailed scores for completed evaluations
-- ============================================================

-- Criteria scores for Project 3 (score scor0001)
INSERT INTO criteria_scores (project_score_id, rubric_criteria_id, score, max_score, weight, weighted_score, justification, ai_rationale) VALUES
  ('scor0001-0001-0001-0001-000000000001', 'crit0001-0001-0001-0001-000000000001', 12, 15, 1.0, 12.0, 'Diagnostico completo con datos cuantitativos del trafico y estado de la via.', 'El documento incluye aforo vehicular, inventario de danos y encuesta a comunidad. Falta informacion pluviometrica.'),
  ('scor0001-0001-0001-0001-000000000001', 'crit0001-0001-0001-0001-000000000002', 17, 20, 1.2, 20.4, 'La solucion de puente vehicular es tecnica y socialmente pertinente.', 'El diseno estructural corresponde a las cargas esperadas y las condiciones hidrologicas de la quebrada.'),
  ('scor0001-0001-0001-0001-000000000001', 'crit0001-0001-0001-0001-000000000003', 13, 15, 1.0, 13.0, 'Buen impacto social con 1,800 beneficiarios directos.', 'Se identifican beneficiarios directos e indirectos. Falta cuantificar impacto economico.'),
  ('scor0001-0001-0001-0001-000000000001', 'crit0001-0001-0001-0001-000000000004', 11, 15, 1.0, 11.0, 'Presupuesto coherente pero contrapartida insuficiente.', 'Los costos unitarios estan dentro del rango de mercado. La contrapartida es solo del 8% del total.'),
  ('scor0001-0001-0001-0001-000000000001', 'crit0001-0001-0001-0001-000000000005',  7, 10, 0.8,  5.6, 'Plan de mantenimiento basico sin compromisos formales.', 'Incluye cronograma de mantenimiento pero falta acto administrativo de compromiso municipal.'),
  ('scor0001-0001-0001-0001-000000000001', 'crit0001-0001-0001-0001-000000000006', 12, 15, 1.0, 12.0, 'Documentacion casi completa, falta licencia ambiental vigente.', 'Estudios previos y planos estan completos. La licencia ambiental esta en tramite.'),
  ('scor0001-0001-0001-0001-000000000001', 'crit0001-0001-0001-0001-000000000007',  6.5, 10, 0.8, 5.2, 'Cronograma optimista para la magnitud de la obra.', 'El plazo de 4 meses para un puente de 25m es ajustado. Se recomienda considerar 6 meses minimo.');

-- ============================================================
-- 10) SCORING_JOBS — sample jobs
-- ============================================================

-- Completed job for Project 3
INSERT INTO scoring_jobs (id, project_score_id, engine_version, config, status, claimed_at, started_at, completed_at, created_at)
VALUES (
  'jjjj0001-0001-0001-0001-000000000001',
  'scor0001-0001-0001-0001-000000000001',
  'v1',
  '{"model": "claude-3-5-sonnet", "temperature": 0.3, "max_tokens": 4096}'::jsonb,
  'completed',
  '2026-02-12T08:00:10Z',
  '2026-02-12T08:00:12Z',
  '2026-02-12T08:02:45Z',
  '2026-02-12T08:00:00Z'
);

-- Completed job for Project 8
INSERT INTO scoring_jobs (id, project_score_id, engine_version, config, status, claimed_at, started_at, completed_at, created_at)
VALUES (
  'jjjj0002-0002-0002-0002-000000000002',
  'scor0002-0002-0002-0002-000000000002',
  'v1',
  '{"model": "claude-3-5-sonnet", "temperature": 0.3, "max_tokens": 4096}'::jsonb,
  'completed',
  '2026-02-16T10:00:08Z',
  '2026-02-16T10:00:10Z',
  '2026-02-16T10:03:22Z',
  '2026-02-16T10:00:00Z'
);

-- Processing job for Project 2
INSERT INTO scoring_jobs (id, project_score_id, engine_version, config, status, claimed_at, started_at, created_at)
VALUES (
  'jjjj0003-0003-0003-0003-000000000003',
  'scor0003-0003-0003-0003-000000000003',
  'v1',
  '{"model": "claude-3-5-sonnet", "temperature": 0.3, "max_tokens": 4096}'::jsonb,
  'processing',
  '2026-02-22T14:00:05Z',
  '2026-02-22T14:00:08Z',
  '2026-02-22T14:00:00Z'
);

-- Pending job (for Project 1 — not yet scored, create score + job)
INSERT INTO project_scores (id, project_id, rubric_id, evaluator_type, status, created_at)
VALUES (
  'scor0004-0004-0004-0004-000000000004',
  'pppp0001-0001-0001-0001-000000000001',
  'rrrr0001-0001-0001-0001-000000000001',
  'ai',
  'pending',
  '2026-02-24T08:00:00Z'
);

INSERT INTO scoring_jobs (id, project_score_id, engine_version, config, status, created_at)
VALUES (
  'jjjj0004-0004-0004-0004-000000000004',
  'scor0004-0004-0004-0004-000000000004',
  'v1',
  '{"model": "claude-3-5-sonnet", "temperature": 0.3, "max_tokens": 4096}'::jsonb,
  'pending',
  '2026-02-24T08:00:00Z'
);

-- Pending job (for Project 5 — not yet scored)
INSERT INTO project_scores (id, project_id, rubric_id, evaluator_type, status, created_at)
VALUES (
  'scor0005-0005-0005-0005-000000000005',
  'pppp0005-0005-0005-0005-000000000005',
  'rrrr0001-0001-0001-0001-000000000001',
  'ai',
  'pending',
  '2026-02-25T09:00:00Z'
);

INSERT INTO scoring_jobs (id, project_score_id, engine_version, config, status, created_at)
VALUES (
  'jjjj0005-0005-0005-0005-000000000005',
  'scor0005-0005-0005-0005-000000000005',
  'v1',
  '{"model": "claude-3-5-sonnet", "temperature": 0.3, "max_tokens": 4096}'::jsonb,
  'pending',
  '2026-02-25T09:00:00Z'
);
