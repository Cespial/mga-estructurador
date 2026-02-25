export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Estructurador MGA
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Plataforma para estructurar proyectos MGA por convocatorias
        </p>
        <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-6">
          <p className="text-sm text-gray-500">
            Wave 0 — Setup inicial completado. Próximo: Auth + Roles (Wave 1).
          </p>
        </div>
      </div>
    </main>
  );
}
