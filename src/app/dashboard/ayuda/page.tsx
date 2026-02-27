import { HelpCenter } from "./help-center";

export const metadata = {
  title: "Ayuda — Polytech",
};

export default function AyudaPage() {
  return (
    <div className="animate-fade-in">
      <h1 className="mb-6 text-[22px] font-semibold tracking-tight text-text-primary">
        Centro de Ayuda
      </h1>
      <HelpCenter />
    </div>
  );
}
