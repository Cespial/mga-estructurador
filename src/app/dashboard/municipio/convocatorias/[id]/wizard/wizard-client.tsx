"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { MgaEtapa, MgaCampo } from "@/lib/types/database";
import type { AiAssistResponse } from "@/lib/ai/schemas";
import { useAiStream } from "@/lib/hooks/use-ai-stream";
import { TextDiffView } from "@/components/ai/text-diff-view";
import { ProjectComparison } from "@/components/ai/project-comparison";
import { ImprovementWizard } from "@/components/ai/improvement-wizard";
import { GlossaryText } from "@/components/mga-glossary-tooltip";
import { FieldWritingGuide } from "@/components/field-writing-guide";
import { DeadlineRiskIndicator } from "@/components/deadline-risk-indicator";
import { PreSubmitChecklist } from "@/components/pre-submit-checklist";
import { SubmissionCeremony } from "@/components/submission-ceremony";
import { OnboardingTour } from "@/components/onboarding-tour";
import { FieldHistory } from "@/components/field-history";
import { ProgressMilestones } from "@/components/progress-milestones";
import { AiUsageStats } from "@/components/ai-usage-stats";
import { PostSubmissionTracker } from "@/components/post-submission-tracker";
import { RevisionRequestPanel } from "@/components/revision-request-panel";
import { EvaluationDeepDive } from "@/components/evaluation-deep-dive";
import { isFormLocked, STATUS_META, type SubmissionStatus } from "@/lib/submission-status";
import { saveSubmissionData } from "./actions";

interface PreEvalCampoScore {
  campo_id: string;
  campo_nombre: string;
  score: number;
  max_score: number;
  justificacion: string;
  recomendacion: string | null;
}

interface PreEvalEtapa {
  etapa_id: string;
  etapa_nombre: string;
  score: number;
  scores: PreEvalCampoScore[];
}

interface PreEvalResult {
  total_score: number;
  etapas: PreEvalEtapa[];
  recomendaciones_generales: string[];
  resumen: string;
  _meta: { model: string; duration_ms: number };
}

interface WizardProps {
  convocatoriaId: string;
  convocatoriaNombre: string;
  submissionId: string;
  etapas: MgaEtapa[];
  initialData: Record<string, string>;
  initialEtapa: string | null;
  initialProgress: number;
  initialStatus: string;
  initialLocked: boolean;
  deadline: string | null;
}

export function WizardClient({
  convocatoriaId,
  convocatoriaNombre,
  submissionId,
  etapas,
  initialData,
  initialEtapa,
  initialProgress,
  initialStatus,
  initialLocked,
  deadline,
}: WizardProps) {
  const [currentEtapaIndex, setCurrentEtapaIndex] = useState(() => {
    if (initialEtapa) {
      const idx = etapas.findIndex((e) => e.id === initialEtapa);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  });
  const [data, setData] = useState<Record<string, string>>(initialData);
  const [progress, setProgress] = useState(initialProgress);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [pendingFields, setPendingFields] = useState<Record<string, string>>(
    {},
  );

  // AI assist state
  const [aiActiveCampo, setAiActiveCampo] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<{
    campoId: string;
    data: AiAssistResponse & {
      _meta?: { model: string; duration_ms: number; cached?: boolean };
    };
  } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Streaming hook for AI assist
  const aiStream = useAiStream({
    onDone: (fullText, meta) => {
      // Try to parse as JSON for structured response
      if (aiActiveCampo) {
        try {
          const parsed = JSON.parse(fullText);
          setAiResponse({
            campoId: aiActiveCampo,
            data: {
              suggested_text: parsed.suggested_text ?? fullText,
              bullets: parsed.bullets ?? [],
              risks: parsed.risks ?? [],
              missing_info_questions: parsed.missing_info_questions ?? [],
              citations: parsed.citations ?? [],
              confidence: parsed.confidence ?? null,
              _meta: {
                model: meta.model,
                duration_ms: 0,
                cached: meta.cached,
              },
            },
          });
        } catch {
          setAiResponse({
            campoId: aiActiveCampo,
            data: {
              suggested_text: fullText,
              bullets: [],
              risks: [],
              missing_info_questions: [],
              citations: [],
              confidence: null,
              _meta: {
                model: meta.model,
                duration_ms: 0,
                cached: meta.cached,
              },
            },
          });
        }
      }
    },
    onError: (message) => {
      setAiError(message);
    },
  });

  // Pre-evaluation state
  const [preEvalLoading, setPreEvalLoading] = useState(false);
  const [preEvalResult, setPreEvalResult] = useState<PreEvalResult | null>(null);

  // Auto-draft state
  const [autoDrafting, setAutoDrafting] = useState(false);
  const [draftedFields, setDraftedFields] = useState<Set<string>>(new Set());

  // Improve text state
  const [improveTarget, setImproveTarget] = useState<string | null>(null);
  const [improveLoading, setImproveLoading] = useState(false);
  const [improveResult, setImproveResult] = useState<{
    campoId: string;
    improved_text: string;
    changes: { type: "added" | "reworded" | "removed"; description: string }[];
  } | null>(null);

  // Validate step state
  const [validationIssues, setValidationIssues] = useState<
    { field_id: string; severity: "error" | "warning" | "info"; message: string; suggestion: string }[]
  >([]);

  // Improvement wizard state
  const [showImprovementWizard, setShowImprovementWizard] = useState(false);

  // Wave A: Submission ceremony & checklist state
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>(
    (initialStatus as SubmissionStatus) || "draft",
  );
  const [formLocked, setFormLocked] = useState(initialLocked);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showCeremony, setShowCeremony] = useState(false);
  const [checklistPassed, setChecklistPassed] = useState(false);

  const locked = formLocked || isFormLocked(submissionStatus);

  // Smart nudge state (per-field)
  const [nudges, setNudges] = useState<Record<string, string | null>>({});
  const nudgeTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const nudgeCooldowns = useRef<Record<string, number>>({});

  const currentEtapa = etapas[currentEtapaIndex];

  const doSave = useCallback(
    async (fields: Record<string, string>, etapaId: string) => {
      if (Object.keys(fields).length === 0) return;

      setSaving(true);
      const result = await saveSubmissionData(
        submissionId,
        fields,
        etapaId,
        etapas,
      );

      if (result.success) {
        setProgress(result.progress);
        setLastSaved(new Date().toLocaleTimeString("es-CO"));
      }
      setSaving(false);
      setDirty(false);
    },
    [submissionId, etapas],
  );

  // Debounced autosave: whenever pendingFields changes
  useEffect(() => {
    if (!dirty || Object.keys(pendingFields).length === 0) return;

    const timer = setTimeout(() => {
      const fieldsToSave = { ...pendingFields };
      setPendingFields({});
      doSave(fieldsToSave, etapas[currentEtapaIndex].id);
    }, 1500);

    return () => clearTimeout(timer);
  }, [pendingFields, dirty, doSave, etapas, currentEtapaIndex]);

  function handleFieldChange(campoId: string, value: string) {
    if (locked) return; // Form is locked after submission
    setData((prev) => ({ ...prev, [campoId]: value }));
    setPendingFields((prev) => ({ ...prev, [campoId]: value }));
    setDirty(true);

    // Trigger smart nudge
    const campo = currentEtapa.campos.find((c) => c.id === campoId);
    if (campo && (campo.tipo === "textarea" || campo.tipo === "text")) {
      handleNudgeTrigger(campoId, campo.nombre, value);
    }
  }

  async function goToEtapa(index: number) {
    // Flush pending save before navigating
    if (Object.keys(pendingFields).length > 0) {
      const fieldsToSave = { ...pendingFields };
      setPendingFields({});
      await doSave(fieldsToSave, etapas[currentEtapaIndex].id);
    }

    // Trigger AI validation in background (don't block navigation)
    validateStep();

    setCurrentEtapaIndex(index);
    // Clear AI panel when changing etapa
    setAiResponse(null);
    setAiError(null);
    setAiActiveCampo(null);
    setImproveResult(null);
    setImproveTarget(null);
    setDraftedFields(new Set());
    setValidationIssues([]);
    setNudges({});
  }

  async function requestAiAssist(campo: MgaCampo) {
    setAiActiveCampo(campo.id);
    setAiError(null);
    setAiResponse(null);

    await aiStream.startStream("/api/ai/assist", {
      convocatoria_id: convocatoriaId,
      etapa_id: currentEtapa.id,
      campo_id: campo.id,
      current_text: data[campo.id] || undefined,
    });
  }

  function applyAiSuggestion() {
    if (!aiResponse) return;
    handleFieldChange(aiResponse.campoId, aiResponse.data.suggested_text);
    setAiResponse(null);
    setAiActiveCampo(null);
  }

  async function requestPreEvaluation() {
    // Flush pending saves first
    if (Object.keys(pendingFields).length > 0) {
      const fieldsToSave = { ...pendingFields };
      setPendingFields({});
      await doSave(fieldsToSave, etapas[currentEtapaIndex].id);
    }

    setPreEvalLoading(true);
    try {
      const res = await fetch("/api/pre-evaluation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: submissionId,
          convocatoria_id: convocatoriaId,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setAiError(json.error ?? "Error al pre-evaluar el proyecto");
        return;
      }

      setPreEvalResult(json as PreEvalResult);
    } catch {
      setAiError("Error de conexión al pre-evaluar el proyecto");
    } finally {
      setPreEvalLoading(false);
    }
  }

  // ── Auto-draft entire step ──
  async function requestAutoDraft() {
    setAutoDrafting(true);
    try {
      const emptyFieldIds = currentEtapa.campos
        .filter((c) => !data[c.id]?.trim())
        .map((c) => c.id);

      if (emptyFieldIds.length === 0) return;

      const res = await fetch("/api/ai/auto-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: submissionId,
          etapa_id: currentEtapa.id,
          campo_ids: emptyFieldIds,
          existing_data: data,
        }),
      });

      if (!res.ok) return;
      const json = await res.json();
      const drafted = json.fields ?? {};
      const newDrafted = new Set<string>();

      for (const [campoId, value] of Object.entries(drafted)) {
        if (typeof value === "string" && value.trim()) {
          handleFieldChange(campoId, value);
          newDrafted.add(campoId);
        }
      }
      setDraftedFields(newDrafted);
    } catch {
      // silent
    } finally {
      setAutoDrafting(false);
    }
  }

  // ── Improve text for a single field ──
  async function requestImproveText(campo: MgaCampo) {
    const currentText = data[campo.id];
    if (!currentText?.trim() || currentText.length < 20) return;

    setImproveTarget(campo.id);
    setImproveLoading(true);
    setImproveResult(null);

    try {
      const res = await fetch("/api/ai/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texto_actual: currentText,
          campo_nombre: campo.nombre,
          campo_descripcion: campo.descripcion ?? "",
          convocatoria_id: convocatoriaId,
        }),
      });

      if (!res.ok) return;
      const json = await res.json();
      setImproveResult({
        campoId: campo.id,
        improved_text: json.improved_text,
        changes: json.changes ?? [],
      });
    } catch {
      // silent
    } finally {
      setImproveLoading(false);
    }
  }

  // ── Validate step via AI before navigation ──
  async function validateStep() {
    try {
      const res = await fetch("/api/ai/validate-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: submissionId,
          etapa_id: currentEtapa.id,
          data_json: data,
          convocatoria_id: convocatoriaId,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setValidationIssues(json.issues ?? []);
      }
    } catch {
      // silent — don't block navigation
    }
  }

  // ── Smart nudge handler ──
  function handleNudgeTrigger(campoId: string, campoNombre: string, text: string) {
    if (nudgeTimers.current[campoId]) {
      clearTimeout(nudgeTimers.current[campoId]);
    }

    if (text.length < 15) return;

    const now = Date.now();
    if (nudgeCooldowns.current[campoId] && now - nudgeCooldowns.current[campoId] < 30000) return;

    nudgeTimers.current[campoId] = setTimeout(async () => {
      try {
        const res = await fetch("/api/ai/nudge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campo_nombre: campoNombre,
            campo_descripcion: "",
            texto_actual: text,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.nudge) {
            setNudges((prev) => ({ ...prev, [campoId]: json.nudge }));
            nudgeCooldowns.current[campoId] = Date.now();
            // Auto-dismiss after 10s
            setTimeout(() => {
              setNudges((prev) => ({ ...prev, [campoId]: null }));
            }, 10000);
          }
        }
      } catch {
        // silent
      }
    }, 3000);
  }

  // ── Build improvement wizard steps from pre-evaluation ──
  function getImprovementSteps() {
    if (!preEvalResult) return [];
    const steps: { campo_id: string; campo_nombre: string; current_text: string; score: number; max_score: number; recomendacion: string; weight: number; impact: number }[] = [];
    for (const etapa of preEvalResult.etapas) {
      for (const s of etapa.scores) {
        if (s.recomendacion && s.score < s.max_score) {
          steps.push({
            campo_id: s.campo_id,
            campo_nombre: s.campo_nombre,
            current_text: data[s.campo_id] ?? "",
            score: s.score,
            max_score: s.max_score,
            recomendacion: s.recomendacion,
            weight: 1,
            impact: (s.max_score - s.score) * 1,
          });
        }
      }
    }
    return steps;
  }

  function getEtapaStatus(etapa: MgaEtapa): "empty" | "partial" | "complete" {
    const requiredFields = etapa.campos.filter((c) => c.requerido);
    if (requiredFields.length === 0) {
      const anyFilled = etapa.campos.some((c) => data[c.id]?.trim());
      return anyFilled ? "complete" : "empty";
    }
    const filledRequired = requiredFields.filter(
      (c) => data[c.id]?.trim(),
    ).length;
    if (filledRequired === 0) return "empty";
    if (filledRequired === requiredFields.length) return "complete";
    return "partial";
  }

  function getValidationErrors(): string[] {
    const errors: string[] = [];
    for (const campo of currentEtapa.campos) {
      if (campo.requerido && !data[campo.id]?.trim()) {
        errors.push(`"${campo.nombre}" es requerido`);
      }
    }
    return errors;
  }

  const validationErrors = getValidationErrors();

  return (
    <div className="flex gap-6">
      {/* Onboarding tour */}
      <OnboardingTour />

      {/* Progress milestones (celebrations) */}
      <ProgressMilestones
        progress={progress}
        preEvalScore={preEvalResult?.total_score ?? null}
      />

      {/* Locked banner */}
      {locked && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-50 border-b border-amber-200 px-4 py-2 text-center">
          <p className="text-xs font-medium text-amber-800">
            {submissionStatus === "submitted"
              ? "Este proyecto fue enviado. El formulario esta bloqueado."
              : submissionStatus === "under_review"
                ? "Este proyecto esta en revision. El formulario esta bloqueado."
                : submissionStatus === "approved"
                  ? "Este proyecto fue aprobado."
                  : submissionStatus === "rejected"
                    ? "Este proyecto no fue aprobado."
                    : "El formulario esta bloqueado."}
          </p>
        </div>
      )}

      {/* Sidebar: etapa navigation */}
      <div className="w-56 shrink-0">
        <div className="sticky top-6">
          {/* Status badge */}
          {submissionStatus !== "draft" && (
            <div className={`mb-3 rounded-md border px-3 py-2 text-center ${STATUS_META[submissionStatus].bgColor} ${STATUS_META[submissionStatus].borderColor}`}>
              <p className={`text-xs font-semibold ${STATUS_META[submissionStatus].color}`}>
                {STATUS_META[submissionStatus].label}
              </p>
            </div>
          )}

          {/* Deadline risk */}
          {deadline && (
            <div className="mb-3">
              <DeadlineRiskIndicator deadline={deadline} progress={progress} />
            </div>
          )}

          {/* Progress bar */}
          <div className="mb-4" data-tour="progress-bar">
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>Progreso general</span>
              <span className="font-semibold text-text-primary">{progress}%</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-bg-elevated">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  progress === 100
                    ? "bg-emerald-500 animate-shimmer"
                    : "bg-accent"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            {progress === 100 && submissionStatus === "draft" && (
              <div className="mt-2 animate-fade-in-up rounded-md bg-emerald-50 px-3 py-2 text-center">
                <p className="text-xs font-semibold text-emerald-700">
                  Completado
                </p>
                <p className="text-[10px] text-emerald-600">
                  Todas las etapas diligenciadas
                </p>
              </div>
            )}
          </div>

          <nav className="space-y-1" data-tour="etapa-nav">
            {etapas.map((etapa, i) => {
              const status = getEtapaStatus(etapa);
              const isCurrent = i === currentEtapaIndex;
              return (
                <button
                  key={etapa.id}
                  onClick={() => goToEtapa(i)}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] transition ${
                    isCurrent
                      ? "bg-accent/5 font-medium text-accent"
                      : "text-text-secondary hover:bg-bg-hover"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      status === "complete"
                        ? "bg-emerald-100 text-emerald-700"
                        : status === "partial"
                          ? "bg-amber-100 text-amber-700"
                          : isCurrent
                            ? "bg-accent/8 text-accent"
                            : "bg-bg-elevated text-text-muted"
                    }`}
                  >
                    {status === "complete" ? "\u2713" : etapa.orden}
                  </span>
                  <span className="truncate">{etapa.nombre}</span>
                </button>
              );
            })}
          </nav>

          {/* Save status */}
          <div className="mt-4 text-xs text-text-muted">
            {saving ? (
              <span className="text-accent">Guardando...</span>
            ) : lastSaved ? (
              <span>Guardado a las {lastSaved}</span>
            ) : (
              <span>Autoguardado activo</span>
            )}
          </div>

          {/* AI usage stats */}
          <AiUsageStats submissionId={submissionId} />

          {/* Submit button — only when in draft or needs_revision */}
          {!locked && (submissionStatus === "draft" || submissionStatus === "needs_revision") && (
            <button
              type="button"
              onClick={() => setShowChecklist(true)}
              className="mt-4 w-full rounded-[var(--radius-button)] bg-accent px-3 py-2 text-xs font-medium text-white hover:bg-accent-hover transition-colors"
            >
              Preparar envio
            </button>
          )}
        </div>
      </div>

      {/* Main content: current etapa fields */}
      <div className="min-w-0 flex-1">
        {/* Post-submission tracker */}
        {submissionStatus !== "draft" && (
          <div className="mb-4">
            <PostSubmissionTracker
              status={submissionStatus}
              submittedAt={null}
              completedAt={null}
            />
          </div>
        )}

        {/* Revision request panel */}
        {submissionStatus === "needs_revision" && (
          <div className="mb-4">
            <RevisionRequestPanel
              submissionId={submissionId}
              onNavigateToField={(campoId) => {
                // Find which etapa contains this campo and navigate to it
                for (let i = 0; i < etapas.length; i++) {
                  if (etapas[i].campos.some((c) => c.id === campoId)) {
                    setCurrentEtapaIndex(i);
                    break;
                  }
                }
              }}
            />
          </div>
        )}

        {/* Evaluation deep dive */}
        {preEvalResult && submissionStatus !== "draft" && (
          <div className="mb-4">
            <EvaluationDeepDive
              scores={preEvalResult.etapas.flatMap((e) =>
                e.scores.map((s) => ({
                  campo_id: s.campo_id,
                  campo_nombre: s.campo_nombre,
                  score: s.score,
                  max_score: s.max_score,
                  justificacion: s.justificacion,
                  recomendacion: s.recomendacion ?? undefined,
                  current_response: data[s.campo_id],
                })),
              )}
              totalScore={preEvalResult.total_score}
              maxScore={100}
              onImproveField={(campoId) => {
                for (let i = 0; i < etapas.length; i++) {
                  if (etapas[i].campos.some((c) => c.id === campoId)) {
                    setCurrentEtapaIndex(i);
                    break;
                  }
                }
              }}
            />
          </div>
        )}

        <div className="rounded-[14px] border border-border bg-bg-card">
          <div className="border-b border-border px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/8 text-sm font-bold text-accent">
                  {currentEtapa.orden}
                </span>
                <div>
                  <h3 className="text-base font-semibold text-text-primary">
                    {currentEtapa.nombre}
                  </h3>
                  <p className="text-xs text-text-muted">
                    {currentEtapa.campos.length} campo
                    {currentEtapa.campos.length !== 1 ? "s" : ""}
                    {validationErrors.length > 0 && (
                      <span className="ml-2 text-amber-600">
                        ({validationErrors.length} pendiente
                        {validationErrors.length !== 1 ? "s" : ""})
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={requestAutoDraft}
                disabled={autoDrafting || locked}
                data-tour="auto-draft-btn"
                className="inline-flex items-center gap-1.5 rounded-md border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 transition hover:bg-purple-100 disabled:opacity-50"
              >
                {autoDrafting ? (
                  <>
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-purple-300 border-t-purple-700" />
                    Generando...
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                    </svg>
                    Auto-completar etapa
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="divide-y divide-border px-6">
            {currentEtapa.campos.map((campo) => (
              <div key={campo.id} className="py-4">
                <div className="mb-1 flex items-center justify-between">
                  <label
                    htmlFor={campo.id}
                    className="flex items-center gap-2 text-[13px] font-medium text-text-primary"
                  >
                    <GlossaryText text={campo.nombre} />
                    {campo.requerido && (
                      <span className="text-xs text-red-500">*</span>
                    )}
                  </label>
                  {(campo.tipo === "textarea" || campo.tipo === "text") && (
                    <div className="flex items-center gap-1.5">
                      {/* Improve button — only for fields with text >20 chars */}
                      {data[campo.id]?.length > 20 && (
                        <button
                          type="button"
                          onClick={() => requestImproveText(campo)}
                          disabled={improveLoading && improveTarget === campo.id}
                          className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                        >
                          {improveLoading && improveTarget === campo.id ? (
                            <span className="inline-block h-2.5 w-2.5 animate-spin rounded-full border border-emerald-300 border-t-emerald-700" />
                          ) : (
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                            </svg>
                          )}
                          Mejorar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => requestAiAssist(campo)}
                        disabled={aiStream.isStreaming || locked}
                        data-tour="ai-assist-btn"
                        className="inline-flex items-center gap-1.5 rounded-md border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700 transition hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {aiStream.isStreaming && aiActiveCampo === campo.id ? (
                          <>
                            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-purple-300 border-t-purple-700" />
                            Generando...
                          </>
                        ) : (
                          <>
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
                            </svg>
                            Asistente IA
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
                {campo.descripcion && (
                  <p className="mb-2 text-xs text-text-muted">
                    <GlossaryText text={campo.descripcion} />
                  </p>
                )}
                {/* Writing guide */}
                <div data-tour="writing-guide">
                  <FieldWritingGuide campoId={campo.id} campoNombre={campo.nombre} />
                </div>
                <FieldInput
                  campo={campo}
                  value={data[campo.id] ?? ""}
                  onChange={(val) => handleFieldChange(campo.id, val)}
                  disabled={locked}
                />

                {/* Streaming text preview — shows while streaming */}
                {aiStream.isStreaming && aiActiveCampo === campo.id && (
                  <div className="mt-3 rounded-lg border border-purple-200 bg-purple-50/50 px-4 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-purple-500" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-500">
                        Generando respuesta...
                      </span>
                    </div>
                    <div className="text-[13px] text-text-primary animate-shimmer-text">
                      {aiStream.text || (
                        <span className="text-purple-400">Pensando...</span>
                      )}
                    </div>
                  </div>
                )}

                {/* AI Response Panel — inline below the field */}
                {aiResponse && aiResponse.campoId === campo.id && (
                  <AiResponsePanel
                    response={aiResponse.data}
                    onApply={applyAiSuggestion}
                    onDismiss={() => {
                      setAiResponse(null);
                      setAiActiveCampo(null);
                    }}
                  />
                )}
                {aiError && aiActiveCampo === campo.id && !aiStream.isStreaming && !aiResponse && (
                  <div className="mt-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
                    {aiError}
                  </div>
                )}

                {/* Text improvement diff */}
                {improveResult && improveResult.campoId === campo.id && (
                  <TextDiffView
                    originalText={data[campo.id] ?? ""}
                    improvedText={improveResult.improved_text}
                    changes={improveResult.changes}
                    onAccept={(text) => {
                      handleFieldChange(campo.id, text);
                      setImproveResult(null);
                      setImproveTarget(null);
                    }}
                    onDismiss={() => {
                      setImproveResult(null);
                      setImproveTarget(null);
                    }}
                  />
                )}

                {/* Project comparison */}
                {(campo.tipo === "textarea" || campo.tipo === "text") && (
                  <div className="mt-1">
                    <ProjectComparison
                      convocatoriaId={convocatoriaId}
                      submissionId={submissionId}
                      etapaId={currentEtapa.id}
                      campoId={campo.id}
                      campoNombre={campo.nombre}
                      currentValue={data[campo.id] ?? ""}
                    />
                  </div>
                )}

                {/* Smart nudge tooltip */}
                {nudges[campo.id] && (
                  <div className="mt-1.5 flex items-start gap-1.5 rounded-md border border-purple-100 bg-purple-50/50 px-3 py-2 text-xs text-purple-700 animate-fade-in">
                    <svg className="mt-0.5 h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                    </svg>
                    <span>{nudges[campo.id]}</span>
                    <button onClick={() => setNudges((prev) => ({ ...prev, [campo.id]: null }))} className="ml-auto text-purple-400 hover:text-purple-600">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Validation issues */}
                {validationIssues.filter((v) => v.field_id === campo.id).map((issue, idx) => (
                  <div
                    key={idx}
                    className={`mt-1.5 rounded-md px-3 py-2 text-xs ${
                      issue.severity === "error"
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : issue.severity === "warning"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}
                  >
                    {issue.message}
                    {issue.suggestion && (
                      <span className="block mt-0.5 text-[11px] opacity-75">{issue.suggestion}</span>
                    )}
                  </div>
                ))}

                {/* Auto-drafted indicator */}
                {draftedFields.has(campo.id) && (
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-purple-500">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                    </svg>
                    Auto-generado por IA — revisa y edita
                  </div>
                )}

                {/* Field history */}
                {(campo.tipo === "textarea" || campo.tipo === "text") && (
                  <FieldHistory
                    submissionId={submissionId}
                    campoId={campo.id}
                    campoNombre={campo.nombre}
                    currentValue={data[campo.id] ?? ""}
                    onRestore={(value) => handleFieldChange(campo.id, value)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pre-evaluation overlay */}
        {preEvalResult && (
          <PreEvaluationPanel
            result={preEvalResult}
            onClose={() => setPreEvalResult(null)}
            onStartImprovement={() => setShowImprovementWizard(true)}
          />
        )}

        {/* Improvement wizard modal */}
        {showImprovementWizard && preEvalResult && (
          <ImprovementWizard
            steps={getImprovementSteps()}
            convocatoriaId={convocatoriaId}
            onFieldUpdate={(campoId, newText) => handleFieldChange(campoId, newText)}
            onClose={() => setShowImprovementWizard(false)}
          />
        )}

        {/* Navigation buttons */}
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => goToEtapa(currentEtapaIndex - 1)}
            disabled={currentEtapaIndex === 0}
            className="rounded-[var(--radius-button)] border border-border px-4 py-2 text-[13px] font-medium text-text-secondary hover:bg-bg-hover transition-colors disabled:cursor-not-allowed disabled:opacity-30"
          >
            &larr; Anterior
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-muted">
              Etapa {currentEtapaIndex + 1} de {etapas.length}
            </span>
            <button
              type="button"
              onClick={requestPreEvaluation}
              disabled={progress < 30 || preEvalLoading}
              data-tour="pre-eval-btn"
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-button)] border border-purple-200 bg-purple-50 px-3 py-2 text-[13px] font-medium text-purple-700 transition hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {preEvalLoading ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-purple-300 border-t-purple-700" />
                  Pre-evaluando...
                </>
              ) : (
                <>
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
                      d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z"
                    />
                  </svg>
                  Pre-evaluar
                </>
              )}
            </button>
          </div>
          <button
            onClick={() => goToEtapa(currentEtapaIndex + 1)}
            disabled={currentEtapaIndex === etapas.length - 1}
            className="rounded-[var(--radius-button)] bg-accent px-4 py-2 text-[13px] font-medium text-white hover:bg-accent-hover transition-colors disabled:cursor-not-allowed disabled:opacity-30"
          >
            Siguiente &rarr;
          </button>
        </div>

        {/* Pre-submit checklist overlay */}
        {showChecklist && !showCeremony && (
          <div className="mt-4">
            <PreSubmitChecklist
              submissionId={submissionId}
              etapas={etapas}
              data={data}
              progress={progress}
              preEvalScore={preEvalResult?.total_score ?? null}
              onAllPassed={setChecklistPassed}
              onClose={() => setShowChecklist(false)}
            />
            {checklistPassed && (
              <div className="mt-3 text-right">
                <button
                  type="button"
                  onClick={() => {
                    setShowChecklist(false);
                    setShowCeremony(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-accent px-4 py-2 text-[13px] font-medium text-white hover:bg-accent-hover transition-colors"
                >
                  Continuar al envio
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Submission ceremony overlay */}
        {showCeremony && (
          <div className="mt-4">
            <SubmissionCeremony
              submissionId={submissionId}
              convocatoriaId={convocatoriaId}
              convocatoriaNombre={convocatoriaNombre}
              etapas={etapas}
              data={data}
              progress={progress}
              preEvalScore={preEvalResult?.total_score ?? null}
              onSubmitted={() => {
                setSubmissionStatus("submitted");
                setFormLocked(true);
                setShowCeremony(false);
              }}
              onClose={() => setShowCeremony(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Confidence Badge
// ============================================================

function ConfidenceBadge({ score }: { score: number | null | undefined }) {
  if (score == null) return null;

  const pct = Math.round(score * 100);
  const color =
    score > 0.8
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : score >= 0.5
        ? "bg-amber-100 text-amber-700 border-amber-200"
        : "bg-red-100 text-red-700 border-red-200";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${color}`}
    >
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {pct}% confianza
    </span>
  );
}

// ============================================================
// AI Response Panel
// ============================================================

function AiResponsePanel({
  response,
  onApply,
  onDismiss,
}: {
  response: AiAssistResponse & {
    _meta?: { model: string; duration_ms: number; cached?: boolean };
  };
  onApply: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="mt-3 rounded-lg border border-purple-200 bg-purple-50/50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-purple-100 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-purple-700">
            Sugerencia del Asistente IA
          </span>
          <ConfidenceBadge score={response.confidence} />
          {response._meta?.cached && (
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              Respuesta instantanea
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {response._meta && !response._meta.cached && (
            <span className="text-[10px] text-purple-400">
              {response._meta.model} &middot;{" "}
              {(response._meta.duration_ms / 1000).toFixed(1)}s
            </span>
          )}
          <button
            onClick={onDismiss}
            className="text-purple-400 hover:text-purple-600"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="space-y-3 px-4 py-3">
        {/* Suggested text */}
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-purple-500">
            Texto sugerido
          </p>
          <div className="rounded-md bg-bg-card p-3 text-[13px] text-text-primary shadow-sm">
            {response.suggested_text}
          </div>
        </div>

        {/* Bullets */}
        {response.bullets.length > 0 && (
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-purple-500">
              Puntos clave
            </p>
            <ul className="space-y-1">
              {response.bullets.map((b, i) => (
                <li
                  key={i}
                  className="flex items-start gap-1.5 text-xs text-text-secondary"
                >
                  <span className="mt-0.5 text-purple-400">&bull;</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Risks */}
        {response.risks.length > 0 && (
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-amber-600">
              Riesgos identificados
            </p>
            <ul className="space-y-1">
              {response.risks.map((r, i) => (
                <li
                  key={i}
                  className="flex items-start gap-1.5 text-xs text-amber-700"
                >
                  <span className="mt-0.5">&#9888;</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Missing info questions */}
        {response.missing_info_questions.length > 0 && (
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-accent">
              Informacion faltante
            </p>
            <ul className="space-y-1">
              {response.missing_info_questions.map((q, i) => (
                <li
                  key={i}
                  className="flex items-start gap-1.5 text-xs text-accent"
                >
                  <span className="mt-0.5">?</span>
                  {q}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Citations */}
        {response.citations && response.citations.length > 0 && (
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-teal-600">
              Fuentes citadas
            </p>
            <div className="space-y-2">
              {response.citations.map((cite, i) => (
                <div
                  key={i}
                  className="rounded-md border border-teal-100 bg-teal-50/50 px-3 py-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-teal-700">
                      {cite.source}
                    </span>
                    {cite.relevance_score != null && (
                      <span className="text-[10px] text-teal-500">
                        {(cite.relevance_score * 100).toFixed(0)}% relevancia
                      </span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-3 text-[11px] text-teal-800">
                    {cite.chunk_text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 border-t border-purple-100 pt-3">
          <button
            onClick={onApply}
            className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700"
          >
            Usar sugerencia
          </button>
          <button
            onClick={onDismiss}
            className="rounded-[var(--radius-button)] border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-bg-hover transition-colors"
          >
            Descartar
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Field Input
// ============================================================

function FieldInput({
  campo,
  value,
  onChange,
  disabled,
}: {
  campo: { id: string; tipo: string };
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  const baseClass =
    "block w-full rounded-[var(--radius-input)] border border-border bg-bg-input px-3 py-2.5 text-[13px] text-text-primary shadow-sm placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/8 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-bg-elevated";

  switch (campo.tipo) {
    case "textarea":
      return (
        <textarea
          id={campo.id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={5}
          className={baseClass}
          placeholder="Escriba aqui..."
          disabled={disabled}
        />
      );
    case "number":
      return (
        <input
          id={campo.id}
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
          placeholder="0"
          disabled={disabled}
        />
      );
    case "date":
      return (
        <input
          id={campo.id}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
          disabled={disabled}
        />
      );
    default:
      return (
        <input
          id={campo.id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
          placeholder="Escriba aqui..."
          disabled={disabled}
        />
      );
  }
}

// ============================================================
// Pre-Evaluation Panel
// ============================================================

function ScoreBar({ score, max }: { score: number; max: number }) {
  const pct = max > 0 ? (score / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 overflow-hidden rounded-full bg-purple-100">
        <div
          className={`h-full rounded-full transition-all ${
            pct >= 75
              ? "bg-emerald-500"
              : pct >= 50
                ? "bg-amber-500"
                : "bg-red-400"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-text-muted">
        {score}/{max}
      </span>
    </div>
  );
}

function PreEvaluationPanel({
  result,
  onClose,
  onStartImprovement,
}: {
  result: PreEvalResult;
  onClose: () => void;
  onStartImprovement?: () => void;
}) {
  const scorePct = Math.round(result.total_score);

  return (
    <div className="mt-4 rounded-[14px] border border-purple-200 bg-purple-50/50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-purple-100 px-5 py-3">
        <div className="flex items-center gap-2">
          <svg
            className="h-4 w-4 text-purple-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z"
            />
          </svg>
          <span className="text-sm font-semibold text-purple-800">
            Pre-evaluacion de tu proyecto
          </span>
        </div>
        <div className="flex items-center gap-3">
          {result._meta && (
            <span className="text-[10px] text-purple-400">
              {result._meta.model} &middot;{" "}
              {(result._meta.duration_ms / 1000).toFixed(1)}s
            </span>
          )}
          <button
            onClick={onClose}
            className="text-purple-400 hover:text-purple-600"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Total score */}
      <div className="border-b border-purple-100 px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-purple-700">
            Score estimado:
          </span>
          <div className="flex flex-1 items-center gap-2">
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-purple-100">
              <div
                className={`h-full rounded-full transition-all ${
                  scorePct >= 75
                    ? "bg-emerald-500"
                    : scorePct >= 50
                      ? "bg-amber-500"
                      : "bg-red-400"
                }`}
                style={{ width: `${scorePct}%` }}
              />
            </div>
            <span className="text-sm font-bold tabular-nums text-purple-800">
              {scorePct}/100
            </span>
          </div>
        </div>
      </div>

      {/* Etapas breakdown */}
      <div className="divide-y divide-purple-100 px-5">
        {result.etapas.map((etapa) => (
          <div key={etapa.etapa_id} className="py-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-text-primary">
                {etapa.etapa_nombre}
              </span>
              <span
                className={`text-xs font-bold tabular-nums ${
                  etapa.score >= 75
                    ? "text-emerald-600"
                    : etapa.score >= 50
                      ? "text-amber-600"
                      : "text-red-500"
                }`}
              >
                {Math.round(etapa.score)}/100
              </span>
            </div>
            <div className="space-y-2 pl-3">
              {etapa.scores.map((s) => (
                <div key={s.campo_id}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-text-secondary">
                      {s.campo_nombre}
                    </span>
                    <ScoreBar score={s.score} max={s.max_score} />
                  </div>
                  <p className="mt-0.5 text-[11px] text-text-muted">
                    {s.justificacion}
                  </p>
                  {s.recomendacion && (
                    <p className="mt-0.5 text-[11px] text-amber-700">
                      &#9888; {s.recomendacion}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Recomendaciones generales */}
      {result.recomendaciones_generales.length > 0 && (
        <div className="border-t border-purple-100 px-5 py-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-purple-500">
            Recomendaciones principales
          </p>
          <ol className="list-inside list-decimal space-y-1">
            {result.recomendaciones_generales.map((rec, i) => (
              <li key={i} className="text-xs text-text-secondary">
                {rec}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Resumen */}
      {result.resumen && (
        <div className="border-t border-purple-100 px-5 py-3">
          <p className="text-xs text-purple-700">{result.resumen}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-purple-100 px-5 py-3">
        {onStartImprovement && (
          <button
            onClick={onStartImprovement}
            className="inline-flex items-center gap-1.5 rounded-md bg-purple-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-purple-700"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
            </svg>
            Mejorar proyecto con IA
          </button>
        )}
        <button
          onClick={onClose}
          className="rounded-[var(--radius-button)] border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-bg-hover transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
