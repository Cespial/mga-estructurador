import Link from "next/link";
import type { Metadata } from "next";
import { MobileNav } from "@/components/mobile-nav";

export const metadata: Metadata = {
  title: "PuBlitec — Convocatorias públicas con inteligencia artificial",
  description:
    "Plataforma donde entidades públicas crean convocatorias con rúbricas y municipios estructuran proyectos MGA con asistencia de inteligencia artificial. Evaluación automática, reportes PDF y Excel.",
  openGraph: {
    title: "PuBlitec — Convocatorias con IA",
    description:
      "Entidades crean convocatorias. Municipios estructuran proyectos con IA. Reportes automáticos.",
    type: "website",
    locale: "es_CO",
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-app">
      {/* ═══════════════════════════════════════════ */}
      {/* NAVBAR                                      */}
      {/* ═══════════════════════════════════════════ */}
      <nav className="sticky top-0 z-50 border-b border-border/50 glass">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent shadow-sm">
              <span className="text-sm font-bold text-white tracking-tight">P</span>
            </div>
            <span className="text-lg font-semibold text-text-primary">
              PuBli<span className="text-accent">tec</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-7">
            {[
              { href: "#desafio", label: "El desafío" },
              { href: "#funcionalidades", label: "Funcionalidades" },
              { href: "#como-funciona", label: "Proceso" },
              { href: "#piloto", label: "Piloto" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/login"
              className="rounded-[var(--radius-button)] bg-accent px-5 py-2 text-[13px] font-semibold text-white hover:bg-accent-hover transition-all shadow-sm"
            >
              Iniciar sesión
            </Link>
          </div>

          <MobileNav />
        </div>
      </nav>

      {/* ═══════════════════════════════════════════ */}
      {/* HERO                                        */}
      {/* ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 landing-hero-bg" />
        <div className="absolute inset-0 landing-grid opacity-40" />

        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-16 lg:pt-24">
          {/* Copy */}
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/15 bg-white/80 px-4 py-1.5 text-[11px] font-semibold text-accent shadow-sm backdrop-blur-sm animate-fade-in">
              <span className="flex h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              Potenciado por inteligencia artificial
            </div>

            <h1 className="font-display text-[2.5rem] leading-[1.12] tracking-tight text-text-primary sm:text-5xl lg:text-[3.25rem]">
              Los municipios merecen las mismas oportunidades de{" "}
              <span className="text-accent">inversión pública</span>
            </h1>

            <p
              className="mx-auto mt-6 max-w-2xl text-[16px] leading-relaxed text-text-secondary animate-fade-in-up"
              style={{ animationDelay: "80ms" }}
            >
              PuBlitec cierra la brecha técnica. La inteligencia artificial asiste
              a municipios en la formulación de proyectos MGA mientras las entidades
              evalúan con rúbricas estandarizadas y generan reportes automáticos.
            </p>

            <div
              className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-up"
              style={{ animationDelay: "160ms" }}
            >
              <Link
                href="/login?action=signup"
                className="w-full sm:w-auto rounded-[var(--radius-button)] bg-accent px-7 py-3 text-sm font-semibold text-white shadow-md hover:bg-accent-hover hover:shadow-lg transition-all"
              >
                Crear cuenta gratuita
              </Link>
              <Link
                href="#piloto"
                className="w-full sm:w-auto rounded-[var(--radius-button)] border border-border bg-white px-7 py-3 text-sm font-semibold text-text-primary hover:bg-bg-elevated transition-colors shadow-sm"
              >
                Probar el piloto
              </Link>
            </div>
          </div>

          {/* Dashboard Mockup */}
          <div
            className="mx-auto mt-14 max-w-5xl animate-fade-in-up"
            style={{ animationDelay: "250ms" }}
          >
            <HeroMockup />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* PROBLEM — "El Desafio"                      */}
      {/* ═══════════════════════════════════════════ */}
      <section
        id="desafio"
        className="scroll-mt-16 border-t border-border px-6 py-20 landing-problem-bg"
      >
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-600">
              El desafío
            </p>
            <h2 className="mt-3 font-display text-[1.75rem] tracking-tight text-text-primary sm:text-3xl lg:text-4xl">
              La brecha que separa a los municipios de los recursos
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] text-text-secondary leading-relaxed">
              Los municipios con menor capacidad técnica son los que más pierden
              convocatorias — y los que más necesitan inversión pública.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-3 stagger-children">
            <PainPoint
              icon={
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                />
              }
              title="Capacidad técnica limitada"
              description="Los equipos municipales no tienen formación en metodología MGA. Los proyectos se formulan con plantillas genéricas que no cumplen criterios de evaluación."
              stat="68%"
              statLabel="de municipios cat. 5-6 sin equipo técnico MGA"
            />
            <PainPoint
              icon={
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              }
              title="Procesos manuales y lentos"
              description="Convocatorias gestionadas con documentos Word, correos y hojas de cálculo. Sin trazabilidad, sin control de versiones, sin estandarización."
              stat="4.7"
              statLabel="meses promedio para formular un proyecto MGA"
            />
            <PainPoint
              icon={
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                />
              }
              title="Evaluación opaca e inconsistente"
              description="Evaluadores aplican criterios de forma desigual. Sin retroalimentación transparente, los municipios no saben cómo mejorar para la siguiente convocatoria."
              stat="23%"
              statLabel="de submissions reciben retroalimentación detallada"
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* FEATURES                                    */}
      {/* ═══════════════════════════════════════════ */}
      <section
        id="funcionalidades"
        className="scroll-mt-16 border-t border-border px-6 py-20"
      >
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
              Funcionalidades
            </p>
            <h2 className="mt-3 font-display text-[1.75rem] tracking-tight text-text-primary sm:text-3xl lg:text-4xl">
              Todo lo que necesitas, de punta a punta
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] text-text-secondary">
              Desde la creación de la convocatoria hasta el reporte final de evaluación.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
            {/* Feature 1: Wizard MGA */}
            <FeatureCard
              accentColor="blue"
              title="Wizard MGA con IA"
              description="Formulario multi-etapa inteligente. La IA asiste campo por campo con sugerencias basadas en los documentos de la convocatoria."
              mockup={
                <div className="flex items-center gap-1.5 mb-3">
                  {["Identificación", "Preparación", "Evaluación", "Programación"].map(
                    (s, i) => (
                      <div key={s} className="flex items-center gap-1.5">
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold ${
                            i === 0
                              ? "bg-emerald-500 text-white"
                              : i === 1
                                ? "bg-accent text-white"
                                : "bg-white/60 text-text-muted border border-border"
                          }`}
                        >
                          {i === 0 ? "\u2713" : i + 1}
                        </div>
                        {i < 3 && (
                          <div
                            className={`h-px w-3 ${i === 0 ? "bg-emerald-300" : "bg-border"}`}
                          />
                        )}
                      </div>
                    ),
                  )}
                </div>
              }
            />

            {/* Feature 2: Pre-evaluación */}
            <FeatureCard
              accentColor="emerald"
              title="Pre-evaluación en tiempo real"
              description="Evalúa tu proyecto contra la rúbrica antes de enviar. Ve puntaje por criterio, justificaciones y recomendaciones de mejora."
              mockup={
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-emerald-400 bg-emerald-50">
                    <span className="text-[13px] font-bold text-emerald-700">82</span>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <MiniBar label="Pertinencia" pct={90} color="bg-emerald-400" />
                    <MiniBar label="Viabilidad" pct={75} color="bg-amber-400" />
                    <MiniBar label="Presupuesto" pct={60} color="bg-orange-400" />
                  </div>
                </div>
              }
            />

            {/* Feature 3: Auto-completar */}
            <FeatureCard
              accentColor="purple"
              title="Auto-completar con IA"
              description="Un clic genera borrador completo de toda la etapa. La IA usa el contexto de etapas previas y documentos de referencia."
              mockup={
                <div className="space-y-1.5">
                  <div className="h-2 w-full rounded bg-purple-200/60" />
                  <div className="h-2 w-4/5 rounded bg-purple-200/60" />
                  <div className="h-2 w-11/12 rounded bg-purple-300/50" />
                  <div className="flex items-center gap-1 mt-1">
                    <div className="h-2 w-1/3 rounded bg-purple-400/40" />
                    <span className="inline-block w-[2px] h-3 bg-purple-500 landing-cursor" />
                  </div>
                </div>
              }
            />

            {/* Feature 4: Chat copiloto */}
            <FeatureCard
              accentColor="indigo"
              title="Chat copiloto"
              description="Conversa con la IA sobre tu proyecto. Puede citar documentos de la convocatoria y sugerir cambios directos en los campos."
              mockup={
                <div className="space-y-2">
                  <div className="flex justify-end">
                    <div className="rounded-lg rounded-br-sm bg-accent/10 px-2.5 py-1.5 text-[9px] text-accent max-w-[70%]">
                      ¿Cómo mejoro la justificación?
                    </div>
                  </div>
                  <div className="flex">
                    <div className="rounded-lg rounded-bl-sm bg-bg-elevated px-2.5 py-1.5 text-[9px] text-text-secondary max-w-[80%]">
                      Según el TdR, debes incluir datos cuantitativos de la población...
                    </div>
                  </div>
                </div>
              }
            />

            {/* Feature 5: Reportes */}
            <FeatureCard
              accentColor="red"
              title="Reportes PDF y Excel"
              description="Genera reportes profesionales con scoring detallado, justificaciones por criterio y análisis comparativo automático."
              mockup={
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-8 items-center justify-center rounded border border-red-200 bg-red-50">
                    <span className="text-[8px] font-bold text-red-600">PDF</span>
                  </div>
                  <div className="flex h-10 w-8 items-center justify-center rounded border border-emerald-200 bg-emerald-50">
                    <span className="text-[8px] font-bold text-emerald-600">XLS</span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="h-1.5 w-full rounded bg-border" />
                    <div className="h-1.5 w-3/4 rounded bg-border" />
                    <div className="h-1.5 w-5/6 rounded bg-border" />
                  </div>
                </div>
              }
            />

            {/* Feature 6: Evaluacion rubrica */}
            <FeatureCard
              accentColor="amber"
              title="Evaluación con rúbrica"
              description="La entidad define criterios con pesos y niveles. La IA pre-llena scores y justificaciones que el evaluador puede ajustar."
              mockup={
                <div className="grid grid-cols-4 gap-1">
                  {[4, 3, 4, 2, 3, 4, 3, 3].map((score, i) => (
                    <div
                      key={i}
                      className={`flex h-6 items-center justify-center rounded text-[9px] font-bold ${
                        score >= 4
                          ? "bg-emerald-100 text-emerald-700"
                          : score >= 3
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {score}
                    </div>
                  ))}
                </div>
              }
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* HOW IT WORKS                                */}
      {/* ═══════════════════════════════════════════ */}
      <section
        id="como-funciona"
        className="scroll-mt-16 border-t border-border bg-bg-elevated px-6 py-20"
      >
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
              Proceso
            </p>
            <h2 className="mt-3 font-display text-[1.75rem] tracking-tight text-text-primary sm:text-3xl lg:text-4xl">
              De la convocatoria al reporte en 4 pasos
            </h2>
          </div>

          <div className="mt-14 grid gap-0 sm:grid-cols-4">
            {[
              {
                step: "1",
                title: "Crear convocatoria",
                desc: "La entidad define formulario MGA por etapas, configura rúbrica de evaluación con pesos y sube documentos de referencia.",
                iconPath:
                  "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z",
              },
              {
                step: "2",
                title: "Estructurar con IA",
                desc: "El municipio completa el wizard paso a paso. La IA sugiere textos, identifica riesgos y autocompleta secciones enteras.",
                iconPath:
                  "M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z",
              },
              {
                step: "3",
                title: "Evaluar proyectos",
                desc: "La IA evalúa cada criterio de la rúbrica con scoring justificado. El evaluador humano puede ajustar cualquier puntaje.",
                iconPath:
                  "M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75",
              },
              {
                step: "4",
                title: "Generar reportes",
                desc: "Exporta resultados en Excel y PDF profesional con prefactibilidad, comparativas y recomendaciones del sistema.",
                iconPath:
                  "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z",
              },
            ].map((item, i) => (
              <div key={item.step} className="relative flex flex-col items-center text-center px-5">
                {/* Connector line */}
                {i > 0 && (
                  <div className="absolute left-0 top-7 hidden h-px w-full -translate-x-1/2 border-t-2 border-dashed border-accent/20 sm:block" />
                )}
                <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-border shadow-sm">
                  <svg
                    className="h-6 w-6 text-accent"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.iconPath} />
                  </svg>
                </div>
                <span className="mt-3 inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">
                  {item.step}
                </span>
                <h3 className="mt-2 text-[14px] font-semibold text-text-primary">
                  {item.title}
                </h3>
                <p className="mt-2 text-[12px] text-text-secondary leading-relaxed max-w-[200px]">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════ */}
      {/* PILOT                                       */}
      {/* ═══════════════════════════════════════════ */}
      <section
        id="piloto"
        className="scroll-mt-16 border-t border-border bg-bg-elevated px-6 py-20"
      >
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/15 bg-white px-4 py-1.5 text-[11px] font-semibold text-accent shadow-sm">
              Acceso piloto disponible
            </div>
            <h2 className="font-display text-[1.75rem] tracking-tight text-text-primary sm:text-3xl">
              Prueba PuBlitec ahora
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-[14px] text-text-secondary">
              Explora la plataforma con cuentas de prueba. Dos roles: la entidad que
              crea convocatorias y el municipio que estructura proyectos con IA.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {/* Entidad */}
            <div className="rounded-[var(--radius-card)] border border-border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                  <svg
                    className="h-5 w-5 text-purple-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">
                    Entidad
                  </h3>
                  <p className="text-[11px] text-text-muted">
                    Crea convocatorias, evalúa y genera reportes
                  </p>
                </div>
              </div>
              <div className="space-y-2 rounded-lg bg-bg-elevated p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Correo</span>
                  <code className="rounded border border-border bg-white px-2 py-0.5 text-xs font-mono text-text-primary">
                    entidad@mga.local
                  </code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Contraseña</span>
                  <code className="rounded border border-border bg-white px-2 py-0.5 text-xs font-mono text-text-primary">
                    Demo1234!
                  </code>
                </div>
              </div>
            </div>

            {/* Municipio */}
            <div className="rounded-[var(--radius-card)] border border-border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <svg
                    className="h-5 w-5 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">
                    Municipio
                  </h3>
                  <p className="text-[11px] text-text-muted">
                    Estructura proyectos con asistencia IA
                  </p>
                </div>
              </div>
              <div className="space-y-2 rounded-lg bg-bg-elevated p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Correo</span>
                  <code className="rounded border border-border bg-white px-2 py-0.5 text-xs font-mono text-text-primary">
                    municipio1@mga.local
                  </code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Contraseña</span>
                  <code className="rounded border border-border bg-white px-2 py-0.5 text-xs font-mono text-text-primary">
                    Demo1234!
                  </code>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-accent px-7 py-3 text-sm font-semibold text-white shadow-md hover:bg-accent-hover hover:shadow-lg transition-all"
            >
              Probar el piloto ahora
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* PARTNERS                                    */}
      {/* ═══════════════════════════════════════════ */}
      <section
        id="entidades"
        className="scroll-mt-16 border-t border-border px-6 py-16"
      >
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-muted">
            Construido para entidades públicas
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
            {[
              { name: "IDEA", style: "tracking-[0.3em] font-black text-[18px]" },
              {
                name: "Gobernación de Antioquia",
                style: "font-semibold text-[14px]",
              },
              { name: "EAFIT", style: "tracking-[0.2em] font-bold text-[16px]" },
              { name: "Argos", style: "font-bold text-[17px] italic" },
            ].map((entity) => (
              <span
                key={entity.name}
                className={`text-text-muted/50 hover:text-text-secondary transition-colors select-none ${entity.style}`}
              >
                {entity.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* FINAL CTA                                   */}
      {/* ═══════════════════════════════════════════ */}
      <section className="landing-cta-bg px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-[1.75rem] tracking-tight text-white sm:text-3xl lg:text-4xl">
            Transforma la gestión de convocatorias en tu entidad
          </h2>
          <p className="mt-4 text-[15px] text-white/70 leading-relaxed">
            Empieza a recibir proyectos mejor estructurados, evalúa con IA y genera
            reportes profesionales en minutos.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login?action=signup"
              className="w-full sm:w-auto rounded-[var(--radius-button)] bg-white px-7 py-3 text-sm font-semibold text-accent shadow-lg hover:bg-white/90 transition-all"
            >
              Comenzar ahora
            </Link>
            <Link
              href="/contacto"
              className="w-full sm:w-auto rounded-[var(--radius-button)] border border-white/25 px-7 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Contactar equipo
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* FOOTER                                      */}
      {/* ═══════════════════════════════════════════ */}
      <footer className="bg-[#1a1a2e] px-6 pt-14 pb-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent">
                  <span className="text-sm font-bold text-white">P</span>
                </div>
                <span className="text-lg font-semibold text-white">
                  PuBli<span className="text-accent">tec</span>
                </span>
              </div>
              <p className="mt-4 max-w-xs text-[13px] text-white/40 leading-relaxed">
                Plataforma de convocatorias públicas con inteligencia artificial.
                Formulación MGA, evaluación automática y reportes profesionales.
              </p>
            </div>

            {/* Producto */}
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/60">
                Producto
              </h4>
              <ul className="mt-4 space-y-2.5">
                {[
                  { href: "#funcionalidades", label: "Funcionalidades" },
                  { href: "#como-funciona", label: "Cómo funciona" },
                  { href: "#piloto", label: "Piloto" },
                  { href: "/casos", label: "Casos de uso" },
                ].map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-[13px] text-white/40 hover:text-white/70 transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recursos */}
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/60">
                Recursos
              </h4>
              <ul className="mt-4 space-y-2.5">
                {[
                  { href: "/implementacion", label: "Implementación" },
                  { href: "/dashboard/ayuda", label: "Centro de ayuda" },
                  { href: "/contacto", label: "Contacto" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-white/40 hover:text-white/70 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/60">
                Legal
              </h4>
              <ul className="mt-4 space-y-2.5">
                {["Términos de servicio", "Política de privacidad", "Política de datos"].map(
                  (label) => (
                    <li key={label}>
                      <span className="text-[13px] text-white/40 cursor-default">
                        {label}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[12px] text-white/30">
              &copy; {new Date().getFullYear()} PuBlitec. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-[12px] text-white/40 hover:text-white/70 transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/login?action=signup"
                className="text-[12px] text-white/40 hover:text-white/70 transition-colors"
              >
                Crear cuenta
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ════════════════════════════════════════════════════ */
/* Sub-components                                       */
/* ════════════════════════════════════════════════════ */

function PainPoint({
  icon,
  title,
  description,
  stat,
  statLabel,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  stat: string;
  statLabel: string;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
          <svg
            className="h-5 w-5 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            {icon}
          </svg>
        </div>
        <h3 className="text-[14px] font-semibold text-text-primary">{title}</h3>
      </div>
      <p className="text-[13px] text-text-secondary leading-relaxed">{description}</p>
      <div className="mt-5 flex items-baseline gap-2 border-t border-border pt-4">
        <span className="font-display text-[1.5rem] text-amber-600">{stat}</span>
        <span className="text-[11px] text-text-muted">{statLabel}</span>
      </div>
    </div>
  );
}

function FeatureCard({
  accentColor,
  title,
  description,
  mockup,
}: {
  accentColor: string;
  title: string;
  description: string;
  mockup: React.ReactNode;
}) {
  const borderMap: Record<string, string> = {
    blue: "hover:border-accent/30",
    emerald: "hover:border-emerald-300/50",
    purple: "hover:border-purple-300/50",
    indigo: "hover:border-indigo-300/50",
    red: "hover:border-red-300/50",
    amber: "hover:border-amber-300/50",
  };

  const bgMap: Record<string, string> = {
    blue: "bg-accent/[0.03]",
    emerald: "bg-emerald-50/50",
    purple: "bg-purple-50/50",
    indigo: "bg-indigo-50/50",
    red: "bg-red-50/30",
    amber: "bg-amber-50/40",
  };

  return (
    <div
      className={`rounded-[var(--radius-card)] border border-border bg-white p-5 shadow-sm transition-all hover:shadow-md ${borderMap[accentColor] ?? ""}`}
    >
      {/* Mini mockup area */}
      <div
        className={`rounded-lg p-3.5 mb-4 ${bgMap[accentColor] ?? "bg-bg-elevated"}`}
      >
        {mockup}
      </div>
      <h3 className="text-[14px] font-semibold text-text-primary">{title}</h3>
      <p className="mt-1.5 text-[12px] text-text-secondary leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function MiniBar({
  label,
  pct,
  color,
}: {
  label: string;
  pct: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 text-[8px] text-text-muted truncate">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-bg-elevated overflow-hidden">
        <div
          className={`h-full rounded-full ${color} landing-fill`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function HeroMockup() {
  return (
    <div className="rounded-2xl bg-[#0f172a] p-1.5 landing-mockup-ring landing-float">
      <div className="rounded-xl bg-[#1e293b] overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2.5">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber-400/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/60" />
          </div>
          <div className="ml-3 flex-1">
            <div className="mx-auto h-5 w-56 rounded-md bg-white/5 flex items-center justify-center">
              <span className="text-[9px] text-white/25 font-mono">
                publitec.co/dashboard/wizard
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex min-h-[300px] sm:min-h-[340px]">
          {/* Sidebar */}
          <div className="hidden sm:block w-40 shrink-0 border-r border-white/5 p-3 space-y-0.5">
            <div className="flex items-center gap-2 rounded-lg bg-accent/15 px-3 py-2">
              <div className="h-3 w-3 rounded bg-accent/50" />
              <span className="text-[9px] font-medium text-accent/80">
                Wizard MGA
              </span>
            </div>
            {["Convocatorias", "Analíticas", "Portafolio", "Calendario"].map(
              (item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="h-3 w-3 rounded bg-white/8" />
                  <span className="text-[9px] text-white/25">{item}</span>
                </div>
              ),
            )}
          </div>

          {/* Main content */}
          <div className="flex-1 p-3 sm:p-4 space-y-3">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Progreso", value: "73%", color: "text-blue-400" },
                { label: "Pre-evaluación", value: "82/100", color: "text-emerald-400" },
                { label: "Campos IA", value: "14/18", color: "text-purple-400" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5"
                >
                  <p className="text-[8px] font-medium uppercase tracking-wider text-white/20">
                    {stat.label}
                  </p>
                  <p className={`mt-0.5 text-base font-bold ${stat.color}`}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* AI field */}
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-medium text-white/30">
                  Justificacion del proyecto
                </span>
                <span className="flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[8px] font-semibold text-accent">
                  <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                  </svg>
                  IA Asistiendo
                </span>
              </div>
              <div className="rounded-md bg-white/[0.03] p-2.5">
                <p className="text-[10px] text-white/40 leading-relaxed">
                  El municipio de San Rafael requiere la construccion de un acueducto
                  veredal para atender a 1,200 familias de la zona rural que actualmente
                  dependen de fuentes hidricas no tratadas
                  <span className="inline-block w-[2px] h-2.5 bg-accent ml-0.5 landing-cursor" />
                </p>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-400/50 landing-fill" style={{ width: "92%" }} />
                </div>
                <span className="text-[8px] text-emerald-400/60">92% confianza</span>
              </div>
            </div>

            {/* Stage progress */}
            <div className="flex items-center gap-2">
              {[
                { label: "Identificación", pct: 100, color: "bg-emerald-400" },
                { label: "Preparación", pct: 85, color: "bg-blue-400" },
                { label: "Evaluación", pct: 60, color: "bg-amber-400" },
                { label: "Programación", pct: 25, color: "bg-white/15" },
              ].map((stage, i) => (
                <div key={stage.label} className="flex-1">
                  <p className="text-[7px] text-white/20 mb-1 truncate">
                    {stage.label}
                  </p>
                  <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${stage.color} landing-fill`}
                      style={{
                        width: `${stage.pct}%`,
                        animationDelay: `${0.8 + i * 0.15}s`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
