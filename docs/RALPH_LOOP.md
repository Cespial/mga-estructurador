# RALPH_LOOP (Modo de trabajo operativo)

Este repositorio se ejecuta en iteraciones cortas, con Git como memoria y trazabilidad total.

## Principios no negociables
- Cambios pequenos, verificables, con rollback facil.
- Cada iteracion debe cerrar el ciclo: **Plan -> Implementacion -> Tests -> Evaluacion -> Commit -> Log**.
- Sin secretos: nunca se copian llaves/tokens en el repo ni en docs. Todo va por env vars.
- No big-bang refactors: si el cambio es grande, se parte en sub-iteraciones con "Definition of Done" medible.

## Definiciones
- **Wave**: bloque de trabajo con entregables medibles (ver `docs/WAVES.md`).
- **Iteracion**: unidad minima que termina en commit (idealmente 1-5 archivos por iteracion, salvo assets).

## Loop por iteracion (checklist)
1) **Plan**
   - Declarar objetivo concreto (1-3 lineas).
   - Alcance exacto: rutas/archivos tocados.
   - Supuestos y riesgos (max 5 bullets).
2) **Implementar**
   - Dif minimo.
   - Logging/observabilidad si aplica (sin PII).
3) **Probar**
   - Correr quality gates relevantes (ver `docs/QUALITY_GATES.md`).
4) **Evaluar**
   - Cumple DoD de la wave?
   - Rompe algo? Hay regresiones UX?
5) **Commit**
   - Mensaje: `feat:` / `fix:` / `docs:` / `chore:` + referencia a wave/iteracion.
6) **Log**
   - Registrar en `docs/ITERATION_LOG.md` (una entrada por iteracion).

## Stop conditions (cuando parar y pedir decision)
- Ambiguedad de producto que afecta UX/venta (p.ej., copy final, pricing, claims).
- Se requiere acceso a credenciales/servicios no disponibles.
- Se detecta riesgo de seguridad/PII o necesidad de rotacion de secretos.
- Falla repetida de gates sin causa clara tras 2 intentos (documentar y bloquear).

## Convenciones Git
- Rama sugerida: `wave/<id>-<slug>` (ej: `wave/w1-manual-base`).
- Commits pequenos y frecuentes.
- Si algo queda a medias: `WIP` no se mergea; se revierte o se completa con gates.

## Trazabilidad minima
- Cada wave tiene DoD en `docs/WAVES.md`.
- Cada iteracion se registra en `docs/ITERATION_LOG.md`.
- Bloqueos y decisiones en `docs/BLOCKERS.md`.
