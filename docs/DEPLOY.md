# DEPLOY — Checklist de despliegue a producción

## 1. Supabase (backend)

### 1.1 Crear proyecto
- [ ] Crear nuevo proyecto en [supabase.com](https://supabase.com)
- [ ] Anotar: **Project URL**, **anon key**, **service_role key**
- [ ] Seleccionar región cercana (us-east-1 o sa-east-1 para Colombia)

### 1.2 Ejecutar migraciones
```bash
# Instalar Supabase CLI si no está
npm install -g supabase

# Vincular al proyecto
supabase link --project-ref <PROJECT_REF>

# Ejecutar migraciones en orden
supabase db push
```

Migraciones (6 archivos):
1. `00001_auth_tenants_profiles.sql` — Auth, tenants, profiles, trigger
2. `00002_convocatorias_mga.sql` — Convocatorias, mga_templates, convocatoria_municipios
3. `00003_submissions.sql` — Submissions, progress trigger
4. `00004_ai_audit.sql` — Audit logs
5. `00005_documents_embeddings.sql` — Documents, embeddings, pgvector, match_embeddings RPC
6. `00006_rubrics_evaluations.sql` — Rubrics, evaluations

### 1.3 Verificar extensiones
En SQL Editor, confirmar:
```sql
SELECT * FROM pg_extension WHERE extname IN ('pgvector', 'uuid-ossp');
```

### 1.4 Crear Storage bucket
```sql
-- En SQL Editor (o desde el dashboard Storage)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'convocatoria-docs',
  'convocatoria-docs',
  false,
  10485760, -- 10MB
  '{"application/pdf","text/plain","application/vnd.openxmlformats-officedocument.wordprocessingml.document"}'
);
```

Crear policy de Storage en el dashboard:
- **SELECT**: authenticated users can read files from their tenant's convocatorias
- **INSERT**: entidad_admin can upload
- **DELETE**: entidad_admin can delete

### 1.5 Cargar datos semilla
```bash
# Opción A: desde CLI
supabase db reset --linked  # ejecuta migraciones + seed

# Opción B: manual
# Copiar contenido de supabase/seed/seed.sql en SQL Editor y ejecutar
```

### 1.6 Crear usuarios demo
En Supabase Dashboard → Authentication → Users:

| Email | Password | Metadata |
|-------|----------|----------|
| `admin@mga.local` | `Demo1234!` | `{"full_name": "Admin Demo"}` |
| `entidad@mga.local` | `Demo1234!` | `{"full_name": "Entidad Demo"}` |
| `municipio1@mga.local` | `Demo1234!` | `{"full_name": "San José del Guaviare"}` |

Luego ejecutar en SQL Editor:
```sql
UPDATE profiles SET role = 'platform_admin' WHERE email = 'admin@mga.local';
UPDATE profiles SET role = 'entidad_admin', tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE email = 'entidad@mga.local';
UPDATE profiles SET role = 'municipio_user', tenant_id = 'a0000000-0000-0000-0000-000000000001', municipio_id = 'b0000000-0000-0000-0000-000000000001' WHERE email = 'municipio1@mga.local';
```

### 1.7 Verificar RLS
```sql
-- Debe retornar 12 tablas con policies habilitadas
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;
```

---

## 2. Vercel (frontend)

### 2.1 Crear proyecto
- [ ] Conectar repositorio GitHub: `Cespial/mga-estructurador`
- [ ] Framework: Next.js (auto-detected)
- [ ] Root directory: `/` (default)
- [ ] Build command: `npm run build` (default)
- [ ] Output directory: `.next` (default)

### 2.2 Variables de entorno
En Vercel → Settings → Environment Variables:

| Variable | Valor | Scope |
|----------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (anon key) | All |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (service role) | Production + Preview |
| `LLM_PROVIDER` | `openai` | All |
| `OPENAI_API_KEY` | `sk-...` | Production + Preview |
| `OPENAI_MODEL` | `gpt-4o-mini` | All |
| `NEXT_PUBLIC_APP_URL` | `https://tu-dominio.vercel.app` | All |

**Opcional (si se usa Anthropic):**
| Variable | Valor |
|----------|-------|
| `LLM_PROVIDER` | `anthropic` |
| `ANTHROPIC_API_KEY` | `sk-ant-...` |
| `ANTHROPIC_MODEL` | `claude-sonnet-4-20250514` |

### 2.3 Deploy
```bash
# Opción A: push a main (auto-deploy)
git push origin main

# Opción B: deploy manual
npx vercel --prod
```

### 2.4 Dominio personalizado (opcional)
- [ ] En Vercel → Settings → Domains → agregar dominio
- [ ] Configurar DNS (CNAME → `cname.vercel-dns.com`)
- [ ] Actualizar `NEXT_PUBLIC_APP_URL` en env vars
- [ ] Actualizar Supabase → Auth → URL Configuration → Site URL

---

## 3. Verificación post-deploy

### 3.1 Health check
- [ ] Abrir URL → redirige a `/login`
- [ ] Login con `entidad@mga.local` → dashboard entidad visible
- [ ] Login con `municipio1@mga.local` → dashboard municipio visible
- [ ] Convocatoria "Mejoramiento de vías terciarias" aparece en ambos dashboards

### 3.2 Funcionalidad
- [ ] Crear nueva convocatoria → se guarda correctamente
- [ ] Editar plantilla MGA → agregar/quitar campos funciona
- [ ] Wizard MGA → autosave funciona (ver indicador "Guardado")
- [ ] Asistente IA → botón responde con sugerencia (requiere API key válida)
- [ ] Upload documento → procesar → status "Listo"
- [ ] Rúbrica → crear criterios + guardar
- [ ] Monitoreo → botón "Evaluar" genera score
- [ ] Municipio ve evaluación + recomendaciones

### 3.3 Seguridad
- [ ] Usuario no autenticado no puede acceder a `/dashboard/*`
- [ ] Municipio no puede acceder a rutas `/dashboard/entidad/*`
- [ ] Entidad no puede acceder a rutas `/dashboard/municipio/*`
- [ ] API `/api/ai/assist` rechaza requests sin sesión
- [ ] RLS: un tenant no ve datos de otro tenant

---

## 4. Monitoreo post-launch

- **Vercel**: Deployments tab → logs de build y runtime
- **Supabase**: Database → Logs, Auth → Logs
- **LLM costs**: Revisar dashboard de OpenAI/Anthropic para uso de tokens
- **Storage**: Supabase Storage → verificar tamaño del bucket

---

## Troubleshooting

| Problema | Solución |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` not found | Verificar que las env vars están en Vercel (no solo .env.local) |
| Auth redirect loop | Verificar Site URL en Supabase Auth → URL Configuration |
| pgvector not available | Ejecutar `CREATE EXTENSION IF NOT EXISTS vector;` en SQL Editor |
| Storage upload falla | Verificar que el bucket `convocatoria-docs` existe y tiene policies |
| AI assist timeout | Verificar `OPENAI_API_KEY` y que el modelo existe. Vercel tiene timeout de 60s en serverless |
| Embeddings fail | Verificar `OPENAI_API_KEY` (embeddings siempre usa OpenAI, no Anthropic) |
