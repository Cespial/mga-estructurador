import type {
  PublitecConvocatoria,
  ProjectForm,
  RubricCriterion,
} from "@/lib/types/database";
import type { LlmMessage } from "@/lib/ai/adapter";

// ---------------------------------------------------------------------------
// System prompt -- defines the evaluator persona
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `Eres un evaluador experto en proyectos de inversion publica en Colombia. Tu rol es evaluar proyectos presentados por municipios a convocatorias de entidades territoriales y del orden nacional.

INSTRUCCIONES GENERALES:
- Evalua de forma objetiva, justa y fundamentada cada criterio de la rubrica.
- Cada criterio tiene un puntaje maximo (max_score) y una guia de evaluacion.
- Asigna un puntaje numerico entero entre 0 y max_score para cada criterio.
- La justificacion debe ser concisa (2-4 oraciones) y referir datos concretos del proyecto.
- El razonamiento (rationale) es tu analisis interno mas detallado de por que asignaste ese puntaje.
- Se estricto pero justo: no infles puntajes si la informacion es vaga o insuficiente.
- Si un campo del formulario esta vacio o no fue diligenciado, penaliza proporcionalmente.

FORMATO DE RESPUESTA:
Responde UNICAMENTE con un objeto JSON valido (sin markdown, sin backticks, sin texto adicional) con la siguiente estructura:

{
  "criteria": [
    {
      "criterion_id": "<uuid del criterio>",
      "score": <numero entero entre 0 y max_score>,
      "max_score": <puntaje maximo del criterio>,
      "justification": "<justificacion breve en espanol>",
      "rationale": "<analisis detallado interno>"
    }
  ],
  "summary": "<resumen general de la evaluacion del proyecto en 3-5 oraciones>"
}`;

// ---------------------------------------------------------------------------
// Build the user prompt with project data and rubric criteria
// ---------------------------------------------------------------------------

export interface ScoringPromptInput {
  convocatoria: PublitecConvocatoria;
  projectTitle: string;
  projectDescription: string | null;
  forms: ProjectForm[];
  criteria: RubricCriterion[];
}

export function buildScoringMessages(input: ScoringPromptInput): LlmMessage[] {
  const {
    convocatoria,
    projectTitle,
    projectDescription,
    forms,
    criteria,
  } = input;

  // ---- Section: Convocatoria context ----
  const convocatoriaSection = [
    `## CONVOCATORIA`,
    `Nombre: ${convocatoria.name}`,
    convocatoria.description
      ? `Descripcion: ${convocatoria.description}`
      : null,
    convocatoria.budget
      ? `Presupuesto total: $${convocatoria.budget.toLocaleString("es-CO")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  // ---- Section: Project info ----
  const projectSection = [
    `## PROYECTO`,
    `Titulo: ${projectTitle}`,
    projectDescription ? `Descripcion: ${projectDescription}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  // ---- Section: Form data ----
  const formSections = forms
    .sort((a, b) => a.step_number - b.step_number)
    .map((form) => {
      const header = `### Paso ${form.step_number}: ${form.step_name}`;
      const fields = Object.entries(form.form_data ?? {})
        .map(([key, value]) => {
          if (value === null || value === undefined || value === "") {
            return `- ${key}: (sin diligenciar)`;
          }
          return `- ${key}: ${String(value)}`;
        })
        .join("\n");
      return `${header}\n${fields}`;
    })
    .join("\n\n");

  // ---- Section: Rubric criteria ----
  const criteriaSection = criteria
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((c, idx) => {
      return [
        `### Criterio ${idx + 1}: ${c.criterion_name}`,
        `- ID: ${c.id}`,
        `- Puntaje maximo: ${c.max_score}`,
        `- Peso: ${c.weight}`,
        c.evaluation_guide
          ? `- Guia de evaluacion: ${c.evaluation_guide}`
          : `- Guia de evaluacion: Evaluar segun la calidad y completitud de la informacion proporcionada.`,
      ].join("\n");
    })
    .join("\n\n");

  const userPrompt = [
    `Evalua el siguiente proyecto segun la rubrica de la convocatoria.`,
    ``,
    convocatoriaSection,
    ``,
    projectSection,
    ``,
    `## DATOS DEL FORMULARIO`,
    formSections,
    ``,
    `## RUBRICA DE EVALUACION`,
    criteriaSection,
    ``,
    `Evalua cada criterio y responde UNICAMENTE con el JSON especificado en las instrucciones.`,
  ].join("\n");

  return [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userPrompt },
  ];
}
