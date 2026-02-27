import type { RubricCriterion } from "@/lib/types/database";

// ---------------------------------------------------------------------------
// Types for the parsed scoring response
// ---------------------------------------------------------------------------

export interface ParsedCriterionScore {
  criterion_id: string;
  score: number;
  max_score: number;
  justification: string;
  rationale: string;
}

export interface ParsedScoringResult {
  criteria: ParsedCriterionScore[];
  summary: string;
}

// ---------------------------------------------------------------------------
// Extract and validate the JSON response from Claude
// ---------------------------------------------------------------------------

/**
 * Parses Claude's response, extracting the JSON object from potential
 * surrounding text/markdown and validating each criterion score.
 */
export function parseScoringResponse(
  raw: string,
  expectedCriteria: RubricCriterion[],
): ParsedScoringResult {
  const json = extractJson(raw);

  if (!json || typeof json !== "object") {
    throw new ScoringParseError(
      "No se pudo extraer un objeto JSON valido de la respuesta del modelo.",
    );
  }

  const criteriaArray = json.criteria;
  if (!Array.isArray(criteriaArray)) {
    throw new ScoringParseError(
      'La respuesta del modelo no contiene un arreglo "criteria".',
    );
  }

  const summary =
    typeof json.summary === "string" ? json.summary : "Sin resumen disponible.";

  // Build a lookup of expected criteria by ID for validation
  const expectedMap = new Map(expectedCriteria.map((c) => [c.id, c]));

  const parsed: ParsedCriterionScore[] = criteriaArray.map(
    (item: Record<string, unknown>, idx: number) => {
      const criterionId = String(item.criterion_id ?? "");
      if (!criterionId) {
        throw new ScoringParseError(
          `El criterio en posicion ${idx} no tiene criterion_id.`,
        );
      }

      const expected = expectedMap.get(criterionId);
      if (!expected) {
        throw new ScoringParseError(
          `criterion_id "${criterionId}" no corresponde a ningun criterio de la rubrica.`,
        );
      }

      const score = toFiniteNumber(item.score, `score del criterio ${idx}`);
      const maxScore = expected.max_score;

      // Clamp score between 0 and max_score
      const clampedScore = Math.max(0, Math.min(Math.round(score), maxScore));

      return {
        criterion_id: criterionId,
        score: clampedScore,
        max_score: maxScore,
        justification:
          typeof item.justification === "string"
            ? item.justification
            : "Sin justificacion proporcionada.",
        rationale:
          typeof item.rationale === "string"
            ? item.rationale
            : "Sin razonamiento detallado.",
      };
    },
  );

  // Verify all expected criteria are covered
  const parsedIds = new Set(parsed.map((p) => p.criterion_id));
  const missing = expectedCriteria.filter((c) => !parsedIds.has(c.id));
  if (missing.length > 0) {
    const names = missing.map((m) => m.criterion_name).join(", ");
    throw new ScoringParseError(
      `Faltan criterios en la respuesta del modelo: ${names}`,
    );
  }

  return { criteria: parsed, summary };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Attempts to extract a JSON object from a raw string.
 * Handles cases where the model wraps JSON in markdown code fences.
 */
function extractJson(raw: string): Record<string, unknown> | null {
  // Try 1: direct parse
  try {
    return JSON.parse(raw);
  } catch {
    // continue to fallback strategies
  }

  // Try 2: extract from markdown code fences
  const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1]);
    } catch {
      // continue
    }
  }

  // Try 3: find first { ... } block
  const braceStart = raw.indexOf("{");
  const braceEnd = raw.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd > braceStart) {
    try {
      return JSON.parse(raw.slice(braceStart, braceEnd + 1));
    } catch {
      // give up
    }
  }

  return null;
}

function toFiniteNumber(value: unknown, label: string): number {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new ScoringParseError(`${label} no es un numero valido: ${value}`);
  }
  return n;
}

export class ScoringParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScoringParseError";
  }
}
