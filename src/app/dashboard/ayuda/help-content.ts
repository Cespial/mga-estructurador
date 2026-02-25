export interface HelpSection {
  id: string;
  title: string;
  content: string;
  subsections?: { id: string; title: string; content: string }[];
}

export const helpSections: HelpSection[] = [
  {
    id: "que-es",
    title: "Que es MGA Estructurador",
    content:
      "La plataforma permite configurar convocatorias, recibir informacion por etapas, adjuntar documentos, evaluar con rubricas ponderadas, y exportar resultados en PDF, con apoyo de un Asistente IA.",
  },
  {
    id: "roles",
    title: "Roles y permisos",
    subsections: [
      {
        id: "entidad-admin",
        title: "Entidad Admin",
        content:
          "Crea y gestiona convocatorias. Configura plantillas MGA (etapas y campos). Sube documentos y los procesa. Define rubricas de evaluacion con pesos por criterio. Monitorea municipios, ejecuta evaluaciones y descarga PDFs.",
      },
      {
        id: "municipio-user",
        title: "Municipio User",
        content:
          "Ve convocatorias asignadas. Diligencia el wizard por etapas. Usa el Asistente IA para mejorar respuestas. Descarga su PDF cuando hay avance.",
      },
    ],
    content: "",
  },
  {
    id: "flujo-configuracion",
    title: "Flujo: Configuracion (Entidad)",
    content: `1. Crear convocatoria (nombre, descripcion, requisitos, fechas)
2. Configurar plantilla (etapas + campos obligatorios/opcionales)
3. Subir documentos de soporte (batch upload, PDF/TXT/DOCX, max 10MB)
4. Procesar documentos (genera embeddings para busqueda IA)
5. Crear rubrica (criterios + pesos + niveles de evaluacion)
6. Asignar municipios a la convocatoria
7. Cambiar estado a "abierta"`,
  },
  {
    id: "flujo-ejecucion",
    title: "Flujo: Ejecucion (Municipio)",
    content: `1. Entrar a convocatoria asignada
2. Click "Comenzar MGA" o "Continuar diligenciamiento"
3. Completar campos etapa por etapa (guardado automatico)
4. Usar Asistente IA en cualquier campo (boton contextual)
5. Revisar progreso en la barra general
6. Descargar PDF cuando haya avance`,
  },
  {
    id: "flujo-evaluacion",
    title: "Flujo: Evaluacion y resultados",
    content: `1. Ir a Monitoreo desde la convocatoria
2. Ver tabla con progreso por municipio y etapa
3. Click "Evaluar" en etapas con progreso > 0 y rubrica definida
4. La IA evalua cada criterio y genera score ponderado
5. Click en score para ver desglose por criterio
6. Descargar PDF por municipio (link en tabla)
7. Revisar recomendaciones de mejora`,
  },
  {
    id: "convocatorias",
    title: "Convocatorias",
    content:
      'Unidad de trabajo principal. Agrupa plantilla, documentos, rubrica y municipios. Estados: borrador, abierta, cerrada, evaluacion. Crear desde Dashboard Entidad > "Nueva convocatoria".',
  },
  {
    id: "plantilla",
    title: "Plantilla MGA (Etapas/Campos)",
    content:
      "Estructura de informacion que el municipio debe llenar. Las etapas son bloques ordenados (ej: Identificacion, Preparacion). Cada etapa tiene campos de tipo texto, textarea, numero, fecha o seleccion. Los campos pueden ser obligatorios u opcionales.",
  },
  {
    id: "documentos",
    title: "Documentos",
    content:
      'Batch upload: seleccionar multiples archivos a la vez. Formatos: PDF, TXT, DOCX. Maximo 10MB por archivo. Estados: Pendiente > Procesando > Listo / Error. El procesamiento extrae texto, genera chunks y crea embeddings para RAG. Use "Procesar" para re-procesar documentos pendientes o con error.',
  },
  {
    id: "rubricas",
    title: "Rubricas (scoring ponderado)",
    content:
      "Los criterios se vinculan a campos MGA. Cada uno tiene peso (importancia relativa) y niveles (tipicamente 1-4: Insuficiente, Basico, Bueno, Excelente). La barra de distribucion muestra porcentajes. El score se calcula como (score/maxScore * peso) / totalPeso * 100.",
  },
  {
    id: "monitoreo",
    title: "Monitoreo",
    content:
      "Tabla donde filas = municipios y columnas = etapas. Muestra progreso (% campos obligatorios completados) y score de evaluacion. Los badges de color indican rendimiento: rojo < 40 < naranja < 60 < amarillo < 80 < verde. Click en el score abre un popover con desglose por criterio. El score total es promedio ponderado.",
  },
  {
    id: "pdf",
    title: "Export PDF",
    content:
      'Incluye: nombre convocatoria, municipio, progreso, fecha, campos por etapa con valores, evaluacion con desglose y recomendaciones. Municipio_user ve solo el suyo; entidad_admin ve cualquiera de su tenant. Descargar desde "Tu progreso" o desde Monitoreo.',
  },
  {
    id: "asistente-ia",
    title: "Asistente IA",
    content:
      "Sugiere texto, puntos clave, riesgos, preguntas faltantes y citaciones de documentos. En el wizard, click en el boton de asistencia en cualquier campo. Usa documentos subidos (RAG) + contexto de la convocatoria. Limite: 10 solicitudes por minuto. Modelo: Claude Sonnet (Anthropic).",
  },
  {
    id: "faq",
    title: "Preguntas frecuentes",
    subsections: [
      {
        id: "faq-evaluar",
        title: "No puedo evaluar una etapa",
        content:
          "Verificar que hay rubrica definida con criterios para esa etapa. Verificar que el municipio tiene progreso > 0.",
      },
      {
        id: "faq-documento",
        title: 'Documento sigue en "Pendiente"',
        content:
          'Click "Procesar" manualmente. Si falla, revisar formato y tamano del archivo.',
      },
      {
        id: "faq-score",
        title: "El score cambio al re-evaluar",
        content:
          "Normal: la IA puede dar scores ligeramente diferentes. El score mas reciente es el vigente.",
      },
      {
        id: "faq-pdf",
        title: "Como descargo el PDF?",
        content:
          'Municipio: seccion "Tu progreso" > "Descargar PDF". Entidad: Monitoreo > link "PDF" en columna del municipio.',
      },
      {
        id: "faq-ia-error",
        title: "Error del Asistente IA",
        content:
          "401: sesion expirada, volver a iniciar sesion. 429: limite de solicitudes, esperar 1 minuto. 502: error del servicio IA, reintentar.",
      },
    ],
    content: "",
  },
  {
    id: "glosario",
    title: "Glosario",
    content: `Convocatoria: proceso abierto por una entidad para recibir proyectos MGA.
Etapa: seccion de la plantilla MGA (ej: Identificacion, Formulacion).
Campo: dato individual dentro de una etapa.
Rubrica: conjunto de criterios de evaluacion con pesos.
Criterio: regla de evaluacion vinculada a un campo, con niveles.
Peso: importancia relativa de un criterio en la rubrica.
Submission: conjunto de respuestas de un municipio a una convocatoria.
Evaluacion: resultado de aplicar la rubrica a una etapa.
Embeddings: representaciones vectoriales de texto para busqueda semantica.
RAG: Retrieval-Augmented Generation — la IA busca contexto en documentos antes de responder.`,
  },
];
