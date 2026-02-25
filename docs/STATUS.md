# STATUS — Estructurador MGA por Convocatorias

> Última actualización: 2026-02-24 | Iteración: 0

## Estado actual: WAVE 0 — Setup inicial

### ¿Qué funciona?
- [x] Next.js 16 + TypeScript + Tailwind CSS 4 (App Router, `src/` dir)
- [x] Supabase client configurado (browser + server + middleware)
- [x] ESLint + TypeScript strict — `npm run lint` y `npm run typecheck` pasan
- [x] Build exitoso (`npm run build`)
- [x] `.env.example` con variables requeridas
- [x] Docs base creados

### ¿Qué falta? (próximas waves)
- [ ] **Wave 1**: Auth + Roles + RLS (login, profiles, tenants, municipios)
- [ ] **Wave 2**: Convocatorias + Plantilla MGA (CRUD, editor plantilla)
- [ ] **Wave 3**: Wizard MGA (diligenciamiento por etapas, autosave)
- [ ] **Wave 4**: Asistente IA (endpoint server-side, schema Zod, audit_logs)
- [ ] **Wave 5**: Documentos + Vectorización por convocatoria (RAG aislado)
- [ ] **Wave 6**: Rúbricas + Evaluación en vivo
- [ ] **Wave 7**: Demo y empaque final

### Bloqueos
- Ninguno actualmente.

### Cómo correr local
```bash
# 1. Clonar e instalar
git clone <repo-url> mga-estructurador
cd mga-estructurador
npm install

# 2. Configurar variables
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase

# 3. Desarrollo
npm run dev        # http://localhost:3000
npm run lint       # ESLint
npm run typecheck  # TypeScript check
npm run build      # Build producción
npm test           # Tests (pendiente)
```

### Decisiones de stack
- **Next.js 16** (App Router, Turbopack en build)
- **Tailwind CSS 4** (via `@tailwindcss/postcss`)
- **Supabase** (Auth + Postgres + Storage + RLS)
- **Zod** para validación de schemas
- **ESLint 9** flat config con `eslint-config-next`
