import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plan de implementacion — Estructurador MGA",
  description:
    "Checklist y pasos para implementar el Estructurador MGA en tu entidad territorial. Desde la configuracion inicial hasta la evaluacion y evidencia.",
};

export default function ImplementacionPage() {
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
            <Link href="/casos" className="text-sm text-gray-600 hover:text-gray-900">
              Casos
            </Link>
            <Link href="/implementacion" className="text-sm font-medium text-gray-900">
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
            Plan de implementacion
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-gray-600">
            Pasos para poner en marcha el Estructurador MGA en tu entidad.
            Sin fechas fijas — cada entidad avanza a su ritmo.
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-3xl">
          <div className="space-y-0">
            <Phase
              number={1}
              title="Configuracion inicial"
              description="Preparar la plataforma y los accesos."
              items={[
                { task: "Crear cuenta de entidad administradora", role: "Admin" },
                { task: "Configurar variables de entorno (Supabase, API keys)", role: "Tecnico" },
                { task: "Verificar acceso al dashboard de entidad", role: "Admin" },
                { task: "Crear usuarios de prueba (entidad + municipio)", role: "Admin" },
              ]}
            />
            <Phase
              number={2}
              title="Diseno de la convocatoria"
              description="Definir la estructura que los municipios van a diligenciar."
              items={[
                { task: "Crear convocatoria (nombre, descripcion, requisitos, fechas)", role: "Admin" },
                { task: "Configurar plantilla MGA: definir etapas y campos por etapa", role: "Admin" },
                { task: "Marcar campos obligatorios vs opcionales", role: "Admin" },
                { task: "Revisar la plantilla con el equipo tecnico", role: "Equipo" },
              ]}
            />
            <Phase
              number={3}
              title="Documentos y contexto IA"
              description="Subir documentos que alimentan el asistente IA."
              items={[
                { task: "Recopilar documentos de referencia (guias, normativas, TdR)", role: "Equipo" },
                { task: "Subir documentos a la convocatoria (batch upload)", role: "Admin" },
                { task: "Procesar documentos para generar embeddings", role: "Sistema" },
                { task: "Verificar que el asistente IA cita correctamente", role: "Admin" },
              ]}
            />
            <Phase
              number={4}
              title="Rubrica de evaluacion"
              description="Definir los criterios y pesos para evaluar los proyectos."
              items={[
                { task: "Definir criterios de evaluacion por campo MGA", role: "Equipo" },
                { task: "Asignar pesos a cada criterio (importancia relativa)", role: "Admin" },
                { task: "Definir niveles de evaluacion (1-4: Insuficiente a Excelente)", role: "Admin" },
                { task: "Revisar la distribucion de pesos (barra visual)", role: "Admin" },
              ]}
            />
            <Phase
              number={5}
              title="Asignacion y apertura"
              description="Vincular municipios y abrir la convocatoria."
              items={[
                { task: "Asignar municipios a la convocatoria", role: "Admin" },
                { task: "Comunicar a los municipios (credenciales + instrucciones)", role: "Equipo" },
                { task: "Cambiar estado de convocatoria a 'abierta'", role: "Admin" },
                { task: "Monitorear primeros diligenciamientos", role: "Admin" },
              ]}
            />
            <Phase
              number={6}
              title="Acompanamiento y monitoreo"
              description="Seguimiento mientras los municipios diligencian."
              items={[
                { task: "Revisar tabla de monitoreo (progreso por municipio y etapa)", role: "Admin" },
                { task: "Identificar municipios con bajo avance", role: "Admin" },
                { task: "Usar ayuda contextual para resolver dudas de municipios", role: "Equipo" },
                { task: "Verificar calidad de respuestas con el asistente IA", role: "Admin" },
              ]}
            />
            <Phase
              number={7}
              title="Evaluacion y resultados"
              description="Evaluar y generar evidencia exportable."
              items={[
                { task: "Ejecutar evaluacion por etapa en monitoreo", role: "Admin" },
                { task: "Revisar scores ponderados y desglose por criterio", role: "Admin" },
                { task: "Leer recomendaciones de mejora generadas por IA", role: "Equipo" },
                { task: "Exportar PDF por municipio como evidencia", role: "Admin" },
                { task: "Compartir resultados con municipios y stakeholders", role: "Equipo" },
              ]}
              isLast
            />
          </div>
        </div>
      </section>

      {/* Kit summary */}
      <section className="border-t border-gray-100 bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Que incluye la plataforma
          </h2>
          <p className="mt-3 text-gray-600">
            Todo lo que necesitas para gestionar convocatorias MGA de punta a punta.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KitItem
              title="Gestion de convocatorias"
              items={["Crear y configurar", "Plantilla MGA flexible", "Asignacion de municipios"]}
            />
            <KitItem
              title="Diligenciamiento"
              items={["Wizard por etapas", "Guardado automatico", "Asistente IA contextual"]}
            />
            <KitItem
              title="Evaluacion"
              items={["Rubrica ponderada", "Scoring automatico", "Desglose por criterio"]}
            />
            <KitItem
              title="Evidencia"
              items={["Export PDF completo", "Monitoreo en tiempo real", "Historial de evaluaciones"]}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Listo para implementar?
          </h2>
          <p className="mt-3 text-gray-600">
            Prueba la demo interactiva o inicia sesion para configurar tu
            primera convocatoria.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Link
              href="/#demo"
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Ver demo
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Iniciar sesion
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

function Phase({
  number,
  title,
  description,
  items,
  isLast = false,
}: {
  number: number;
  title: string;
  description: string;
  items: { task: string; role: string }[];
  isLast?: boolean;
}) {
  return (
    <div className="relative flex gap-4">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
          {number}
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-gray-200" />}
      </div>

      {/* Content */}
      <div className={`min-w-0 flex-1 ${isLast ? "pb-0" : "pb-8"}`}>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <p className="mt-0.5 text-sm text-gray-500">{description}</p>
        <div className="mt-3 space-y-2">
          {items.map((item) => (
            <div
              key={item.task}
              className="flex items-start gap-3 rounded-md border border-gray-100 bg-gray-50 px-3 py-2"
            >
              <div className="mt-0.5 h-4 w-4 shrink-0 rounded border border-gray-300 bg-white" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-700">{item.task}</p>
              </div>
              <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                {item.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KitItem({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 text-left">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <ul className="mt-2 space-y-1">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-center gap-2 text-xs text-gray-600"
          >
            <span className="block h-1 w-1 shrink-0 rounded-full bg-blue-400" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
