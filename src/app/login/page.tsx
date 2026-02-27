import Link from "next/link";
import { login, signup } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; action?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-app p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <span className="text-lg font-bold text-white">P</span>
            </div>
            <span className="text-2xl font-bold text-text-primary">
              Publi<span className="text-accent">tec</span>
            </span>
          </Link>
          <p className="mt-3 text-sm text-text-secondary">
            {params.action === "signup" ? "Crea tu cuenta para comenzar" : "Inicia sesion para continuar"}
          </p>
        </div>

        {params.error && (
          <div className="mb-4 rounded-[var(--radius-input)] border border-danger/30 bg-danger-muted p-3 text-sm text-danger">
            {params.error}
          </div>
        )}

        {params.message && (
          <div className="mb-4 rounded-[var(--radius-input)] border border-success/30 bg-success-muted p-3 text-sm text-success">
            {params.message}
          </div>
        )}

        <div className="rounded-[var(--radius-card)] border border-border bg-bg-card p-6 shadow-[var(--shadow-card)]">
          <form className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary">
                Correo electronico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1.5 block w-full rounded-[var(--radius-input)] border border-border bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
                placeholder="usuario@ejemplo.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary">
                Contrasena
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                className="mt-1.5 block w-full rounded-[var(--radius-input)] border border-border bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-text-secondary">
                Nombre completo{" "}
                <span className="text-text-muted">(solo registro)</span>
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                className="mt-1.5 block w-full rounded-[var(--radius-input)] border border-border bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
                placeholder="Juan Perez"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                formAction={login}
                className="flex-1 rounded-[var(--radius-button)] bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-bg-app"
              >
                Iniciar sesion
              </button>
              <button
                formAction={signup}
                className="flex-1 rounded-[var(--radius-button)] border border-border bg-transparent px-4 py-2 text-sm font-medium text-text-primary hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-bg-app"
              >
                Registrarse
              </button>
            </div>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-text-muted">
          Al registrarte, aceptas los terminos de uso de Publitec.
        </p>
      </div>
    </main>
  );
}
