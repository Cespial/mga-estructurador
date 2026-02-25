import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Estructurador MGA por Convocatorias",
  description:
    "Plataforma para estructurar proyectos MGA en el marco de convocatorias gubernamentales",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
