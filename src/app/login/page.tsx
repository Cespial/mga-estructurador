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
      <div className="w-full max-w-[380px]">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-accent">
              <span className="text-lg font-bold text-white">P</span>
            </div>
            <span className="text-[22px] font-semibold text-text-primary">
              PuBli<span className="text-accent">tec</span>
            </span>
          </Link>
          <p className="mt-3 text-[13px] text-text-muted">
            {params.action === "signup" ? "Crea tu cuenta para comenzar" : "Inicia sesion para continuar"}
          </p>
        </div>

        {params.error && (
          <div className="mb-4 rounded-[var(--radius-input)] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            {params.error}
          </div>
        )}

        {params.message && (
          <div className="mb-4 rounded-[var(--radius-input)] border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-700">
            {params.message}
          </div>
        )}

        <div className="rounded-[var(--radius-card)] border border-border bg-bg-card p-6 shadow-[var(--shadow-elevated)]">
          <form className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-[13px] font-medium text-text-primary">
                Correo electronico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1.5 block w-full rounded-[var(--radius-input)] border border-border bg-bg-input px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/8"
                placeholder="usuario@ejemplo.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[13px] font-medium text-text-primary">
                Contrasena
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                className="mt-1.5 block w-full rounded-[var(--radius-input)] border border-border bg-bg-input px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/8"
                placeholder="Minimo 6 caracteres"
              />
            </div>

            <div>
              <label htmlFor="full_name" className="block text-[13px] font-medium text-text-primary">
                Nombre completo{" "}
                <span className="text-text-muted font-normal">(solo registro)</span>
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                className="mt-1.5 block w-full rounded-[var(--radius-input)] border border-border bg-bg-input px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/8"
                placeholder="Juan Perez"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                formAction={login}
                className="flex-1 rounded-[var(--radius-button)] bg-accent px-4 py-2.5 text-[13px] font-medium text-white hover:bg-accent-hover transition-colors"
              >
                Iniciar sesion
              </button>
              <button
                formAction={signup}
                className="flex-1 rounded-[var(--radius-button)] border border-border bg-bg-card px-4 py-2.5 text-[13px] font-medium text-text-primary hover:bg-bg-hover transition-colors"
              >
                Registrarse
              </button>
            </div>
          </form>
        </div>

        <p className="mt-6 text-center text-[11px] text-text-muted">
          Al registrarte, aceptas los terminos de uso de PuBlitec.
        </p>
      </div>
    </main>
  );
}
