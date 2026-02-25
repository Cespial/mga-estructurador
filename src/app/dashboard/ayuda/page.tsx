import { HelpCenter } from "./help-center";

export const metadata = {
  title: "Ayuda — Estructurador MGA",
};

export default function AyudaPage() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-900">
        Centro de Ayuda
      </h1>
      <HelpCenter />
    </div>
  );
}
