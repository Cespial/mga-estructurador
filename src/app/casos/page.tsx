import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Casos de uso — Estructurador MGA",
  description:
    "Descubre como entidades territoriales usan el Estructurador MGA para gestionar convocatorias, evaluar proyectos y generar evidencia auditable.",
};

export default function CasosPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-lg font-bold text-gray-900">
            Estructurador MGA
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/#demo" className="text-sm text-gray-600 hover:text-gray-900">
              Demo
            </Link>
            <Link href="/casos" className="text-sm font-medium text-gray-900">
              Casos
            </Link>
            <Link href="/implementacion" className="text-sm text-gray-600 hover:text-gray-900">
              Implementacion
            </Link>
            <Link
              href="/login"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Entrar
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="px-4 pb-12 pt-16">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Casos de uso
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-gray-600">
            Escenarios reales donde el Estructurador MGA aporta valor. Los datos
            mostrados son representativos del funcionamiento de la plataforma.
          </p>
        </div>
      </section>

      {/* Case studies */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-4xl space-y-8">
          <CaseStudy
            title="Convocatoria de Infraestructura Vial"
            entity="Gobernacion departamental"
            description="La gobernacion abrio una convocatoria para recibir proyectos MGA de mejoramiento de vias terciarias en 12 municipios."
            challenge="Cada municipio enviaba documentos en formatos diferentes (Word, PDF, correo). La evaluacion tomaba semanas y los criterios variaban entre evaluadores."
            solution="Se configuro una plantilla MGA con 5 etapas (Identificacion, Preparacion, Evaluacion, Programacion, Seguimiento), rubrica ponderada con 8 criterios y documentos de referencia para el asistente IA."
            results={[
              "12 municipios diligenciaron simultaneamente",
              "Evaluacion estandarizada con rubrica ponderada",
              "PDF de resultados por municipio con desglose por criterio",
              "Recomendaciones automaticas de mejora por etapa",
            ]}
            tags={["Infraestructura", "12 municipios", "5 etapas"]}
          />

          <CaseStudy
            title="Proyectos de Saneamiento Basico"
            entity="Entidad territorial"
            description="Una entidad territorial necesitaba evaluar proyectos de acueducto y alcantarillado presentados por municipios rurales."
            challenge="Los municipios pequenos no tenian experiencia en estructuracion MGA. Las respuestas eran incompletas y carecian de datos tecnicos suficientes."
            solution="Se habilito el asistente IA con documentos tecnicos de referencia (guias MVCT, normativa RAS). Los municipios usaron las sugerencias del asistente para mejorar la calidad de sus respuestas."
            results={[
              "Asistente IA con contexto de documentos tecnicos (RAG)",
              "Mejora en la calidad de respuestas con sugerencias contextuales",
              "Progreso visible en tiempo real para la entidad",
              "Exportacion de evidencia completa en PDF",
            ]}
            tags={["Saneamiento", "Asistente IA", "Municipios rurales"]}
          />

          <CaseStudy
            title="Evaluacion de Proyectos Educativos"
            entity="Secretaria de Educacion"
            description="La secretaria de educacion requeria evaluar proyectos de infraestructura educativa bajo criterios tecnicos y pedagogicos."
            challenge="Los criterios de evaluacion combinaban aspectos tecnicos (presupuesto, cronograma) con pedagogicos (impacto educativo, cobertura). Se necesitaba un scoring que ponderara ambos."
            solution="Se creo una rubrica con criterios de diferente peso: mayor peso a impacto educativo y cobertura, menor peso a aspectos administrativos. El scoring ponderado refleja las prioridades institucionales."
            results={[
              "Rubrica con pesos diferenciados por tipo de criterio",
              "Score ponderado que refleja prioridades institucionales",
              "Desglose transparente: cada municipio ve su evaluacion por criterio",
              "Historial de evaluaciones para auditoria",
            ]}
            tags={["Educacion", "Scoring ponderado", "Auditoria"]}
          />
        </div>
      </section>

      {/* Disclaimer */}
      <section className="border-t border-gray-100 bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs text-gray-500">
            Los casos descritos representan escenarios tipicos de uso de la
            plataforma. Los datos son ilustrativos y reflejan las capacidades
            funcionales del sistema.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Quieres ver como funciona?
          </h2>
          <p className="mt-3 text-gray-600">
            Prueba la demo interactiva o contactanos para una implementacion
            en tu entidad.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Link
              href="/#demo"
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Ver demo
            </Link>
            <Link
              href="/implementacion"
              className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Plan de implementacion
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-6xl text-center text-sm text-gray-500">
          <p>Estructurador MGA &mdash; Plataforma de gestion de proyectos MGA por convocatorias.</p>
          <div className="mt-2 flex items-center justify-center gap-4 text-xs">
            <Link href="/" className="hover:text-gray-700">Inicio</Link>
            <Link href="/casos" className="hover:text-gray-700">Casos</Link>
            <Link href="/implementacion" className="hover:text-gray-700">Implementacion</Link>
            <Link href="/login" className="hover:text-gray-700">Entrar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Sub-components ── */

function CaseStudy({
  title,
  entity,
  description,
  challenge,
  solution,
  results,
  tags,
}: {
  title: string;
  entity: string;
  description: string;
  challenge: string;
  solution: string;
  results: string[];
  tags: string[];
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <p className="mt-0.5 text-sm text-gray-500">{entity}</p>
          </div>
          <div className="flex shrink-0 gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-medium text-blue-700"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 py-5">
        <p className="text-sm text-gray-700">{description}</p>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-red-500">
              Desafio
            </p>
            <p className="text-sm text-gray-600">{challenge}</p>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-blue-600">
              Solucion
            </p>
            <p className="text-sm text-gray-600">{solution}</p>
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-green-600">
            Resultados
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {results.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-sm text-gray-700"
              >
                <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}
