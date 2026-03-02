import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "PuBlitec — Plataforma de Convocatorias con IA",
  description:
    "Plataforma donde entidades crean convocatorias con rubricas y municipios estructuran proyectos con asistencia de inteligencia artificial. Reportes Excel y PDF profesionales.",
  openGraph: {
    title: "PuBlitec — Plataforma de Convocatorias con IA",
    description:
      "Gestiona convocatorias, estructura proyectos con IA y genera reportes profesionales.",
    type: "website",
    locale: "es_CO",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${instrumentSerif.variable}`}>
      <body className="font-sans bg-bg-app text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
