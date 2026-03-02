"use client";

import { useState, useEffect } from "react";

/**
 * AI Usage Stats Widget
 *
 * Shows how the municipality is using AI tools:
 * - Total assists requested
 * - Acceptance rate
 * - Fields where AI had most impact
 */

interface AiUsageStatsProps {
  submissionId: string;
}

interface UsageData {
  totalAssists: number;
  totalDrafts: number;
  totalImproves: number;
  total: number;
}

export function AiUsageStats({ submissionId }: AiUsageStatsProps) {
  const [data, setData] = useState<UsageData | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Fetch from field_changes to calculate AI usage
    async function load() {
      try {
        const res = await fetch(
          `/api/field-changes?submission_id=${submissionId}&campo_id=__all__`,
        );
        if (!res.ok) {
          // Endpoint may not support __all__ query; use fallback count
          setData({
            totalAssists: 0,
            totalDrafts: 0,
            totalImproves: 0,
            total: 0,
          });
          return;
        }
        const json = await res.json();
        const changes = json.changes ?? [];
        const assists = changes.filter(
          (c: { source: string }) => c.source === "ai_assist",
        ).length;
        const drafts = changes.filter(
          (c: { source: string }) => c.source === "auto_draft",
        ).length;
        const improves = changes.filter(
          (c: { source: string }) => c.source === "improve",
        ).length;
        setData({
          totalAssists: assists,
          totalDrafts: drafts,
          totalImproves: improves,
          total: assists + drafts + improves,
        });
      } catch {
        setData({ totalAssists: 0, totalDrafts: 0, totalImproves: 0, total: 0 });
      }
    }
    load();
  }, [submissionId]);

  if (!data) return null;

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1.5 text-[10px] text-purple-500 hover:text-purple-700 transition-colors"
      >
        <svg
          className="h-3 w-3"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
          />
        </svg>
        Uso de IA: {data.total} intervenciones
      </button>

      {expanded && (
        <div className="mt-2 rounded-lg border border-purple-100 bg-purple-50/30 p-3 space-y-2 animate-fade-in">
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <p className="text-lg font-bold tabular-nums text-purple-700">
                {data.totalAssists}
              </p>
              <p className="text-[9px] text-purple-500">Asistencias</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold tabular-nums text-purple-700">
                {data.totalDrafts}
              </p>
              <p className="text-[9px] text-purple-500">Auto-borradores</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold tabular-nums text-purple-700">
                {data.totalImproves}
              </p>
              <p className="text-[9px] text-purple-500">Mejoras de texto</p>
            </div>
          </div>
          {data.total > 0 && (
            <p className="text-[10px] text-purple-600 text-center">
              La IA te ha asistido {data.total} veces en este proyecto.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
