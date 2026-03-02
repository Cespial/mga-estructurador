"use client";

import { useState, useEffect } from "react";

/**
 * Internal Notes
 *
 * Per-field notes visible only to the municipality team.
 * Supports resolve/reopen workflow.
 */

interface Note {
  id: string;
  campo_id: string | null;
  content: string;
  resolved: boolean;
  created_at: string;
}

interface InternalNotesProps {
  submissionId: string;
  campoId: string;
}

export function InternalNotes({ submissionId, campoId }: InternalNotesProps) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);

  const unresolvedCount = notes.filter((n) => !n.resolved).length;

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(
      `/api/internal-notes?submission_id=${submissionId}&campo_id=${campoId}`,
    )
      .then((r) => (r.ok ? r.json() : { notes: [] }))
      .then((json) => setNotes(json.notes ?? []))
      .catch(() => setNotes([]))
      .finally(() => setLoading(false));
  }, [open, submissionId, campoId]);

  async function addNote() {
    if (!newNote.trim()) return;
    try {
      const res = await fetch("/api/internal-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: submissionId,
          campo_id: campoId,
          content: newNote.trim(),
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setNotes((prev) => [...prev, json.note]);
        setNewNote("");
      }
    } catch {
      // silent
    }
  }

  async function toggleResolve(noteId: string, resolved: boolean) {
    try {
      const res = await fetch("/api/internal-notes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note_id: noteId, resolved: !resolved }),
      });
      if (res.ok) {
        setNotes((prev) =>
          prev.map((n) =>
            n.id === noteId ? { ...n, resolved: !resolved } : n,
          ),
        );
      }
    } catch {
      // silent
    }
  }

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 text-[10px] text-amber-600 hover:text-amber-800 transition-colors"
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
        </svg>
        Notas internas
        {unresolvedCount > 0 && (
          <span className="rounded-full bg-amber-100 px-1 py-0.5 text-[8px] font-bold text-amber-700">
            {unresolvedCount}
          </span>
        )}
      </button>

      {open && (
        <div className="mt-2 rounded-lg border border-amber-100 bg-amber-50/30 p-3 space-y-2 animate-fade-in">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">
            Notas del equipo (solo visibles para tu municipio)
          </p>

          {loading && (
            <p className="text-[11px] text-text-muted">Cargando...</p>
          )}

          {notes.map((note) => (
            <div
              key={note.id}
              className={`rounded-md border px-3 py-2 ${
                note.resolved
                  ? "border-border bg-bg-elevated opacity-60"
                  : "border-amber-200 bg-white"
              }`}
            >
              <p className="text-[11px] text-text-secondary">{note.content}</p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[9px] text-text-muted">
                  {new Date(note.created_at).toLocaleDateString("es-CO", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <button
                  onClick={() => toggleResolve(note.id, note.resolved)}
                  className={`text-[9px] font-medium ${
                    note.resolved
                      ? "text-amber-600 hover:text-amber-800"
                      : "text-emerald-600 hover:text-emerald-800"
                  }`}
                >
                  {note.resolved ? "Reabrir" : "Resolver"}
                </button>
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addNote()}
              placeholder="Agregar nota..."
              className="flex-1 rounded-md border border-border px-2 py-1 text-[11px] placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-amber-300"
            />
            <button
              onClick={addNote}
              disabled={!newNote.trim()}
              className="rounded-md bg-amber-500 px-2 py-1 text-[10px] font-medium text-white hover:bg-amber-600 disabled:opacity-50"
            >
              Agregar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
