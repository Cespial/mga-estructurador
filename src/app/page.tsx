import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Publitec — Gestiona convocatorias con inteligencia artificial",
  description:
    "Plataforma donde entidades crean convocatorias con rubricas y municipios estructuran proyectos con asistencia IA. Reportes Excel y PDF profesionales con analisis de pre-factibilidad.",
  openGraph: {
    title: "Publitec",
    description: "Gestiona convocatorias con inteligencia artificial.",
    type: "website",
    locale: "es_CO",
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-app">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 glass border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <span className="text-sm font-bold text-white">P</span>
            </div>
            <span className="text-lg font-bold text-text-primary">
              Publi<span className="text-accent">tec</span>
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
              Funcionalidades
            </a>
            <a href="#como-funciona" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
              Como funciona
            </a>
            <a href="#entidades" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
              Entidades
            </a>
            <Link
              href="/login"
              className="rounded-[var(--radius-button)] bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
            >
              Entrar
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-20 pt-24">
        {/* Glow effect */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-accent/5 blur-[120px]" />
        <div className="relative mx-auto max-w-6xl">
          <div className="text-center">
            <div className="mb-6 inline-flex rounded-[var(--radius-pill)] border border-accent/20 bg-accent-muted px-4 py-1.5 text-xs font-medium text-accent">
              Plataforma de convocatorias con IA
            </div>
            <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
              Gestiona convocatorias con{" "}
              <span className="text-accent">inteligencia artificial</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-text-secondary">
              Entidades crean convocatorias con rubricas. Municipios estructuran
              proyectos con asistente IA. Genera reportes Excel y PDF
              profesionales con analisis de pre-factibilidad.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/login?action=signup"
                className="rounded-[var(--radius-button)] bg-accent px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-accent-hover transition-all glow-accent"
              >
                Crear Convocatoria
              </Link>
              <Link
                href="/dashboard/convocatorias"
                className="rounded-[var(--radius-button)] border border-border-hover bg-transparent px-6 py-3 text-sm font-semibold text-text-primary hover:bg-white/5 transition-colors"
              >
                Explorar Demo
              </Link>
            </div>
          </div>

          {/* Dashboard preview mockup */}
          <div className="mt-16 rounded-[var(--radius-shell)] border border-border bg-bg-card p-2 shadow-[var(--shadow-elevated)]">
            <div className="rounded-[var(--radius-card)] bg-bg-sidebar p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-3 w-3 rounded-full bg-danger/60" />
                <div className="h-3 w-3 rounded-full bg-warning/60" />
                <div className="h-3 w-3 rounded-full bg-success/60" />
                <div className="ml-auto h-6 w-32 rounded bg-white/5" />
              </div>
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Convocatorias Activas", value: "12" },
                  { label: "Proyectos Recibidos", value: "47" },
                  { label: "Evaluados", value: "31" },
                  { label: "Puntaje Promedio", value: "78.4" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-[var(--radius-card)] border border-border bg-bg-card p-4">
                    <p className="text-xs text-text-muted">{stat.label}</p>
                    <p className="mt-1 text-2xl font-bold text-text-primary">{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-[var(--radius-card)] border border-border bg-bg-card p-4 h-32">
                  <p className="text-xs text-text-muted mb-3">Convocatorias Recientes</p>
                  <div className="space-y-2">
                    <div className="h-4 w-3/4 rounded bg-white/5" />
                    <div className="h-4 w-1/2 rounded bg-white/5" />
                    <div className="h-4 w-2/3 rounded bg-white/5" />
                  </div>
                </div>
                <div className="rounded-[var(--radius-card)] border border-border bg-bg-card p-4 h-32">
                  <p className="text-xs text-text-muted mb-3">Proyectos Recientes</p>
                  <div className="space-y-2">
                    <div className="h-4 w-2/3 rounded bg-accent/10" />
                    <div className="h-4 w-3/4 rounded bg-accent/10" />
                    <div className="h-4 w-1/2 rounded bg-accent/10" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-16 border-t border-border px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-text-primary">
              Todo lo que necesitas para gestionar convocatorias
            </h2>
            <p className="mt-4 text-text-secondary">
              Desde la creacion hasta el reporte final, todo en un solo lugar.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3 stagger-children">
            <FeatureCard
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              }
              title="Convocatorias Inteligentes"
              description="Crea convocatorias con formularios personalizables, etapas configurables y rubricas de evaluacion detalladas."
            />
            <FeatureCard
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
              }
              title="Asistente IA"
              description="Claude asiste a municipios campo por campo. Sugiere textos, identifica riesgos y completa secciones con informacion contextual."
            />
            <FeatureCard
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              }
              title="Reportes Profesionales"
              description="Genera reportes Excel y PDF con scoring detallado, justificaciones por criterio y analisis comparativo."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="scroll-mt-16 border-t border-border px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-text-primary">Como funciona</h2>
            <p className="mt-4 text-text-secondary">
              Un flujo claro de punta a punta, desde la convocatoria hasta el reporte.
            </p>
          </div>
          <div className="mt-12 grid gap-0 sm:grid-cols-4">
            {[
              { step: "1", label: "Crear Convocatoria", desc: "La entidad define formulario, etapas y rubrica de evaluacion." },
              { step: "2", label: "Estructurar Proyecto", desc: "El municipio completa el wizard con asistencia IA paso a paso." },
              { step: "3", label: "Evaluar con IA", desc: "Claude evalua cada criterio de la rubrica y genera puntajes justificados." },
              { step: "4", label: "Descargar Reporte", desc: "Exporta resultados en Excel y PDF profesional con pre-factibilidad." },
            ].map((item, i) => (
              <div key={item.step} className="relative flex flex-col items-center text-center px-4">
                {i > 0 && (
                  <div className="absolute left-0 top-6 hidden h-0.5 w-full -translate-x-1/2 bg-border sm:block" />
                )}
                <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-lg font-bold text-white shadow-[var(--shadow-glow)]">
                  {item.step}
                </div>
                <h3 className="mt-4 text-sm font-semibold text-text-primary">{item.label}</h3>
                <p className="mt-2 text-xs text-text-secondary max-w-[180px]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Entities section */}
      <section id="entidades" className="scroll-mt-16 border-t border-border px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-text-primary">
            Construido para entidades publicas
          </h2>
          <p className="mt-4 text-text-secondary">
            Disenado para gobernaciones, institutos de desarrollo y entidades que gestionan convocatorias con municipios.
          </p>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
            {["IDEA", "Gobernacion de Antioquia", "EAFIT", "Argos"].map((entity) => (
              <div
                key={entity}
                className="rounded-[var(--radius-card)] border border-border bg-bg-card px-6 py-4 text-sm font-medium text-text-secondary"
              >
                {entity}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-text-primary">
            Listo para transformar tus convocatorias?
          </h2>
          <p className="mt-4 text-text-secondary">
            Empieza a gestionar convocatorias, recibir proyectos estructurados y
            evaluar con inteligencia artificial.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/login?action=signup"
              className="rounded-[var(--radius-button)] bg-accent px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-accent-hover transition-all glow-accent"
            >
              Comenzar ahora
            </Link>
            <Link
              href="/dashboard/convocatorias"
              className="rounded-[var(--radius-button)] border border-border-hover bg-transparent px-6 py-3 text-sm font-semibold text-text-primary hover:bg-white/5 transition-colors"
            >
              Explorar Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-accent text-xs font-bold text-white">P</div>
              <span className="text-sm font-semibold text-text-secondary">Publitec</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-text-muted">
              <a href="#features" className="hover:text-text-secondary transition-colors">Funcionalidades</a>
              <a href="#como-funciona" className="hover:text-text-secondary transition-colors">Como funciona</a>
              <Link href="/login" className="hover:text-text-secondary transition-colors">Entrar</Link>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-text-muted">
            Publitec &mdash; Plataforma de convocatorias con inteligencia artificial.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ── Sub-components ── */

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="card-premium p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-input)] bg-accent-muted text-accent">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold text-text-primary">{title}</h3>
      <p className="mt-2 text-sm text-text-secondary">{description}</p>
    </div>
  );
}
