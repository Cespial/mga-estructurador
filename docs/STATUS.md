# STATUS — Estructurador MGA por Convocatorias

> Última actualización: 2026-02-25 | Iteración: 6

## Estado actual: WAVE 6 — Rúbricas + Evaluación (completada)

### ¿Qué funciona?
- [x] Next.js 16 + TypeScript + Tailwind CSS 4 (App Router, `src/` dir)
- [x] Supabase client configurado (browser + server + middleware)
- [x] ESLint + TypeScript strict — `npm run lint` y `npm run typecheck` pasan
- [x] Build exitoso (`npm run build` — 21 rutas)
- [x] CI: GitHub Actions (lint + typecheck + test + build)
- [x] **Auth**: Login/signup con email+password
- [x] **Roles**: `platform_admin`, `entidad_admin`, `municipio_user`
- [x] **DB Schema**: tenants, profiles, municipios, convocatorias, mga_templates, convocatoria_municipios, submissions, audit_logs, documents, embeddings, rubrics, evaluations
- [x] **RLS Policies**: aislamiento completo (12 tablas con policies)
- [x] **Convocatorias CRUD**: crear, editar, eliminar, cambiar estado
- [x] **Plantilla MGA**: editor visual de etapas + campos
- [x] **Asignación municipios**: asignar/remover municipios
- [x] **Wizard MGA**: diligenciamiento por etapas con autosave debounced
- [x] **Progreso**: cálculo automático (% campos requeridos completados)
- [x] **Sync progress**: trigger que actualiza convocatoria_municipios.progress
- [x] **Vista municipio**: convocatoria detail con progreso por etapa
- [x] **Monitoreo entidad**: tabla de avance por municipio con desglose por etapa
- [x] **Asistente IA**: endpoint `/api/ai/assist` con adapter pattern (OpenAI/Anthropic)
- [x] **LLM Adapter**: factory function con soporte OpenAI y Anthropic
- [x] **Prompt contextual**: system prompt MGA + user prompt con convocatoria/etapa/campo + RAG context
- [x] **Schema de salida IA**: Zod con fallback graceful para respuestas no conformes
- [x] **Audit logs**: tabla audit_logs para trazabilidad de interacciones IA
- [x] **Rate limiting**: 10 solicitudes/minuto por usuario via audit_logs count
- [x] **UI Asistente**: botón "Asistente IA" por campo (textarea/text) en wizard
- [x] **Panel respuesta IA**: muestra suggested_text, bullets, risks, missing_info_questions, citations
- [x] **Usar sugerencia**: botón para aplicar texto sugerido al campo
- [x] **pgvector**: extensión habilitada + tabla embeddings con HNSW index
- [x] **Documents**: tabla documents + upload a Supabase Storage
- [x] **Document processing**: extracción de texto (PDF, TXT, DOCX) + chunking + embeddings
- [x] **RAG retrieval**: similarity search aislada por convocatoria via `match_embeddings` RPC
- [x] **UI Documentos**: gestión de documentos por convocatoria (upload, procesar, eliminar)
- [x] **Citations**: panel de citaciones en respuesta IA con fuente y relevancia
- [x] **Rúbricas**: tabla rubrics con criterios JSONB (campo_id, peso, niveles 1-4)
- [x] **Editor rúbrica**: UI visual para definir criterios + pesos + niveles de evaluación
- [x] **Evaluaciones**: tabla evaluations con scores por etapa + recomendaciones
- [x] **Scoring LLM**: evaluación por criterio usando LLM + rúbrica, normalizado a 100pts
- [x] **API evaluación**: POST `/api/evaluations/run` con upsert (re-evaluación)
- [x] **Monitoreo con scores**: tabla entidad con score badges + botón "Evaluar" por etapa
- [x] **Feedback municipio**: vista municipio con scores + recomendaciones por etapa

### ¿Qué falta? (próximas waves)
- [ ] **Wave 7**: Demo y empaque final

### Bloqueos
- Ninguno actualmente.

### Rutas disponibles (21 total)
| Ruta | Acceso | Descripción |
|------|--------|-------------|
| `/` | Público | Redirect |
| `/login` | No auth | Login + signup |
| `/auth/callback` | Sistema | Callback OAuth |
| `/api/ai/assist` | Auth (POST) | Endpoint asistente IA + RAG |
| `/api/documents/process` | Auth (POST) | Procesamiento de documentos (chunking + embeddings) |
| `/api/evaluations/run` | entidad_admin (POST) | Evaluación LLM por etapa |
| `/dashboard` | Auth | Redirect por rol |
| `/dashboard/entidad` | entidad_admin | Lista convocatorias + stats |
| `/dashboard/entidad/convocatorias/nueva` | entidad_admin | Crear convocatoria |
| `/dashboard/entidad/convocatorias/[id]` | entidad_admin | Detalle + edición |
| `/dashboard/entidad/convocatorias/[id]/plantilla` | entidad_admin | Editor plantilla MGA |
| `/dashboard/entidad/convocatorias/[id]/municipios` | entidad_admin | Asignar municipios |
| `/dashboard/entidad/convocatorias/[id]/documentos` | entidad_admin | Gestión documentos + RAG |
| `/dashboard/entidad/convocatorias/[id]/rubricas` | entidad_admin | Editor de rúbrica |
| `/dashboard/entidad/convocatorias/[id]/monitoreo` | entidad_admin | Monitoreo avance + evaluaciones |
| `/dashboard/municipio` | municipio_user | Convocatorias asignadas |
| `/dashboard/municipio/convocatorias/[id]` | municipio_user | Detalle + progreso + evaluaciones |
| `/dashboard/municipio/convocatorias/[id]/wizard` | municipio_user | Wizard MGA + Asistente IA |
| `/dashboard/admin` | platform_admin | Panel admin |
