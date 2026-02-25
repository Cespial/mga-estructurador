# BACKLOG — Estructurador MGA por Convocatorias

## MVP (MUST)

### Wave 1 — Auth + Roles + RLS ✅
- [x] Configurar Supabase Auth (email + password)
- [x] Crear tablas: `tenants`, `profiles`, `municipios` (seed)
- [x] Implementar roles: `platform_admin`, `entidad_admin`, `municipio_user`
- [x] Políticas RLS por tenant y rol
- [x] UI: login page + redirección por rol
- [x] Middleware de protección de rutas

### Wave 2 — Convocatorias + Plantilla MGA ✅
- [x] Tabla `convocatorias` (tenant_id, metadata, fechas, estado)
- [x] CRUD convocatoria (UI entidad_admin)
- [x] Tabla `mga_templates` (etapas + campos en JSON)
- [x] Editor visual de plantilla MGA (client component)
- [x] Tabla `convocatoria_municipios` (asignación + remover)
- [x] UI municipio: ver convocatoria asignada y etapas MGA

### Wave 3 — Wizard MGA ✅
- [x] Tabla `submissions` (convocatoria_id, municipio_id, data_json, etapa_actual, progress)
- [x] Wizard UI por etapas MGA (sidebar + campos + navegación)
- [x] Autosave (debounced 1.5s, state-based)
- [x] Validaciones mínimas por etapa (campos requeridos)
- [x] Cálculo de progreso (% campos requeridos completados)
- [x] Tablero entidad: monitoreo con desglose por etapa por municipio
- [x] Sync progress trigger (submissions → convocatoria_municipios)

### Wave 4 — Asistente IA ✅
- [x] Endpoint server-side `/api/ai/assist`
- [x] Schema de salida Zod (suggested_text, bullets, risks, etc.)
- [x] Adapter pattern para LLM (OpenAI/Anthropic)
- [x] Tabla `audit_logs` para interacciones IA
- [x] UI: botón de asistente por campo MGA
- [x] Prompt template contextual
- [x] Rate limiting (10 req/min por usuario)
- [x] Panel de respuesta IA con "Usar sugerencia"

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
