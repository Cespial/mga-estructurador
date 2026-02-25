import Link from "next/link";
import type { Metadata } from "next";
import { InteractiveDemo } from "@/components/landing/interactive-demo";

export const metadata: Metadata = {
  title: "Estructurador MGA — Estructura, evalua y evidencia proyectos MGA",
  description:
    "Plataforma para estructurar proyectos MGA por convocatorias. Configura etapas, recibe informacion, evalua con rubricas ponderadas y exporta resultados en PDF con asistente IA.",
  openGraph: {
    title: "Estructurador MGA",
    description:
      "Estructura, recibe, evalua y evidencia proyectos MGA — sin friccion.",
    type: "website",
    locale: "es_CO",
  },
  twitter: {
    card: "summary_large_image",
    title: "Estructurador MGA",
    description:
      "Estructura, recibe, evalua y evidencia proyectos MGA — sin friccion.",
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <span className="text-lg font-bold text-gray-900">
            Estructurador MGA
          </span>
          <div className="flex items-center gap-4">
            <a href="#demo" className="text-sm text-gray-600 hover:text-gray-900">
              Demo
            </a>
            <a href="#como-funciona" className="text-sm text-gray-600 hover:text-gray-900">
              Flujo
            </a>
            <a href="#beneficios" className="text-sm text-gray-600 hover:text-gray-900">
              Beneficios
            </a>
            <Link
              href="/login"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Entrar
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-16 pt-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <div className="mb-4 inline-flex rounded-full bg-blue-50 px-4 py-1.5 text-xs font-medium text-blue-700">
              Plataforma de gestion MGA por convocatorias
            </div>
            <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Estructura, recibe, evalua y{" "}
              <span className="text-blue-600">evidencia en PDF</span>
              {" "}&mdash; sin friccion
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
              Configura convocatorias con etapas y campos. Los municipios
              diligencian con asistente IA. Evalua con rubricas ponderadas.
              Exporta todo en PDF auditables.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <a
                href="#demo"
                className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Ver demo guiada
              </a>
              <Link
                href="/login"
                className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Iniciar sesion
              </Link>
            </div>
          </div>

          {/* Flow visualization */}
          <div className="mt-16">
            <FlowSteps />
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="border-t border-gray-100 bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            El problema que resolvemos
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <ProblemCard
              title="Informacion dispersa"
              description="Cada municipio envia proyectos en formatos diferentes. No hay estructura estandar ni trazabilidad."
            />
            <ProblemCard
              title="Evaluacion manual"
              description="Evaluar decenas de proyectos MGA toma semanas. Los criterios varian entre evaluadores."
            />
            <ProblemCard
              title="Sin evidencia auditable"
              description="No hay registro claro de que se evaluo, con que criterios y que puntaje obtuvo cada proyecto."
            />
          </div>
        </div>
      </section>

      {/* Solution */}
      <section id="como-funciona" className="scroll-mt-16 border-t border-gray-100 px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Como lo resolvemos
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-gray-600">
            Un flujo estructurado de punta a punta: desde la configuracion
            hasta el PDF de resultados.
          </p>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            <SolutionCard
              step="1"
              title="La entidad configura"
              items={[
                "Crea la convocatoria",
                "Define etapas y campos MGA",
                "Sube documentos de soporte",
                "Configura rubrica ponderada",
              ]}
            />
            <SolutionCard
              step="2"
              title="El municipio diligencia"
              items={[
                "Accede a convocatorias asignadas",
                "Completa el wizard por etapas",
                "Usa el asistente IA para mejorar",
                "Progreso guardado automaticamente",
              ]}
            />
            <SolutionCard
              step="3"
              title="Evaluacion y evidencia"
              items={[
                "Scoring automatico con IA",
                "Desglose por criterio y peso",
                "Recomendaciones de mejora",
                "Export PDF por municipio",
              ]}
            />
          </div>
        </div>
      </section>

      {/* Interactive Demo */}
      <section id="demo" className="scroll-mt-16 border-t border-gray-100 bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Demo interactiva
            </h2>
            <p className="mt-3 text-gray-600">
              Experimenta el flujo completo: diligencia campos, ve el scoring
              ponderado y el resumen ejecutivo.
            </p>
          </div>
          <div className="mt-8">
            <InteractiveDemo />
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="beneficios" className="scroll-mt-16 border-t border-gray-100 px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Beneficios medibles
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <BenefitCard
              title="Estandarizacion"
              description="Todos los municipios siguen la misma estructura MGA definida por la entidad."
            />
            <BenefitCard
              title="Evaluacion objetiva"
              description="Rubricas ponderadas con criterios claros. Score reproducible y auditable."
            />
            <BenefitCard
              title="Asistente IA"
              description="Sugerencias contextuales basadas en documentos de la convocatoria (RAG)."
            />
            <BenefitCard
              title="Evidencia en PDF"
              description="Exporta respuestas, evaluaciones y recomendaciones por municipio."
            />
          </div>
        </div>
      </section>

      {/* Evidence / Trust */}
      <section className="border-t border-gray-100 bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-gray-900">
            Auditable por diseno
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <TrustCard
              title="Rubrica ponderada"
              description="Criterios con pesos, niveles de evaluacion (1-4) y score calculado transparentemente."
            />
            <TrustCard
              title="Export PDF completo"
              description="Nombre, progreso, campos por etapa, evaluacion con desglose y recomendaciones."
            />
            <TrustCard
              title="Control de acceso"
              description="Roles separados (entidad/municipio), aislamiento por tenant, sesiones seguras."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-100 px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Listo para estructurar tus convocatorias?
          </h2>
          <p className="mt-3 text-gray-600">
            Empieza a configurar convocatorias, recibir proyectos MGA y
            evaluar con criterios claros.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/login"
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Comenzar ahora
            </Link>
            <a
              href="#demo"
              className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Ver demo
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-6xl text-center text-sm text-gray-500">
          <p>
            Estructurador MGA &mdash; Plataforma de gestion de proyectos MGA
            por convocatorias.
          </p>
          <p className="mt-1">
            Desarrollado con Next.js, Supabase y Claude AI.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ── Sub-components ── */

function FlowSteps() {
  const steps = [
    { label: "Configurar", desc: "Convocatoria + plantilla + rubrica", color: "bg-blue-600" },
    { label: "Diligenciar", desc: "Wizard por etapas + asistente IA", color: "bg-indigo-600" },
    { label: "Evaluar", desc: "Scoring ponderado automatico", color: "bg-violet-600" },
    { label: "Evidenciar", desc: "Export PDF auditable", color: "bg-purple-600" },
  ];

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-0">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white ${step.color}`}
            >
              {i + 1}
            </div>
            <p className="mt-2 text-sm font-semibold text-gray-900">
              {step.label}
            </p>
            <p className="mt-0.5 max-w-[140px] text-center text-xs text-gray-500">
              {step.desc}
            </p>
          </div>
          {i < steps.length - 1 && (
            <div className="mx-4 hidden h-0.5 w-12 bg-gray-300 sm:block" />
          )}
        </div>
      ))}
    </div>
  );
}

function ProblemCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 text-left">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
    </div>
  );
}

function SolutionCard({
  step,
  title,
  items,
}: {
  step: string;
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 text-left">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
          {step}
        </span>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
            <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function BenefitCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 text-left">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
    </div>
  );
}

function TrustCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 text-left">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
    </div>
  );
}
