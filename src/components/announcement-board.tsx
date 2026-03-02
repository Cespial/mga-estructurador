"use client";

import { useState, useEffect } from "react";

/**
 * Announcement Board
 *
 * Tab in convocatoria page showing entity updates, FAQs, and clarifications.
 * Badge for unread announcements.
 */

interface Announcement {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  created_at: string;
}

interface AnnouncementBoardProps {
  convocatoriaId: string;
}

export function AnnouncementBoard({ convocatoriaId }: AnnouncementBoardProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/announcements?convocatoria_id=${convocatoriaId}`,
        );
        if (res.ok) {
          const json = await res.json();
          setAnnouncements(json.announcements ?? []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [convocatoriaId]);

  if (loading) {
    return (
      <div className="py-4 text-center text-[12px] text-text-muted">
        Cargando anuncios...
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="rounded-[8px] border border-dashed border-border p-6 text-center">
        <svg className="mx-auto h-8 w-8 text-text-muted/50" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46" />
        </svg>
        <p className="mt-2 text-[12px] text-text-muted">
          No hay anuncios de la entidad.
        </p>
      </div>
    );
  }

  // Sort: pinned first, then by date
  const sorted = [...announcements].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-3">
      {sorted.map((a) => (
        <div
          key={a.id}
          className={`rounded-lg border p-4 ${
            a.pinned
              ? "border-amber-200 bg-amber-50/30"
              : "border-border bg-bg-card"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {a.pinned && (
                <svg className="h-3.5 w-3.5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                </svg>
              )}
              <h4 className="text-[13px] font-semibold text-text-primary">
                {a.title}
              </h4>
            </div>
            <span className="text-[10px] text-text-muted">
              {new Date(a.created_at).toLocaleDateString("es-CO", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-text-secondary whitespace-pre-wrap">
            {a.body}
          </p>
        </div>
      ))}
    </div>
  );
}

/** Badge showing unread announcements count */
export function AnnouncementBadge({
  convocatoriaId,
}: {
  convocatoriaId: string;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch(`/api/announcements?convocatoria_id=${convocatoriaId}`)
      .then((r) => (r.ok ? r.json() : { announcements: [] }))
      .then((json) => setCount((json.announcements ?? []).length))
      .catch(() => setCount(0));
  }, [convocatoriaId]);

  if (count === 0) return null;

  return (
    <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">
      {count}
    </span>
  );
}
