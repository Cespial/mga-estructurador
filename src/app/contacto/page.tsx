import Link from "next/link";
import type { Metadata } from "next";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contacto — PuBlitec",
  description:
    "Contactanos para implementar el PuBlitec en tu entidad territorial.",
};

export default function ContactoPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-[11px] font-bold text-white">P</div>
            <span className="text-lg font-semibold text-text-primary">Poly<span className="text-accent">tech</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/#demo" className="text-[13px] text-text-secondary hover:text-text-primary">
              Demo
            </Link>
            <Link href="/casos" className="text-[13px] text-text-secondary hover:text-text-primary">
              Casos
            </Link>
            <Link href="/contacto" className="text-[13px] font-medium text-text-primary">
              Contacto
            </Link>
            <Link
              href="/login"
              className="rounded-[var(--radius-button)] bg-accent px-4 py-2 text-[13px] font-medium text-white hover:bg-accent-hover transition-colors"
            >
              Entrar
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="px-4 pb-8 pt-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            Contacto
          </h1>
          <p className="mt-4 text-text-secondary">
            Quieres implementar el PuBlitec en tu entidad? Cuentanos
            tu caso y te orientamos.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-2xl rounded-xl border border-border bg-white p-6 shadow-sm sm:p-8">
          <ContactForm />
        </div>
      </section>

      {/* Alt contact */}
      <section className="border-t border-border bg-bg-app px-4 py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-lg font-semibold text-text-primary">
            Otras formas de contacto
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-white p-4">
              <p className="text-[13px] font-medium text-text-primary">Demo en vivo</p>
              <p className="mt-1 text-[11px] text-text-muted">
                Prueba la plataforma sin registrarte.
              </p>
              <Link
                href="/#demo"
                className="mt-2 inline-block text-[13px] font-medium text-accent hover:text-accent-hover"
              >
                Ver demo interactiva
              </Link>
            </div>
            <div className="rounded-lg border border-border bg-white p-4">
              <p className="text-[13px] font-medium text-text-primary">
                Plan de implementacion
              </p>
              <p className="mt-1 text-[11px] text-text-muted">
                Revisa los pasos para poner en marcha la plataforma.
              </p>
              <Link
                href="/implementacion"
                className="mt-2 inline-block text-[13px] font-medium text-accent hover:text-accent-hover"
              >
                Ver checklist
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-bg-app px-4 py-8">
        <div className="mx-auto max-w-6xl text-center text-[13px] text-text-muted">
          <p>PuBlitec &mdash; Plataforma de convocatorias con inteligencia artificial.</p>
          <div className="mt-2 flex items-center justify-center gap-4 text-[11px]">
            <Link href="/" className="hover:text-text-secondary">Inicio</Link>
            <Link href="/casos" className="hover:text-text-secondary">Casos</Link>
            <Link href="/implementacion" className="hover:text-text-secondary">Implementacion</Link>
            <Link href="/contacto" className="hover:text-text-secondary">Contacto</Link>
            <Link href="/login" className="hover:text-text-secondary">Entrar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
