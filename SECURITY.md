# SECURITY (Zero-Secrets)

## Regla 1: Nunca pegar llaves en chats, issues o commits
Si una llave se expone:
1) Revocar/rotar inmediatamente.
2) Reemplazar en Vercel/CI/local.
3) Revisar historial: commits, PRs, logs, capturas.
4) Documentar en `docs/BLOCKERS.md` (sin pegar la llave).

## Variables de entorno
- Produccion: Vercel Environment Variables.
- Local: `.env.local` (NO se comitea).

## Git hygiene
Recomendado:
- Asegurar `.env.local` en `.gitignore`.
- Reglas de "secret scanning" (GitHub) y/o pre-commit que bloquee patrones:
  - `sk-`
  - `api_key`
  - `BEGIN PRIVATE KEY`

## Logging seguro
- No loggear headers de auth.
- No loggear payloads con PII.
- Errores: mensajes genericos hacia UI; detalle solo server-side y sanitizado.

## Checklist antes de merge
- [ ] `git diff` sin secretos/patrones sensibles
- [ ] `npm run lint && npm run typecheck && npm run build`
- [ ] E2E si hubo cambios en flujos
