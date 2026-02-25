# QUALITY_GATES

Estos gates deben correrse por wave e idealmente por iteracion.

## Gates obligatorios (siempre)
- `npm run lint`
- `npm run typecheck`
- `npm run build`

## Gates E2E (cuando toque UI/flows)
- `npm run test:e2e` (o el comando real del repo)
- Requisito: sin flakes; si hay flakes, documentar y aislar.

## Gates de seguridad (siempre antes de merge a main)
- No secretos en cambios:
  - revisar `git diff` por patrones `sk-`, `api_key`, `BEGIN PRIVATE KEY`, etc.
- `.env.local` nunca se comitea.
- Headers/auth: no loggear tokens, ni payloads sensibles.

## Gates de UX/a11y (cuando toque frontend)
- Navegacion teclado: tab/shift+tab, escape en dialogs.
- `prefers-reduced-motion` respetado en animaciones WOW.
- No texto critico solo en color.

## Gates de performance (cuando toque landing/marketing)
- Evitar assets pesados sin compresion.
- Cargar imagenes con `next/image`.
- Animaciones: preferir CSS/Framer Motion con limites.

## Stop conditions de calidad
- Si `build` falla: NO avanzar de wave.
- Si hay regresion en flows clave (wizard/monitoreo/documentos): revertir o fix inmediato.
