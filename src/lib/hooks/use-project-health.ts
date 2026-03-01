"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface HealthResult {
  score: number;
  tip: string | null;
}

/**
 * Computes a local heuristic health score and periodically
 * calls the AI health-check endpoint for a more nuanced score.
 *
 * Local heuristic (instant):
 * - Completitud campos requeridos (40%)
 * - Calidad texto: word count vs expected minimum (40%)
 * - Consistencia: non-empty fields ratio (20%)
 *
 * AI check (every 30s of activity):
 * - Lightweight LLM call (max_tokens=100)
 */
export function useProjectHealth(
  fields: Record<string, string>,
  requiredFieldIds: string[],
  stepName: string,
  projectTitle: string,
) {
  const [localScore, setLocalScore] = useState(0);
  const [aiScore, setAiScore] = useState<number | null>(null);
  const [tip, setTip] = useState<string | null>(null);
  const lastCheckRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Compute local heuristic score
  useEffect(() => {
    const allFieldIds = Object.keys(fields);
    const totalFields = allFieldIds.length;

    if (totalFields === 0) {
      setLocalScore(0);
      return;
    }

    // 1. Completitud (40%)
    const requiredFilled = requiredFieldIds.filter(
      (id) => fields[id] && String(fields[id]).trim().length > 0,
    ).length;
    const completitudScore =
      requiredFieldIds.length > 0
        ? (requiredFilled / requiredFieldIds.length) * 40
        : 40; // All filled if no required fields

    // 2. Quality — word count vs minimum expected (~50 words per text field) (40%)
    let totalWords = 0;
    let textFieldCount = 0;
    for (const [, value] of Object.entries(fields)) {
      if (value && String(value).trim().length > 0) {
        const words = String(value).trim().split(/\s+/).length;
        totalWords += words;
        textFieldCount++;
      }
    }

    const avgWords = textFieldCount > 0 ? totalWords / textFieldCount : 0;
    const qualityRatio = Math.min(avgWords / 50, 1);
    const qualityScore = qualityRatio * 40;

    // 3. Coverage — ratio of filled fields (20%)
    const filled = allFieldIds.filter(
      (id) => fields[id] && String(fields[id]).trim().length > 0,
    ).length;
    const coverageScore = (filled / totalFields) * 20;

    setLocalScore(
      Math.round(completitudScore + qualityScore + coverageScore),
    );
  }, [fields, requiredFieldIds]);

  // Schedule AI health check after 30s of inactivity
  const scheduleAiCheck = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const elapsed = Date.now() - lastCheckRef.current;
    if (elapsed < 30000) {
      timerRef.current = setTimeout(scheduleAiCheck, 30000 - elapsed);
      return;
    }

    timerRef.current = setTimeout(async () => {
      lastCheckRef.current = Date.now();
      try {
        const res = await fetch("/api/ai/health-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fields,
            step_name: stepName,
            project_title: projectTitle,
          }),
        });

        if (res.ok) {
          const data: HealthResult = await res.json();
          setAiScore(data.score);
          setTip(data.tip);
        }
      } catch {
        // silent
      }
    }, 5000); // 5s debounce after activity
  }, [fields, stepName, projectTitle]);

  // Trigger AI check scheduling when fields change
  useEffect(() => {
    scheduleAiCheck();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [scheduleAiCheck]);

  // Combined score: prefer AI score when available, blend with local
  const combinedScore =
    aiScore !== null
      ? Math.round(0.6 * aiScore + 0.4 * localScore)
      : localScore;

  return {
    score: combinedScore,
    localScore,
    aiScore,
    tip,
  };
}
