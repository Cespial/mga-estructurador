"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: "deadline" | "revision" | "start";
  convocatoriaId: string;
  progress?: number;
}

interface CalendarClientProps {
  events: CalendarEvent[];
}

const TYPE_STYLES: Record<
  string,
  { bg: string; text: string; border: string; label: string }
> = {
  deadline: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    label: "Fecha limite",
  },
  revision: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    label: "Revision",
  },
  start: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    label: "Inicio",
  },
};

export function CalendarClient({ events }: CalendarClientProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const daysInMonth = new Date(
    currentMonth.year,
    currentMonth.month + 1,
    0,
  ).getDate();
  const firstDayOfWeek = new Date(
    currentMonth.year,
    currentMonth.month,
    1,
  ).getDay();

  const monthName = new Date(
    currentMonth.year,
    currentMonth.month,
  ).toLocaleDateString("es-CO", { month: "long", year: "numeric" });

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const event of events) {
      const d = new Date(event.date);
      if (
        d.getFullYear() === currentMonth.year &&
        d.getMonth() === currentMonth.month
      ) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(event);
      }
    }
    return map;
  }, [events, currentMonth]);

  const prevMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { ...prev, month: prev.month - 1 };
    });
  };

  const nextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { ...prev, month: prev.month + 1 };
    });
  };

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === currentMonth.year &&
    today.getMonth() === currentMonth.month &&
    today.getDate() === day;

  // Upcoming events (sorted)
  const upcoming = useMemo(() => {
    const now = new Date();
    return events
      .filter((e) => new Date(e.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 10);
  }, [events]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Calendar Grid */}
      <div className="lg:col-span-2 card-premium p-5">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="rounded-md p-1.5 hover:bg-bg-hover transition-colors"
          >
            <svg
              className="h-4 w-4 text-text-secondary"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
          </button>
          <h2 className="text-[14px] font-semibold text-text-primary capitalize">
            {monthName}
          </h2>
          <button
            onClick={nextMonth}
            className="rounded-md p-1.5 hover:bg-bg-hover transition-colors"
          >
            <svg
              className="h-4 w-4 text-text-secondary"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-px mb-1">
          {["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"].map((d) => (
            <div
              key={d}
              className="text-center text-[10px] font-medium text-text-muted py-1"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7 gap-px">
          {/* Empty cells for offset */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-20 bg-bg-elevated/50 rounded" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEvents = eventsByDate[day] ?? [];
            return (
              <div
                key={day}
                className={`h-20 rounded border p-1 ${
                  isToday(day)
                    ? "border-accent bg-accent/5"
                    : "border-transparent bg-bg-elevated/30"
                }`}
              >
                <span
                  className={`text-[11px] font-medium ${
                    isToday(day) ? "text-accent" : "text-text-secondary"
                  }`}
                >
                  {day}
                </span>
                <div className="mt-0.5 space-y-0.5">
                  {dayEvents.slice(0, 2).map((e) => {
                    const style = TYPE_STYLES[e.type];
                    return (
                      <div
                        key={e.id}
                        className={`rounded px-1 py-0.5 text-[8px] font-medium truncate ${style.bg} ${style.text}`}
                        title={e.title}
                      >
                        {e.title}
                      </div>
                    );
                  })}
                  {dayEvents.length > 2 && (
                    <span className="text-[8px] text-text-muted">
                      +{dayEvents.length - 2} mas
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Events Sidebar */}
      <div className="card-premium p-5">
        <h3 className="text-[13px] font-semibold text-text-primary mb-3">
          Proximos eventos
        </h3>
        {upcoming.length === 0 ? (
          <p className="text-[12px] text-text-muted">
            No hay eventos proximos.
          </p>
        ) : (
          <div className="space-y-2.5">
            {upcoming.map((event) => {
              const style = TYPE_STYLES[event.type];
              const daysUntil = Math.ceil(
                (new Date(event.date).getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24),
              );
              return (
                <Link
                  key={event.id}
                  href={`/dashboard/municipio/convocatorias/${event.convocatoriaId}`}
                  className={`block rounded-lg border p-3 transition-colors hover:bg-bg-hover ${style.border}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium text-text-primary truncate">
                        {event.title}
                      </p>
                      <p className="text-[10px] text-text-muted mt-0.5">
                        {new Date(event.date).toLocaleDateString("es-CO", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-medium ${style.bg} ${style.text}`}
                      >
                        {style.label}
                      </span>
                      {daysUntil <= 7 && daysUntil > 0 && (
                        <p className="mt-0.5 text-[9px] font-medium text-red-600 text-right">
                          {daysUntil} dia{daysUntil !== 1 ? "s" : ""}
                        </p>
                      )}
                      {daysUntil === 0 && (
                        <p className="mt-0.5 text-[9px] font-bold text-red-600 text-right">
                          Hoy
                        </p>
                      )}
                    </div>
                  </div>
                  {event.progress !== undefined && (
                    <div className="mt-2 h-1 rounded-full bg-bg-elevated overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${event.progress}%` }}
                      />
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
