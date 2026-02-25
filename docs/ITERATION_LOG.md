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

---

## Iteracion 2026-02-25-3 -- Wave 3 -- WOW Landing publica

**Objetivo**
- Landing publica real en `/` (no redirect a login)
- Secciones: Hero, Problema, Solucion, Flujo 4 pasos, Beneficios, Evidencia, CTA, Footer
- Demo interactiva: wizard → scoring → resumen ejecutivo mock
- SEO basico: robots.txt, sitemap.xml, OG/Twitter metadata

**Scope**
- Archivos tocados:
  - `src/app/page.tsx` (reescrito) — landing completa con 8 secciones
  - `src/components/landing/interactive-demo.tsx` (nuevo) — demo guiada con 3 pasos
  - `src/app/robots.ts` (nuevo) — reglas robots.txt
  - `src/app/sitemap.ts` (nuevo) — sitemap.xml

**Cambios**
- Hero con promesa de valor + 2 CTAs (demo + login)
- Visualizacion de flujo en 4 pasos (Configurar → Diligenciar → Evaluar → Evidenciar)
- Seccion problema (3 dolores: info dispersa, evaluacion manual, sin evidencia)
- Seccion solucion (3 columnas: entidad configura, municipio diligencia, evaluacion)
- Demo interactiva:
  - Wizard con 2 etapas, 3 campos, boton "Llenar ejemplo"
  - Scoring animado con rubrica ponderada (3 criterios con pesos)
  - Resumen ejecutivo estilo PDF con evaluacion y recomendaciones
- Seccion beneficios (4 cards: estandarizacion, evaluacion objetiva, IA, PDF)
- Seccion "Auditable por diseno" (rubrica, PDF, control de acceso)
- CTA final + footer
- Landing es pagina estatica (prerendered)
- robots.txt bloquea /dashboard/ y /api/
- sitemap.xml con / y /login

**Quality Gates**
- lint: pass
- typecheck: pass
- build: pass (24 rutas, nuevas: / (static), /robots.txt, /sitemap.xml)

**Commit**
- hash: b5ad5c8
- mensaje: `feat: wave 3 — public landing page + interactive demo + SEO`

**Siguientes pasos**
- Wave 4: Microinteracciones + sorpresa

---

## Iteracion 2026-02-25-4 -- Wave 4 -- Microinteracciones + Sorpresa

**Objetivo**
- 4 microinteracciones accesibles (prefers-reduced-motion)
- 1 momento sorpresa: toggle Before/After del Asistente IA

**Scope**
- Archivos tocados:
  - `src/app/globals.css` (mod) — keyframes: score-reveal, shimmer, fade-in-up + reduced-motion
  - `src/app/dashboard/entidad/convocatorias/[id]/monitoreo/monitoreo-table.tsx` (mod) — score reveal animation
  - `src/app/dashboard/municipio/convocatorias/[id]/wizard/wizard-client.tsx` (mod) — progress celebration
  - `src/components/landing/interactive-demo.tsx` (mod) — score reveal + before/after toggle

**Cambios**
- CSS animations: score-reveal (scale+bounce 0.5s), shimmer (gradient sweep 2s loop), fade-in-up (0.4s)
- Reduced-motion media query: desactiva todas las animaciones
- Monitoreo: ScoreBadge con animate-score-reveal al evaluar (1s timeout, luego estatico)
- Wizard: barra de progreso verde con shimmer al 100% + mensaje "Completado" con fade-in-up
- Landing demo scoring: scores individuales con reveal animation, score total con fade-in-up
- Landing demo summary: score badge con reveal, PDF preview con fade-in-up
- Before/After toggle: texto crudo vs texto mejorado con IA (toggle Antes/Despues)

**Quality Gates**
- lint: pass
- typecheck: pass
- build: pass (24 rutas)

**Commit**
- hash: 23582a6
- mensaje: `feat: wave 4 — microinteractions + before/after surprise`

**Siguientes pasos**
- Wave 5: Proof para vender (kit comercial)
