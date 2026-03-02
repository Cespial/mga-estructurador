"use client";

import { useState, useEffect } from "react";

/**
 * Progress Milestones
 *
 * Shows celebration animations at 25%, 50%, 75%, 100%.
 * Displays motivational message and estimated score improvement.
 */

interface ProgressMilestonesProps {
  progress: number;
  preEvalScore: number | null;
}

const MILESTONES = [
  {
    threshold: 25,
    message: "Buen inicio. Ya completaste la primera cuarta parte de tu proyecto.",
    emoji: "1/4",
  },
  {
    threshold: 50,
    message: "Ya completaste la mitad. Tu proyecto va por buen camino.",
    emoji: "1/2",
  },
  {
    threshold: 75,
    message: "Casi listo. Solo falta una cuarta parte para completar.",
    emoji: "3/4",
  },
  {
    threshold: 100,
    message: "Excelente. Todas las etapas estan completas. Revisa y envia tu proyecto.",
    emoji: "OK",
  },
];

export function ProgressMilestones({
  progress,
  preEvalScore,
}: ProgressMilestonesProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMilestone, setCelebrationMilestone] = useState<
    (typeof MILESTONES)[0] | null
  >(null);
  const [lastCelebrated, setLastCelebrated] = useState<number>(0);

  useEffect(() => {
    // Check storage for last celebrated milestone
    const stored = localStorage.getItem("publitec_last_milestone");
    if (stored) setLastCelebrated(parseInt(stored, 10));
  }, []);

  useEffect(() => {
    // Find the highest milestone reached that hasn't been celebrated
    const milestone = [...MILESTONES]
      .reverse()
      .find((m) => progress >= m.threshold && m.threshold > lastCelebrated);

    if (milestone) {
      setCelebrationMilestone(milestone);
      setShowCelebration(true);
      setLastCelebrated(milestone.threshold);
      localStorage.setItem(
        "publitec_last_milestone",
        String(milestone.threshold),
      );

      // Auto-dismiss after 5s
      const timer = setTimeout(() => setShowCelebration(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [progress, lastCelebrated]);

  if (!showCelebration || !celebrationMilestone) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
      <div className="w-80 rounded-xl border border-purple-200 bg-white p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700">
            {celebrationMilestone.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-purple-800">
              Progreso: {celebrationMilestone.threshold}%
            </p>
            <p className="mt-0.5 text-[11px] text-text-secondary leading-relaxed">
              {celebrationMilestone.message}
            </p>
            {preEvalScore != null && (
              <p className="mt-1 text-[10px] text-purple-600">
                Score estimado: {Math.round(preEvalScore)}/100
              </p>
            )}
          </div>
          <button
            onClick={() => setShowCelebration(false)}
            className="text-text-muted hover:text-text-primary"
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
    </div>
  );
}
