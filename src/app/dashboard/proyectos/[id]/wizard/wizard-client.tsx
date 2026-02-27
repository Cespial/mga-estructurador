"use client";

import { useState, useRef, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { saveWizardStep, submitProject } from "./actions";
import type {
  Project,
  ProjectForm,
  WizardStepDefinition,
  WizardField,
  AiChatMessage,
} from "@/lib/types/database";

/* ──────────────────────────────────────────────────────────
   Props
   ────────────────────────────────────────────────────────── */
interface WizardClientProps {
  project: Project;
  projectForms: ProjectForm[];
  wizardSteps: WizardStepDefinition[];
  convocatoriaName: string;
  initialChatMessages: AiChatMessage[];
}

/* ──────────────────────────────────────────────────────────
   Chat message type (local state)
   ────────────────────────────────────────────────────────── */
interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  fieldId?: string;
}

/* ──────────────────────────────────────────────────────────
   Component
   ────────────────────────────────────────────────────────── */
export function WizardClient({
  project,
  projectForms,
  wizardSteps,
  convocatoriaName,
  initialChatMessages,
}: WizardClientProps) {
  const [isPending, startTransition] = useTransition();

  /* ── Step state ────────────────────────────────────── */
  const [currentStep, setCurrentStep] = useState(() => {
    // Start at first incomplete step
    const firstIncomplete = projectForms.find((f) => !f.completed);
    if (firstIncomplete) {
      const idx = wizardSteps.findIndex((s) => s.step_number === firstIncomplete.step_number);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  });

  /* ── Form data state ───────────────────────────────── */
  const [allFormData, setAllFormData] = useState<Record<number, Record<string, string>>>(() => {
    const initial: Record<number, Record<string, string>> = {};
    for (const form of projectForms) {
      const data = (form.form_data ?? {}) as Record<string, string>;
      initial[form.step_number] = data;
    }
    // Ensure every step has an entry
    for (const step of wizardSteps) {
      if (!initial[step.step_number]) {
        initial[step.step_number] = {};
      }
    }
    return initial;
  });

  /* ── Saving / status state ─────────────────────────── */
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Chat state ────────────────────────────────────── */
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>(() =>
    initialChatMessages.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
    }))
  );
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [activeAiFieldId, setActiveAiFieldId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  /* ── Derived ───────────────────────────────────────── */
  const step = wizardSteps[currentStep];
  const stepData = allFormData[step.step_number] ?? {};
  const totalSteps = wizardSteps.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const completedSteps = projectForms.filter((f) => f.completed).length;

  /* ── Scroll chat to bottom on new messages ─────────── */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  /* ── Auto-save with debounce ───────────────────────── */
  const autoSave = useCallback(
    (stepNum: number, data: Record<string, string>) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setSaveStatus("idle");

      saveTimerRef.current = setTimeout(async () => {
        setSaving(true);
        try {
          // Determine if step is complete (all required fields filled)
          const stepDef = wizardSteps.find((s) => s.step_number === stepNum);
          const isComplete = stepDef
            ? stepDef.fields
                .filter((f) => f.required && f.type !== "file")
                .every((f) => data[f.id]?.trim())
            : false;

          await saveWizardStep(project.id, stepNum, data, isComplete);
          setSaveStatus("saved");
        } catch {
          setSaveStatus("error");
        } finally {
          setSaving(false);
        }
      }, 1000);
    },
    [project.id, wizardSteps]
  );

  /* ── Handle field change ───────────────────────────── */
  const handleFieldChange = useCallback(
    (fieldId: string, value: string) => {
      setAllFormData((prev) => {
        const updated = {
          ...prev,
          [step.step_number]: { ...(prev[step.step_number] ?? {}), [fieldId]: value },
        };
        autoSave(step.step_number, updated[step.step_number]);
        return updated;
      });
    },
    [step.step_number, autoSave]
  );

  /* ── Navigation ────────────────────────────────────── */
  const goToStep = useCallback(
    async (targetStep: number) => {
      // Save current step before navigating
      setSaving(true);
      try {
        const stepDef = wizardSteps[currentStep];
        const data = allFormData[stepDef.step_number] ?? {};
        const isComplete = stepDef.fields
          .filter((f) => f.required && f.type !== "file")
          .every((f) => data[f.id]?.trim());
        await saveWizardStep(project.id, stepDef.step_number, data, isComplete);
      } catch {
        /* continue navigation even if save fails */
      } finally {
        setSaving(false);
      }
      setCurrentStep(targetStep);
      setSaveStatus("idle");
    },
    [currentStep, allFormData, wizardSteps, project.id]
  );

  /* ── Submit project ────────────────────────────────── */
  const handleSubmit = useCallback(async () => {
    setSubmitError(null);
    // Save last step first
    setSaving(true);
    try {
      const data = allFormData[step.step_number] ?? {};
      const isComplete = step.fields
        .filter((f) => f.required && f.type !== "file")
        .every((f) => data[f.id]?.trim());
      await saveWizardStep(project.id, step.step_number, data, isComplete);
    } catch {
      /* continue */
    } finally {
      setSaving(false);
    }

    startTransition(async () => {
      try {
        await submitProject(project.id);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error al enviar el proyecto.";
        setSubmitError(msg);
      }
    });
  }, [allFormData, step, project.id]);

  /* ── AI Chat ───────────────────────────────────────── */
  const sendChatMessage = useCallback(
    async (message: string, fieldId?: string) => {
      if (!message.trim()) return;

      const userMsg: ChatMsg = {
        id: `user-${Date.now()}`,
        role: "user",
        content: message,
        fieldId,
      };
      setChatMessages((prev) => [...prev, userMsg]);
      setChatInput("");
      setChatLoading(true);

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: project.id,
            step_number: step.step_number,
            content: message,
          }),
        });

        if (!res.ok) {
          throw new Error("Error en la respuesta del asistente.");
        }

        const data = await res.json();
        const assistantMsg: ChatMsg = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.content ?? "Lo siento, no pude generar una respuesta.",
          fieldId,
        };
        setChatMessages((prev) => [...prev, assistantMsg]);

        if (fieldId) {
          setActiveAiFieldId(fieldId);
        }
      } catch {
        const errMsg: ChatMsg = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content:
            "Lo siento, hubo un error al conectar con el asistente. Por favor intenta de nuevo.",
        };
        setChatMessages((prev) => [...prev, errMsg]);
      } finally {
        setChatLoading(false);
      }
    },
    [project.id, step, allFormData]
  );

  /* ── Apply AI suggestion to field ──────────────────── */
  const applySuggestion = useCallback(
    (content: string, fieldId?: string) => {
      const targetField = fieldId ?? activeAiFieldId;
      if (!targetField) return;
      handleFieldChange(targetField, content);
      setActiveAiFieldId(null);
    },
    [activeAiFieldId, handleFieldChange]
  );

  /* ── Render field ──────────────────────────────────── */
  function renderField(field: WizardField) {
    const value = stepData[field.id] ?? "";

    const aiButton = field.aiAssistable ? (
      <button
        type="button"
        onClick={() => {
          const msg = `Ayudame con el campo: ${field.label}`;
          setActiveAiFieldId(field.id);
          sendChatMessage(msg, field.id);
          chatInputRef.current?.focus();
        }}
        className="inline-flex items-center gap-1 rounded-[var(--radius-button)] bg-accent-muted px-2 py-1 text-xs font-medium text-accent hover:bg-accent/20 transition-all duration-200 group/ai"
        title="Asistir con IA"
      >
        <svg
          className="h-3.5 w-3.5 transition-transform group-hover/ai:rotate-12"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
        Asistir con IA
      </button>
    ) : null;

    switch (field.type) {
      case "text":
        return (
          <div key={field.id} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor={field.id} className="block text-sm font-medium text-text-secondary">
                {field.label}
                {field.required && <span className="ml-1 text-accent">*</span>}
              </label>
              {aiButton}
            </div>
            {field.description && (
              <p className="text-xs text-text-muted">{field.description}</p>
            )}
            <input
              id={field.id}
              type="text"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              className="block w-full rounded-[var(--radius-input)] border bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-200 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 border-border"
            />
          </div>
        );

      case "textarea":
        return (
          <div key={field.id} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor={field.id} className="block text-sm font-medium text-text-secondary">
                {field.label}
                {field.required && <span className="ml-1 text-accent">*</span>}
              </label>
              {aiButton}
            </div>
            {field.description && (
              <p className="text-xs text-text-muted">{field.description}</p>
            )}
            <textarea
              id={field.id}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              rows={5}
              className="block w-full rounded-[var(--radius-input)] border bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-200 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 border-border resize-y"
            />
          </div>
        );

      case "number":
        return (
          <div key={field.id} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor={field.id} className="block text-sm font-medium text-text-secondary">
                {field.label}
                {field.required && <span className="ml-1 text-accent">*</span>}
              </label>
              {aiButton}
            </div>
            {field.description && (
              <p className="text-xs text-text-muted">{field.description}</p>
            )}
            <input
              id={field.id}
              type="number"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              className="block w-full rounded-[var(--radius-input)] border bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-200 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 border-border"
            />
          </div>
        );

      case "currency":
        return (
          <div key={field.id} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor={field.id} className="block text-sm font-medium text-text-secondary">
                {field.label}
                {field.required && <span className="ml-1 text-accent">*</span>}
              </label>
              {aiButton}
            </div>
            {field.description && (
              <p className="text-xs text-text-muted">{field.description}</p>
            )}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-text-muted">
                $
              </span>
              <input
                id={field.id}
                type="text"
                inputMode="numeric"
                value={value}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  handleFieldChange(field.id, raw);
                }}
                placeholder={field.placeholder}
                required={field.required}
                className="block w-full rounded-[var(--radius-input)] border bg-bg-input pl-7 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-200 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 border-border"
              />
            </div>
            {value && (
              <p className="text-xs text-text-muted">
                ${Number(value).toLocaleString("es-CO")}
              </p>
            )}
          </div>
        );

      case "select":
        return (
          <div key={field.id} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor={field.id} className="block text-sm font-medium text-text-secondary">
                {field.label}
                {field.required && <span className="ml-1 text-accent">*</span>}
              </label>
              {aiButton}
            </div>
            {field.description && (
              <p className="text-xs text-text-muted">{field.description}</p>
            )}
            <select
              id={field.id}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.required}
              className="block w-full rounded-[var(--radius-input)] border bg-bg-input px-3 py-2 text-sm text-text-primary transition-colors duration-200 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 border-border"
            >
              <option value="">Seleccionar...</option>
              {(field.options ?? []).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        );

      case "date":
        return (
          <div key={field.id} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor={field.id} className="block text-sm font-medium text-text-secondary">
                {field.label}
                {field.required && <span className="ml-1 text-accent">*</span>}
              </label>
              {aiButton}
            </div>
            {field.description && (
              <p className="text-xs text-text-muted">{field.description}</p>
            )}
            <input
              id={field.id}
              type="date"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.required}
              className="block w-full rounded-[var(--radius-input)] border bg-bg-input px-3 py-2 text-sm text-text-primary transition-colors duration-200 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 border-border"
            />
          </div>
        );

      case "file":
        return (
          <div key={field.id} className="space-y-1.5">
            <label className="block text-sm font-medium text-text-secondary">
              {field.label}
              {field.required && <span className="ml-1 text-accent">*</span>}
            </label>
            {field.description && (
              <p className="text-xs text-text-muted">{field.description}</p>
            )}
            <div className="relative rounded-[var(--radius-input)] border-2 border-dashed border-border hover:border-accent/40 transition-colors duration-200 bg-bg-input/50">
              <div className="flex flex-col items-center justify-center py-8 px-4">
                <svg
                  className="h-8 w-8 text-text-muted mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
                <p className="text-sm text-text-secondary">
                  Arrastra un archivo o{" "}
                  <span className="text-accent font-medium cursor-pointer">selecciona</span>
                </p>
                <p className="mt-1 text-xs text-text-muted">PDF, DOCX, XLS (max 10MB)</p>
              </div>
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  /* ──────────────────────────────────────────────────────
     Render
     ────────────────────────────────────────────────────── */
  return (
    <div className="animate-fade-in -m-6">
      {/* Top bar */}
      <div className="glass sticky top-0 z-20 flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/dashboard/proyectos/${project.id}`}
            className="text-text-muted hover:text-text-secondary transition-colors shrink-0"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-text-primary truncate">
              {project.title || "Nuevo Proyecto"}
            </h1>
            <p className="text-xs text-text-muted truncate">{convocatoriaName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {/* Save indicator */}
          <div className="flex items-center gap-1.5">
            {saving && (
              <div className="flex items-center gap-1.5 text-xs text-text-muted animate-pulse">
                <div className="h-1.5 w-1.5 rounded-full bg-warning" />
                Guardando...
              </div>
            )}
            {saveStatus === "saved" && !saving && (
              <div className="flex items-center gap-1.5 text-xs text-success">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Guardado
              </div>
            )}
            {saveStatus === "error" && !saving && (
              <div className="flex items-center gap-1.5 text-xs text-danger">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                Error al guardar
              </div>
            )}
          </div>
          <Badge variant="accent">
            Paso {currentStep + 1} de {totalSteps}
          </Badge>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex h-[calc(100vh-8rem)]">
        {/* ── LEFT COLUMN: Form ── */}
        <div className="flex-1 flex flex-col min-w-0 lg:w-2/3">
          {/* Step navigation bar */}
          <div className="border-b border-border bg-bg-card/50 px-6 py-3">
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {wizardSteps.map((s, idx) => {
                const form = projectForms.find((f) => f.step_number === s.step_number);
                const isCompleted = form?.completed ?? false;
                const isCurrent = idx === currentStep;

                return (
                  <button
                    key={s.step_number}
                    onClick={() => goToStep(idx)}
                    className={`flex items-center gap-2 rounded-[var(--radius-button)] px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                      isCurrent
                        ? "bg-accent text-white shadow-sm"
                        : isCompleted
                          ? "bg-success-muted text-success hover:bg-success-muted/80"
                          : "bg-slate-100 text-text-muted hover:bg-slate-200 hover:text-text-secondary"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                        isCurrent
                          ? "bg-white/30 text-white"
                          : isCompleted
                            ? "bg-success/20 text-success"
                            : "bg-slate-200 text-text-muted"
                      }`}
                    >
                      {isCompleted ? (
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      ) : (
                        s.step_number
                      )}
                    </span>
                    {s.step_name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Progress */}
          <div className="px-6 pt-4">
            <Progress
              value={completedSteps}
              max={totalSteps}
              label="Progreso total"
              size="sm"
            />
          </div>

          {/* Step content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="animate-slide-in-right" key={step.step_number}>
              {/* Step header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-muted text-accent font-bold text-sm">
                    {step.step_number}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-text-primary">{step.step_name}</h2>
                    <p className="text-sm text-text-secondary">{step.description}</p>
                  </div>
                </div>
              </div>

              {/* Fields */}
              <div className="space-y-5">
                {step.fields.map((field) => renderField(field))}
              </div>
            </div>
          </div>

          {/* Navigation footer */}
          <div className="border-t border-border bg-bg-card/80 px-6 py-4">
            {submitError && (
              <div className="mb-3 rounded-[var(--radius-input)] bg-danger-muted border border-danger/20 px-3 py-2 text-xs text-danger">
                {submitError}
              </div>
            )}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => goToStep(currentStep - 1)}
                disabled={isFirstStep || saving}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                Anterior
              </Button>

              <div className="flex items-center gap-3">
                {isLastStep ? (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={saving || isPending}
                    className="glow-accent"
                  >
                    {isPending ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                        Enviar Proyecto
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={() => goToStep(currentStep + 1)}
                    disabled={saving}
                  >
                    Siguiente
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: AI Chat ── */}
        <div className="hidden lg:flex w-[380px] flex-col border-l border-border bg-bg-sidebar/50">
          {/* Chat header */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-input)] bg-accent-muted text-accent">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Asistente IA</h3>
              <p className="text-xs text-text-muted">Te ayudo a estructurar tu proyecto</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-muted/50 text-accent mb-4">
                  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-text-primary mb-1">
                  Hola, soy tu asistente
                </p>
                <p className="text-xs text-text-muted leading-relaxed">
                  Puedo ayudarte a redactar cualquier campo del formulario. Haz clic en{" "}
                  <span className="text-accent font-medium">&quot;Asistir con IA&quot;</span>{" "}
                  en un campo o escribeme aqui.
                </p>
                <div className="mt-4 space-y-1.5 w-full">
                  {[
                    "Como redacto una buena justificacion?",
                    "Que debe incluir la descripcion del problema?",
                    "Ayudame con los resultados esperados",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => sendChatMessage(suggestion)}
                      className="w-full rounded-[var(--radius-input)] border border-border px-3 py-2 text-left text-xs text-text-secondary hover:border-accent/40 hover:bg-accent-muted/30 hover:text-accent transition-all duration-200"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
              >
                <div
                  className={`max-w-[85%] rounded-[var(--radius-card)] px-3.5 py-2.5 ${
                    msg.role === "user"
                      ? "bg-accent text-white rounded-br-sm"
                      : "bg-bg-elevated border border-border text-text-primary rounded-bl-sm"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                  {/* Apply suggestion button for assistant messages with a field context */}
                  {msg.role === "assistant" && msg.fieldId && (
                    <button
                      onClick={() => applySuggestion(msg.content, msg.fieldId)}
                      className="mt-2 flex items-center gap-1.5 rounded-[var(--radius-button)] bg-accent/10 border border-accent/20 px-2.5 py-1 text-xs font-medium text-accent hover:bg-accent/20 transition-all duration-200"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Aplicar sugerencia
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {chatLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-bg-elevated border border-border rounded-[var(--radius-card)] rounded-bl-sm px-4 py-3">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="h-2 w-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="h-2 w-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div className="border-t border-border p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendChatMessage(chatInput);
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={chatInputRef}
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Escribe tu pregunta..."
                disabled={chatLoading}
                className="flex-1 rounded-[var(--radius-input)] border border-border bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-200 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-button)] bg-accent text-white hover:bg-accent-hover transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
