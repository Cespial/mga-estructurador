# ADR-0002: Multi-tenancy via RLS en Supabase

## Estado
Aceptado

## Contexto
La plataforma sirve a múltiples entidades (ministerios/gobernaciones) que crean convocatorias. Los municipios deben ver solo sus datos. Se requiere aislamiento estricto.

## Decisión
Implementar multi-tenancy a nivel de base de datos usando Row Level Security (RLS) de PostgreSQL, nativo en Supabase.

### Patrón
- Cada tabla de negocio incluye `tenant_id` (referencia a `tenants`).
- Las policies RLS filtran por `tenant_id` del usuario autenticado (vía `profiles`).
- Municipios tienen filtros adicionales por `municipio_id`.
- `platform_admin` tiene bypass de RLS solo para soporte interno.

### Roles
- `platform_admin`: acceso total.
- `entidad_admin`: acceso a datos de su tenant.
- `municipio_user`: acceso a sus submissions y convocatorias asignadas.

## Alternativas consideradas
- **Multi-schema**: Un schema por tenant. Descartado: complejidad de gestión, no escala bien en Supabase.
- **Filtro en aplicación**: Filtrar en código. Descartado: inseguro, propenso a errores.

## Consecuencias
- Aislamiento fuerte a nivel de DB (no depende del código de la app).
- Cada nueva tabla requiere policies RLS (overhead de desarrollo).
- Requiere helper functions en SQL para obtener `tenant_id` y `role` del usuario.
