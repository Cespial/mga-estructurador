"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Onboarding Tour
 *
 * Step-by-step tour of the wizard for first-time users.
 * Highlights key features: filling fields, AI assist, pre-evaluation,
 * improvement wizard, auto-draft.
 *
 * Uses a lightweight custom implementation (no external dependency).
 * Stores completion in localStorage.
 */

interface TourStep {
  /** CSS selector for the element to highlight */
  target: string;
  /** Title of the step */
  title: string;
  /** Description of the step */
  description: string;
  /** Position of the popover */
  position: "top" | "bottom" | "left" | "right";
}

const TOUR_STEPS: TourStep[] = [
  {
    target: "[data-tour='etapa-nav']",
    title: "Navegacion por etapas",
    description:
      "Aqui ves todas las etapas del proyecto MGA. Navega entre ellas haciendo clic. El indicador de color muestra el estado: verde = completa, amarillo = parcial, gris = vacia.",
    position: "right",
  },
  {
    target: "[data-tour='progress-bar']",
    title: "Barra de progreso",
    description:
      "Tu progreso general se actualiza automaticamente al llenar campos requeridos. Busca llegar al 100% antes de enviar.",
    position: "bottom",
  },
  {
    target: "[data-tour='ai-assist-btn']",
    title: "Asistente IA",
    description:
      "Cada campo de texto tiene un boton de Asistente IA. Haz clic para recibir una sugerencia basada en el contexto de la convocatoria y tu proyecto.",
    position: "bottom",
  },
  {
    target: "[data-tour='auto-draft-btn']",
    title: "Auto-completar etapa",
    description:
      "Este boton genera un borrador automatico para todos los campos vacios de la etapa actual. Revisa y edita las sugerencias de la IA.",
    position: "bottom",
  },
  {
    target: "[data-tour='pre-eval-btn']",
    title: "Pre-evaluacion IA",
    description:
      "Cuando tengas al menos 30% de avance, usa la pre-evaluacion para conocer tu score estimado y recibir recomendaciones de mejora.",
    position: "top",
  },
  {
    target: "[data-tour='writing-guide']",
    title: "Guia de escritura",
    description:
      "Cada campo tiene una guia que explica que buscan los evaluadores, errores comunes y un ejemplo de respuesta excelente.",
    position: "bottom",
  },
];

const TOUR_STORAGE_KEY = "publitec_onboarding_completed";

export function OnboardingTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    // Check if tour was already completed
    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!completed) {
      // Delay to let the page render
      const timer = setTimeout(() => setActive(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const updatePosition = useCallback(() => {
    if (!active) return;
    const currentStep = TOUR_STEPS[step];
    if (!currentStep) return;

    const el = document.querySelector(currentStep.target);
    if (el) {
      setRect(el.getBoundingClientRect());
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      setRect(null);
    }
  }, [active, step]);

  useEffect(() => {
    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [updatePosition]);

  function completeTour() {
    setActive(false);
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
  }

  function nextStep() {
    if (step < TOUR_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      completeTour();
    }
  }

  function prevStep() {
    if (step > 0) setStep(step - 1);
  }

  if (!active) return null;

  const currentStep = TOUR_STEPS[step];
  const padding = 8;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[9998] bg-black/40 transition-opacity" />

      {/* Highlight cutout */}
      {rect && (
        <div
          className="fixed z-[9999] rounded-lg border-2 border-accent shadow-lg pointer-events-none"
          style={{
            top: rect.top - padding,
            left: rect.left - padding,
            width: rect.width + padding * 2,
            height: rect.height + padding * 2,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.4)",
          }}
        />
      )}

      {/* Popover */}
      <div
        className="fixed z-[10000] w-80 rounded-xl border border-border bg-white p-4 shadow-xl"
        style={getPopoverPosition(rect, currentStep?.position ?? "bottom")}
      >
        <div className="flex items-start justify-between mb-2">
          <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">
            Paso {step + 1} de {TOUR_STEPS.length}
          </span>
          <button
            onClick={completeTour}
            className="text-text-muted hover:text-text-primary text-xs"
          >
            Saltar
          </button>
        </div>
        <h4 className="text-sm font-semibold text-text-primary">
          {currentStep?.title}
        </h4>
        <p className="mt-1 text-[12px] leading-relaxed text-text-secondary">
          {currentStep?.description}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-1">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${
                  i === step ? "bg-accent" : "bg-border"
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={prevStep}
                className="rounded-md border border-border px-3 py-1 text-xs font-medium text-text-secondary hover:bg-bg-hover"
              >
                Anterior
              </button>
            )}
            <button
              onClick={nextStep}
              className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-white hover:bg-accent-hover"
            >
              {step === TOUR_STEPS.length - 1 ? "Finalizar" : "Siguiente"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function getPopoverPosition(
  rect: DOMRect | null,
  position: string,
): React.CSSProperties {
  if (!rect) {
    return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  }

  const gap = 16;
  switch (position) {
    case "right":
      return {
        top: rect.top,
        left: rect.right + gap,
      };
    case "left":
      return {
        top: rect.top,
        right: window.innerWidth - rect.left + gap,
      };
    case "top":
      return {
        bottom: window.innerHeight - rect.top + gap,
        left: rect.left,
      };
    case "bottom":
    default:
      return {
        top: rect.bottom + gap,
        left: rect.left,
      };
  }
}

/**
 * Button to restart the tour manually (for help menu)
 */
export function RestartTourButton() {
  function restart() {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    window.location.reload();
  }

  return (
    <button
      onClick={restart}
      className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary"
    >
      <svg
        className="h-3.5 w-3.5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
        />
      </svg>
      Repetir tutorial
    </button>
  );
}
