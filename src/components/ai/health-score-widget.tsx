"use client";

import { useState } from "react";

interface HealthScoreWidgetProps {
  score: number;
  tip: string | null;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-amber-500";
  if (score >= 30) return "text-orange-500";
  return "text-red-500";
}

function getStrokeColor(score: number): string {
  if (score >= 80) return "stroke-emerald-500";
  if (score >= 60) return "stroke-amber-500";
  if (score >= 30) return "stroke-orange-500";
  return "stroke-red-500";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excelente";
  if (score >= 60) return "Aceptable";
  if (score >= 30) return "Necesita trabajo";
  return "Muy debil";
}

/**
 * Floating health score widget with circular progress indicator.
 * Shows project quality score and an AI tip on hover.
 */
export function HealthScoreWidget({ score, tip }: HealthScoreWidgetProps) {
  const [expanded, setExpanded] = useState(false);

  // SVG circle math
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button
        onClick={() => setExpanded(!expanded)}
        className="group relative flex items-center gap-2 rounded-full border border-border bg-bg-card px-3 py-2 shadow-lg transition-all hover:shadow-xl"
      >
        {/* Circular progress */}
        <svg className="h-10 w-10 -rotate-90" viewBox="0 0 44 44">
          <circle
            cx="22"
            cy="22"
            r={radius}
            fill="none"
            strokeWidth="3"
            className="stroke-bg-elevated"
          />
          <circle
            cx="22"
            cy="22"
            r={radius}
            fill="none"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className={`transition-all duration-700 ${getStrokeColor(score)}`}
          />
        </svg>
        <span
          className={`absolute left-3 top-2 flex h-10 w-10 items-center justify-center text-[13px] font-bold tabular-nums ${getScoreColor(score)}`}
        >
          {score}
        </span>

        <div className="pr-1">
          <p className="text-[11px] font-semibold text-text-primary">
            Health
          </p>
          <p className={`text-[10px] font-medium ${getScoreColor(score)}`}>
            {getScoreLabel(score)}
          </p>
        </div>
      </button>

      {/* Expanded tip */}
      {expanded && tip && (
        <div className="absolute bottom-full right-0 mb-2 w-64 rounded-[10px] border border-border bg-bg-card p-3 shadow-lg">
          <div className="flex items-start gap-2">
            <svg
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
              />
            </svg>
            <p className="text-xs text-text-secondary">{tip}</p>
          </div>
        </div>
      )}
    </div>
  );
}
