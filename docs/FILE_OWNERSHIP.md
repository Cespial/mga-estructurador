# FILE_OWNERSHIP (Multi-agente)

Objetivo: permitir trabajo paralelo sin conflictos.

## Owners y scopes

### Worker A -- Docs/Manual
Puede tocar:
- `docs/**`
- `src/app/**/ayuda/**`
- `src/app/**/manual/**`
- `src/content/**` (si se crea)

Prohibido:
- `src/lib/ai/**`
- `src/app/api/**` (salvo endpoints de contenido estatico, con aprobacion)

Entregables:
- Manual v1 + Help Center UI

---

### Worker B -- Marketing/WOW (Landing publica + assets)
Puede tocar:
- `src/app/(public)/**` (o el grupo publico definido)
- `public/**`
- metadata (`src/app/layout.tsx`, `robots.ts`, `sitemap.ts`) si aplica

Prohibido:
- Rutas privadas `/dashboard/**` (excepto link a ayuda)
- Logica Supabase/AI

Entregables:
- Landing + demo guiada + OG assets

---

### Worker C -- Product UX (Sorpresa + microinteracciones)
Puede tocar:
- Componentes UI: `src/components/**`
- Paginas dashboard puntuales para microinteracciones: `src/app/dashboard/**`

Prohibido:
- Cambios estructurales de auth/RLS
- Migraciones DB

Entregables:
- Microinteracciones accesibles + prefers-reduced-motion

---

### Worker D -- Seguridad/Infra docs
Puede tocar:
- `SECURITY.md`, `.env.example`, `.gitignore`
- scripts/hooks (si existen): `.husky/**` o `scripts/**`

Prohibido:
- No tocar logica de negocio

Entregables:
- Anti-secrets + rotacion + guardrails
