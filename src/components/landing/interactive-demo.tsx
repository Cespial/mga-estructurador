"use client";

import { useState } from "react";

/* ── Demo data ── */

const DEMO_ETAPAS = [
  {
    id: "identificacion",
    nombre: "Identificacion",
    campos: [
      { id: "problema", label: "Problema central", tipo: "textarea" },
      { id: "poblacion", label: "Poblacion objetivo", tipo: "text" },
    ],
  },
  {
    id: "preparacion",
    nombre: "Preparacion",
    campos: [
      { id: "objetivo", label: "Objetivo general del proyecto", tipo: "textarea" },
    ],
  },
];

const DEMO_CRITERIOS = [
  { campo_id: "problema", nombre: "Claridad del problema", peso: 3, maxScore: 4 },
  { campo_id: "poblacion", nombre: "Definicion de poblacion", peso: 2, maxScore: 4 },
  { campo_id: "objetivo", nombre: "Coherencia del objetivo", peso: 3, maxScore: 4 },
];

const PLACEHOLDER_VALUES: Record<string, string> = {
  problema:
    "La comunidad rural del municipio de San Pedro carece de acceso a agua potable. El 60% de la poblacion depende de fuentes no tratadas, generando enfermedades gastrointestinales recurrentes.",
  poblacion:
    "3.200 habitantes del area rural de San Pedro, incluyendo 890 menores de edad y 420 adultos mayores.",
  objetivo:
    "Garantizar el acceso a agua potable para la poblacion rural de San Pedro mediante la construccion de un acueducto veredal con capacidad para 800 familias.",
};

/* ── Component ── */

type DemoStep = "wizard" | "scoring" | "summary";

export function InteractiveDemo() {
  const [step, setStep] = useState<DemoStep>("wizard");
  const [etapaIdx, setEtapaIdx] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [scores, setScores] = useState<Record<string, number>>({});
  const [animatingScore, setAnimatingScore] = useState(false);

  const currentEtapa = DEMO_ETAPAS[etapaIdx];

  function fillWithExample() {
    setValues({ ...PLACEHOLDER_VALUES });
  }

  function handleChange(campoId: string, value: string) {
    setValues((prev) => ({ ...prev, [campoId]: value }));
  }

  function handleNextEtapa() {
    if (etapaIdx < DEMO_ETAPAS.length - 1) {
      setEtapaIdx(etapaIdx + 1);
    } else {
      // Move to scoring
      runScoring();
    }
  }

  function handlePrevEtapa() {
    if (etapaIdx > 0) {
      setEtapaIdx(etapaIdx - 1);
    }
  }

  function runScoring() {
    setStep("scoring");
    setAnimatingScore(true);

    // Simulate scoring with delays
    const newScores: Record<string, number> = {};
    DEMO_CRITERIOS.forEach((c, i) => {
      const hasValue = (values[c.campo_id] ?? "").trim().length > 20;
      const score = hasValue ? 3 + Math.round(Math.random() * 1) : 1 + Math.round(Math.random() * 1);
      setTimeout(() => {
        newScores[c.campo_id] = score;
        setScores({ ...newScores });
        if (i === DEMO_CRITERIOS.length - 1) {
          setTimeout(() => setAnimatingScore(false), 400);
        }
      }, 600 * (i + 1));
    });
  }

  function goToSummary() {
    setStep("summary");
  }

  function restart() {
    setStep("wizard");
    setEtapaIdx(0);
    setValues({});
    setScores({});
  }

  // Calculate overall score
  const totalPeso = DEMO_CRITERIOS.reduce((acc, c) => acc + c.peso, 0);
  const weightedScore =
    Object.keys(scores).length === DEMO_CRITERIOS.length
      ? DEMO_CRITERIOS.reduce((acc, c) => {
          const s = scores[c.campo_id] ?? 0;
          return acc + (s / c.maxScore) * c.peso;
        }, 0) /
        totalPeso *
        100
      : null;

  const filledCount = Object.values(values).filter((v) => v.trim()).length;
  const totalFields = DEMO_ETAPAS.reduce((acc, e) => acc + e.campos.length, 0);
  const progress = Math.round((filledCount / totalFields) * 100);

  return (
    <div className="rounded-[14px] border border-border bg-bg-card shadow-lg">
      {/* Tab bar */}
      <div className="flex border-b border-border">
        <StepTab
          label="1. Diligenciar"
          active={step === "wizard"}
          done={step === "scoring" || step === "summary"}
        />
        <StepTab
          label="2. Evaluar"
          active={step === "scoring"}
          done={step === "summary"}
        />
        <StepTab label="3. Resumen" active={step === "summary"} done={false} />
      </div>

      <div className="p-6">
        {step === "wizard" && (
          <WizardStep
            etapa={currentEtapa}
            etapaIdx={etapaIdx}
            totalEtapas={DEMO_ETAPAS.length}
            values={values}
            progress={progress}
            onChange={handleChange}
            onNext={handleNextEtapa}
            onPrev={handlePrevEtapa}
            onFill={fillWithExample}
          />
        )}

        {step === "scoring" && (
          <ScoringStep
            scores={scores}
            weightedScore={weightedScore}
            animating={animatingScore}
            onNext={goToSummary}
          />
        )}

        {step === "summary" && (
          <SummaryStep
            values={values}
            scores={scores}
            weightedScore={weightedScore}
            onRestart={restart}
          />
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function StepTab({
  label,
  active,
  done,
}: {
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div
      className={`flex-1 px-4 py-3 text-center text-[11px] font-medium ${
        active
          ? "border-b-2 border-accent text-accent"
          : done
            ? "text-emerald-600"
            : "text-text-muted"
      }`}
    >
      {done ? `${label} ✓` : label}
    </div>
  );
}

function WizardStep({
  etapa,
  etapaIdx,
  totalEtapas,
  values,
  progress,
  onChange,
  onNext,
  onPrev,
  onFill,
}: {
  etapa: (typeof DEMO_ETAPAS)[number];
  etapaIdx: number;
  totalEtapas: number;
  values: Record<string, string>;
  progress: number;
  onChange: (id: string, v: string) => void;
  onNext: () => void;
  onPrev: () => void;
  onFill: () => void;
}) {
  const isLast = etapaIdx === totalEtapas - 1;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] text-text-muted">
            Etapa {etapaIdx + 1} de {totalEtapas}
          </p>
          <h3 className="text-[15px] font-semibold text-text-primary">
            {etapa.nombre}
          </h3>
        </div>
        <div className="text-right">
          <p className="text-[22px] font-semibold text-accent tabular-nums">{progress}%</p>
          <p className="text-[10px] text-text-muted">progreso</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-4">
        {etapa.campos.map((campo) => (
          <div key={campo.id}>
            <label
              htmlFor={`demo-${campo.id}`}
              className="block text-[13px] font-medium text-text-primary"
            >
              {campo.label}
            </label>
            {campo.tipo === "textarea" ? (
              <textarea
                id={`demo-${campo.id}`}
                value={values[campo.id] ?? ""}
                onChange={(e) => onChange(campo.id, e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-[var(--radius-input)] border border-border bg-bg-input px-3 py-2.5 text-[13px] text-text-primary shadow-sm placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/8"
                placeholder="Escribe aqui..."
              />
            ) : (
              <input
                id={`demo-${campo.id}`}
                type="text"
                value={values[campo.id] ?? ""}
                onChange={(e) => onChange(campo.id, e.target.value)}
                className="mt-1 block w-full rounded-[var(--radius-input)] border border-border bg-bg-input px-3 py-2.5 text-[13px] text-text-primary shadow-sm placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/8"
                placeholder="Escribe aqui..."
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex gap-2">
          {etapaIdx > 0 && (
            <button
              onClick={onPrev}
              className="rounded-[var(--radius-button)] border border-border px-4 py-2 text-[13px] text-text-secondary hover:bg-bg-hover transition-colors"
            >
              Anterior
            </button>
          )}
          <button
            onClick={onFill}
            className="rounded-[var(--radius-button)] border border-accent/20 bg-accent/5 px-4 py-2 text-[13px] text-accent hover:bg-accent/10 transition-colors"
          >
            Llenar ejemplo
          </button>
        </div>
        <button
          onClick={onNext}
          className="rounded-[var(--radius-button)] bg-accent px-4 py-2 text-[13px] font-medium text-white hover:bg-accent-hover transition-colors"
        >
          {isLast ? "Evaluar con IA" : "Siguiente etapa"}
        </button>
      </div>
    </div>
  );
}

function ScoringStep({
  scores,
  weightedScore,
  animating,
  onNext,
}: {
  scores: Record<string, number>;
  weightedScore: number | null;
  animating: boolean;
  onNext: () => void;
}) {
  return (
    <div>
      <h3 className="text-[15px] font-semibold text-text-primary">
        Evaluacion con rubrica ponderada
      </h3>
      <p className="mt-1 text-[13px] text-text-muted">
        La IA evalua cada criterio segun el contenido enviado.
      </p>

      <div className="mt-6 space-y-3">
        {DEMO_CRITERIOS.map((c) => {
          const score = scores[c.campo_id];
          const pct = score != null ? (score / c.maxScore) * 100 : 0;
          const hasScore = score != null;

          return (
            <div
              key={c.campo_id}
              className="rounded-[8px] border border-border bg-bg-app px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-medium text-text-primary">
                    {c.nombre}
                  </p>
                  <p className="text-[11px] text-text-muted">
                    Peso: {c.peso} &middot; Max: {c.maxScore}
                  </p>
                </div>
                <div className="text-right">
                  {hasScore ? (
                    <span
                      className={`animate-score-reveal text-[15px] font-semibold tabular-nums ${
                        pct >= 75 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-red-600"
                      }`}
                    >
                      {score}/{c.maxScore}
                    </span>
                  ) : (
                    <span className="inline-block h-4 w-10 animate-pulse rounded bg-gray-100" />
                  )}
                </div>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall score */}
      {weightedScore != null && (
        <div className="animate-fade-in-up mt-6 rounded-[10px] border border-accent/20 bg-accent/5 p-4 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-accent">
            Score ponderado total
          </p>
          <p className="mt-1 text-[28px] font-semibold text-accent tabular-nums">
            {weightedScore.toFixed(1)}%
          </p>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={onNext}
          disabled={animating}
          className="rounded-[var(--radius-button)] bg-accent px-4 py-2 text-[13px] font-medium text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
        >
          Ver resumen ejecutivo
        </button>
      </div>
    </div>
  );
}

function SummaryStep({
  values,
  scores,
  weightedScore,
  onRestart,
}: {
  values: Record<string, string>;
  scores: Record<string, number>;
  weightedScore: number | null;
  onRestart: () => void;
}) {
  const [showImproved, setShowImproved] = useState(true);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-semibold text-text-primary">
            Resumen ejecutivo
          </h3>
          <p className="text-[13px] text-text-muted">
            Asi se veria el PDF exportable de este municipio.
          </p>
        </div>
        <div className="animate-score-reveal rounded-[10px] bg-accent/5 px-3 py-1.5 text-center">
          <p className="text-[11px] text-accent">Score</p>
          <p className="text-[22px] font-semibold text-accent tabular-nums">
            {weightedScore?.toFixed(1) ?? "—"}%
          </p>
        </div>
      </div>

      {/* Before / After toggle */}
      <BeforeAfterToggle showImproved={showImproved} onToggle={setShowImproved} />

      {/* Mock PDF preview */}
      <div className="animate-fade-in-up rounded-[10px] border border-border bg-bg-app p-5">
        <div className="mb-4 border-b border-border pb-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
            Convocatoria de ejemplo
          </p>
          <p className="text-[13px] font-medium text-text-primary">
            Municipio de San Pedro
          </p>
          <p className="text-[11px] text-text-muted">
            Fecha: {new Date().toLocaleDateString("es-CO")}
          </p>
        </div>

        {DEMO_ETAPAS.map((etapa) => (
          <div key={etapa.id} className="mb-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
              {etapa.nombre}
            </p>
            {etapa.campos.map((campo) => (
              <div key={campo.id} className="mt-2">
                <p className="text-[11px] font-medium text-text-secondary">
                  {campo.label}
                </p>
                <p className="mt-0.5 text-[13px] text-text-primary">
                  {values[campo.id] || "(sin respuesta)"}
                </p>
              </div>
            ))}
          </div>
        ))}

        <div className="mt-4 border-t border-border pt-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
            Evaluacion
          </p>
          <div className="mt-2 space-y-1">
            {DEMO_CRITERIOS.map((c) => (
              <div
                key={c.campo_id}
                className="flex items-center justify-between text-[13px]"
              >
                <span className="text-text-secondary">{c.nombre}</span>
                <span className="font-medium text-text-primary tabular-nums">
                  {scores[c.campo_id] ?? "—"}/{c.maxScore}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-[8px] bg-accent/5 px-3 py-2 text-center">
            <span className="text-[13px] font-semibold text-accent tabular-nums">
              Score ponderado: {weightedScore?.toFixed(1) ?? "—"}%
            </span>
          </div>
        </div>

        <div className="mt-4 border-t border-border pt-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
            Recomendaciones
          </p>
          <ul className="mt-2 space-y-1 text-[13px] text-text-secondary">
            <li>• Ampliar la descripcion del problema con datos cuantitativos adicionales.</li>
            <li>• Incluir cronograma estimado de ejecucion del proyecto.</li>
            <li>• Detallar las fuentes de financiacion disponibles.</li>
          </ul>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={onRestart}
          className="rounded-[var(--radius-button)] border border-border px-4 py-2 text-[13px] text-text-secondary hover:bg-bg-hover transition-colors"
        >
          Reiniciar demo
        </button>
        <p className="text-[11px] text-text-muted">
          En la app real, este resumen se exporta como PDF.
        </p>
      </div>
    </div>
  );
}

/* ── Before/After Toggle ── */

const BEFORE_TEXT =
  "hay un problema de agua en el municipio y la gente se enferma mucho. queremos hacer algo para mejorar esto.";

const AFTER_TEXT =
  "La comunidad rural del municipio de San Pedro carece de acceso a agua potable. El 60% de la poblacion depende de fuentes no tratadas, generando enfermedades gastrointestinales recurrentes que afectan principalmente a 890 menores de edad y 420 adultos mayores.";

function BeforeAfterToggle({
  showImproved,
  onToggle,
}: {
  showImproved: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <div className="mb-4 rounded-[10px] border border-purple-200/50 bg-purple-50/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-purple-600">
          Antes vs Despues del Asistente IA
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggle(false)}
            className={`rounded-[var(--radius-button)] px-2.5 py-1 text-[11px] font-medium transition-colors ${
              !showImproved
                ? "bg-gray-100 text-text-primary"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            Antes
          </button>
          <button
            onClick={() => onToggle(true)}
            className={`rounded-[var(--radius-button)] px-2.5 py-1 text-[11px] font-medium transition-colors ${
              showImproved
                ? "bg-purple-600 text-white"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            Despues
          </button>
        </div>
      </div>
      <div className="overflow-hidden rounded-[8px] border border-border bg-bg-card px-4 py-3">
        <p className="text-[11px] font-medium text-text-muted">Problema central</p>
        <p
          className={`mt-1 text-[13px] transition-all duration-300 ${
            showImproved ? "text-text-primary" : "italic text-text-muted"
          }`}
        >
          {showImproved ? AFTER_TEXT : BEFORE_TEXT}
        </p>
      </div>
      <p className="mt-2 text-center text-[10px] text-purple-400">
        {showImproved
          ? "Texto mejorado con contexto de documentos y estructura MGA"
          : "Texto crudo sin asistencia"}
      </p>
    </div>
  );
}
