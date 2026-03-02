"use client";

import { useState } from "react";

/**
 * Field Writing Guide
 *
 * Collapsible panel per field showing:
 * - What evaluators look for (from rubric)
 * - Common errors to avoid
 * - Example of a good answer
 * - Linked rubric criteria and weight
 */

interface WritingGuideData {
  /** What evaluators look for in this field */
  evaluatorCriteria: string;
  /** Common mistakes municipalities make */
  commonErrors: string[];
  /** Example of a level-4 (excellent) answer */
  exampleAnswer: string;
  /** Rubric criterion name if linked */
  rubricCriterion?: string;
  /** Weight/importance of this criterion */
  rubricWeight?: number;
}

// Default writing guides mapped by common field patterns
const FIELD_GUIDES: Record<string, WritingGuideData> = {
  problema: {
    evaluatorCriteria:
      "Los evaluadores buscan una descripcion clara y especifica del problema, respaldada con datos cuantitativos, fuentes oficiales, y evidencia de la afectacion a la poblacion objetivo.",
    commonErrors: [
      "Describir la solucion en lugar del problema",
      "No incluir datos cuantitativos ni estadisticas",
      "Ser muy general sin contextualizar al territorio",
      "No citar fuentes de informacion",
    ],
    exampleAnswer:
      "El municipio de San Pedro presenta una tasa de desercion escolar del 23% en educacion basica (Secretaria de Educacion, 2024), afectando a 1,200 ninos y ninas de la zona rural. Las principales causas incluyen la falta de transporte escolar (65% de los desertores viven a mas de 5km de la escuela) y la inexistencia de un programa de alimentacion escolar.",
    rubricCriterion: "Identificacion del problema",
    rubricWeight: 15,
  },
  justificacion: {
    evaluatorCriteria:
      "Se evalua la pertinencia y solidez del argumento. Debe demostrar por que el proyecto es necesario, vinculando con planes de desarrollo, normatividad y necesidades de la comunidad.",
    commonErrors: [
      "Repetir la descripcion del problema sin agregar valor",
      "No vincular con el Plan de Desarrollo Municipal",
      "Omitir el marco normativo aplicable",
      "No cuantificar el impacto de no actuar",
    ],
    exampleAnswer:
      "La intervencion se justifica por la alineacion con el ODS 4 (Educacion de Calidad), el Plan Nacional de Desarrollo 2022-2026 y el Plan de Desarrollo Municipal 'San Pedro Progresa' (meta 3.2: reducir desercion al 10%). De no intervenir, se estima que 450 ninos adicionales abandonarian la escuela en los proximos 2 anos, incrementando los indices de trabajo infantil.",
    rubricCriterion: "Justificacion",
    rubricWeight: 10,
  },
  poblacion: {
    evaluatorCriteria:
      "Se espera una caracterizacion detallada de los beneficiarios: cantidad, ubicacion, genero, edad, condicion socioeconomica. Diferenciar beneficiarios directos e indirectos.",
    commonErrors: [
      "No cuantificar con precision los beneficiarios",
      "No diferenciar entre beneficiarios directos e indirectos",
      "Omitir la caracterizacion sociodemografica",
      "No explicar como se identifico la poblacion",
    ],
    exampleAnswer:
      "Beneficiarios directos: 1,200 estudiantes (52% ninas, 48% ninos) de 6 a 14 anos, pertenecientes a los estratos 1 y 2, residentes en 8 veredas del area rural. Beneficiarios indirectos: 3,500 personas (familias de los estudiantes). Fuente: SIMAT 2024 y encuesta municipal de caracterizacion.",
    rubricCriterion: "Poblacion objetivo",
    rubricWeight: 10,
  },
  presupuesto: {
    evaluatorCriteria:
      "El presupuesto debe estar detallado por componentes y actividades, con precios unitarios justificados. Las fuentes de financiacion deben estar claramente identificadas.",
    commonErrors: [
      "Presentar cifras globales sin desglose",
      "No justificar precios unitarios",
      "No identificar claramente la contrapartida",
      "Omitir costos indirectos (administracion, imprevistos)",
    ],
    exampleAnswer:
      "Presupuesto total: $850,000,000. Componente 1 - Infraestructura: $600M (cimentacion $120M, estructura $280M, acabados $200M). Componente 2 - Dotacion: $180M. Administracion (5%): $42.5M. Imprevistos (3%): $27.5M. Fuentes: SGR $600M (70.6%), Municipio $250M (29.4%).",
    rubricCriterion: "Presupuesto",
    rubricWeight: 15,
  },
  sostenibilidad: {
    evaluatorCriteria:
      "Se evalua que el proyecto tenga un plan claro para mantener los beneficios despues de finalizar la inversion. Debe abordar sostenibilidad tecnica, financiera e institucional.",
    commonErrors: [
      "Mencionar sostenibilidad de forma generica sin plan concreto",
      "No identificar quien asumira costos de operacion y mantenimiento",
      "Omitir compromisos institucionales",
      "No considerar la sostenibilidad ambiental",
    ],
    exampleAnswer:
      "Sostenibilidad financiera: El municipio incluira en su presupuesto anual $45M para operacion y mantenimiento, respaldado por Acuerdo del Concejo Municipal No. 012-2024. Sostenibilidad institucional: La Secretaria de Educacion asumira la operacion con 3 funcionarios asignados. Sostenibilidad ambiental: Se implementara plan de manejo de residuos solidos en la institucion.",
    rubricCriterion: "Sostenibilidad",
    rubricWeight: 10,
  },
  resultados: {
    evaluatorCriteria:
      "Los resultados esperados deben ser medibles con indicadores claros, linea base y metas cuantificables. Deben estar vinculados a los objetivos del proyecto.",
    commonErrors: [
      "Definir resultados vagos sin indicadores",
      "No establecer linea base",
      "Confundir productos con resultados",
      "No establecer metas cuantificables",
    ],
    exampleAnswer:
      "Resultado 1: Reduccion de la tasa de desercion escolar del 23% al 10% (indicador: tasa de desercion SIMAT). Resultado 2: 1,200 estudiantes con acceso a transporte escolar (indicador: # estudiantes transportados / # estudiantes matriculados zona rural). Linea base: 0 rutas escolares operando (2024).",
    rubricCriterion: "Resultados esperados",
    rubricWeight: 15,
  },
  cronograma: {
    evaluatorCriteria:
      "El cronograma debe mostrar actividades detalladas con fechas realistas, responsables asignados y dependencias entre actividades.",
    commonErrors: [
      "Actividades demasiado generales",
      "No considerar tiempos de procesos administrativos",
      "Fechas poco realistas",
      "No asignar responsables",
    ],
    exampleAnswer:
      "Fase 1 - Preconstruccion (Meses 1-2): Elaboracion de estudios y disenos, licencias. Fase 2 - Construccion (Meses 3-10): Cimentacion (M3-4), estructura (M5-7), acabados (M8-9), instalaciones (M10). Fase 3 - Dotacion y puesta en marcha (Meses 11-12). Responsable: Secretaria de Infraestructura.",
    rubricCriterion: "Cronograma",
    rubricWeight: 5,
  },
};

function getGuideForField(
  campoId: string,
  campoNombre: string,
): WritingGuideData | null {
  // Try exact match by campo ID
  const lower = campoId.toLowerCase();
  const nombreLower = campoNombre.toLowerCase();

  for (const [key, guide] of Object.entries(FIELD_GUIDES)) {
    if (lower.includes(key) || nombreLower.includes(key)) {
      return guide;
    }
  }

  return null;
}

export function FieldWritingGuide({
  campoId,
  campoNombre,
}: {
  campoId: string;
  campoNombre: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const guide = getGuideForField(campoId, campoNombre);

  if (!guide) return null;

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 transition-colors"
      >
        <svg
          className={`h-3 w-3 transition-transform ${expanded ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m8.25 4.5 7.5 7.5-7.5 7.5"
          />
        </svg>
        Guia de escritura
        {guide.rubricCriterion && (
          <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-600 border border-blue-100">
            Peso: {guide.rubricWeight}%
          </span>
        )}
      </button>

      {expanded && (
        <div className="mt-2 space-y-3 rounded-lg border border-blue-100 bg-blue-50/30 p-3 animate-fade-in">
          {/* What evaluators look for */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600">
              Que buscan los evaluadores
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">
              {guide.evaluatorCriteria}
            </p>
          </div>

          {/* Common errors */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-red-500">
              Errores comunes
            </p>
            <ul className="mt-1 space-y-0.5">
              {guide.commonErrors.map((err, i) => (
                <li
                  key={i}
                  className="flex items-start gap-1.5 text-[11px] text-text-muted"
                >
                  <span className="mt-0.5 text-red-400">&#x2717;</span>
                  {err}
                </li>
              ))}
            </ul>
          </div>

          {/* Example answer */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
              Ejemplo de respuesta nivel 4 (excelente)
            </p>
            <div className="mt-1 rounded-md bg-white/80 px-3 py-2 text-[11px] leading-relaxed text-text-secondary border border-emerald-100">
              {guide.exampleAnswer}
            </div>
          </div>

          {/* Rubric link */}
          {guide.rubricCriterion && (
            <div className="flex items-center gap-2 rounded-md bg-white/60 px-2 py-1.5 border border-blue-100">
              <svg
                className="h-3.5 w-3.5 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z"
                />
              </svg>
              <span className="text-[10px] text-blue-700">
                Criterio de rubrica:{" "}
                <strong>{guide.rubricCriterion}</strong> — Peso:{" "}
                {guide.rubricWeight}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
