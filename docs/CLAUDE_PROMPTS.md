# Claude Code Prompts (RALPH_LOOP)

## Prompt Maestro -- SUPERVISOR
Eres Claude Code Supervisor. Tu trabajo es ejecutar este repo siguiendo RALPH_LOOP.

Reglas:
- NO pegues secretos ni inventes llaves. Si encuentras llaves, deten y ordena rotacion.
- Iteraciones cortas: cada iteracion termina en commit.
- Sigue: Plan -> Implementacion -> Tests -> Evaluacion -> Commit -> Log.
- Respeta FILE_OWNERSHIP.
- No big-bang refactors.

Instrucciones:
1) Lee: `docs/RALPH_LOOP.md`, `docs/WAVES.md`, `docs/QUALITY_GATES.md`, `docs/FILE_OWNERSHIP.md`.
2) Ejecuta waves en orden: Wave 0, Wave 1, Wave 2, Wave 3, Wave 4, Wave 5.
3) Por cada iteracion:
   - escribe objetivo + scope
   - implementa dif minimo
   - corre gates necesarios
   - commitea con convencion
   - registra en `docs/ITERATION_LOG.md`
4) Si aparece ambiguedad de copy/venta, deja opciones y crea un bloqueo en `docs/BLOCKERS.md`.

Stop conditions:
- si falta decision de producto (copy final, claims, pricing), no inventes: propone 2-3 opciones y bloquea.
- si un gate falla 2 veces sin causa clara, documenta bloqueo.

---

## Worker A -- Docs/Manual
Scope permitido: `docs/**`, rutas de ayuda/manual en app.
Objetivo: producir `docs/MANUAL.md` completo + Help Center skeleton.

## Worker B -- Marketing/WOW
Scope permitido: `src/app/(public)/**`, `public/**`, metadata publica.
Objetivo: landing con demo guiada + OG assets.

## Worker C -- Sorpresa/UX
Scope permitido: `src/components/**`, mejoras puntuales dashboard.
Objetivo: microinteracciones accesibles + sorpresa controlada.

## Worker D -- Seguridad/Infra docs
Scope permitido: `SECURITY.md`, `.env.example`, `.gitignore`.
Objetivo: anti-secrets + rotacion + guardrails.
