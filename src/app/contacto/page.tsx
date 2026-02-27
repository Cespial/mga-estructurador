import Link from "next/link";
import type { Metadata } from "next";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contacto — Polytech",
  description:
    "Contactanos para implementar el Polytech en tu entidad territorial.",
};

export default function ContactoPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-xs font-bold text-white">P</div>
            <span className="text-lg font-semibold text-text-primary">Poly<span className="text-accent">tech</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/#demo" className="text-sm text-gray-600 hover:text-gray-900">
              Demo
            </Link>
            <Link href="/casos" className="text-sm text-gray-600 hover:text-gray-900">
              Casos
            </Link>
            <Link href="/contacto" className="text-sm font-medium text-gray-900">
              Contacto
            </Link>
            <Link
              href="/login"
              className="rounded-[var(--radius-button)] bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
            >
              Entrar
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="px-4 pb-8 pt-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Contacto
          </h1>
          <p className="mt-4 text-gray-600">
            Quieres implementar el Polytech en tu entidad? Cuentanos
            tu caso y te orientamos.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <ContactForm />
        </div>
      </section>

      {/* Alt contact */}
      <section className="border-t border-gray-100 bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Otras formas de contacto
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-sm font-medium text-gray-900">Demo en vivo</p>
              <p className="mt-1 text-xs text-gray-500">
                Prueba la plataforma sin registrarte.
              </p>
              <Link
                href="/#demo"
                className="mt-2 inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Ver demo interactiva
              </Link>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-sm font-medium text-gray-900">
                Plan de implementacion
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Revisa los pasos para poner en marcha la plataforma.
              </p>
              <Link
                href="/implementacion"
                className="mt-2 inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Ver checklist
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-6xl text-center text-sm text-gray-500">
          <p>Polytech &mdash; Plataforma de convocatorias con inteligencia artificial.</p>
          <div className="mt-2 flex items-center justify-center gap-4 text-xs">
            <Link href="/" className="hover:text-gray-700">Inicio</Link>
            <Link href="/casos" className="hover:text-gray-700">Casos</Link>
            <Link href="/implementacion" className="hover:text-gray-700">Implementacion</Link>
            <Link href="/contacto" className="hover:text-gray-700">Contacto</Link>
            <Link href="/login" className="hover:text-gray-700">Entrar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
