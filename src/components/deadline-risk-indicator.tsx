"use client";

/**
 * Deadline Risk Indicator
 *
 * Calculates risk based on:
 * - Days remaining until deadline
 * - Current progress (0-100)
 * - Estimated daily advance rate
 *
 * Shows traffic light: green (on track), yellow (at risk), red (likely won't make it)
 */

interface DeadlineRiskProps {
  /** ISO date string for the deadline */
  deadline: string | null;
  /** Current progress 0-100 */
  progress: number;
  /** Compact mode for dashboard cards */
  compact?: boolean;
}

type RiskLevel = "safe" | "at_risk" | "critical" | "overdue" | "unknown";

interface RiskAssessment {
  level: RiskLevel;
  daysRemaining: number;
  estimatedDaysToComplete: number | null;
  label: string;
  description: string;
}

function assessRisk(
  deadline: string | null,
  progress: number,
): RiskAssessment {
  if (!deadline) {
    return {
      level: "unknown",
      daysRemaining: 0,
      estimatedDaysToComplete: null,
      label: "Sin fecha",
      description: "No hay fecha limite definida.",
    };
  }

  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffMs = deadlineDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return {
      level: "overdue",
      daysRemaining,
      estimatedDaysToComplete: null,
      label: "Vencido",
      description: `La fecha limite paso hace ${Math.abs(daysRemaining)} dia${Math.abs(daysRemaining) !== 1 ? "s" : ""}.`,
    };
  }

  if (progress >= 100) {
    return {
      level: "safe",
      daysRemaining,
      estimatedDaysToComplete: 0,
      label: "Completado",
      description: "El proyecto esta completo.",
    };
  }

  const remaining = 100 - progress;

  // Estimate: assume average ~5% per day for active work
  // If progress is >0, estimate based on assumption of ~5 days active so far
  const estimatedDailyRate = progress > 0 ? Math.max(progress / 5, 3) : 3;
  const estimatedDaysToComplete = Math.ceil(remaining / estimatedDailyRate);

  if (daysRemaining >= estimatedDaysToComplete * 1.5) {
    return {
      level: "safe",
      daysRemaining,
      estimatedDaysToComplete,
      label: "A tiempo",
      description: `${daysRemaining} dias restantes. Vas por buen camino.`,
    };
  }

  if (daysRemaining >= estimatedDaysToComplete * 0.8) {
    return {
      level: "at_risk",
      daysRemaining,
      estimatedDaysToComplete,
      label: "En riesgo",
      description: `${daysRemaining} dias restantes. Necesitas avanzar mas rapido.`,
    };
  }

  return {
    level: "critical",
    daysRemaining,
    estimatedDaysToComplete,
    label: "Critico",
    description: `Solo ${daysRemaining} dia${daysRemaining !== 1 ? "s" : ""} restante${daysRemaining !== 1 ? "s" : ""}. Prioriza completar el proyecto.`,
  };
}

const RISK_STYLES: Record<
  RiskLevel,
  { bg: string; text: string; border: string; dot: string }
> = {
  safe: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  at_risk: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  critical: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  overdue: {
    bg: "bg-red-50",
    text: "text-red-800",
    border: "border-red-300",
    dot: "bg-red-600",
  },
  unknown: {
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
};

export function DeadlineRiskIndicator({
  deadline,
  progress,
  compact = false,
}: DeadlineRiskProps) {
  const risk = assessRisk(deadline, progress);
  const styles = RISK_STYLES[risk.level];

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 ${styles.bg} ${styles.text} ${styles.border}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
        <span className="text-[10px] font-medium">{risk.label}</span>
        {risk.daysRemaining > 0 && risk.level !== "unknown" && (
          <span className="text-[10px] opacity-75">
            {risk.daysRemaining}d
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border px-3 py-2 ${styles.bg} ${styles.border}`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${styles.dot} ${
            risk.level === "critical" || risk.level === "overdue"
              ? "animate-pulse"
              : ""
          }`}
        />
        <span className={`text-xs font-semibold ${styles.text}`}>
          {risk.label}
        </span>
        {risk.daysRemaining > 0 && risk.level !== "unknown" && (
          <span className={`ml-auto text-xs ${styles.text} opacity-75`}>
            {risk.daysRemaining} dia{risk.daysRemaining !== 1 ? "s" : ""}{" "}
            restante{risk.daysRemaining !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      <p className={`mt-1 text-[11px] ${styles.text} opacity-80`}>
        {risk.description}
      </p>
    </div>
  );
}
