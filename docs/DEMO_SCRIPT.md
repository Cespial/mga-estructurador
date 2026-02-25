# DEMO SCRIPT — Estructurador MGA por Convocatorias

> Duración estimada: **8-10 minutos**
> Requisitos: seed data cargada, 3 usuarios creados, LLM API key configurada

---

## Preparación previa (antes de iniciar demo)

1. Ejecutar seed: `supabase db reset` o cargar `supabase/seed/seed.sql`
2. Crear 3 usuarios en Supabase Auth (o vía signup en la app):
   - `admin@mga.local` / `Demo1234!` → platform_admin
   - `entidad@mga.local` / `Demo1234!` → entidad_admin (Ministerio de Transporte)
   - `municipio1@mga.local` / `Demo1234!` → municipio_user (San José del Guaviare)
3. Ejecutar profile updates (ver comentarios al final de `seed.sql`)
4. Verificar que `OPENAI_API_KEY` está configurada en `.env.local`
5. Tener abierto: navegador con 2 pestañas (entidad + municipio)

---

## Acto 1 — Contexto y problema (1 min)

**Narración:**
> "En Colombia, los municipios deben estructurar proyectos de inversión pública usando la Metodología General Ajustada (MGA). Muchos municipios pequeños no tienen la capacidad técnica para hacerlo bien. Las entidades del gobierno central lanzan convocatorias, pero no pueden monitorear el avance en tiempo real ni dar retroalimentación temprana."

> "Hoy les presento el Estructurador MGA — una plataforma que conecta entidades con municipios, les ayuda con IA a llenar los formularios MGA, y permite evaluación automática con rúbricas."

---

## Acto 2 — Rol entidad: configuración de convocatoria (2 min)

**Pestaña 1:** Login como `entidad@mga.local`

1. **Dashboard entidad** → Mostrar la convocatoria "Mejoramiento de vías terciarias 2026"
2. Click en la convocatoria → **Página de detalle**
   - Señalar las 5 tarjetas: Plantilla MGA (4 etapas), Municipios (2), Avance promedio, Documentos, Rúbrica
   - "Todo se configura desde aquí"

3. **Plantilla MGA** → Click en "Plantilla MGA"
   - Mostrar las 4 etapas: Identificación, Preparación, Evaluación, Programación
   - Abrir una etapa, mostrar los campos (tipo, descripción, requerido)
   - "La entidad define qué debe llenar cada municipio. Completamente configurable."
   - Volver

4. **Municipios asignados** → Click en "Municipios"
   - Mostrar San José del Guaviare y Puerto Asís asignados
   - "Se pueden agregar o remover municipios en cualquier momento"
   - Volver

---

## Acto 3 — Rol municipio: diligenciar MGA con IA (3 min)

**Pestaña 2:** Login como `municipio1@mga.local`

1. **Dashboard municipio** → Ver convocatoria asignada, click para entrar
2. **Detalle convocatoria** → Mostrar etapas MGA con progreso (datos pre-cargados del seed)
3. Click **"Continuar diligenciamiento"** → Wizard

4. **Wizard — Etapa 1: Identificación**
   - Mostrar sidebar con las 4 etapas y badges de progreso
   - Mostrar campos ya llenados por el seed
   - Editar campo "Problema central" → Mostrar el **autosave** (indicador "Guardado")

5. **Asistente IA** (momento clave de la demo)
   - Click botón **"Asistente IA"** en el campo "Problema central"
   - Esperar respuesta (~3-5 seg)
   - Mostrar el panel de respuesta:
     - **Texto sugerido**: narración mejorada del problema
     - **Puntos clave**: bullets resumidos
     - **Riesgos**: identificados por la IA
     - **Preguntas**: sobre información faltante
     - **Citaciones**: si hay documentos procesados (RAG)
   - Click **"Usar sugerencia"** → texto se copia al campo
   - "La IA no inventa datos — trabaja con el contexto de la convocatoria y los documentos oficiales"

6. Navegar a Etapa 2, mostrar que el progreso se actualiza en tiempo real

---

## Acto 4 — Documentos + RAG (1.5 min)

**Pestaña 1:** Volver a entidad

1. Click **"Documentos"** en la convocatoria
2. Subir un PDF de ejemplo (cualquier documento técnico de infraestructura vial)
3. Click **"Procesar"** → Mostrar estado: "Procesando" → "Listo"
   - "El sistema extrae texto, lo divide en fragmentos y genera embeddings para búsqueda semántica"
   - Señalar el conteo de chunks generados

4. **Volver al municipio** (Pestaña 2)
   - Usar el Asistente IA de nuevo en un campo
   - Mostrar las **citaciones** que ahora aparecen referenciando el documento subido
   - "Cada sugerencia ahora está respaldada por los documentos oficiales de la convocatoria"

---

## Acto 5 — Rúbrica + Evaluación automática (2 min)

**Pestaña 1:** Entidad

1. Click **"Rúbrica"** → Editor de rúbrica
   - Si el seed ya cargó la rúbrica, mostrar los criterios existentes
   - Si no, agregar un criterio en vivo:
     - Seleccionar campo "Problema central" del dropdown
     - Peso: 0.30
     - Descripción: "Claridad y pertinencia del problema identificado"
     - Mostrar los 4 niveles (Insuficiente → Excelente) con descripciones
   - "La rúbrica define objetivamente cómo se evalúa cada campo"
   - Guardar

2. Click **"Monitoreo"** → Tabla de monitoreo
   - Mostrar los 2 municipios con su progreso por etapa (pills de %)
   - Click **"Evaluar"** en Etapa 1 de San José del Guaviare
   - Esperar resultado (~5-10 seg — el LLM evalúa cada criterio)
   - Mostrar score badge (ej: 72pts en amarillo)
   - "La evaluación es automática, basada en la rúbrica que definimos"

3. **Volver al municipio** (Pestaña 2)
   - En la página de detalle de la convocatoria
   - Mostrar que ahora aparece el score y las **recomendaciones**
   - "El municipio recibe feedback específico: qué mejorar y cómo"

---

## Acto 6 — Resumen y cierre (0.5 min)

**Narración:**
> "En resumen, el Estructurador MGA permite:"
> 1. "A las entidades: definir convocatorias configurables, subir documentos de referencia, y evaluar con rúbricas automáticas"
> 2. "A los municipios: diligenciar proyectos MGA con asistencia de IA respaldada por documentos oficiales"
> 3. "A ambos: monitorear avance en tiempo real con feedback accionable"

> "Stack técnico: Next.js 16, Supabase con Row Level Security en 12 tablas, pgvector para RAG, y modelos de lenguaje intercambiables. Deployable en Vercel + Supabase en minutos."

---

## Preguntas frecuentes (backup)

| Pregunta | Respuesta |
|----------|-----------|
| ¿Qué LLM usa? | OpenAI GPT-4o-mini por defecto, adapter pattern permite cambiar a Anthropic Claude |
| ¿Los datos están aislados? | Sí, Row Level Security en las 12 tablas. Cada entidad solo ve sus datos |
| ¿Funciona sin LLM? | Todo excepto el asistente IA y las evaluaciones automáticas |
| ¿Se puede personalizar la plantilla? | Totalmente. Cada convocatoria tiene su propia plantilla MGA configurable |
| ¿Cómo se manejan los documentos? | Upload → chunking → embeddings → búsqueda semántica aislada por convocatoria |
| ¿Cuánto cuesta el LLM? | GPT-4o-mini: ~$0.001 por sugerencia, ~$0.005 por evaluación de etapa |

---

## Credenciales demo

| Rol | Email | Password |
|-----|-------|----------|
| Platform Admin | `admin@mga.local` | `Demo1234!` |
| Entidad Admin | `entidad@mga.local` | `Demo1234!` |
| Municipio User (San José) | `municipio1@mga.local` | `Demo1234!` |
