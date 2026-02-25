# QA — Estrategia de pruebas

## Comandos

```bash
npm run lint       # ESLint (0 errores requerido)
npm run typecheck  # TypeScript strict (0 errores requerido)
npm test           # Tests unitarios/integración (pendiente)
npm run build      # Verifica que el build compile
```

## Niveles de prueba

### 1. Estático (siempre)
- TypeScript strict mode (`noEmit`)
- ESLint con config de Next.js
- Zod para validación runtime de schemas

### 2. Unitario (Wave 1+)
- Vitest o Jest (por definir)
- Cobertura mínima: validators, helpers, schemas

### 3. Integración (Wave 2+)
- API routes con mocks de Supabase
- Componentes con Testing Library (si aplica)

### 4. E2E (Wave 3+)
- Playwright (si aplica, para demo script)
- Smoke test: login → navegar → crear → guardar

### 5. Seguridad (continuo)
- Verificación manual de RLS (queries cross-tenant)
- No secrets en repo (`git log --all -p | grep -i key`)
- Prompt injection tests en asistente IA

## Quality Gates por iteración

Antes de cada commit:
- [x] `npm run lint` OK
- [x] `npm run typecheck` OK
- [ ] `npm test` OK (cuando existan tests)
- [ ] Rutas críticas navegables (smoke test manual)
- [ ] RLS activa (cuando haya auth)
- [ ] Sin secretos en repo
