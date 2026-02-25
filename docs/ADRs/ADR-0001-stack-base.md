# ADR-0001: Stack base del proyecto

## Estado
Aceptado

## Contexto
Necesitamos definir el stack tecnológico para un MVP de plataforma web que ayude a municipios a estructurar proyectos MGA en el marco de convocatorias gubernamentales.

## Decisión
- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- **Auth/DB/Storage**: Supabase (Auth + Postgres + Storage + RLS)
- **Hosting**: Vercel (Preview Deployments + Prod)
- **Repositorio**: GitHub (PRs + Actions)
- **Validación**: Zod
- **IA**: Adapter pattern para múltiples proveedores LLM
- **Vectorización**: pgvector en Supabase (por defecto)

## Consecuencias
- Stack moderno con excelente DX y deploy rápido.
- Supabase provee auth + db + storage + realtime en un solo servicio.
- RLS nativo en Postgres para multi-tenancy.
- pgvector permite RAG sin infraestructura adicional.
- Vercel optimizado para Next.js (zero-config deploys).
- El adapter pattern para LLM permite cambiar proveedor sin refactor.
