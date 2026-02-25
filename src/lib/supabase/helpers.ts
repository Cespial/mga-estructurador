/**
 * Safely cast Supabase query results to a typed array.
 * Avoids bare `as Type[]` casts scattered across pages.
 */
export function toRows<T>(data: unknown): T[] {
  return (data ?? []) as T[];
}

/**
 * Safely cast a Supabase single-row result.
 */
export function toRow<T>(data: unknown): T | null {
  return (data ?? null) as T | null;
}
