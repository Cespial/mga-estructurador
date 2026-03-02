"use client";

import { useState, useEffect } from "react";

/**
 * Snippet Library
 *
 * Reusable text snippets (boilerplate) that can be inserted into wizard fields.
 * Shows beside the AI assist button.
 */

interface Snippet {
  id: string;
  label: string;
  content: string;
  tags: string[];
}

interface SnippetLibraryProps {
  onInsert: (text: string) => void;
}

export function SnippetLibrary({ onInsert }: SnippetLibraryProps) {
  const [open, setOpen] = useState(false);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/snippets")
      .then((res) => (res.ok ? res.json() : { snippets: [] }))
      .then((json) => setSnippets(json.snippets ?? []))
      .catch(() => setSnippets([]))
      .finally(() => setLoading(false));
  }, [open]);

  const filtered = snippets.filter(
    (s) =>
      s.label.toLowerCase().includes(search.toLowerCase()) ||
      s.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700 hover:bg-blue-100"
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
        Snippets
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-1 w-72 rounded-lg border border-border bg-white p-3 shadow-xl">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar snippets..."
            className="mb-2 w-full rounded-md border border-border px-2 py-1 text-[12px] placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent/30"
          />

          {loading && (
            <p className="text-[11px] text-text-muted">Cargando...</p>
          )}

          {!loading && filtered.length === 0 && (
            <p className="text-[11px] text-text-muted py-3 text-center">
              No hay snippets{search ? " que coincidan" : " guardados"}.
            </p>
          )}

          <div className="max-h-48 overflow-y-auto space-y-1.5">
            {filtered.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onInsert(s.content);
                  setOpen(false);
                }}
                className="w-full text-left rounded-md border border-border p-2 hover:bg-bg-hover transition-colors"
              >
                <p className="text-[11px] font-medium text-text-primary">
                  {s.label}
                </p>
                <p className="mt-0.5 text-[10px] text-text-muted line-clamp-2">
                  {s.content}
                </p>
                {s.tags.length > 0 && (
                  <div className="mt-1 flex gap-1">
                    {s.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-blue-50 px-1 py-0.5 text-[8px] text-blue-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={() => setOpen(false)}
            className="mt-2 w-full text-center text-[10px] text-text-muted hover:text-text-primary"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}
