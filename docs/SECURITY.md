# SECURITY — Modelo de seguridad

## Roles y permisos

| Rol              | Alcance                                    |
| ---------------- | ------------------------------------------ |
| platform_admin   | Todo (soporte interno)                     |
| entidad_admin    | Datos de su tenant (convocatorias, municipios, evaluaciones) |
| municipio_user   | Sus submissions + convocatoria asignada    |

## Row Level Security (RLS)

Todas las tablas con datos de negocio tienen RLS activado. Las policies siguen este patrón:

### Regla general
```sql
-- El usuario solo ve registros de su tenant
CREATE POLICY "tenant_isolation" ON tabla
  USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
```

### Municipio (más restrictivo)
```sql
-- municipio_user solo ve sus propias submissions
CREATE POLICY "municipio_own_submissions" ON submissions
  USING (
    municipio_id IN (
      SELECT municipio_id FROM profiles WHERE id = auth.uid()
    )
  );
```

## Amenazas identificadas

### 1. Prompt Injection
- **Riesgo**: Usuario inyecta instrucciones maliciosas en campos MGA que llegan al LLM.
- **Mitigación**:
  - System prompt con instrucciones estrictas y output schema fijo (Zod).
  - Separación clara entre instrucciones del sistema y datos del usuario.
  - No ejecutar código generado por el LLM.
  - Rate limiting por usuario/tenant.

### 2. Data Leakage Multi-tenant
- **Riesgo**: Un tenant accede a datos de otro tenant.
- **Mitigación**:
  - RLS en todas las tablas.
  - RAG filtrado por `convocatoria_id` (aislamiento de embeddings).
  - Queries server-side siempre pasan por Supabase client autenticado.
  - Nunca usar `service_role` key en el frontend.

### 3. Acceso no autorizado
- **Riesgo**: Usuario sin autenticación accede a rutas protegidas.
- **Mitigación**:
  - Middleware de Next.js verifica sesión en todas las rutas protegidas.
  - Supabase Auth con refresh automático de tokens.
  - Redirects a /login si no hay sesión válida.

### 4. Secrets en repositorio
- **Mitigación**:
  - `.env.example` sin valores reales.
  - `.env` y `.env.local` en `.gitignore`.
  - Variables sensibles solo en Vercel Environment Variables.
  - `SUPABASE_SERVICE_ROLE_KEY` solo en server-side.

## Rate Limiting (MVP)
- Endpoint IA: máx 10 requests/minuto por usuario.
- Implementación vía contador en tabla o middleware simple.
