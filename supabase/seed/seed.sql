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
INSERT INTO convocatoria_municipios (convocatoria_id, municipio_id, estado, progress) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'activo', 61.54),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'activo', 23.08)
ON CONFLICT (convocatoria_id, municipio_id) DO UPDATE SET progress = EXCLUDED.progress;

-- ============================================================
-- DEMO DATA — Submissions con contenido MGA realista
-- ============================================================

-- Submission: San José del Guaviare (8/13 required campos = 61.54%)
INSERT INTO submissions (id, convocatoria_id, municipio_id, data_json, etapa_actual, progress) VALUES
  (
    'e0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    '{
      "campo-1-1": "Las vías terciarias del municipio de San José del Guaviare presentan un deterioro severo que afecta la conectividad de 23 veredas rurales. El 78% de los tramos (aproximadamente 145 km) se encuentran en estado intransitable durante la temporada de lluvias (abril-noviembre), lo que impide el transporte de productos agropecuarios, el acceso a servicios de salud y educación, y la movilidad general de cerca de 12,000 habitantes de la zona rural.",
      "campo-1-2": "CAUSAS DIRECTAS:\n1. Deterioro estructural de la capa de rodadura por falta de mantenimiento periódico\n2. Deficiencia en el sistema de drenaje (cunetas y alcantarillas colapsadas)\n3. Incremento del tráfico pesado por actividades ganaderas\n\nCAUSAS INDIRECTAS:\n- Presupuesto municipal insuficiente para mantenimiento vial (solo $800M/año vs $3,200M requeridos)\n- Ausencia de un plan de gestión vial municipal actualizado\n\nEFECTOS DIRECTOS:\n1. Pérdida de cosechas por imposibilidad de transporte (estimado $2,400M/año)\n2. Aumento de tiempos de desplazamiento (promedio 3.5 horas vs 1.2 horas en buen estado)\n3. Deserción escolar rural del 15% en temporada de lluvias\n\nEFECTOS INDIRECTOS:\n- Migración rural-urbana acelerada\n- Incremento de costos de vida en zona rural (30% más que casco urbano)",
      "campo-1-3": "ACTORES INVOLUCRADOS:\n- Alcaldía Municipal de San José del Guaviare (ejecutor)\n- Ministerio de Transporte (cofinanciador)\n- Juntas de Acción Comunal de 23 veredas (beneficiarios directos)\n- Asociación de Ganaderos del Guaviare (sector productivo)\n- INVÍAS regional (asistencia técnica)\n\nPOBLACIÓN BENEFICIARIA:\n- Directa: 12,000 habitantes rurales de 23 veredas\n- Indirecta: 45,000 habitantes del casco urbano (mejora en abastecimiento)\n- 2,300 estudiantes rurales\n- 850 productores agropecuarios",
      "campo-1-4": "Los ganaderos necesitan vías transitables todo el año para sacar el ganado. Las juntas comunales han priorizado las vías en sus planes de inversión. El ministerio busca impactar zonas de posconflicto.",
      "campo-2-1": "Se evaluaron tres alternativas:\n\nALTERNATIVA 1: Mejoramiento con placa huella en tramos críticos (45 km)\n- Costo: $18,500M\n- Durabilidad: 20 años\n- Beneficia 15 veredas con mayor población\n\nALTERNATIVA 2: Mejoramiento con material granular (afirmado) en 100 km\n- Costo: $12,000M\n- Durabilidad: 5 años (requiere mantenimiento anual)\n- Mayor cobertura pero menor durabilidad\n\nALTERNATIVA 3: Pavimentación total de vía principal (25 km)\n- Costo: $35,000M\n- Durabilidad: 25 años\n- Solo beneficia corredor principal, no veredas secundarias",
      "campo-2-2": "Se selecciona la ALTERNATIVA 1 (placa huella en tramos críticos) por las siguientes razones:\n1. Mejor relación costo-beneficio a largo plazo\n2. Durabilidad de 20 años reduce costos de mantenimiento\n3. La placa huella es la tecnología recomendada por INVÍAS para vías terciarias\n4. Permite tránsito en todas las épocas del año\n5. Beneficia el 65% de la población rural objetivo\n6. Cofinanciación del 20% ($3,700M) es viable para el municipio",
      "campo-2-3": "Municipio de San José del Guaviare, Guaviare. Veredas: La Libertad, El Retorno, Cachicamo, Puerto Arturo, Caño Negro, entre otras. Coordenadas centro del proyecto: 2.5709° N, 72.6394° W.",
      "campo-2-4": "ACTIVIDADES:\n1. Estudios y diseños detallados (3 meses)\n2. Construcción de placa huella en 45 km (12 meses)\n3. Rehabilitación de cunetas y alcantarillas (6 meses, paralelo)\n4. Señalización vial (1 mes)\n\nPRODUCTOS:\n- 45 km de vía terciaria mejorada con placa huella\n- 90 km de cunetas rehabilitadas\n- 35 alcantarillas nuevas o rehabilitadas\n\nRESULTADOS:\n- Reducción del tiempo de desplazamiento en 60%\n- Transitabilidad 365 días/año\n- Reducción de pérdidas agropecuarias en 70%"
    }'::jsonb,
    'etapa-3',
    61.54
  )
ON CONFLICT (convocatoria_id, municipio_id) DO UPDATE
  SET data_json = EXCLUDED.data_json, etapa_actual = EXCLUDED.etapa_actual, progress = EXCLUDED.progress;

-- Submission: Puerto Asís (3/13 required campos = 23.08%)
INSERT INTO submissions (id, convocatoria_id, municipio_id, data_json, etapa_actual, progress) VALUES
  (
    'e0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000002',
    '{
      "campo-1-1": "Las vías terciarias de Puerto Asís están en mal estado. Los campesinos no pueden sacar sus productos al mercado durante la época de lluvias. Hay muchos huecos y las cunetas están tapadas.",
      "campo-1-2": "Las causas son la falta de mantenimiento y el clima lluvioso. Los efectos son que la gente no puede movilizarse bien.",
      "campo-1-3": "Los beneficiarios son los campesinos de las veredas cercanas, aproximadamente 5,000 personas."
    }'::jsonb,
    'etapa-1',
    23.08
  )
ON CONFLICT (convocatoria_id, municipio_id) DO UPDATE
  SET data_json = EXCLUDED.data_json, etapa_actual = EXCLUDED.etapa_actual, progress = EXCLUDED.progress;

-- ============================================================
-- RÚBRICA — Criterios de evaluación para la convocatoria
-- ============================================================

INSERT INTO rubrics (id, convocatoria_id, tenant_id, criterios_json) VALUES
  (
    'f0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    '[
      {
        "campo_id": "campo-1-1",
        "peso": 0.20,
        "descripcion": "Claridad y pertinencia del problema central identificado",
        "niveles": [
          {"score": 1, "label": "Insuficiente", "descripcion": "No identifica un problema claro o el problema no es pertinente al contexto vial"},
          {"score": 2, "label": "Básico", "descripcion": "Identifica un problema general pero sin datos específicos ni cuantificación"},
          {"score": 3, "label": "Bueno", "descripcion": "Problema bien definido con datos parciales de afectación y población"},
          {"score": 4, "label": "Excelente", "descripcion": "Problema claramente definido con datos cuantitativos de afectación, población y territorio"}
        ]
      },
      {
        "campo_id": "campo-1-2",
        "peso": 0.15,
        "descripcion": "Calidad del análisis de causas y efectos (árbol de problemas)",
        "niveles": [
          {"score": 1, "label": "Insuficiente", "descripcion": "No presenta análisis de causas y efectos"},
          {"score": 2, "label": "Básico", "descripcion": "Lista causas y efectos sin estructura ni diferenciación directas/indirectas"},
          {"score": 3, "label": "Bueno", "descripcion": "Diferencia causas directas e indirectas con efectos asociados"},
          {"score": 4, "label": "Excelente", "descripcion": "Árbol completo con causas y efectos directos e indirectos, cuantificados y con evidencia"}
        ]
      },
      {
        "campo_id": "campo-1-3",
        "peso": 0.10,
        "descripcion": "Identificación de actores y cuantificación de beneficiarios",
        "niveles": [
          {"score": 1, "label": "Insuficiente", "descripcion": "No identifica actores ni beneficiarios"},
          {"score": 2, "label": "Básico", "descripcion": "Menciona beneficiarios sin cuantificar ni diferenciar directos/indirectos"},
          {"score": 3, "label": "Bueno", "descripcion": "Cuantifica beneficiarios y lista actores principales"},
          {"score": 4, "label": "Excelente", "descripcion": "Mapeo completo de actores con roles definidos y beneficiarios cuantificados por categoría"}
        ]
      },
      {
        "campo_id": "campo-2-1",
        "peso": 0.15,
        "descripcion": "Rigurosidad en el análisis de alternativas técnicas",
        "niveles": [
          {"score": 1, "label": "Insuficiente", "descripcion": "No presenta alternativas o presenta solo una"},
          {"score": 2, "label": "Básico", "descripcion": "Presenta alternativas sin análisis comparativo"},
          {"score": 3, "label": "Bueno", "descripcion": "Compara al menos 2 alternativas con criterios técnicos y económicos"},
          {"score": 4, "label": "Excelente", "descripcion": "Análisis completo de 3+ alternativas con costos, durabilidad, cobertura y justificación técnica"}
        ]
      },
      {
        "campo_id": "campo-2-2",
        "peso": 0.10,
        "descripcion": "Justificación de la alternativa seleccionada",
        "niveles": [
          {"score": 1, "label": "Insuficiente", "descripcion": "No justifica la selección"},
          {"score": 2, "label": "Básico", "descripcion": "Justificación superficial sin criterios claros"},
          {"score": 3, "label": "Bueno", "descripcion": "Justificación con criterios técnicos y económicos"},
          {"score": 4, "label": "Excelente", "descripcion": "Justificación robusta con múltiples criterios, viabilidad financiera y alineación con política pública"}
        ]
      },
      {
        "campo_id": "campo-3-1",
        "peso": 0.15,
        "descripcion": "Calidad del flujo económico (costos y beneficios)",
        "niveles": [
          {"score": 1, "label": "Insuficiente", "descripcion": "No presenta flujo económico"},
          {"score": 2, "label": "Básico", "descripcion": "Lista costos generales sin desagregación ni beneficios valorados"},
          {"score": 3, "label": "Bueno", "descripcion": "Flujo con costos desagregados y beneficios estimados"},
          {"score": 4, "label": "Excelente", "descripcion": "Flujo completo con costos detallados, beneficios valorados y horizonte de evaluación definido"}
        ]
      },
      {
        "campo_id": "campo-4-1",
        "peso": 0.15,
        "descripcion": "Coherencia y completitud del marco lógico",
        "niveles": [
          {"score": 1, "label": "Insuficiente", "descripcion": "No presenta marco lógico"},
          {"score": 2, "label": "Básico", "descripcion": "Marco lógico incompleto (falta objetivo, indicadores o supuestos)"},
          {"score": 3, "label": "Bueno", "descripcion": "Marco lógico con objetivo, actividades, indicadores y supuestos"},
          {"score": 4, "label": "Excelente", "descripcion": "Matriz completa con fin, propósito, componentes, actividades, indicadores verificables, medios de verificación y supuestos"}
        ]
      }
    ]'::jsonb
  )
ON CONFLICT (convocatoria_id) DO UPDATE SET criterios_json = EXCLUDED.criterios_json;

-- ============================================================
-- EVALUACIONES DEMO — Para San José del Guaviare, Etapa 1
-- ============================================================

INSERT INTO evaluations (id, submission_id, convocatoria_id, municipio_id, etapa_id, scores_json, total_score, max_score, recomendaciones, llm_model, duration_ms) VALUES
  (
    'g0000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'etapa-1',
    '[
      {"campo_id": "campo-1-1", "campo_nombre": "Problema central", "score": 4, "max_score": 4, "justificacion": "Excelente identificación del problema con datos cuantitativos: 145 km en mal estado, 23 veredas afectadas, 12,000 habitantes, temporalidad del problema bien definida."},
      {"campo_id": "campo-1-2", "campo_nombre": "Árbol de problemas", "score": 4, "max_score": 4, "justificacion": "Árbol completo y bien estructurado con causas directas e indirectas diferenciadas, efectos cuantificados ($2,400M en pérdidas, 15% deserción escolar) y evidencia de impacto."},
      {"campo_id": "campo-1-3", "campo_nombre": "Participantes y beneficiarios", "score": 4, "max_score": 4, "justificacion": "Mapeo completo de actores con roles definidos. Beneficiarios cuantificados por categoría: 12,000 directos, 45,000 indirectos, 2,300 estudiantes, 850 productores."}
    ]'::jsonb,
    91.11,
    100,
    ARRAY['Considerar incluir análisis de género en la identificación de beneficiarios', 'Agregar fuentes de los datos estadísticos citados para mayor sustento'],
    'gpt-4o-mini (seed)',
    0
  )
ON CONFLICT (submission_id, etapa_id) DO UPDATE
  SET scores_json = EXCLUDED.scores_json, total_score = EXCLUDED.total_score, recomendaciones = EXCLUDED.recomendaciones;

-- Evaluation: San José, Etapa 2
INSERT INTO evaluations (id, submission_id, convocatoria_id, municipio_id, etapa_id, scores_json, total_score, max_score, recomendaciones, llm_model, duration_ms) VALUES
  (
    'g0000000-0000-0000-0000-000000000002',
    'e0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'etapa-2',
    '[
      {"campo_id": "campo-2-1", "campo_nombre": "Análisis técnico de alternativas", "score": 4, "max_score": 4, "justificacion": "Análisis completo de 3 alternativas con costos, durabilidad y cobertura bien diferenciados."},
      {"campo_id": "campo-2-2", "campo_nombre": "Alternativa seleccionada", "score": 3, "max_score": 4, "justificacion": "Buena justificación con 6 criterios, aunque falta análisis de sostenibilidad a largo plazo y alineación explícita con el Plan Nacional de Desarrollo."}
    ]'::jsonb,
    70.00,
    100,
    ARRAY['[Alternativa seleccionada] Incluir referencia explícita al Plan Nacional de Desarrollo y al CONPES de vías terciarias', '[Alternativa seleccionada] Agregar análisis de sostenibilidad operativa post-construcción'],
    'gpt-4o-mini (seed)',
    0
  )
ON CONFLICT (submission_id, etapa_id) DO UPDATE
  SET scores_json = EXCLUDED.scores_json, total_score = EXCLUDED.total_score, recomendaciones = EXCLUDED.recomendaciones;

-- ============================================================
-- PROFILE SETUP — Run after creating auth users
-- ============================================================
-- Create users via Supabase Dashboard (Auth → Users → Add User) or via signup:
--   admin@mga.local      / Demo1234!
--   entidad@mga.local    / Demo1234!
--   municipio1@mga.local / Demo1234!
--
-- Then run these updates:
--
-- UPDATE profiles SET role = 'platform_admin' WHERE email = 'admin@mga.local';
-- UPDATE profiles SET role = 'entidad_admin', tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE email = 'entidad@mga.local';
-- UPDATE profiles SET role = 'municipio_user', tenant_id = 'a0000000-0000-0000-0000-000000000001', municipio_id = 'b0000000-0000-0000-0000-000000000001' WHERE email = 'municipio1@mga.local';
