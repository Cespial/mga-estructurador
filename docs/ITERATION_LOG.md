# ITERATION_LOG

---

## Iteracion 2025-02-25-1 -- Wave 0 -- Base documental + Security
**Objetivo**
- Crear estructura docs completa (RALPH_LOOP, WAVES, QUALITY_GATES, etc.)
- Auditar repo por secretos expuestos
- Actualizar .env.example y SECURITY.md

**Scope**
- Archivos tocados:
  - `docs/RALPH_LOOP.md` (nuevo)
  - `docs/WAVES.md` (nuevo)
  - `docs/QUALITY_GATES.md` (nuevo)
  - `docs/FILE_OWNERSHIP.md` (nuevo)
  - `docs/ITERATION_LOG.md` (nuevo)
  - `docs/BLOCKERS.md` (nuevo)
  - `docs/MANUAL.md` (nuevo)
  - `docs/WOW_SPEC.md` (nuevo)
  - `docs/CLAUDE_PROMPTS.md` (nuevo)
  - `docs/SECURITY.md` (actualizado)
  - `.env.example` (actualizado)
  - `SECURITY.md` (nuevo, raiz)

**Cambios**
- Estructura RALPH_LOOP completa
- Manual v1 base content
- WOW spec para landing + sorpresa
- Security checklist + rotacion
- Quality gates definidos

**Quality Gates**
- lint: pass
- typecheck: pass
- build: pass

**Commit**
- hash: (pendiente)
- mensaje: `docs: wave 0 — base documental + security + RALPH_LOOP`

**Siguientes pasos**
- Wave 1: Manual v1 completo

---

## Iteracion 2026-02-25-2 -- Wave 2 -- Help Center in-app

**Objetivo**
- Construir centro de ayuda integrado en /dashboard/ayuda
- Agregar botones contextuales de ayuda en paginas clave
- Link "Ayuda" en header del dashboard

**Scope**
- Archivos tocados:
  - `src/app/dashboard/ayuda/help-content.ts` (nuevo) — datos estructurados del help center
  - `src/app/dashboard/ayuda/help-center.tsx` (nuevo) — cliente con sidebar, busqueda, copy-link
  - `src/app/dashboard/ayuda/page.tsx` (nuevo) — server page wrapper
  - `src/app/dashboard/ayuda/loading.tsx` (nuevo) — skeleton de carga
  - `src/components/help-button.tsx` (nuevo) — boton contextual reutilizable
  - `src/app/dashboard/layout.tsx` (mod) — link Ayuda en header
  - `src/app/dashboard/entidad/convocatorias/[id]/monitoreo/page.tsx` (mod)
  - `src/app/dashboard/entidad/convocatorias/[id]/documentos/page.tsx` (mod)
  - `src/app/dashboard/entidad/convocatorias/[id]/rubricas/page.tsx` (mod)
  - `src/app/dashboard/municipio/convocatorias/[id]/wizard/page.tsx` (mod)

**Cambios**
- Help center con 13 secciones: que-es, roles, flujos, convocatorias, plantilla, documentos, rubricas, monitoreo, PDF, asistente IA, FAQ (5 items), glosario
- Busqueda con normalizacion de acentos
- Sidebar con indice de contenido (desktop)
- Copy-link por seccion
- Botones contextuales en: monitoreo, documentos, rubricas, wizard
- Loading skeleton para ayuda

**Quality Gates**
- lint: pass
- typecheck: pass
- build: pass (22 rutas, nueva: /dashboard/ayuda)

**Commit**
- hash: a96cda8
- mensaje: `feat: wave 2 — help center + contextual help buttons`

**Siguientes pasos**
- Wave 3: WOW Landing page
