# STATUS — Polytech (Estructurador MGA por Convocatorias)

> Última actualización: 2026-03-01 | Iteración: 8

## Estado actual: MVP COMPLETO — Producción + Design System unificado + Pre-evaluación

**URL producción**: https://mga-estructurador.vercel.app
**Supabase**: cqgqnertuovzvgkkkobo (15 migraciones aplicadas)

---

## Test E2E — 43/43 PASS

| Suite | Resultado | Tests |
|-------|-----------|-------|
| Entidad Admin | **11/11 PASS** | Auth, dashboard, CRUD convocatorias, template, municipios, rúbricas, documentos, submissions, evaluaciones, HTTP endpoints |
| Municipio User | **19/19 PASS** | Auth, convocatorias asignadas, aislamiento datos, template, submission + integridad, evaluaciones, audit logs, AI assist |
| Admin + Seguridad | **13/13 PASS** | Platform admin acceso total, aislamiento RLS por rol, municipio no puede escribir en tablas de entidad, endpoints HTTP |

---

## Iteración 8 — Design System + Pre-evaluación (Feb 25 – Mar 1, 2026)

### 1. Pre-evaluación en tiempo real (nuevo)
- **Endpoint**: `POST /api/pre-evaluation/run` — evalúa todos los criterios de la rúbrica sin persistir en DB
- **Auth**: acepta `municipio_user` (no solo `entidad_admin`)
- **Optimización**: 1 llamada LLM por etapa (batch de criterios) + 1 llamada para resumen ejecutivo
- **UI**: botón "Pre-evaluar" en barra de navegación del wizard (requiere ≥30% progreso)
- **Panel de resultados**: score total, desglose por etapa/criterio, barras de progreso coloreadas, justificaciones, recomendaciones con iconos de alerta, resumen ejecutivo
- **Colores**: purple (consistente con IA en toda la app)

### 2. Rebranding Publitec → Polytech
- Renombrado completo en UI, componentes, y documentación
- Acento EAFIT blue como color primario

### 3. Design system unificado
- Tokens de color: reemplazo de clases gray/slate/indigo/green/yellow por tokens semánticos
- Tipografía Inter como fuente de referencia
- Tema claro rediseñado: fondo blanco, sidebar oscuro
- Unificación purple para elementos de IA en toda la app
- Unificación emerald (éxito) y amber (advertencia)

### 4. Landing page + ventas
- Página de contacto, casos de éxito, implementación
- Demo seed script con datos realistas
- Sales proof kit completo

---

## Hotfixes post-deploy (migrations 00007–00010)

### 1. RLS infinite recursion (00007, 00008, 00009)
- **Problema**: `infinite recursion detected in policy for relation 'convocatorias'`
- **Causa raíz**: Helper functions (`auth_user_role`, `auth_user_tenant_id`, `auth_user_municipio_id`) consultaban `profiles` cuyas políticas RLS llamaban a esas mismas funciones. Adicionalmente, políticas de `convocatorias` hacían subquery a `convocatoria_municipios` y viceversa (ciclo cross-tabla). PostgreSQL evalúa TODAS las políticas con lógica OR.
- **Fix**: Funciones `SECURITY DEFINER` con fallback JWT→DB. Denormalización de `tenant_id` en `convocatoria_municipios`. Funciones wrapper: `get_municipio_convocatoria_ids()`, `get_convocatoria_tenant_id()`, `is_municipio_assigned_to_convocatoria()`.

### 2. .single() → .maybeSingle() (código)
- **Problema**: Queries a `mga_templates`, `rubrics`, `submissions` con `.single()` fallaban con PGRST116 cuando no había registros.
- **Fix**: Cambiado a `.maybeSingle()` en 8 archivos (pages + API routes).

### 3. processDocument auth (código)
- **Problema**: Server action llamaba al API route con cookie auth que no funciona en server-to-server. Además `profile` se referenciaba fuera de su scope.
- **Fix**: Service role key header para llamadas server-to-server. Variable `callerTenantId` con scope correcto.

### 4. .trim() en non-string (código)
- **Problema**: `data_json` values podían ser non-string, causando error en `.trim()`.
- **Fix**: `String(value ?? "").trim()` en 3 archivos.

### 5. Filtros faltantes en dashboards (código)
- **Problema**: Municipio dashboard no filtraba por `municipio_id`. Entidad dashboard no filtraba por `tenant_id`. Admin dashboard mostraba ceros hardcodeados.
- **Fix**: Filtros explícitos + queries reales con `Promise.all` en admin.

### 6. AI Assist "Invalid UUID" (código + schema)
- **Problema**: Zod `z.string().uuid()` rechazaba UUIDs del seed (`c0000000-...`) porque no cumplen RFC 4122 (version nibble ≠ 4).
- **Fix**: Relajado a `z.string().min(1)`. PostgreSQL valida formato UUID en DB layer.

### 7. "invalid model ID" en AI Assist (env vars)
- **Problema**: Variables `OPENAI_MODEL` y `LLM_PROVIDER` en Vercel tenían valores inválidos.
- **Fix**: Eliminadas. El código usa defaults correctos: `claude-sonnet-4-6` / `anthropic`.

### 8. Role guards en RLS (00010)
- **Problema**: Políticas `entidad_admin` no verificaban `auth_user_role()`, solo `tenant_id`. Municipio users con mismo `tenant_id` podían insertar convocatorias y ver tenants.
- **Fix**: Agregado `auth_user_role() = 'entidad_admin'` a 9 políticas en 8 tablas.

---

## ¿Qué funciona?

- [x] Next.js 16 + TypeScript + Tailwind CSS 4 (App Router, `src/` dir)
- [x] Supabase client configurado (browser + server + middleware)
- [x] ESLint + TypeScript strict — `npm run lint` y `npm run typecheck` pasan
- [x] Build exitoso (`pnpm build` — 35 rutas)
- [x] CI: GitHub Actions (lint + typecheck + test + build)
- [x] **Auth**: Login/signup con email+password
- [x] **Roles**: `platform_admin`, `entidad_admin`, `municipio_user`
- [x] **DB Schema**: 17 tablas con RLS + pgvector
- [x] **RLS Policies**: aislamiento completo con role guards (10+ migraciones, SECURITY DEFINER)
- [x] **Convocatorias CRUD**: crear, editar, eliminar, cambiar estado
- [x] **Plantilla MGA**: editor visual de etapas + campos
- [x] **Asignación municipios**: asignar/remover municipios
- [x] **Wizard MGA**: diligenciamiento por etapas con autosave debounced
- [x] **Progreso**: cálculo automático (% campos requeridos completados)
- [x] **Sync progress**: trigger que actualiza convocatoria_municipios.progress
- [x] **Vista municipio**: convocatoria detail con progreso por etapa
- [x] **Monitoreo entidad**: tabla de avance por municipio con desglose por etapa
- [x] **Asistente IA**: endpoint `/api/ai/assist` con adapter pattern (Anthropic)
- [x] **LLM Adapter**: factory function con soporte OpenAI y Anthropic (default: claude-sonnet-4-6)
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
- [x] **Pre-evaluación**: POST `/api/pre-evaluation/run` — scoring sin persistir, batch por etapa
- [x] **UI Pre-evaluación**: panel overlay con scores, desglose, recomendaciones y resumen ejecutivo
- [x] **Monitoreo con scores**: tabla entidad con score badges + botón "Evaluar" por etapa
- [x] **Feedback municipio**: vista municipio con scores + recomendaciones por etapa
- [x] **Generación PDF**: exportar submissions y reportes en PDF
- [x] **Exportación Excel**: datos de proyecto en formato XLSX
- [x] **Email**: notificaciones transaccionales via Resend
- [x] **Cron scoring**: `/api/cron/score-projects` cada 5 min via Vercel Cron
- [x] **Landing page**: casos de éxito, contacto, implementación
- [x] **Tema claro/oscuro**: toggle con design tokens semánticos
- [x] **Design system**: Inter, purple IA, emerald/amber, tokens unificados
- [x] **DEMO_SCRIPT.md**: guion de presentación 8-10 min con 6 actos
- [x] **Seed completo**: datos demo con contenido MGA realista (2 submissions, rúbrica, evaluaciones)
- [x] **DEPLOY.md**: checklist de despliegue Vercel + Supabase con troubleshooting
- [x] **Admin dashboard**: métricas reales (tenants, usuarios, convocatorias)

## Credenciales demo

| Email | Password | Rol |
|-------|----------|-----|
| `admin@mga.local` | `Demo1234!` | platform_admin |
| `entidad@mga.local` | `Demo1234!` | entidad_admin (Ministerio de Transporte) |
| `municipio1@mga.local` | `Demo1234!` | municipio_user (San José del Guaviare) |

## Migraciones (15)

| # | Archivo | Descripción |
|---|---------|-------------|
| 1 | `00001_base_tables.sql` | Tenants, profiles, municipios, convocatorias, mga_templates, convocatoria_municipios + RLS |
| 2 | `00002_convocatorias.sql` | Extensiones de convocatorias |
| 3 | `00003_submissions.sql` | Submissions + progress trigger |
| 4 | `00004_audit_logs.sql` | Audit logs para IA |
| 5 | `00005_documents_embeddings.sql` | Documents, embeddings, pgvector, match_embeddings RPC |
| 6 | `00006_rubrics_evaluations.sql` | Rubrics, evaluations |
| 7 | `00007_fix_rls_recursion.sql` | Custom access token hook + JWT helper functions |
| 8 | `00008_fix_helper_fallback.sql` | JWT-first con DB fallback + SECURITY DEFINER |
| 9 | `00009_break_cross_table_recursion.sql` | SECURITY DEFINER wrappers + tenant_id denorm — fix definitivo |
| 10 | `00010_add_role_guards_to_policies.sql` | Role guards en todas las políticas entidad/municipio |
| 11 | `00011_publitec_core_tables.sql` | Tablas Polytech (organizations, convocatorias_v2, projects, rubrics_v2, etc.) |
| 12 | `00012_publitec_storage.sql` | Configuración de storage |
| 13 | `00013_publitec_rls.sql` | Políticas RLS Polytech |
| 14 | `00014_claim_scoring_job.sql` | Gestión de scoring jobs |
| 15 | `20260225_contact_messages.sql` | Tabla de mensajes de contacto |

## Rutas disponibles (35 total)

| Ruta | Acceso | Descripción |
|------|--------|-------------|
| `/` | Público | Landing page |
| `/login` | No auth | Login + signup |
| `/casos` | Público | Casos de éxito |
| `/contacto` | Público | Formulario de contacto |
| `/implementacion` | Público | Plan de implementación |
| `/auth/callback` | Sistema | Callback OAuth |
| `/auth/signout` | Sistema | Cerrar sesión |
| `/api/ai/assist` | Auth (POST) | Endpoint asistente IA + RAG |
| `/api/ai/chat` | Auth (POST) | Chat LLM |
| `/api/documents/process` | Auth (POST) | Procesamiento de documentos |
| `/api/evaluations/run` | entidad_admin (POST) | Evaluación LLM por etapa |
| `/api/pre-evaluation/run` | municipio_user (POST) | Pre-evaluación sin persistir |
| `/api/scoring/start` | entidad_admin (POST) | Iniciar scoring batch |
| `/api/submissions/[id]/pdf` | Auth (GET) | PDF de submission |
| `/api/reports/[projectId]/pdf` | entidad_admin (GET) | Reporte PDF |
| `/api/reports/[projectId]/xlsx` | entidad_admin (GET) | Reporte Excel |
| `/api/wizard/save-step` | Auth (POST) | Guardar paso del wizard |
| `/api/wizard/submit` | Auth (POST) | Enviar proyecto |
| `/api/cron/score-projects` | Cron secret (GET) | Scoring automático cada 5 min |
| `/dashboard` | Auth | Redirect por rol |
| `/dashboard/admin` | platform_admin | Panel admin con métricas |
| `/dashboard/entidad` | entidad_admin | Lista convocatorias + stats |
| `/dashboard/entidad/analytics` | entidad_admin | Analíticas |
| `/dashboard/entidad/convocatorias/nueva` | entidad_admin | Crear convocatoria |
| `/dashboard/entidad/convocatorias/[id]` | entidad_admin | Detalle + edición |
| `/dashboard/entidad/convocatorias/[id]/plantilla` | entidad_admin | Editor plantilla MGA |
| `/dashboard/entidad/convocatorias/[id]/municipios` | entidad_admin | Asignar municipios |
| `/dashboard/entidad/convocatorias/[id]/documentos` | entidad_admin | Gestión documentos + RAG |
| `/dashboard/entidad/convocatorias/[id]/rubricas` | entidad_admin | Editor de rúbrica |
| `/dashboard/entidad/convocatorias/[id]/monitoreo` | entidad_admin | Monitoreo avance + evaluaciones |
| `/dashboard/municipio` | municipio_user | Convocatorias asignadas |
| `/dashboard/municipio/convocatorias/[id]` | municipio_user | Detalle + progreso + evaluaciones |
| `/dashboard/municipio/convocatorias/[id]/wizard` | municipio_user | Wizard MGA + Asistente IA + Pre-evaluación |
| `/dashboard/onboarding` | Auth | Onboarding |
| `/dashboard/organizacion` | Auth | Perfil de organización |
| `/dashboard/convocatorias/explorar` | Auth | Explorar convocatorias |
| `/dashboard/proyectos` | Auth | Lista de proyectos |
| `/dashboard/proyectos/[id]` | Auth | Detalle de proyecto |
| `/dashboard/proyectos/[id]/wizard` | Auth | Wizard de proyecto |
| `/dashboard/proyectos/aplicar/[convocatoriaId]` | Auth | Aplicar a convocatoria |
| `/dashboard/evaluaciones` | Auth | Ver evaluaciones |
| `/dashboard/evaluaciones/[projectId]` | Auth | Detalle de evaluación |
| `/dashboard/reportes` | Auth | Reportes |
| `/dashboard/ayuda` | Auth | Centro de ayuda |
