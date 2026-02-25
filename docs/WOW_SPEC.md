# WOW_SPEC -- Propuesta "Descrestar" para vender

Objetivo: que en 5-10 segundos alguien diga: "ok, esto es serio, se entiende y se siente premium".

## 1) WOW inmediato (primer pantallazo)
**Hero**
- Promesa clara: "Estructura, recibe, evalua y evidencia en PDF -- sin friccion".
- CTA 1: "Ver demo guiada"
- CTA 2: "Entrar" (login)
- Visual central: "Mapa del flujo" animado (3-5 pasos) con progreso.

**Efecto guau recomendado**
- Demo interactiva "modo vitrina":
  - Un mini-wizard con 2 etapas y 3 campos
  - Un scoring de rubrica que se recalcula
  - Un preview de PDF (mock) que se actualiza al final

## 2) Factor sorpresa (memorable, no infantil)
- "Reveal" de resultados: al finalizar la demo, aparece un "Resumen ejecutivo" (mock) + boton "Ver PDF".
- Microconfetti sutil o shimmer en el badge de score (respeta reduced motion).
- "Antes/Despues": un toggle que muestra respuesta cruda vs respuesta mejorada con IA (en demo con texto predefinido).

## 3) Prueba y credibilidad (para vender)
- Seccion "Auditable por diseno":
  - Rubrica ponderada + desglose
  - Export PDF
  - Historial/registro (si aplica)
- Seccion "Seguridad" (sin claims exagerados):
  - Roles, control de acceso, separacion por tenant (explicacion simple)

## 4) Copy y estructura recomendada de la landing
1. Hero + demo
2. Problema (dolores)
3. Solucion (como lo resuelve)
4. Flujo (Entidad -> Municipio -> Evaluacion)
5. Beneficios medibles (sin inventar metricas)
6. Evidencia (PDF / scoring / auditoria)
7. CTA (demo + contacto)

## 5) Reglas de implementacion
- Nada de assets enormes sin compresion.
- Animaciones ligeras, con fallback.
- No tocar dashboard business logic en esta wave salvo links/contextual help.
