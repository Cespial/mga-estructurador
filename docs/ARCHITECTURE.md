# ARCHITECTURE — Estructurador MGA por Convocatorias

## Diagrama de alto nivel

```
┌─────────────────────────────────────────────────────┐
│                    VERCEL                            │
│  ┌───────────────────────────────────────────────┐  │
│  │              Next.js 16 (App Router)           │  │
│  │                                               │  │
│  │  ┌─────────┐  ┌──────────┐  ┌─────────────┐  │  │
│  │  │  Pages   │  │  API      │  │  Middleware  │  │  │
│  │  │  (RSC +  │  │  Routes   │  │  (Auth      │  │  │
│  │  │  Client) │  │  (Server) │  │   Session)  │  │  │
│  │  └────┬─────┘  └────┬─────┘  └──────┬──────┘  │  │
│  │       │              │               │         │  │
│  │       └──────────────┼───────────────┘         │  │
│  │                      │                         │  │
│  │              ┌───────┴────────┐                │  │
│  │              │ Supabase Client│                │  │
│  │              │ (SSR + Browser)│                │  │
│  │              └───────┬────────┘                │  │
│  └──────────────────────┼────────────────────────┘  │
└─────────────────────────┼────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              │       SUPABASE        │
              │                       │
              │  ┌─────┐  ┌────────┐  │
              │  │ Auth │  │Postgres│  │
              │  │      │  │ + RLS  │  │
              │  └──────┘  │+pgvect│  │
              │            └────────┘  │
              │  ┌────────────────┐    │
              │  │    Storage     │    │
              │  │  (documentos)  │    │
              │  └────────────────┘    │
              └────────────────────────┘
                          │
              ┌───────────┴───────────┐
              │     LLM Provider      │
              │  (OpenAI / Anthropic) │
              │     via adapter       │
              └───────────────────────┘
```

## Módulos del frontend

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Rutas de autenticación (login, registro)
│   ├── (dashboard)/        # Layout protegido
│   │   ├── municipio/      # Vista municipio (wizard MGA, asistente)
│   │   ├── entidad/        # Vista entidad (convocatorias, monitoreo)
│   │   └── admin/          # Vista platform_admin
│   └── api/                # Route handlers (IA, webhooks)
├── lib/
│   ├── supabase/           # Clientes Supabase (browser, server, middleware)
│   ├── ai/                 # Adapter LLM + prompts + schemas
│   ├── validators/         # Schemas Zod compartidos
│   └── utils/              # Helpers generales
├── components/             # Componentes UI reutilizables
└── middleware.ts            # Middleware de sesión Supabase
```

## Modelo de datos (entidades clave)

```
tenants ──< convocatorias ──< mga_templates
   │              │
   │              ├──< convocatoria_municipios >── municipios
   │              │
   │              ├──< submissions ──< evaluations
   │              │
   │              ├──< documents ──< embeddings
   │              │
   │              └──< rubrics
   │
   └──< profiles (users via supabase auth)

audit_logs (transversal, todas las acciones)
```

## Multi-tenancy

- Cada `tenant` representa una entidad (ministerio/gobernación).
- Aislamiento vía `tenant_id` en tablas + RLS policies.
- `municipio_user` accede solo a datos de sus convocatorias asignadas.
- `entidad_admin` accede solo a datos de su tenant.
- `platform_admin` accede a todo (soporte interno).
