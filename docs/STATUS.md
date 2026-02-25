# STATUS — Estructurador MGA por Convocatorias

> Última actualización: 2026-02-25 | Iteración: 3

## Estado actual: WAVE 3 — Wizard MGA (completada)

### ¿Qué funciona?
- [x] Next.js 16 + TypeScript + Tailwind CSS 4 (App Router, `src/` dir)
- [x] Supabase client configurado (browser + server + middleware)
- [x] ESLint + TypeScript strict — `npm run lint` y `npm run typecheck` pasan
- [x] Build exitoso (`npm run build` — 15 rutas)
- [x] CI: GitHub Actions (lint + typecheck + test + build)
- [x] **Auth**: Login/signup con email+password
- [x] **Roles**: `platform_admin`, `entidad_admin`, `municipio_user`
- [x] **DB Schema**: tenants, profiles, municipios, convocatorias, mga_templates, convocatoria_municipios, submissions
- [x] **RLS Policies**: aislamiento completo (7 tablas con policies)
- [x] **Convocatorias CRUD**: crear, editar, eliminar, cambiar estado
- [x] **Plantilla MGA**: editor visual de etapas + campos
- [x] **Asignación municipios**: asignar/remover municipios
- [x] **Wizard MGA**: diligenciamiento por etapas con autosave debounced
- [x] **Progreso**: cálculo automático (% campos requeridos completados)
- [x] **Sync progress**: trigger que actualiza convocatoria_municipios.progress
- [x] **Vista municipio**: convocatoria detail con progreso por etapa
- [x] **Monitoreo entidad**: tabla de avance por municipio con desglose por etapa

### ¿Qué falta? (próximas waves)
- [ ] **Wave 4**: Asistente IA (endpoint server-side, schema Zod, audit_logs)
- [ ] **Wave 5**: Documentos + Vectorización por convocatoria (RAG aislado)
- [ ] **Wave 6**: Rúbricas + Evaluación en vivo
- [ ] **Wave 7**: Demo y empaque final

### Bloqueos
- Ninguno actualmente.

### Rutas disponibles (15 total)
| Ruta | Acceso | Descripción |
|------|--------|-------------|
| `/` | Público | Redirect |
| `/login` | No auth | Login + signup |
| `/auth/callback` | Sistema | Callback OAuth |
| `/dashboard` | Auth | Redirect por rol |
| `/dashboard/entidad` | entidad_admin | Lista convocatorias + stats |
| `/dashboard/entidad/convocatorias/nueva` | entidad_admin | Crear convocatoria |
| `/dashboard/entidad/convocatorias/[id]` | entidad_admin | Detalle + edición |
| `/dashboard/entidad/convocatorias/[id]/plantilla` | entidad_admin | Editor plantilla MGA |
| `/dashboard/entidad/convocatorias/[id]/municipios` | entidad_admin | Asignar municipios |
| `/dashboard/entidad/convocatorias/[id]/monitoreo` | entidad_admin | Monitoreo avance |
| `/dashboard/municipio` | municipio_user | Convocatorias asignadas |
| `/dashboard/municipio/convocatorias/[id]` | municipio_user | Detalle + progreso |
| `/dashboard/municipio/convocatorias/[id]/wizard` | municipio_user | Wizard MGA |
| `/dashboard/admin` | platform_admin | Panel admin |
