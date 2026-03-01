import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PuBlitec — Gestiona convocatorias con inteligencia artificial",
  description:
    "Plataforma donde entidades crean convocatorias con rubricas y municipios estructuran proyectos con asistencia IA. Reportes Excel y PDF profesionales con analisis de pre-factibilidad.",
  openGraph: {
    title: "PuBlitec",
    description: "Gestiona convocatorias con inteligencia artificial.",
    type: "website",
    locale: "es_CO",
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-app">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <span className="text-sm font-bold text-white">P</span>
            </div>
            <span className="text-lg font-semibold text-text-primary">
              PuBli<span className="text-accent">tec</span>
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-[13px] text-text-secondary hover:text-text-primary transition-colors">
              Funcionalidades
            </a>
            <a href="#como-funciona" className="text-[13px] text-text-secondary hover:text-text-primary transition-colors">
              Como funciona
            </a>
            <a href="#piloto" className="text-[13px] text-text-secondary hover:text-text-primary transition-colors">
              Piloto
            </a>
            <a href="#entidades" className="text-[13px] text-text-secondary hover:text-text-primary transition-colors">
              Entidades
            </a>
            <Link
              href="/login"
              className="rounded-[var(--radius-button)] bg-accent px-4 py-2 text-[13px] font-medium text-white hover:bg-accent-hover transition-colors"
            >
              Entrar
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-20 pt-24">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-accent/[0.03] blur-[100px]" />
        <div className="relative mx-auto max-w-6xl">
          <div className="text-center">
            <div className="mb-6 inline-flex rounded-[var(--radius-pill)] border border-accent/20 bg-accent-muted px-4 py-1.5 text-xs font-medium text-accent">
              Plataforma de convocatorias con IA
            </div>
            <h1 className="mx-auto max-w-4xl text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl lg:text-[56px] lg:leading-[1.1]">
              Gestiona convocatorias con{" "}
              <span className="text-accent">inteligencia artificial</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-[16px] text-text-secondary leading-relaxed">
              Entidades crean convocatorias con rubricas. Municipios estructuran
              proyectos con asistente IA. Genera reportes Excel y PDF
              profesionales con analisis de pre-factibilidad.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/login?action=signup"
                className="rounded-[var(--radius-button)] bg-accent px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-accent-hover transition-all"
              >
                Crear Convocatoria
              </Link>
              <Link
                href="/dashboard/convocatorias"
                className="rounded-[var(--radius-button)] border border-border bg-white px-6 py-3 text-sm font-semibold text-text-primary hover:bg-bg-elevated transition-colors"
              >
                Explorar Demo
              </Link>
            </div>
          </div>

          {/* Dashboard preview mockup */}
          <div className="mt-16 rounded-[var(--radius-shell)] border border-border bg-[#1c1c28] p-2 shadow-[var(--shadow-elevated)]">
            <div className="rounded-[var(--radius-card)] bg-[#22222e] p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-3 w-3 rounded-full bg-red-400/60" />
                <div className="h-3 w-3 rounded-full bg-amber-400/60" />
                <div className="h-3 w-3 rounded-full bg-emerald-400/60" />
                <div className="ml-auto h-6 w-32 rounded bg-white/5" />
              </div>
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: "CONVOCATORIAS ACTIVAS", value: "12" },
                  { label: "PROYECTOS RECIBIDOS", value: "47" },
                  { label: "EVALUADOS", value: "31" },
                  { label: "PUNTAJE PROMEDIO", value: "78.4" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted">{stat.label}</p>
                    <p className="mt-2 text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 h-28">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted mb-3">Convocatorias Recientes</p>
                  <div className="space-y-2">
                    <div className="h-3 w-3/4 rounded bg-white/5" />
                    <div className="h-3 w-1/2 rounded bg-white/5" />
                    <div className="h-3 w-2/3 rounded bg-white/5" />
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 h-28">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted mb-3">Proyectos Recientes</p>
                  <div className="space-y-2">
                    <div className="h-3 w-2/3 rounded bg-accent/20" />
                    <div className="h-3 w-3/4 rounded bg-accent/20" />
                    <div className="h-3 w-1/2 rounded bg-accent/20" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-16 border-t border-border px-4 py-20 bg-bg-elevated">
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
                  <div className="absolute left-0 top-6 hidden h-px w-full -translate-x-1/2 bg-border sm:block" />
                )}
                <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-lg font-bold text-white shadow-sm">
                  {item.step}
                </div>
                <h3 className="mt-4 text-sm font-semibold text-text-primary">{item.label}</h3>
                <p className="mt-2 text-xs text-text-secondary max-w-[180px]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Piloto */}
      <section id="piloto" className="scroll-mt-16 border-t border-border px-4 py-20 bg-bg-elevated">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <div className="mb-4 inline-flex rounded-[var(--radius-pill)] border border-accent/20 bg-accent-muted px-4 py-1.5 text-xs font-medium text-accent">
              Acceso piloto disponible
            </div>
            <h2 className="text-3xl font-bold text-text-primary">
              Instrucciones del Piloto
            </h2>
            <p className="mt-4 text-text-secondary max-w-2xl mx-auto">
              Explora PuBlitec con cuentas de prueba. Hay dos roles principales: la
              entidad que crea convocatorias y el municipio que estructura proyectos
              con asistencia IA.
            </p>
          </div>

          {/* Credenciales */}
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            <div className="rounded-[var(--radius-card)] border border-border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">Entidad (Administrador)</h3>
                  <p className="text-[11px] text-text-muted">Crea convocatorias, define rubricas y evalua</p>
                </div>
              </div>
              <div className="space-y-2 rounded-lg bg-bg-elevated p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Correo</span>
                  <code className="rounded bg-white px-2 py-0.5 text-xs font-mono text-text-primary border border-border">entidad@mga.local</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Contrasena</span>
                  <code className="rounded bg-white px-2 py-0.5 text-xs font-mono text-text-primary border border-border">Demo1234!</code>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-text-muted leading-relaxed">
                Con esta cuenta puedes crear convocatorias, configurar formularios por etapas, definir
                rubricas de evaluacion con pesos, monitorear proyectos recibidos, evaluar con IA y
                descargar reportes.
              </p>
            </div>

            <div className="rounded-[var(--radius-card)] border border-border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">Municipio (Usuario)</h3>
                  <p className="text-[11px] text-text-muted">Estructura proyectos y recibe asistencia IA</p>
                </div>
              </div>
              <div className="space-y-2 rounded-lg bg-bg-elevated p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Correo</span>
                  <code className="rounded bg-white px-2 py-0.5 text-xs font-mono text-text-primary border border-border">municipio1@mga.local</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Contrasena</span>
                  <code className="rounded bg-white px-2 py-0.5 text-xs font-mono text-text-primary border border-border">Demo1234!</code>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-text-muted leading-relaxed">
                Con esta cuenta puedes explorar convocatorias abiertas, estructurar un proyecto paso a paso
                con el wizard, usar el asistente IA para auto-completar campos, recibir pre-evaluacion
                en tiempo real y mejorar el puntaje con recomendaciones.
              </p>
            </div>
          </div>

          {/* Ruta paso a paso */}
          <div className="mt-14">
            <h3 className="text-center text-lg font-semibold text-text-primary mb-8">
              Ruta del piloto paso a paso
            </h3>

            {/* Flujo Entidad */}
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100">
                  <span className="text-xs font-bold text-purple-600">E</span>
                </div>
                <h4 className="text-sm font-semibold text-purple-700">Flujo de la Entidad</h4>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <PilotStep
                  number="1"
                  title="Iniciar sesion como Entidad"
                  description="Ingresa con entidad@mga.local / Demo1234! y accede al dashboard de administracion."
                  color="purple"
                />
                <PilotStep
                  number="2"
                  title="Crear una convocatoria"
                  description="Ve a Convocatorias > Nueva. Define nombre, descripcion, presupuesto, fechas y sube documentos de referencia."
                  color="purple"
                />
                <PilotStep
                  number="3"
                  title="Configurar formulario"
                  description="En la pestaña Plantilla, agrega etapas (ej: Identificacion, Presupuesto, Cronograma) con campos personalizados por etapa."
                  color="purple"
                />
                <PilotStep
                  number="4"
                  title="Definir rubrica de evaluacion"
                  description="En Rubricas, crea criterios con pesos, niveles de calificacion (1-4) y guias de evaluacion. Puedes usar IA para sugerir criterios."
                  color="purple"
                />
                <PilotStep
                  number="5"
                  title="Publicar y monitorear"
                  description="Publica la convocatoria. En Monitoreo ve proyectos recibidos, heatmap de desempeno y compara municipios."
                  color="purple"
                />
                <PilotStep
                  number="6"
                  title="Evaluar y generar reportes"
                  description="Evalua proyectos con IA (scoring automatico por criterio), descarga reportes Excel/PDF y genera informe ejecutivo IA."
                  color="purple"
                />
              </div>
            </div>

            {/* Flujo Municipio */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100">
                  <span className="text-xs font-bold text-blue-600">M</span>
                </div>
                <h4 className="text-sm font-semibold text-blue-700">Flujo del Municipio</h4>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <PilotStep
                  number="1"
                  title="Iniciar sesion como Municipio"
                  description="Ingresa con municipio1@mga.local / Demo1234! y accede al dashboard del municipio."
                  color="blue"
                />
                <PilotStep
                  number="2"
                  title="Explorar convocatorias"
                  description="Ve las convocatorias abiertas disponibles. Revisa los requisitos, fechas limite y documentos adjuntos."
                  color="blue"
                />
                <PilotStep
                  number="3"
                  title="Aplicar a una convocatoria"
                  description="Selecciona una convocatoria y crea un nuevo proyecto. Se abre el wizard paso a paso para estructurar el proyecto."
                  color="blue"
                />
                <PilotStep
                  number="4"
                  title="Usar el asistente IA"
                  description="En cada campo puedes: pedir ayuda IA, auto-completar la etapa completa, mejorar textos existentes, o chatear con el copiloto IA."
                  color="blue"
                />
                <PilotStep
                  number="5"
                  title="Pre-evaluar el proyecto"
                  description="Antes de enviar, ejecuta la pre-evaluacion IA. Ve tu puntaje estimado por criterio y usa el wizard de mejora para subir el score."
                  color="blue"
                />
                <PilotStep
                  number="6"
                  title="Enviar y dar seguimiento"
                  description="Envia el proyecto cuando estes satisfecho. Recibe notificaciones de estado, comentarios de la entidad y recomendaciones de mejora."
                  color="blue"
                />
              </div>
            </div>
          </div>

          {/* Funcionalidades IA destacadas */}
          <div className="mt-14 rounded-[var(--radius-card)] border border-accent/20 bg-accent-muted/30 p-6">
            <h3 className="text-sm font-semibold text-accent mb-4 flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Funcionalidades IA para probar durante el piloto
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <AiFeatureItem
                label="Auto-completar etapa"
                description="Un click genera contenido para todos los campos vacios de la etapa con contexto de la convocatoria."
              />
              <AiFeatureItem
                label="Mejorar texto"
                description="Selecciona cualquier campo con texto y la IA lo mejora en claridad, formalidad y completitud."
              />
              <AiFeatureItem
                label="Chat copiloto"
                description="Conversa con la IA sobre tu proyecto. Puede citar documentos de la convocatoria y modificar campos."
              />
              <AiFeatureItem
                label="Pre-evaluacion en tiempo real"
                description="Evalua tu proyecto contra la rubrica antes de enviar. Ve puntaje por criterio y recomendaciones."
              />
              <AiFeatureItem
                label="Wizard de mejora"
                description="Recorre los campos con menor puntaje y la IA los corrige automaticamente. Contador de puntos ganados."
              />
              <AiFeatureItem
                label="Generar proyecto completo"
                description="Desde cero, la IA genera los 5 pasos del proyecto en 90 segundos con coherencia inter-etapas."
              />
              <AiFeatureItem
                label="Streaming en tiempo real"
                description="Todas las respuestas IA aparecen palabra por palabra con animacion, sin esperar al final."
              />
              <AiFeatureItem
                label="Evaluacion formal con IA"
                description="La entidad evalua proyectos con scoring automatico por criterio, justificaciones y reportes PDF."
              />
            </div>
          </div>

          {/* CTA */}
          <div className="mt-10 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-accent px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-accent-hover transition-all"
            >
              Probar el piloto ahora
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
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
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
            {["IDEA", "Gobernacion de Antioquia", "EAFIT", "Argos"].map((entity) => (
              <div
                key={entity}
                className="rounded-[var(--radius-card)] border border-border bg-white px-6 py-4 text-sm font-medium text-text-secondary shadow-sm"
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
              className="rounded-[var(--radius-button)] bg-accent px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-accent-hover transition-all"
            >
              Comenzar ahora
            </Link>
            <Link
              href="/dashboard/convocatorias"
              className="rounded-[var(--radius-button)] border border-border bg-white px-6 py-3 text-sm font-semibold text-text-primary hover:bg-bg-elevated transition-colors"
            >
              Explorar Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-8 bg-bg-elevated">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-accent text-xs font-bold text-white">P</div>
              <span className="text-sm font-semibold text-text-secondary">PuBlitec</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-text-muted">
              <a href="#features" className="hover:text-text-secondary transition-colors">Funcionalidades</a>
              <a href="#como-funciona" className="hover:text-text-secondary transition-colors">Como funciona</a>
              <a href="#piloto" className="hover:text-text-secondary transition-colors">Piloto</a>
              <Link href="/login" className="hover:text-text-secondary transition-colors">Entrar</Link>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-text-muted">
            PuBlitec &mdash; Plataforma de convocatorias con inteligencia artificial.
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
    <div className="rounded-[var(--radius-card)] border border-border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent-muted text-accent">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold text-text-primary">{title}</h3>
      <p className="mt-2 text-sm text-text-secondary leading-relaxed">{description}</p>
    </div>
  );
}

function PilotStep({
  number,
  title,
  description,
  color,
}: {
  number: string;
  title: string;
  description: string;
  color: "purple" | "blue";
}) {
  const bg = color === "purple" ? "bg-purple-50" : "bg-blue-50";
  const numBg = color === "purple" ? "bg-purple-600" : "bg-blue-600";
  const titleColor = color === "purple" ? "text-purple-900" : "text-blue-900";

  return (
    <div className={`rounded-[var(--radius-card)] border border-border ${bg} p-4`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${numBg} text-[11px] font-bold text-white`}>
          {number}
        </div>
        <div>
          <h5 className={`text-[13px] font-semibold ${titleColor}`}>{title}</h5>
          <p className="mt-1 text-[11px] text-text-secondary leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

function AiFeatureItem({
  label,
  description,
}: {
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <svg className="mt-0.5 h-4 w-4 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
      <div>
        <span className="text-xs font-semibold text-text-primary">{label}</span>
        <span className="text-xs text-text-muted"> — {description}</span>
      </div>
    </div>
  );
}
