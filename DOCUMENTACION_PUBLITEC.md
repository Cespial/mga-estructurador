# PuBlitec — Plataforma de Gestion de Convocatorias con Inteligencia Artificial

## Documento Tecnico Integral

---

## 1. Resumen Ejecutivo

**PuBlitec** es una plataforma web que digitaliza y potencia con inteligencia artificial el ciclo completo de convocatorias publicas en Colombia. Conecta a **entidades** (ministerios, gobernaciones, fondos de inversion) con **municipios** para la formulacion, evaluacion y seguimiento de proyectos de inversion publica bajo la **Metodologia General Ajustada (MGA)** del Departamento Nacional de Planeacion (DNP).

### Problema que resuelve

Los municipios colombianos — especialmente los de categoria 5 y 6 — enfrentan barreras criticas para acceder a recursos de inversion publica:

1. **Complejidad tecnica**: La metodologia MGA exige conocimientos especializados en formulacion de proyectos (arboles de problemas, marcos logicos, analisis de alternativas) que muchos equipos municipales no poseen.
2. **Fragmentacion del proceso**: Las convocatorias se gestionan con formularios en papel, correos electronicos y hojas de calculo, sin trazabilidad ni estandarizacion.
3. **Evaluacion subjetiva**: Los criterios de evaluacion varian entre evaluadores y la retroalimentacion es limitada, lo que impide a los municipios mejorar sus propuestas.
4. **Desconexion temporal**: No existe retroalimentacion en tiempo real. Los municipios solo saben el resultado semanas o meses despues del cierre.

### Solucion

PuBlitec automatiza el ciclo completo:

```
Entidad crea convocatoria → Municipio estructura proyecto con IA →
IA pre-evalua en tiempo real → Municipio mejora y envia →
Entidad evalua formalmente → Reportes PDF/Excel automaticos
```

La inteligencia artificial (Claude de Anthropic) asiste en cada paso: genera borradores, sugiere mejoras, identifica riesgos, pre-evalua contra rubrica, y produce reportes ejecutivos automaticos.

---

## 2. Arquitectura del Sistema

### 2.1 Stack Tecnologico

| Capa | Tecnologia | Version | Proposito |
|------|-----------|---------|-----------|
| **Frontend** | Next.js (App Router) | 16.1.6 | Framework full-stack con Server Components |
| **UI** | React | 19.2.4 | Componentes reactivos |
| **Estilos** | Tailwind CSS | 4.2.1 | Sistema de diseno con tokens semanticos |
| **Animaciones** | Framer Motion | 12.34 | Transiciones y micro-interacciones |
| **Formularios** | React Hook Form + Zod | 7.71 / 4.3 | Validacion de formularios con esquemas tipados |
| **Graficos** | Recharts | 3.7.0 | Dashboards y visualizacion de datos |
| **Base de datos** | Supabase (PostgreSQL) | — | DB relacional con RLS, Auth, Storage, pgvector |
| **Autenticacion** | Supabase Auth | — | Email + password, sesiones con cookies |
| **IA / LLM** | Anthropic Claude | claude-sonnet-4-6 | Generacion de texto, evaluacion, analisis |
| **Embeddings** | Voyage AI | — | Vectorizacion de documentos para RAG |
| **Email** | Resend | 6.9.2 | Notificaciones transaccionales |
| **PDF** | jsPDF + AutoTable | 4.2 / 5.0 | Generacion de reportes PDF |
| **Excel** | ExcelJS | 4.4.0 | Generacion de reportes Excel |
| **Hosting** | Vercel | — | Deploy automatico con serverless functions |
| **Lenguaje** | TypeScript (strict) | 5.9.3 | Tipado estatico en todo el proyecto |
| **Testing** | Vitest | 4.0.18 | Tests unitarios |

### 2.2 Diagrama de Arquitectura

```
                    ┌─────────────────────────────┐
                    │         VERCEL               │
                    │    (Next.js 16 App Router)   │
                    │                              │
                    │  ┌─────────┐  ┌───────────┐ │
                    │  │  Pages  │  │ API Routes│ │
                    │  │ (SSR +  │  │(Serverless│ │
                    │  │  RSC)   │  │Functions) │ │
                    │  └────┬────┘  └─────┬─────┘ │
                    │       │             │        │
                    │  ┌────┴─────────────┴────┐   │
                    │  │     Middleware         │   │
                    │  │  (Auth + Session)      │   │
                    │  └───────────┬────────────┘   │
                    └─────────────┼─────────────────┘
                                  │
                    ┌─────────────┼─────────────────┐
                    │             ▼                  │
                    │      SUPABASE                  │
                    │  ┌──────────────────┐          │
                    │  │   PostgreSQL     │          │
                    │  │  + pgvector      │          │
                    │  │  + RLS Policies  │          │
                    │  │  + Triggers      │          │
                    │  └──────────────────┘          │
                    │  ┌──────────┐ ┌────────────┐  │
                    │  │   Auth   │ │  Storage   │  │
                    │  │(Sessions)│ │(Documentos)│  │
                    │  └──────────┘ └────────────┘  │
                    └───────────────────────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                    │
        ┌─────▼──────┐    ┌──────▼───────┐    ┌──────▼──────┐
        │ Anthropic   │    │  Voyage AI   │    │   Resend    │
        │ Claude API  │    │ (Embeddings) │    │  (Email)    │
        │ (LLM)       │    │              │    │             │
        └─────────────┘    └──────────────┘    └─────────────┘
```

### 2.3 Modelo de Datos

La base de datos consta de **25 migraciones** que definen las siguientes tablas principales:

#### Tablas Nucleares

| Tabla | Proposito | Campos Clave |
|-------|----------|--------------|
| `profiles` | Usuarios del sistema | id, email, role (platform_admin, entidad_admin, municipio_user), tenant_id, municipio_id |
| `tenants` | Entidades gubernamentales | id, name, slug |
| `municipios` | Catalogo de municipios colombianos | id, codigo_dane, nombre, departamento |
| `organizations` | Organizaciones (entidad o municipio) | id, name, type, nit, municipality, department |

#### Tablas de Convocatorias

| Tabla | Proposito | Campos Clave |
|-------|----------|--------------|
| `convocatorias` | Convocatorias con plantilla MGA | id, tenant_id, nombre, estado, fecha_cierre |
| `convocatorias_v2` | Convocatorias con formulario dinamico | id, organization_id, name, status, form_schema (JSONB) |
| `mga_templates` | Plantilla MGA (etapas + campos) | id, convocatoria_id, etapas_json (JSONB) |
| `rubrics` / `rubrics_v2` | Rubricas de evaluacion | criterios con pesos, niveles de scoring (1-4) |
| `rubric_criteria` | Criterios individuales de rubrica | criterion_name, max_score, weight, evaluation_guide |
| `convocatoria_municipios` | Asignacion municipio-convocatoria | progress (0-100%), estado |
| `convocatoria_stages` | Etapas temporales de convocatoria | start_date, end_date, status |
| `document_requirements` | Documentos requeridos por convocatoria | name, required, accepted_formats |

#### Tablas de Proyectos y Submissions

| Tabla | Proposito | Campos Clave |
|-------|----------|--------------|
| `projects` | Proyectos (esquema v2) | id, convocatoria_id, organization_id, status, budget_requested |
| `project_forms` | Datos de formulario por paso | step_number, form_data (JSONB), ai_suggestions, completed |
| `submissions` | Submissions MGA (esquema legacy) | data_json, progress, status, locked, submitted_at |
| `submission_documents` | Documentos adjuntos del municipio | file_name, storage_path, ai_validation |
| `field_changes` | Historial de cambios por campo | old_value, new_value, changed_by, source |

#### Tablas de Evaluacion

| Tabla | Proposito | Campos Clave |
|-------|----------|--------------|
| `evaluations` | Evaluaciones formales | scores_json, total_score, max_score, recomendaciones |
| `project_scores` | Scores de proyecto (v2) | evaluator_type (ai/human), total_score, ai_summary |
| `criteria_scores` | Desglose por criterio | score, justification, ai_rationale |
| `scoring_jobs` | Cola de procesamiento de scoring | status, engine_version, error_message |

#### Tablas de Comunicacion y Colaboracion

| Tabla | Proposito | Campos Clave |
|-------|----------|--------------|
| `field_comments` | Comentarios por campo (entidad-municipio) | resolved, resolved_note, blocking |
| `internal_notes` | Notas internas del equipo | campo_id, content, resolved |
| `announcements` | Anuncios de convocatoria | title, body, pinned |
| `direct_messages` | Chat entidad-municipio | sender_id, content, thread_id |
| `revision_requests` | Solicitudes de revision | campos[], message, deadline, round, status |
| `notifications` | Notificaciones del sistema | type, title, body, read |

#### Tablas de IA y Documentos

| Tabla | Proposito | Campos Clave |
|-------|----------|--------------|
| `documents` | Documentos de referencia (convocatoria) | file_name, file_path, status |
| `embeddings` | Chunks vectorizados para RAG | chunk_text, embedding (pgvector), document_id |
| `project_embeddings` | Embeddings de proyectos | project_id, campo_id, embedding |
| `ai_chat_messages` | Historial de chat con IA | role, content, step_number |
| `audit_logs` | Registro de todas las llamadas IA | action, prompt_hash, response_json, duration_ms |

#### Tablas de Productividad

| Tabla | Proposito | Campos Clave |
|-------|----------|--------------|
| `project_templates` | Plantillas reutilizables | data_snapshot, tags, source_submission_id |
| `text_snippets` | Bloques de texto frecuentes | label, content, tags |

### 2.4 Seguridad — Row Level Security (RLS)

Todas las tablas tienen RLS habilitado con politicas que garantizan aislamiento multi-tenant:

- **platform_admin**: Acceso total a todas las tablas
- **entidad_admin**: Solo ve datos de su tenant (convocatorias propias, submissions recibidas)
- **municipio_user**: Solo ve convocatorias asignadas y sus propias submissions

Funciones auxiliares de seguridad (SECURITY DEFINER):
- `auth_user_role()` — Retorna el rol del usuario autenticado
- `auth_user_tenant_id()` — Retorna el tenant_id del usuario
- `auth_user_municipio_id()` — Retorna el municipio_id del usuario

---

## 3. Funcionalidades del Sistema

### 3.1 Para Entidades (Gobierno)

#### Gestion de Convocatorias
- Crear convocatorias con nombre, descripcion, presupuesto, fechas de apertura y cierre
- Estados: borrador → abierta → cerrada → evaluacion → resuelta
- Asignar municipios a convocatorias con control de acceso

#### Editor de Plantilla MGA
- Diseno visual de formularios multi-etapa
- Cada etapa contiene campos configurables: texto, textarea, numero, fecha, seleccion
- Campos marcados como requeridos/opcionales
- Campos habilitados para asistencia IA (aiAssistable)
- Orden de etapas configurable con drag & drop

#### Sistema de Rubricas
- Definicion de criterios de evaluacion vinculados a campos MGA
- Cada criterio tiene: nombre, peso (%), puntaje maximo, guia de evaluacion
- Niveles de scoring: 1 (Insuficiente), 2 (Basico), 3 (Satisfactorio), 4 (Excelente)
- Generacion de rubrica con IA: el sistema sugiere criterios basados en la descripcion de la convocatoria

#### Evaluacion de Proyectos
- Evaluacion formal con scoring por criterio
- Justificacion detallada por campo evaluado
- Evaluacion asistida por IA (el sistema pre-llena scores y justificaciones)
- Evaluacion humana con override manual

#### Gestion de Documentos
- Subida de documentos de referencia (PDF, DOC)
- Procesamiento automatico: extraccion de texto, chunking, vectorizacion
- Los documentos alimentan el sistema RAG para que la IA tenga contexto especifico de la convocatoria

#### Comunicacion con Municipios
- Comentarios campo por campo con workflow de resolucion (abierto → resuelto → reabierto)
- Comentarios bloqueantes que impiden el envio hasta resolverse
- Tablero de anuncios por convocatoria (FAQs, aclaraciones, actualizaciones)
- Chat directo con municipio

#### Solicitudes de Revision
- Emitir solicitud de revision que reabre secciones especificas del formulario
- Indicar campos exactos que requieren atencion
- Establecer deadline para la revision
- Rastrear rondas de revision (R1, R2, R3...)

#### Monitoreo y Reportes
- Dashboard con heatmap de progreso por municipio
- Estadisticas agregadas: total submissions, scores promedio, tasa de completacion
- Reporte ejecutivo generado por IA con tendencias y recomendaciones
- Exportacion de reportes en PDF y Excel con scoring detallado

#### Definicion de Requisitos Documentales
- Configurar lista de documentos requeridos por convocatoria
- Especificar formatos aceptados, tamanio maximo, obligatoriedad
- Los municipios ven como checklist con slots de carga

---

### 3.2 Para Municipios

#### Dashboard del Municipio
- Vista de todas las convocatorias asignadas con progreso
- Indicador de riesgo de deadline (semaforo: verde/amarillo/rojo)
- Recomendaciones IA de convocatorias compatibles con el perfil del municipio
- Enlaces rapidos a analiticas, portafolio y calendario

#### Wizard MGA (Formulacion de Proyectos)
El corazon de la plataforma. Un formulario multi-etapa inteligente que guia al municipio paso a paso:

**Navegacion y progreso:**
- Sidebar con etapas numeradas y estado (vacio, parcial, completo)
- Barra de progreso general con porcentaje
- Autoguardado cada 1.5 segundos con indicador visual
- Milestones de progreso con celebraciones en 25%, 50%, 75% y 100%

**Asistencia IA por campo:**
- Boton "Asistir con IA" en cada campo de texto
- Streaming en tiempo real (Server-Sent Events)
- Respuesta estructurada: texto sugerido, puntos clave, riesgos identificados, preguntas pendientes, citas de documentos
- Indicador de confianza (alto/medio/bajo) basado en similitud RAG
- Vista de diferencias (diff) para comparar texto actual vs sugerido
- Aceptar, rechazar o editar manualmente la sugerencia

**Auto-borrador por etapa:**
- Un click genera borrador completo para todos los campos vacios de la etapa
- Usa contexto de etapas previas para coherencia
- Preserva contenido existente

**Mejorar texto:**
- Boton "Mejorar" en cada campo con contenido
- La IA reescribe para mayor claridad, formalidad y completitud
- Vista de diferencias para revisar cambios

**Glosario MGA contextual:**
- Deteccion automatica de terminologia MGA en labels y descripciones
- Tooltips con definicion, ejemplo y alias para 25+ terminos
- Terminos incluyen: arbol de problemas, marco logico, linea base, cadena de valor, entre otros

**Guia de escritura por campo:**
- Panel colapsable que muestra: que buscan los evaluadores, errores comunes, ejemplo de respuesta nivel 4
- Vincula el campo con el criterio de rubrica correspondiente

**Historial de versiones:**
- Timeline de cambios por campo (manual, IA assist, auto-draft, mejora, restauracion)
- Restaurar version anterior con un click

**Tour de onboarding:**
- Walkthrough de 6 pasos en el primer uso
- Resalta: navegacion de etapas, barra de progreso, boton de asistencia IA, auto-draft, pre-evaluacion, guia de escritura

#### Pre-Evaluacion en Tiempo Real
- Scoring completo contra la rubrica de la convocatoria sin enviar
- Desglose por etapa y por criterio con puntaje, justificacion y recomendacion
- Requiere minimo 30% de progreso
- Score total con barras de color (verde ≥75, amarillo ≥50, rojo <50)
- Recomendaciones generales ordenadas por impacto

#### Wizard de Mejora
- Despues de pre-evaluar, identifica los campos mas debiles
- Guia paso a paso para mejorar cada campo debil
- Sugiere texto mejorado basado en el nivel siguiente de la rubrica
- Recalcula score estimado despues de cada mejora

#### Simulador de Score ("What-If")
- Sliders interactivos por criterio de rubrica
- Calcula score total en tiempo real al ajustar cada criterio
- Muestra top 3 mejoras con mayor retorno de inversion (ROI)
- Enlace directo al campo en el wizard para implementar la mejora

#### Analisis Detallado de Evaluacion
- Por cada criterio con score < maximo:
  - Respuesta actual del municipio
  - Justificacion del evaluador
  - Nivel actual en la rubrica vs nivel siguiente
  - Descripcion de que incluiria una respuesta del siguiente nivel
  - Boton para abrir wizard de mejora en ese campo

#### Comparacion con Proyectos Referentes
- Benchmarks anonimizados contra otros municipios
- Comparacion de scores por seccion MGA

#### Checklist Pre-Envio
- Validacion automatica antes de permitir envio:
  - Campos requeridos completos
  - Progreso >= umbral
  - Score de pre-evaluacion >= minimo
  - Comentarios bloqueantes resueltos
  - Minimos de caracteres cumplidos
- Items criticos bloquean envio; items recomendados muestran warnings

#### Ceremonia de Envio
- Pantalla de confirmacion con resumen de etapas y score
- Checkbox de declaracion juramentada
- Boton "Enviar proyecto" que cambia status y bloquea formulario
- Email de confirmacion automatico

#### Maquina de Estados del Submission
- `draft` → `submitted` → `under_review` → `needs_revision` → `submitted` (re-envio)
- `under_review` → `approved` / `rejected`
- Formulario bloqueado cuando status != draft y != needs_revision
- Banner informativo del estado actual

#### Seguimiento Post-Envio
- Pipeline visual: Enviado → En revision → Decision final
- Timestamps por transicion de estado
- Panel de solicitudes de revision activas con navegacion a campos marcados

#### Panel de Revision
- Cuando la entidad solicita revision, muestra:
  - Mensaje del evaluador
  - Campos especificos que requieren atencion (con botones de navegacion)
  - Deadline de la revision
  - Numero de ronda de revision

#### Portafolio de Proyectos
- Vista unificada de todos los proyectos del municipio
- Estadisticas agregadas: total, activos, tasa de exito, score promedio
- Filtros por estado (borrador, enviado, en revision, aprobado, no aprobado)
- Barra de progreso y score por proyecto

#### Calendario de Fechas
- Vista de calendario mensual con eventos codificados por color:
  - Rojo: fechas limite de convocatoria
  - Naranja: deadlines de revision
  - Azul: fechas de inicio
- Panel lateral de proximos eventos con countdown
- Indicador de progreso por convocatoria

#### Dashboard de Analiticas
- Grafico de trayectoria de scores (LineChart)
- Radar de secciones MGA fuertes/debiles (RadarChart)
- Distribucion de progreso por proyecto (BarChart)
- Racha de mejora y notificaciones al cruzar umbrales (60, 70, 80)

#### Carga de Documentos
- Zona de carga drag & drop por campo o etapa
- Validacion de tipo y tamanio de archivo
- Lista de documentos subidos con opcion de eliminar

#### Checklist de Documentos Requeridos
- Lista de documentos definidos por la entidad
- Slots de carga por documento requerido
- Indicador de completitud (obligatorios vs opcionales)

#### Plantillas Reutilizables
- Guardar proyecto completado como plantilla
- Al iniciar nueva convocatoria, pre-llenar desde plantilla
- Vista previa de datos de la plantilla antes de aplicar

#### Snippets de Texto
- Libreria de bloques de texto reutilizables (ej: descripcion institucional, datos geograficos)
- Busqueda por etiquetas
- Insertar snippet directamente en el campo del wizard

#### Notas Internas del Equipo
- Notas por campo visibles solo para el equipo del municipio
- Workflow de resolver/reabrir
- No visibles para la entidad

#### Revision Interna
- Paso opcional de aprobacion antes de enviar a la entidad
- El revisor interno puede aprobar o solicitar cambios con comentarios
- Solo despues de aprobacion interna se habilita el envio

#### Notificaciones
- Tipos: deadline, mejora sugerida, inactividad, comentario, informacion
- Bell icon con badge de no leidas
- Generacion automatica por cron (deadline a 7/3/1 dias, inactividad 7+ dias)

---

### 3.3 Capacidades de Inteligencia Artificial

#### Asistencia por Campo (AI Assist)
- **Como funciona**: El usuario hace click en "Asistir con IA" en cualquier campo del formulario. El sistema construye un prompt con: contexto de la convocatoria, etapa actual, campo especifico, contenido existente del usuario, y chunks relevantes de documentos de referencia (RAG). Claude genera una respuesta estructurada en streaming.
- **Salida**: texto sugerido, puntos clave (bullets), riesgos identificados, preguntas sobre informacion faltante, citas de documentos de referencia, score de confianza
- **RAG**: Los documentos de la convocatoria se procesan en chunks y se vectorizan con Voyage AI. Al momento de la consulta, se recuperan los top-5 chunks mas relevantes (similitud coseno > 0.7) usando pgvector.
- **Cache**: Hash SHA-256 del prompt; si existe una respuesta identica de las ultimas 24 horas, se retorna del cache.

#### Generacion Completa de Proyecto
- **Como funciona**: Un click genera todas las etapas del proyecto secuencialmente. Cada etapa usa como contexto el contenido generado en etapas anteriores para mantener coherencia.
- **Streaming**: Progreso en tiempo real via SSE con eventos `step_complete`
- **Tiempo**: ~90 segundos para un proyecto completo de 5+ etapas

#### Auto-Draft por Etapa
- Genera borrador para todos los campos vacios de una etapa
- Preserva contenido existente
- Usa misma logica de RAG que el assist individual

#### Mejora de Texto
- Reescribe texto existente para mayor claridad, formalidad y completitud
- Mantiene el significado original
- Vista de diferencias para revision

#### Pre-Evaluacion IA
- Evalua el proyecto completo contra la rubrica de la convocatoria
- 1 llamada LLM por etapa (evalua todos los criterios en batch)
- Retorna: score total, score por criterio, puntajes ponderados, justificaciones, recomendaciones de mejora
- El municipio puede ejecutarla cuantas veces quiera antes de enviar

#### Evaluacion Formal IA
- Ejecutada por la entidad sobre submissions recibidas
- Genera scores, justificaciones y resumen ejecutivo
- Soporta evaluacion hibrida: IA pre-llena scores que el evaluador humano puede ajustar

#### Chat Copiloto
- Interfaz conversacional multi-turno
- Contexto: documentos de convocatoria, datos del proyecto actual, historial de chat
- Soporta acciones: el LLM puede sugerir actualizaciones directas a campos
- Respuestas en streaming con formato markdown

#### Sugerencia de Rubrica
- La IA sugiere criterios de evaluacion basados en la descripcion de la convocatoria
- Propone nombres de criterios, descripciones, pesos y niveles de scoring

#### Nudges Inteligentes
- Notificaciones proactivas basadas en analisis de scoring
- Sugiere mejoras especificas cuando detecta campos debiles

#### Recomendacion de Convocatorias
- Analiza el perfil del municipio y recomienda convocatorias compatibles
- Matching basado en sector, presupuesto, requisitos

#### Configuracion del Proveedor LLM
- Patron adaptador para cambio de proveedor (Anthropic/OpenAI)
- Modelo configurable via variable de entorno (`ANTHROPIC_MODEL`)
- Reintentos: 3 intentos con backoff exponencial (base 1s)
- Rate limiting: 10 llamadas/minuto por usuario

---

## 4. Flujos de Usuario

### 4.1 Flujo de la Entidad

```
1. Login como entidad_admin
2. Crear nueva convocatoria
   ├─ Nombre, descripcion, presupuesto, fechas
   ├─ Definir plantilla MGA (etapas + campos)
   ├─ Configurar rubrica de evaluacion
   ├─ Subir documentos de referencia
   ├─ Definir requisitos documentales
   └─ Asignar municipios
3. Publicar convocatoria (estado: abierta)
4. Monitorear progreso
   ├─ Heatmap de avance por municipio
   ├─ Publicar anuncios/FAQs
   └─ Responder preguntas via chat/comentarios
5. Cerrar convocatoria
6. Evaluar submissions
   ├─ Evaluacion asistida por IA (pre-fill de scores)
   ├─ Ajuste manual por evaluador
   ├─ Solicitar revision si hay deficiencias
   └─ Aprobar/rechazar proyectos
7. Generar reportes
   ├─ PDF individual por proyecto
   ├─ Excel consolidado
   └─ Reporte ejecutivo IA
```

### 4.2 Flujo del Municipio

```
1. Login como municipio_user
2. Ver convocatorias asignadas en dashboard
3. Abrir wizard MGA para una convocatoria
4. Llenar formulario etapa por etapa
   ├─ Escribir manualmente
   ├─ Usar AI Assist por campo
   ├─ Generar borrador completo con auto-draft
   ├─ Mejorar textos existentes
   ├─ Consultar glosario MGA
   ├─ Leer guia de escritura por campo
   ├─ Revisar historial de cambios
   ├─ Insertar snippets reutilizables
   └─ Chatear con copiloto IA
5. Pre-evaluar proyecto
   ├─ Ver score total y desglose
   ├─ Identificar campos debiles
   ├─ Usar wizard de mejora
   └─ Simular impacto de mejoras (what-if)
6. Subir documentos requeridos
7. Completar checklist pre-envio
8. Revision interna (opcional)
9. Enviar proyecto (ceremonia de envio)
10. Seguimiento post-envio
    ├─ Pipeline de estado
    ├─ Atender solicitudes de revision
    ├─ Revisar comentarios del evaluador
    └─ Ver resultados de evaluacion
```

---

## 5. API — Endpoints

### 5.1 Endpoints de Inteligencia Artificial

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/api/ai/assist` | Asistencia IA por campo con RAG y streaming SSE |
| POST | `/api/ai/chat` | Chat copiloto conversacional con streaming |
| POST | `/api/ai/auto-draft` | Auto-borrador de etapa completa |
| POST | `/api/ai/generate-project` | Generacion completa de proyecto (todas las etapas) |
| POST | `/api/ai/improve` | Mejora de calidad de texto |
| POST | `/api/ai/validate-step` | Validacion de calidad de etapa |
| POST | `/api/ai/compare-field` | Comparacion de campo contra rubrica |
| POST | `/api/ai/suggest-rubric` | Sugerencia de rubrica con IA |
| POST | `/api/ai/nudge` | Notificaciones inteligentes de mejora |
| POST | `/api/ai/benchmarks` | Benchmarks contra otros proyectos |
| POST | `/api/ai/match-convocatorias` | Recomendacion de convocatorias |
| GET | `/api/ai/health-check` | Estado del servicio LLM |

### 5.2 Endpoints de Evaluacion

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/api/evaluations/run` | Evaluacion formal de submission |
| POST | `/api/pre-evaluation/run` | Pre-evaluacion en tiempo real |
| POST | `/api/scoring/start` | Iniciar cola de scoring batch |

### 5.3 Endpoints de Reportes

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/reports/[projectId]/pdf` | Exportar reporte PDF |
| GET | `/api/reports/[projectId]/xlsx` | Exportar reporte Excel |
| POST | `/api/reports/[convocatoriaId]/ai-report` | Reporte ejecutivo IA |
| GET | `/api/submissions/[id]/pdf` | PDF de submission MGA |

### 5.4 Endpoints de Wizard y Submissions

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/api/wizard/save-step` | Guardar paso del formulario (autosave) |
| POST | `/api/wizard/submit` | Enviar proyecto formalmente |
| POST | `/api/submissions/submit` | Enviar submission MGA |

### 5.5 Endpoints de Documentos

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/api/documents/process` | Procesar documento (texto + embeddings) |
| GET | `/api/documents/list` | Listar documentos de convocatoria |
| GET | `/api/documents/requirements` | Requisitos documentales |

### 5.6 Endpoints de Comunicacion

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET/POST | `/api/comments` | Comentarios por campo |
| PATCH | `/api/comments` | Resolver/reabrir comentario |
| GET/POST | `/api/internal-notes` | Notas internas del equipo |
| PATCH | `/api/internal-notes` | Resolver nota interna |
| GET/POST | `/api/messages` | Chat directo entidad-municipio |
| GET/POST | `/api/announcements` | Anuncios de convocatoria |
| GET/POST | `/api/revision-requests` | Solicitudes de revision |

### 5.7 Endpoints de Datos y Analiticas

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/notifications` | Notificaciones del usuario |
| POST | `/api/notifications/[id]/read` | Marcar como leida |
| POST | `/api/cron/generate-notifications` | Cron de generacion automatica |
| GET | `/api/analytics/heatmap` | Heatmap de progreso |
| GET | `/api/field-changes` | Historial de cambios por campo |
| GET/POST | `/api/templates` | Plantillas de proyecto |
| GET/POST | `/api/snippets` | Snippets reutilizables |

---

## 6. Componentes de UI

### 6.1 Componentes de IA

| Componente | Archivo | Funcion |
|-----------|---------|---------|
| Chat Copiloto | `ai/ai-chat.tsx` | Interfaz de chat conversacional con IA |
| Boton AI Assist | `ai/ai-assist-button.tsx` | Trigger de asistencia por campo |
| Mejora de Texto | `ai/ai-improve.tsx` | Modal de mejora de texto |
| Auto-Draft | `ai/auto-draft-button.tsx` | Boton de auto-llenado de etapa |
| Evaluacion IA | `ai/evaluate-with-ai.tsx` | Interfaz de evaluacion con IA |
| Vista de Diff | `ai/text-diff-view.tsx` | Comparacion texto original vs sugerido |
| Comparacion de Proyectos | `ai/project-comparison.tsx` | Benchmarks con proyectos referentes |
| Wizard de Mejora | `ai/improvement-wizard.tsx` | Guia paso a paso para mejorar campos debiles |
| Simulador de Score | `ai/score-simulator.tsx` | Sliders what-if por criterio |
| Recomendaciones | `ai/convocatoria-recommendations.tsx` | Convocatorias sugeridas |
| Reporte de Aprendizaje | `ai/learning-report.tsx` | Analisis IA post-evaluacion |

### 6.2 Componentes del Wizard

| Componente | Archivo | Funcion |
|-----------|---------|---------|
| Cliente del Wizard | `wizard-client.tsx` | Orquestador principal (~1500 lineas) |
| Guia de Escritura | `field-writing-guide.tsx` | Panel con criterios de evaluacion y ejemplos |
| Glosario MGA | `mga-glossary-tooltip.tsx` | Tooltips contextuales de terminologia |
| Historial de Campo | `field-history.tsx` | Timeline de cambios con restauracion |
| Tour de Onboarding | `onboarding-tour.tsx` | Walkthrough de primer uso |
| Snippets | `snippet-library.tsx` | Libreria de texto reutilizable |

### 6.3 Componentes de Proceso

| Componente | Archivo | Funcion |
|-----------|---------|---------|
| Checklist Pre-Envio | `pre-submit-checklist.tsx` | Validaciones antes de enviar |
| Ceremonia de Envio | `submission-ceremony.tsx` | Pantalla de confirmacion y envio |
| Indicador de Riesgo | `deadline-risk-indicator.tsx` | Semaforo de deadline |
| Milestones de Progreso | `progress-milestones.tsx` | Celebraciones en hitos |
| Tracker Post-Envio | `post-submission-tracker.tsx` | Pipeline de estado post-envio |
| Estadisticas IA | `ai-usage-stats.tsx` | Metricas de uso de herramientas IA |
| Historial de Score | `score-history-chart.tsx` | Grafico de trayectoria de scores |

### 6.4 Componentes de Comunicacion

| Componente | Archivo | Funcion |
|-----------|---------|---------|
| Panel de Revision | `revision-request-panel.tsx` | Solicitudes de revision activas |
| Notas Internas | `internal-notes.tsx` | Notas del equipo por campo |
| Revision Interna | `internal-review.tsx` | Aprobacion interna pre-envio |
| Chat con Evaluador | `evaluator-chat.tsx` | Chat bidireccional |
| Tablero de Anuncios | `announcement-board.tsx` | Anuncios de convocatoria |
| Deep Dive Evaluacion | `evaluation-deep-dive.tsx` | Analisis detallado por criterio |

### 6.5 Componentes de Documentos

| Componente | Archivo | Funcion |
|-----------|---------|---------|
| Carga de Documentos | `document-upload.tsx` | Drag & drop con validacion |
| Checklist de Docs | `document-checklist.tsx` | Requisitos documentales con slots |
| Selector de Plantillas | `template-selector.tsx` | Elegir plantilla existente |

---

## 7. Paginas de la Aplicacion

### 7.1 Paginas Publicas

| Ruta | Descripcion |
|------|-------------|
| `/` | Landing page con features, como funciona, piloto, entidades aliadas |
| `/login` | Inicio de sesion (email + password) |
| `/casos` | Casos de uso (estatica) |
| `/contacto` | Formulario de contacto |
| `/implementacion` | Guia de implementacion (estatica) |

### 7.2 Dashboard Compartido

| Ruta | Descripcion |
|------|-------------|
| `/dashboard` | Redirige segun rol del usuario |
| `/dashboard/ayuda` | Centro de ayuda |
| `/dashboard/notificaciones` | Centro de notificaciones |
| `/dashboard/organizacion` | Perfil de la organizacion |
| `/dashboard/onboarding` | Onboarding de primer uso |
| `/dashboard/convocatorias` | Lista de convocatorias |
| `/dashboard/convocatorias/explorar` | Explorar convocatorias abiertas |

### 7.3 Dashboard de Entidad

| Ruta | Descripcion |
|------|-------------|
| `/dashboard/entidad` | Panel principal con estadisticas |
| `/dashboard/entidad/convocatorias/nueva` | Crear nueva convocatoria |
| `/dashboard/entidad/convocatorias/[id]` | Detalle de convocatoria |
| `/dashboard/entidad/convocatorias/[id]/plantilla` | Editor de plantilla MGA |
| `/dashboard/entidad/convocatorias/[id]/rubricas` | Editor de rubricas |
| `/dashboard/entidad/convocatorias/[id]/documentos` | Gestion de documentos |
| `/dashboard/entidad/convocatorias/[id]/municipios` | Municipios asignados |
| `/dashboard/entidad/convocatorias/[id]/monitoreo` | Heatmap de progreso |
| `/dashboard/entidad/convocatorias/[id]/informe` | Reporte ejecutivo IA |
| `/dashboard/entidad/analytics` | Analiticas globales |
| `/dashboard/entidad/analytics/ai` | Analiticas de uso de IA |

### 7.4 Dashboard de Municipio

| Ruta | Descripcion |
|------|-------------|
| `/dashboard/municipio` | Panel con convocatorias asignadas |
| `/dashboard/municipio/convocatorias/[id]` | Detalle de convocatoria |
| `/dashboard/municipio/convocatorias/[id]/wizard` | Wizard MGA |
| `/dashboard/municipio/analiticas` | Dashboard de desempeno |
| `/dashboard/municipio/portafolio` | Portafolio de todos los proyectos |
| `/dashboard/municipio/calendario` | Calendario unificado de fechas |
| `/dashboard/municipio/benchmarks` | Comparacion con otros municipios |

### 7.5 Evaluaciones y Reportes

| Ruta | Descripcion |
|------|-------------|
| `/dashboard/evaluaciones` | Lista de evaluaciones |
| `/dashboard/evaluaciones/[projectId]` | Detalle de evaluacion |
| `/dashboard/reportes` | Centro de reportes |

### 7.6 Proyectos (Esquema V2)

| Ruta | Descripcion |
|------|-------------|
| `/dashboard/proyectos` | Lista de proyectos |
| `/dashboard/proyectos/[id]` | Detalle de proyecto |
| `/dashboard/proyectos/[id]/wizard` | Wizard de formulacion v2 |
| `/dashboard/proyectos/aplicar/[convocatoriaId]` | Aplicar a convocatoria |

---

## 8. Sistema de Notificaciones

### Tipos de Notificacion

| Tipo | Trigger | Mensaje |
|------|---------|---------|
| `deadline` | 7, 3, 1 dias antes del cierre | "La convocatoria X cierra en N dias" |
| `improvement` | Post pre-evaluacion con campos < 50% | "Tu campo X puede mejorar. Score actual: N%" |
| `inactive` | Sin ediciones por 7+ dias | "Tu proyecto X lleva N dias sin cambios" |
| `comment` | Evaluador comenta en campo | "Nuevo comentario en campo X" |
| `info` | Anuncio de convocatoria | Contenido del anuncio |

### Generacion Automatica (Cron)
- Ejecuta cada hora via Vercel Cron
- Autenticado con `CRON_SECRET`
- Evita duplicados verificando notificaciones existentes del mismo tipo

### Entrega
- Icono de campana en sidebar con badge de no leidas
- Centro de notificaciones con lista paginada
- Email para eventos criticos (submission, deadline)

---

## 9. Seguridad

### Autenticacion
- Email + password via Supabase Auth
- Sesiones basadas en cookies con refresh automatico via middleware
- No se usan magic links ni OAuth (configurable para futuro)

### Autorizacion (Multi-Tenant)
- 3 niveles de acceso: platform_admin, entidad_admin, municipio_user
- RLS (Row Level Security) en todas las tablas de PostgreSQL
- Funciones SECURITY DEFINER para verificacion de permisos
- Tenant isolation: cada entidad solo ve sus propios datos

### Proteccion de API
- Verificacion de sesion en todos los endpoints
- Verificacion de rol para operaciones sensibles
- Rate limiting en endpoints de IA (10/minuto por usuario)
- CORS configurado via Next.js
- Validacion de input con Zod schemas

### Datos Sensibles
- Claves API almacenadas en variables de entorno (no en codigo)
- Supabase Service Role Key solo usado server-side
- Prompts y respuestas IA registrados en audit_logs para trazabilidad

---

## 10. Despliegue e Infraestructura

### Variables de Entorno Requeridas

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Aplicacion
NEXT_PUBLIC_APP_URL=https://publitec.vercel.app

# IA
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-6     # opcional, default

# Embeddings (opcional — para RAG)
VOYAGE_API_KEY=pa-...

# Email (opcional — degradacion elegante si no esta)
RESEND_API_KEY=re_...
CONTACT_NOTIFY_EMAIL=admin@publitec.co

# Cron (opcional)
CRON_SECRET=secret_...
```

### Despliegue en Vercel
1. Conectar repositorio GitHub a Vercel
2. Configurar variables de entorno en Vercel Dashboard
3. Deploy automatico en push a branch `main`
4. Serverless functions para API routes
5. Edge runtime para middleware de sesion

### Migraciones de Base de Datos
Las 25 migraciones se ejecutan en orden secuencial:

| # | Nombre | Contenido |
|---|--------|-----------|
| 00001 | Estructura base | tenants, profiles, municipios, convocatorias |
| 00002 | Submissions | submissions, mga_templates |
| 00003 | Seguridad RLS | Politicas de acceso por rol |
| 00004 | Audit logs | audit_logs para trazabilidad IA |
| 00005 | Embeddings | documents, embeddings (pgvector) |
| 00006 | Evaluaciones | rubrics, evaluations con scoring |
| 00007 | Evaluacion avanzada | Campos adicionales en evaluations |
| 00008 | Convocatoria municipios | Asignacion y progreso |
| 00009 | Status y completado | completed_at, mejor tracking |
| 00010 | Trigger de progreso | Auto-sync de % progreso |
| 00011 | PuBlitec core v2 | organizations, convocatorias_v2, projects, rubrics_v2 |
| 00012 | Project forms | project_forms, project_documents, scoring_jobs |
| 00013 | Seed data | Datos iniciales para demo |
| 00014 | Project embeddings | Embeddings de proyectos |
| 00015 | AI chat | ai_chat_messages |
| 00016 | Convocatoria stages | Etapas temporales |
| 00017 | Notifications | Sistema de notificaciones |
| 00018 | Contact messages | Formulario de contacto |
| 00019 | Field comments | Comentarios campo por campo |
| 00020 | Fix trigger | Correccion de trigger de progreso |
| 00021 | Status machine | submission.status, comment resolution |
| 00022 | Field changes | Historial de versiones por campo |
| 00023 | Templates/snippets/docs | Plantillas, snippets, requisitos documentales |
| 00024 | Comunicacion | Anuncios, mensajes directos, notas internas |
| 00025 | Revision requests | Solicitudes de revision + indice portafolio |

---

## 11. Metricas y KPIs del Sistema

### Metricas de Uso de IA
- Numero de llamadas de asistencia IA por usuario/dia
- Tasa de aceptacion de sugerencias IA
- Comparacion de scores en campos asistidos vs manuales
- Tiempo promedio de generacion (streaming)
- Cache hit rate del prompt

### Metricas de Proceso
- Tiempo promedio para completar un proyecto
- Progreso promedio al momento de pre-evaluacion
- Score promedio de pre-evaluacion vs evaluacion formal
- Numero de rondas de revision promedio
- Tasa de submissions que pasan el checklist al primer intento

### Metricas de Resultado
- Tasa de aprobacion por municipio/convocatoria
- Score promedio por criterio de rubrica
- Mejora de score entre rondas de revision
- Tiempo entre submission y decision final

---

## 12. Diferenciadores Clave

1. **IA integrada en cada paso**: No es un chatbot aparte; la IA esta embebida en cada campo del formulario con contexto especifico de la convocatoria.

2. **RAG con documentos de convocatoria**: Las sugerencias de la IA se basan en los documentos reales de la convocatoria (terminos de referencia, guias tecnicas), no en conocimiento generico.

3. **Pre-evaluacion en tiempo real**: Los municipios pueden ver su score estimado antes de enviar, con desglose por criterio y recomendaciones de mejora.

4. **Ciclo de retroalimentacion cerrado**: Desde la formulacion hasta la evaluacion, cada dato fluye: la rubrica define los criterios, la IA evalua contra ellos, el municipio mejora basado en la retroalimentacion, y el score se actualiza.

5. **Multi-tenant con RLS**: Aislamiento completo de datos entre entidades y municipios a nivel de base de datos, no de aplicacion.

6. **Streaming nativo**: Todas las respuestas IA se entregan en streaming (SSE), proporcionando feedback inmediato al usuario.

7. **Generacion completa de proyecto**: Un click genera un proyecto MGA completo con coherencia entre etapas, algo que normalmente toma semanas de trabajo manual.

8. **Plataforma bilingual (ES)**: Toda la interfaz, prompts de IA, y documentacion estan en espanol, adaptados al contexto colombiano y la terminologia MGA.

---

## 13. Entidades Aliadas

- **IDEA** (Instituto para el Desarrollo de Antioquia)
- **Gobernacion de Antioquia**
- **Universidad EAFIT**
- **Grupo Argos**

---

## 14. Equipo y Contacto

- **Plataforma**: [https://mga-estructurador.vercel.app](https://mga-estructurador.vercel.app)
- **Repositorio**: Privado (GitHub)
- **Stack**: Next.js 16 + React 19 + Supabase + Claude AI + TypeScript

---

*Documento generado para PuBlitec v0.1.0 — Marzo 2026*
