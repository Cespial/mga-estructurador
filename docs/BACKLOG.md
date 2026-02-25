# BACKLOG — Estructurador MGA por Convocatorias

## MVP (MUST)

### Wave 1 — Auth + Roles + RLS ✅
- [x] Configurar Supabase Auth (email + password)
- [x] Crear tablas: `tenants`, `profiles`, `municipios` (seed)
- [x] Implementar roles: `platform_admin`, `entidad_admin`, `municipio_user`
- [x] Políticas RLS por tenant y rol
- [x] UI: login page + redirección por rol
- [x] Middleware de protección de rutas

### Wave 2 — Convocatorias + Plantilla MGA
- [ ] Tabla `convocatorias` (tenant_id, metadata, fechas, estado)
- [ ] CRUD convocatoria (UI entidad_admin)
- [ ] Tabla `mga_templates` (etapas + campos en JSON)
- [ ] Editor simple de plantilla MGA
- [ ] Tabla `convocatoria_municipios` (asignación)
- [ ] UI municipio: ver convocatoria asignada y etapas

### Wave 3 — Wizard MGA
- [ ] Tabla `submissions` (convocatoria_id, municipio_id, data_json, etapa_actual)
- [ ] Wizard UI por etapas MGA
- [ ] Autosave (debounced)
- [ ] Validaciones mínimas por etapa
- [ ] Cálculo de progreso (%)
- [ ] Tablero entidad: lista municipios + % avance

### Wave 4 — Asistente IA
- [ ] Endpoint server-side `/api/ai/assist`
- [ ] Schema de salida Zod (suggested_text, bullets, risks, etc.)
- [ ] Adapter pattern para LLM (OpenAI/Anthropic)
- [ ] Tabla `audit_logs` para interacciones IA
- [ ] UI: botón de asistente por campo MGA
- [ ] Prompt template contextual

### Wave 5 — Documentos + RAG
- [ ] Upload a Supabase Storage por convocatoria
- [ ] Tabla `documents` (metadata)
- [ ] Pipeline chunking + embeddings (pgvector)
- [ ] Tabla `embeddings` (convocatoria_id aislado)
- [ ] Retrieval top-k con filtro por convocatoria
- [ ] Citaciones en respuestas IA

### Wave 6 — Rúbricas + Evaluación
- [ ] Tabla `rubrics` (criterios JSON por convocatoria)
- [ ] Tabla `evaluations` (submission_id, etapa, score, recomendaciones)
- [ ] Scoring por etapa
- [ ] Tablero entidad: alerts + recomendaciones
- [ ] Vista municipio: recomendaciones accionables

### Wave 7 — Demo + Empaque
- [ ] DEMO_SCRIPT.md con guion 7-10 min
- [ ] Dataset de ejemplo (convocatoria demo + 2 municipios)
- [ ] Checklist despliegue Vercel + Supabase prod
- [ ] Seed script para demo

## SHOULD (si alcanza)
- [ ] Ingesta masiva de documentos (batch upload)
- [ ] Rúbrica más robusta con scoring ponderado
- [ ] Notificaciones por email (cambios de estado)
- [ ] Export PDF de submissions

## WON'T (MVP)
- Planos civiles/ingeniería
- Firma electrónica avanzada
- Integraciones profundas con sistemas gubernamentales
