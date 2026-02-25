# DECISIONS — Registro de decisiones técnicas

## DEC-001: Next.js 16 con App Router
**Fecha**: 2026-02-24
**Decisión**: Usar Next.js 16 (última versión) con App Router y directorio `src/`.
**Razón**: Estándar moderno, soporte nativo de Server Components, compatible con Vercel.

## DEC-002: Tailwind CSS 4 via PostCSS
**Fecha**: 2026-02-24
**Decisión**: Tailwind CSS 4 con `@tailwindcss/postcss` plugin.
**Razón**: v4 simplifica configuración, no requiere `tailwind.config.js`.

## DEC-003: ESLint 9 flat config
**Fecha**: 2026-02-24
**Decisión**: ESLint 9 con flat config (`eslint.config.mjs`) y `eslint-config-next`.
**Razón**: Next.js 16 eliminó el comando `next lint`; usamos `eslint .` directamente.

## DEC-004: Supabase SSR pattern
**Fecha**: 2026-02-24
**Decisión**: Usar `@supabase/ssr` con middleware para manejo de sesiones.
**Razón**: Patrón oficial de Supabase para Next.js App Router. Tres clientes: browser, server, middleware.

## DEC-005: Zod para validación
**Fecha**: 2026-02-24
**Decisión**: Zod como librería única de validación (inputs, schemas IA, API responses).
**Razón**: Type-safe, composable, excelente DX con TypeScript.

## DEC-006: Auth email+password (no magic link)
**Fecha**: 2026-02-25
**Decisión**: Usar email+password como método principal de autenticación.
**Razón**: Más simple para MVP, no requiere configurar SMTP. Magic link se puede agregar después.

## DEC-007: Auto-create profile on signup via trigger
**Fecha**: 2026-02-25
**Decisión**: Trigger en `auth.users` que crea automáticamente un registro en `profiles`.
**Razón**: Garantiza que todo usuario tiene profile. El rol default es `municipio_user`; admins asignan roles manualmente.

## DEC-008: RLS helper functions (SECURITY DEFINER)
**Fecha**: 2026-02-25
**Decisión**: Funciones `auth_user_role()`, `auth_user_tenant_id()`, `auth_user_municipio_id()` con SECURITY DEFINER.
**Razón**: Simplifica policies RLS. SECURITY DEFINER permite acceder a `profiles` desde policies sin recursión.

## DEC-009: MGA template como JSONB (no tablas normalizadas)
**Fecha**: 2026-02-25
**Decisión**: Guardar la plantilla MGA como `etapas_json JSONB` en `mga_templates` (una fila por convocatoria).
**Razón**: La estructura de etapas/campos varía por convocatoria. JSONB permite flexibilidad total. Validamos con Zod en la app. Se puede migrar a tablas normalizadas si hay queries complejas.

## DEC-010: Editor de plantilla como client component
**Fecha**: 2026-02-25
**Decisión**: El editor de plantilla MGA es un client component (`"use client"`) con estado local y save explícito.
**Razón**: Manipulación interactiva de arrays anidados (etapas > campos) requiere estado mutable. Server actions no son prácticas para edición in-place. El save invoca un server action para persistir.

## DEC-011: Convocatoria auto-crea template vacío
**Fecha**: 2026-02-25
**Decisión**: Al crear una convocatoria, se inserta automáticamente un `mga_templates` con `etapas_json: []`.
**Razón**: Simplifica la relación 1:1 (convocatoria siempre tiene template). El entidad_admin lo llena después.
