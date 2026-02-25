# Estructurador MGA por Convocatorias

Plataforma web para ayudar a **municipios** a estructurar proyectos bajo la Metodología General Ajustada (MGA), en el marco de **convocatorias** creadas por entidades gubernamentales (ministerios/gobernaciones).

## Stack

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- **Auth/DB/Storage**: Supabase (Auth + Postgres + RLS + Storage)
- **Hosting**: Vercel
- **IA**: Asistente contextual con RAG por convocatoria
- **Validación**: Zod

## Desarrollo local

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase

# Correr en desarrollo
npm run dev
```

## Scripts disponibles

| Comando             | Descripción                    |
| ------------------- | ------------------------------ |
| `npm run dev`       | Servidor de desarrollo         |
| `npm run build`     | Build de producción            |
| `npm run start`     | Servidor de producción         |
| `npm run lint`      | ESLint                         |
| `npm run typecheck` | Verificación de tipos (strict) |
| `npm test`          | Tests                          |

## Documentación

- [STATUS](docs/STATUS.md) — Estado actual del proyecto
- [BACKLOG](docs/BACKLOG.md) — Lista priorizada de trabajo
- [ARCHITECTURE](docs/ARCHITECTURE.md) — Arquitectura del sistema
- [SECURITY](docs/SECURITY.md) — Modelo de seguridad y RLS
- [DECISIONS](docs/DECISIONS.md) — Decisiones técnicas
- [AI_PROMPTS](docs/AI_PROMPTS.md) — Prompts y schemas del asistente IA
- [QA](docs/QA.md) — Estrategia de pruebas
- [DEMO_SCRIPT](docs/DEMO_SCRIPT.md) — Guion de demo
