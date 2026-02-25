# STATUS — Estructurador MGA por Convocatorias

> Última actualización: 2026-02-25 | Iteración: 1

## Estado actual: WAVE 1 — Auth + Roles + RLS (completada)

### ¿Qué funciona?
- [x] Next.js 16 + TypeScript + Tailwind CSS 4 (App Router, `src/` dir)
- [x] Supabase client configurado (browser + server + middleware)
- [x] ESLint + TypeScript strict — `npm run lint` y `npm run typecheck` pasan
- [x] Build exitoso (`npm run build`)
- [x] `.env.example` con variables requeridas
- [x] Docs base creados
- [x] **Auth**: Login/signup con email+password (Supabase Auth)
- [x] **Roles**: `platform_admin`, `entidad_admin`, `municipio_user` (enum + profiles)
- [x] **DB Schema**: tablas `tenants`, `profiles`, `municipios` con RLS
- [x] **RLS Policies**: aislamiento por tenant_id, role, municipio_id
- [x] **Middleware**: protección de rutas `/dashboard/*`, redirect auth
- [x] **Dashboard**: layouts por rol (entidad, municipio, admin) con shells
- [x] **Trigger**: auto-creación de profile al signup
- [x] **Seed**: datos de ejemplo (tenants + municipios colombianos)
- [x] CI: GitHub Actions (lint + typecheck + test + build)

### ¿Qué falta? (próximas waves)
- [ ] **Wave 2**: Convocatorias + Plantilla MGA (CRUD, editor plantilla)
- [ ] **Wave 3**: Wizard MGA (diligenciamiento por etapas, autosave)
- [ ] **Wave 4**: Asistente IA (endpoint server-side, schema Zod, audit_logs)
- [ ] **Wave 5**: Documentos + Vectorización por convocatoria (RAG aislado)
- [ ] **Wave 6**: Rúbricas + Evaluación en vivo
- [ ] **Wave 7**: Demo y empaque final

### Bloqueos
- Ninguno actualmente.
- Nota: Next.js 16 depreca `middleware` en favor de `proxy`. Funciona pero genera warning.

### Cómo correr local
```bash
# 1. Clonar e instalar
git clone https://github.com/Cespial/mga-estructurador.git
cd mga-estructurador
npm install

# 2. Configurar variables
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase

# 3. Aplicar migraciones en Supabase
# Ejecutar supabase/migrations/00001_base_tables.sql en tu proyecto Supabase
# Ejecutar supabase/seed/seed.sql para datos de ejemplo

# 4. Desarrollo
npm run dev        # http://localhost:3000
npm run lint       # ESLint
npm run typecheck  # TypeScript check
npm run build      # Build producción
npm test           # Tests (pendiente)
```

### Rutas disponibles
| Ruta                    | Acceso        | Descripción                  |
| ----------------------- | ------------- | ---------------------------- |
| `/`                     | Público       | Redirect a login o dashboard |
| `/login`                | No auth       | Login + signup               |
| `/auth/callback`        | Sistema       | Callback OAuth/magic link    |
| `/dashboard`            | Auth          | Redirect por rol             |
| `/dashboard/entidad`    | entidad_admin | Panel de entidad             |
| `/dashboard/municipio`  | municipio_user| Panel de municipio           |
| `/dashboard/admin`      | platform_admin| Panel de administración      |

### Decisiones de stack
- **Next.js 16** (App Router, Turbopack en build)
- **Tailwind CSS 4** (via `@tailwindcss/postcss`)
- **Supabase** (Auth + Postgres + Storage + RLS)
- **Zod** para validación de schemas
- **ESLint 9** flat config con `eslint-config-next`
