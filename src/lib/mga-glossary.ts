/**
 * MGA Glossary — Terms and definitions from DNP methodology
 * Used for contextual tooltips in the wizard.
 */

export interface GlossaryTerm {
  term: string;
  definition: string;
  example?: string;
  /** Alternative forms to match in text (lowercase) */
  aliases?: string[];
}

export const MGA_GLOSSARY: GlossaryTerm[] = [
  {
    term: "Arbol de problemas",
    definition:
      "Herramienta de analisis que permite identificar el problema central, sus causas directas e indirectas, y sus efectos. Es la base para formular la solucion del proyecto.",
    example:
      "Problema central: Alta tasa de desercion escolar. Causa directa: Falta de transporte escolar. Efecto: Baja cobertura educativa.",
    aliases: ["arbol de problemas", "arbol problemas"],
  },
  {
    term: "Arbol de objetivos",
    definition:
      "Transformacion positiva del arbol de problemas. Convierte problemas en objetivos, causas en medios, y efectos en fines.",
    example:
      "Objetivo: Reducir la tasa de desercion escolar. Medio: Implementar rutas de transporte escolar.",
    aliases: ["arbol de objetivos", "arbol objetivos"],
  },
  {
    term: "Marco logico",
    definition:
      "Matriz que resume el diseno del proyecto: objetivo general, objetivo especifico, componentes (productos), actividades, indicadores, medios de verificacion y supuestos.",
    aliases: ["marco logico", "matriz de marco logico"],
  },
  {
    term: "Linea base",
    definition:
      "Valor inicial del indicador antes de la intervencion del proyecto. Permite medir el cambio generado.",
    example:
      "Linea base: 45% de cobertura de agua potable (2023). Meta: 80% de cobertura (2025).",
    aliases: ["linea base", "linea de base"],
  },
  {
    term: "Indicador",
    definition:
      "Variable cuantitativa o cualitativa que permite medir el logro de los objetivos del proyecto. Debe ser especifico, medible, alcanzable, relevante y temporal (SMART).",
    example: "Porcentaje de hogares con acceso a agua potable.",
    aliases: ["indicadores"],
  },
  {
    term: "Meta",
    definition:
      "Valor esperado del indicador al final del proyecto. Representa el cambio cuantificable que se busca lograr.",
    example: "Incrementar la cobertura de alcantarillado del 30% al 65%.",
    aliases: ["metas"],
  },
  {
    term: "Componente",
    definition:
      "Producto o servicio concreto que entrega el proyecto. Cada componente agrupa actividades relacionadas para lograr un resultado especifico.",
    example:
      "Componente 1: Construccion de aulas. Componente 2: Dotacion de mobiliario.",
    aliases: ["componentes"],
  },
  {
    term: "Actividad",
    definition:
      "Accion concreta necesaria para producir un componente. Tiene un costo, duracion y responsable asignado.",
    example: "Actividad 1.1: Adecuacion del terreno. Actividad 1.2: Cimentacion.",
    aliases: ["actividades"],
  },
  {
    term: "Poblacion objetivo",
    definition:
      "Grupo especifico de personas que seran beneficiadas directamente por el proyecto. Se debe cuantificar y caracterizar.",
    example:
      "3,500 estudiantes de educacion basica primaria del area rural del municipio.",
    aliases: [
      "poblacion objetivo",
      "poblacion beneficiaria",
      "beneficiarios",
      "beneficiarios directos",
    ],
  },
  {
    term: "Justificacion",
    definition:
      "Argumento que explica por que es necesario ejecutar el proyecto. Incluye evidencia del problema, datos estadisticos y normatividad aplicable.",
    aliases: ["justificacion del proyecto"],
  },
  {
    term: "Sostenibilidad",
    definition:
      "Capacidad del proyecto para mantener sus beneficios en el tiempo despues de finalizada la intervencion. Incluye sostenibilidad tecnica, financiera, ambiental e institucional.",
    aliases: ["sostenibilidad del proyecto"],
  },
  {
    term: "Presupuesto",
    definition:
      "Estimacion detallada de los costos del proyecto desglosados por componentes y actividades. Incluye fuentes de financiacion.",
    aliases: ["presupuesto del proyecto", "presupuesto detallado"],
  },
  {
    term: "Cronograma",
    definition:
      "Plan temporal que muestra la secuencia y duracion de las actividades del proyecto, generalmente representado en un diagrama de Gantt.",
    aliases: ["cronograma de actividades"],
  },
  {
    term: "Supuestos",
    definition:
      "Condiciones externas necesarias para el exito del proyecto que estan fuera del control del ejecutor. Si no se cumplen, el proyecto puede verse afectado.",
    example:
      "Supuesto: El municipio mantiene la contrapartida aprobada durante toda la ejecucion.",
    aliases: ["supuestos del proyecto"],
  },
  {
    term: "Riesgos",
    definition:
      "Eventos o condiciones inciertas que pueden afectar negativamente el desarrollo o resultados del proyecto. Se deben identificar, evaluar y mitigar.",
    aliases: ["riesgos del proyecto", "analisis de riesgos"],
  },
  {
    term: "Estudio tecnico",
    definition:
      "Analisis de la viabilidad tecnica del proyecto: localizacion, tamano, tecnologia, ingenieria basica y requerimientos de recursos.",
    aliases: ["estudio tecnico", "estudios tecnicos"],
  },
  {
    term: "Diagnostico",
    definition:
      "Descripcion y analisis de la situacion actual del problema que motiva el proyecto. Incluye datos, estadisticas y contexto territorial.",
    aliases: ["diagnostico situacional", "diagnostico del problema"],
  },
  {
    term: "Contrapartida",
    definition:
      "Aporte de recursos (financieros, en especie o humanos) que el municipio compromete como complemento a los recursos solicitados.",
    example:
      "Contrapartida municipal: $200,000,000 en mano de obra y maquinaria.",
    aliases: ["contrapartida municipal", "contrapartidas"],
  },
  {
    term: "CDP",
    definition:
      "Certificado de Disponibilidad Presupuestal. Documento que garantiza la existencia de recursos en el presupuesto del municipio para financiar el proyecto.",
    aliases: ["cdp", "certificado de disponibilidad presupuestal"],
  },
  {
    term: "DTS",
    definition:
      "Documento Tecnico Soporte. Contiene la informacion tecnica detallada que sustenta la formulacion del proyecto.",
    aliases: ["dts", "documento tecnico soporte"],
  },
  {
    term: "MGA",
    definition:
      "Metodologia General Ajustada. Marco metodologico del DNP (Departamento Nacional de Planeacion) para la formulacion y evaluacion de proyectos de inversion publica en Colombia.",
    aliases: ["mga", "metodologia general ajustada"],
  },
  {
    term: "DNP",
    definition:
      "Departamento Nacional de Planeacion. Entidad del gobierno colombiano que coordina la formulacion y evaluacion de proyectos de inversion publica.",
    aliases: ["dnp", "departamento nacional de planeacion"],
  },
  {
    term: "BPIN",
    definition:
      "Banco de Programas y Proyectos de Inversion Nacional. Sistema de informacion del DNP donde se registran todos los proyectos de inversion publica.",
    aliases: ["bpin", "banco de proyectos"],
  },
  {
    term: "Impacto ambiental",
    definition:
      "Efectos positivos o negativos que el proyecto puede generar sobre el medio ambiente. Se deben identificar medidas de mitigacion para impactos negativos.",
    aliases: ["impacto ambiental", "evaluacion ambiental"],
  },
];

/**
 * Find glossary terms present in a given text.
 * Returns matching terms in order of appearance.
 */
export function findTermsInText(text: string): GlossaryTerm[] {
  const lower = text.toLowerCase();
  const found: { term: GlossaryTerm; index: number }[] = [];

  for (const entry of MGA_GLOSSARY) {
    const searchTerms = [entry.term.toLowerCase(), ...(entry.aliases ?? [])];
    for (const searchTerm of searchTerms) {
      const idx = lower.indexOf(searchTerm);
      if (idx !== -1) {
        found.push({ term: entry, index: idx });
        break; // found one match for this term, skip other aliases
      }
    }
  }

  // Sort by position in text, deduplicate
  found.sort((a, b) => a.index - b.index);
  const seen = new Set<string>();
  return found
    .filter((f) => {
      if (seen.has(f.term.term)) return false;
      seen.add(f.term.term);
      return true;
    })
    .map((f) => f.term);
}
