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

## DEC-012: Submission data_json flat (campo_id → value)
**Fecha**: 2026-02-25
**Decisión**: `data_json` en submissions es un objeto plano `{ campo_id: string_value }` sin estructura por etapa.
**Razón**: Simplifica lectura/escritura. Los campos tienen IDs únicos globales. El progreso se calcula cruzando con la plantilla MGA.

## DEC-013: Autosave con state (no refs) — debounce 1.5s
**Fecha**: 2026-02-25
**Decisión**: Autosave usa estado React (`pendingFields`) en vez de refs, con debounce de 1.5 segundos vía useEffect.
**Razón**: ESLint React Compiler no permite acceso a refs durante render. El patrón state-based es igual de efectivo y pasa lint.

## DEC-014: Trigger para sync progress submissions → convocatoria_municipios
**Fecha**: 2026-02-25
**Decisión**: Un trigger PostgreSQL sincroniza `submissions.progress` a `convocatoria_municipios.progress` automáticamente.
**Razón**: La entidad consulta `convocatoria_municipios` para ver avance. Sincronizar vía trigger evita queries adicionales y mantiene consistencia.

## DEC-015: LLM Adapter pattern con factory function
**Fecha**: 2026-02-25
**Decisión**: Usar patrón adapter con interfaz `LlmAdapter` y factory `createLlmAdapter()` que selecciona OpenAI o Anthropic según env var `LLM_PROVIDER`.
**Razón**: Permite cambiar de proveedor LLM sin modificar código de negocio. OpenAI usa SDK oficial; Anthropic usa fetch directo para evitar dependencia adicional.

## DEC-016: Rate limiting via audit_logs count
**Fecha**: 2026-02-25
**Decisión**: Rate limiting simple: contar registros en `audit_logs` del usuario en el último minuto (máx 10).
**Razón**: No requiere infraestructura adicional (Redis, etc.). Suficiente para MVP. La tabla audit_logs ya existe para trazabilidad.

## DEC-017: Fallback graceful para respuestas LLM no conformes
**Fecha**: 2026-02-25
**Decisión**: Si el LLM devuelve JSON que no pasa Zod, intentar extraer campos individuales. Si devuelve texto plano, envolverlo como `suggested_text`.
**Razón**: Los LLMs no siempre respetan el schema exacto. Es mejor mostrar algo útil que fallar completamente.

## DEC-018: Asistente IA solo en campos textarea y text
**Fecha**: 2026-02-25
**Decisión**: El botón "Asistente IA" solo aparece en campos de tipo `textarea` y `text`, no en `number` o `date`.
**Razón**: Solo los campos de texto libre se benefician de sugerencias narrativas del LLM.
