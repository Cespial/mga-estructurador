# Manual de la Plataforma (MGA Estructurador)

## 1) Que es esto
La plataforma permite **configurar convocatorias**, **recibir informacion por etapas**, **adjuntar documentos**, **evaluar con rubricas ponderadas**, y **exportar resultados en PDF**, con apoyo de un **Asistente IA**.

## 2) Roles y permisos
### Entidad Admin (`entidad_admin`)
- Crea/gestiona convocatorias.
- Configura plantilla MGA (etapas/campos).
- Sube documentos y los procesa.
- Define rubricas de evaluacion (pesos por criterio).
- Monitorea municipios, ejecuta evaluaciones, descarga PDFs.

### Municipio User (`municipio_user`)
- Ve convocatorias asignadas.
- Diligencia el wizard por etapas.
- Usa el Asistente IA para mejorar respuestas.
- Descarga su PDF (si aplica).

## 3) Flujo de trabajo (end-to-end)

### Flujo A -- Configuracion (Entidad Admin)
1. Crear convocatoria (nombre, descripcion, requisitos, fechas)
2. Configurar plantilla (etapas + campos obligatorios/opcionales)
3. Subir documentos de soporte (batch upload, PDF/TXT/DOCX, max 10MB)
4. Procesar documentos (genera embeddings para busqueda IA)
5. Crear rubrica (criterios + pesos + niveles de evaluacion)
6. Asignar municipios a la convocatoria
7. Cambiar estado a "abierta"

### Flujo B -- Ejecucion (Municipio User)
1. Entrar a convocatoria asignada
2. Click "Comenzar MGA" o "Continuar diligenciamiento"
3. Completar campos etapa por etapa (guardado automatico)
4. Usar Asistente IA en cualquier campo (boton contextual)
5. Revisar progreso en la barra general
6. Descargar PDF cuando haya avance

### Flujo C -- Evaluacion y resultados (Entidad Admin)
1. Ir a Monitoreo desde la convocatoria
2. Ver tabla con progreso por municipio y etapa
3. Click "Evaluar" en etapas con progreso > 0 y rubrica definida
4. La IA evalua cada criterio y genera score ponderado
5. Click en score para ver desglose por criterio (popover)
6. Descargar PDF por municipio (link en tabla)
7. Revisar recomendaciones de mejora

## 4) Modulos

### 4.1 Convocatorias
- **Que es**: unidad de trabajo principal. Agrupa plantilla, documentos, rubrica, municipios.
- **Estados**: borrador -> abierta -> cerrada -> evaluacion.
- **Crear**: Dashboard Entidad -> "Nueva convocatoria" -> llenar formulario.

### 4.2 Plantilla MGA (Etapas/Campos)
- **Que es**: estructura de informacion que el municipio debe llenar.
- **Etapas**: bloques ordenados (ej: Identificacion, Preparacion, Evaluacion).
- **Campos**: text, textarea, number, date, select. Pueden ser obligatorios.
- **Configurar**: Convocatoria -> Plantilla -> agregar etapas y campos.

### 4.3 Documentos
- **Batch upload**: seleccionar multiples archivos a la vez.
- **Formatos**: PDF, TXT, DOCX. Maximo 10MB por archivo.
- **Estados**: Pendiente -> Procesando -> Listo / Error.
- **Procesamiento**: extrae texto, genera chunks, crea embeddings para RAG.
- **Boton "Procesar"**: re-procesa documentos pendientes o con error.

### 4.4 Rubricas (scoring ponderado)
- **Criterios**: se vinculan a campos MGA. Cada uno tiene peso y niveles.
- **Peso**: importancia relativa. La barra de distribucion muestra porcentajes.
- **Niveles**: tipicamente 1-4 (Insuficiente, Basico, Bueno, Excelente).
- **Score**: se calcula como (score/maxScore * peso) / totalPeso * 100.

### 4.5 Monitoreo
- **Tabla**: filas = municipios, columnas = etapas.
- **Progreso**: porcentaje de campos obligatorios completados.
- **Score**: badge de color (rojo < 40 < naranja < 60 < amarillo < 80 < verde).
- **Desglose**: click en score abre popover con score por criterio.
- **Score total**: promedio ponderado de etapas evaluadas.
- **PDF**: link por municipio en la columna de nombre.

### 4.6 Export PDF
- **Contenido**: nombre convocatoria, municipio, progreso, fecha, campos por etapa con valores, evaluacion con desglose y recomendaciones.
- **Acceso**: municipio_user ve solo el suyo; entidad_admin ve cualquiera de su tenant.
- **Descarga**: boton "Descargar PDF" en vista municipio + link "PDF" en monitoreo.

### 4.7 Asistente IA
- **Que hace**: sugiere texto, puntos clave, riesgos, preguntas faltantes, citaciones de documentos.
- **Como usarlo**: en el wizard, click en el boton de asistencia en cualquier campo.
- **Contexto**: usa documentos subidos (RAG) + datos de la convocatoria/etapa/campo.
- **Limite**: 10 solicitudes por minuto por usuario.
- **Modelo**: Claude Sonnet (Anthropic).

## 5) Preguntas frecuentes

**No puedo evaluar una etapa**
- Verificar que hay rubrica definida con criterios para esa etapa.
- Verificar que el municipio tiene progreso > 0 en esa etapa.

**Subi un documento y sigue en "Pendiente"**
- Click "Procesar" manualmente. Si falla, revisar formato y tamano.

**El score cambio despues de re-evaluar**
- Normal: la IA puede dar scores ligeramente diferentes. El score mas reciente es el vigente.

**Como descargo el PDF?**
- Municipio: seccion "Tu progreso" -> "Descargar PDF".
- Entidad: Monitoreo -> link "PDF" en columna del municipio.

**Error del Asistente IA**
- 401: sesion expirada, volver a iniciar sesion.
- 429: limite de solicitudes, esperar 1 minuto.
- 502: error del servicio IA, reintentar.

## 6) Troubleshooting rapido
- **Error de autenticacion**: cerrar sesion y volver a entrar.
- **Pagina en blanco**: verificar conexion, recargar.
- **Build fallo**: correr `npm run lint && npm run typecheck && npm run build`.

## 7) Glosario
- **Convocatoria**: proceso abierto por una entidad para recibir proyectos MGA.
- **Etapa**: seccion de la plantilla MGA (ej: Identificacion, Formulacion).
- **Campo**: dato individual dentro de una etapa.
- **Rubrica**: conjunto de criterios de evaluacion con pesos.
- **Criterio**: regla de evaluacion vinculada a un campo, con niveles.
- **Peso**: importancia relativa de un criterio en la rubrica.
- **Submission**: conjunto de respuestas de un municipio a una convocatoria.
- **Evaluacion**: resultado de aplicar la rubrica a una etapa de un submission.
- **Embeddings**: representaciones vectoriales de texto para busqueda semantica (RAG).
- **RAG**: Retrieval-Augmented Generation — la IA busca contexto en documentos antes de responder.
