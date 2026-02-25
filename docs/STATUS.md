# STATUS — Estructurador MGA por Convocatorias

> Última actualización: 2026-02-25 | Iteración: 2

## Estado actual: WAVE 2 — Convocatorias + Plantilla MGA (completada)

### ¿Qué funciona?
- [x] Next.js 16 + TypeScript + Tailwind CSS 4 (App Router, `src/` dir)
- [x] Supabase client configurado (browser + server + middleware)
- [x] ESLint + TypeScript strict — `npm run lint` y `npm run typecheck` pasan
- [x] Build exitoso (`npm run build` — 13 rutas)
- [x] CI: GitHub Actions (lint + typecheck + test + build)
- [x] **Auth**: Login/signup con email+password (Supabase Auth)
- [x] **Roles**: `platform_admin`, `entidad_admin`, `municipio_user`
- [x] **DB Schema**: tenants, profiles, municipios, convocatorias, mga_templates, convocatoria_municipios
- [x] **RLS Policies**: aislamiento completo por tenant, rol, municipio
- [x] **Convocatorias CRUD**: crear, editar, eliminar, cambiar estado
- [x] **Plantilla MGA**: editor visual de etapas + campos (client component)
- [x] **Asignación municipios**: asignar/remover municipios a convocatoria
- [x] **Vista municipio**: ver convocatorias asignadas + detalle de etapas MGA
- [x] **Zod validators**: schemas para convocatoria, template, campos
- [x] **Seed data**: convocatoria demo con 4 etapas MGA + 2 municipios asignados

### ¿Qué falta? (próximas waves)
- [ ] **Wave 3**: Wizard MGA (diligenciamiento por etapas, autosave)
- [ ] **Wave 4**: Asistente IA (endpoint server-side, schema Zod, audit_logs)
- [ ] **Wave 5**: Documentos + Vectorización por convocatoria (RAG aislado)
- [ ] **Wave 6**: Rúbricas + Evaluación en vivo
- [ ] **Wave 7**: Demo y empaque final

### Bloqueos
- Ninguno actualmente.

### Rutas disponibles
| Ruta | Acceso | Descripción |
|------|--------|-------------|
| `/` | Público | Redirect a login o dashboard |
| `/login` | No auth | Login + signup |
| `/auth/callback` | Sistema | Callback OAuth |
| `/dashboard` | Auth | Redirect por rol |
| `/dashboard/entidad` | entidad_admin | Lista convocatorias + stats |
| `/dashboard/entidad/convocatorias/nueva` | entidad_admin | Crear convocatoria |
| `/dashboard/entidad/convocatorias/[id]` | entidad_admin | Detalle + edición convocatoria |
| `/dashboard/entidad/convocatorias/[id]/plantilla` | entidad_admin | Editor plantilla MGA |
| `/dashboard/entidad/convocatorias/[id]/municipios` | entidad_admin | Asignar municipios |
| `/dashboard/municipio` | municipio_user | Convocatorias asignadas |
| `/dashboard/municipio/convocatorias/[id]` | municipio_user | Detalle convocatoria + etapas |
| `/dashboard/admin` | platform_admin | Panel admin |
