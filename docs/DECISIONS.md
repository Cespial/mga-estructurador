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
