import type { WizardStepDefinition } from "@/lib/types/database";

export const DEFAULT_WIZARD_STEPS: WizardStepDefinition[] = [
  {
    step_number: 1,
    step_name: "Identificacion",
    description: "Informacion basica del proyecto y del municipio",
    fields: [
      { id: "project_name", label: "Nombre del Proyecto", type: "text", required: true, placeholder: "Ej: Mejoramiento vial zona rural", aiAssistable: true },
      { id: "municipality", label: "Municipio", type: "text", required: true, placeholder: "Nombre del municipio", aiAssistable: false },
      { id: "department", label: "Departamento", type: "text", required: true, placeholder: "Departamento", aiAssistable: false },
      { id: "sector", label: "Sector", type: "select", required: true, options: ["Infraestructura", "Educacion", "Salud", "Agricultura", "Tecnologia", "Medio Ambiente", "Cultura", "Deporte", "Otro"], aiAssistable: false },
      { id: "problem_description", label: "Descripcion del Problema", type: "textarea", required: true, description: "Describa el problema o necesidad que busca resolver el proyecto", placeholder: "Describa la situacion actual que motiva este proyecto...", aiAssistable: true },
      { id: "justification", label: "Justificacion", type: "textarea", required: true, description: "Explique por que es necesario este proyecto", placeholder: "Argumente la importancia y urgencia del proyecto...", aiAssistable: true },
    ],
  },
  {
    step_number: 2,
    step_name: "Presupuesto",
    description: "Desglose financiero y fuentes de financiacion",
    fields: [
      { id: "total_budget", label: "Presupuesto Total", type: "currency", required: true, placeholder: "0", aiAssistable: false },
      { id: "own_resources", label: "Recursos Propios", type: "currency", required: false, placeholder: "0", aiAssistable: false },
      { id: "requested_amount", label: "Monto Solicitado", type: "currency", required: true, placeholder: "0", aiAssistable: false },
      { id: "other_sources", label: "Otras Fuentes de Financiacion", type: "textarea", required: false, placeholder: "Detalle otras fuentes de financiacion si las hay...", aiAssistable: true },
      { id: "budget_breakdown", label: "Desglose Presupuestal", type: "textarea", required: true, description: "Detalle los rubros principales del presupuesto", placeholder: "Rubro 1: $XXX - Descripcion\nRubro 2: $XXX - Descripcion", aiAssistable: true },
    ],
  },
  {
    step_number: 3,
    step_name: "Impacto",
    description: "Poblacion beneficiaria, indicadores y resultados esperados",
    fields: [
      { id: "target_population", label: "Poblacion Objetivo", type: "number", required: true, placeholder: "Numero de beneficiarios directos", aiAssistable: false },
      { id: "beneficiaries_description", label: "Descripcion de Beneficiarios", type: "textarea", required: true, description: "Describa la poblacion que se beneficiara del proyecto", placeholder: "Caracterice la poblacion beneficiaria...", aiAssistable: true },
      { id: "expected_results", label: "Resultados Esperados", type: "textarea", required: true, description: "Enumere los resultados concretos que espera lograr", placeholder: "1. Resultado esperado...\n2. Resultado esperado...", aiAssistable: true },
      { id: "sustainability", label: "Sostenibilidad", type: "textarea", required: true, description: "Como se garantiza la sostenibilidad del proyecto a largo plazo", placeholder: "Explique como el proyecto sera sostenible en el tiempo...", aiAssistable: true },
      { id: "environmental_impact", label: "Impacto Ambiental", type: "textarea", required: false, description: "Describa el impacto ambiental y medidas de mitigacion", placeholder: "Analisis de impacto ambiental...", aiAssistable: true },
    ],
  },
  {
    step_number: 4,
    step_name: "Cronograma",
    description: "Plan de ejecucion y actividades principales",
    fields: [
      { id: "start_date", label: "Fecha de Inicio Propuesta", type: "date", required: true, aiAssistable: false },
      { id: "end_date", label: "Fecha de Finalizacion Propuesta", type: "date", required: true, aiAssistable: false },
      { id: "duration_months", label: "Duracion (meses)", type: "number", required: true, placeholder: "12", aiAssistable: false },
      { id: "activities", label: "Actividades Principales", type: "textarea", required: true, description: "Liste las actividades principales con sus plazos estimados", placeholder: "Mes 1-2: Actividad 1\nMes 3-4: Actividad 2", aiAssistable: true },
      { id: "milestones", label: "Hitos del Proyecto", type: "textarea", required: true, description: "Defina los hitos clave del proyecto", placeholder: "Hito 1: Descripcion - Fecha estimada\nHito 2: Descripcion - Fecha estimada", aiAssistable: true },
    ],
  },
  {
    step_number: 5,
    step_name: "Documentos",
    description: "Documentos de soporte y anexos requeridos",
    fields: [
      { id: "technical_document", label: "Documento Tecnico", type: "file", required: false, description: "Documento tecnico del proyecto (PDF, DOCX)", aiAssistable: false },
      { id: "budget_document", label: "Presupuesto Detallado", type: "file", required: false, description: "Archivo Excel o PDF con el presupuesto detallado", aiAssistable: false },
      { id: "support_letters", label: "Cartas de Apoyo", type: "file", required: false, description: "Cartas de apoyo de la comunidad o entidades", aiAssistable: false },
      { id: "additional_notes", label: "Notas Adicionales", type: "textarea", required: false, placeholder: "Cualquier informacion adicional relevante...", aiAssistable: true },
    ],
  },
];
