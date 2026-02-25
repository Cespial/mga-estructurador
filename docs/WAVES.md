# WAVES -- Manual + WOW (Venta)

Contexto asumido:
- App Next.js (App Router) + Supabase + Vercel.
- Roles principales: `entidad_admin` y `municipio_user`.
- Modulos clave existentes: Convocatorias, Plantillas (MGA), Wizard, Documentos, Rubricas, Monitoreo, PDF, Asistente IA.

Objetivo del programa:
1) Crear un **Manual** que explique el flujo de trabajo end-to-end.
2) Crear una **Propuesta WOW + sorpresa** para vender el proyecto (landing publica + demo + microinteracciones + proof).

---

## Wave 0 -- Seguridad + Base documental (obligatoria)
**Entregables**
- `SECURITY.md`, `.env.example`, checklist anti-secretos.
- Estructura docs + prompts (Claude Supervisor + Workers).
- "Help Center skeleton" (solo estructura, sin copy final).

**DoD**
- No hay secretos en repo.
- Existe guia de rotacion + gitignore recomendado.
- Quality gates base definidos.

---

## Wave 1 -- Manual v1 (flujo de trabajo real)
**Entregables**
- `docs/MANUAL.md` completo (roles, flujos, FAQs, glosario, troubleshooting).
- Mapa de flujo (texto + diagrama Mermaid opcional).
- "Quickstart" 10 minutos por rol.

**DoD**
- Cualquier persona nueva entiende:
  - Que hace la plataforma
  - Que hace cada rol
  - Como se crea una convocatoria, se configura, se asigna, se llena, se evalua y se exporta
- Manual con secciones: onboarding, flujos, errores comunes, soporte.

---

## Wave 2 -- Manual dentro de la app (Help Center)
**Entregables**
- Ruta in-app: `/dashboard/ayuda` (privada) y/o `/manual` (publica) con navegacion.
- UI: buscador simple, indice lateral, "copiar link a seccion".
- Boton "Ayuda" contextual (ej: en Monitoreo, Documentos, Wizard).

**DoD**
- Un usuario puede encontrar respuestas sin salir del producto.
- 0 errores de build + navegacion estable.
- Accesibilidad minima: focus states, roles, headings.

---

## Wave 3 -- WOW de venta (Landing publica)
**Entregables**
- Landing publica real (no redirect a /login).
- Secciones: Hero, Problema, Solucion, Flujo en 3 pasos, Beneficios, Casos/Prueba, CTA, Footer.
- Metadatos OG/Twitter + favicon + og-image.
- "Demo guiada" (modo lectura): simulacion del wizard + scoring + PDF (sin datos reales).

**DoD**
- "Efecto guau" visible en los primeros 5 segundos:
  - Animacion/visual del flujo
  - Demo interactiva o preview dinamico
  - Mensaje claro del valor
- CTA claro a demo o contacto.
- SEO basico: sitemap + robots + titles/descriptions por pagina publica.

---

## Wave 4 -- Sorpresa (microinteracciones + momentos memorables)
**Entregables**
- 2-4 microinteracciones (ej: confetti sutil al completar, "score reveal", tooltips inteligentes, "before/after" del PDF).
- 1 "momento sorpresa" controlado (no infantil).
- Performance: animaciones ligeras, no bloating.

**DoD**
- La sorpresa no interrumpe tareas.
- Todo accesible y con fallback (prefers-reduced-motion).

---

## Wave 5 -- Proof para vender (kit comercial)
**Entregables**
- Pagina "/casos" o "/resultados" (aunque sea con datos placeholder honestos).
- 1-pager descargable (PDF marketing) o "Sales deck" embebida.
- Checklist de implementacion + timeline (sin prometer fechas, solo pasos).

**DoD**
- Existe un paquete vendible: landing + demo + prueba + manual.
- Mensajes sin claims no verificables.
