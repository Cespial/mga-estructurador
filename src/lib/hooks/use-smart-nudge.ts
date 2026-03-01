"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UseSmartNudgeOptions {
  debounceMs?: number;
  cooldownMs?: number;
  dismissMs?: number;
}

interface UseSmartNudgeReturn {
  nudge: string | null;
  isLoading: boolean;
  dismissNudge: () => void;
  onTextChange: (text: string) => void;
}

/**
 * Hook for showing contextual nudges while the user types.
 * Activates 3s after the user stops typing.
 * Rate limited: max 1 nudge per field per 30s.
 */
export function useSmartNudge(
  campoNombre: string,
  campoDescripcion: string,
  criterioRubrica?: string,
  options?: UseSmartNudgeOptions,
): UseSmartNudgeReturn {
  const {
    debounceMs = 3000,
    cooldownMs = 30000,
    dismissMs = 10000,
  } = options ?? {};

  const [nudge, setNudge] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastNudgeTimeRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const dismissNudge = useCallback(() => {
    setNudge(null);
    if (dismissRef.current) {
      clearTimeout(dismissRef.current);
      dismissRef.current = null;
    }
  }, []);

  const fetchNudge = useCallback(
    async (text: string) => {
      // Check cooldown
      const now = Date.now();
      if (now - lastNudgeTimeRef.current < cooldownMs) {
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);

      try {
        const res = await fetch("/api/ai/nudge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campo_nombre: campoNombre,
            campo_descripcion: campoDescripcion,
            texto_actual: text,
            criterio_rubrica: criterioRubrica,
          }),
          signal: controller.signal,
        });

        if (!res.ok) return;

        const data = await res.json();

        if (data.nudge) {
          setNudge(data.nudge);
          lastNudgeTimeRef.current = Date.now();

          // Auto-dismiss
          dismissRef.current = setTimeout(() => {
            setNudge(null);
          }, dismissMs);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      } finally {
        setIsLoading(false);
      }
    },
    [campoNombre, campoDescripcion, criterioRubrica, cooldownMs, dismissMs],
  );

  const onTextChange = useCallback(
    (text: string) => {
      // Dismiss existing nudge when user types
      dismissNudge();

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (text.length < 15) return;

      debounceRef.current = setTimeout(() => {
        fetchNudge(text);
      }, debounceMs);
    },
    [debounceMs, fetchNudge, dismissNudge],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (dismissRef.current) clearTimeout(dismissRef.current);
      abortRef.current?.abort();
    };
  }, []);

  return { nudge, isLoading, dismissNudge, onTextChange };
}
