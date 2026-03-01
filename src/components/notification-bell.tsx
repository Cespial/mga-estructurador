"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  action_url?: string;
  read: boolean;
  created_at: string;
}

/**
 * Notification bell icon for the header.
 * Shows unread count badge and dropdown with recent notifications.
 */
export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications?limit=10");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: string) {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    } catch {
      // silent fail
    }
  }

  const typeIcon = (type: string) => {
    switch (type) {
      case "deadline":
        return "text-red-500";
      case "improvement":
        return "text-purple-500";
      case "inactive":
        return "text-amber-500";
      case "comment":
        return "text-blue-500";
      default:
        return "text-text-muted";
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-[var(--radius-button)] p-2 text-text-muted hover:bg-bg-hover hover:text-text-secondary transition-colors"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-[14px] border border-border bg-bg-card shadow-lg">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-semibold text-text-primary">
                Notificaciones
              </span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-semibold text-accent">
                  {unreadCount} sin leer
                </span>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-xs text-text-muted">
                  Cargando...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-text-muted">
                  No hay notificaciones
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`border-b border-border px-4 py-3 transition-colors ${
                      n.read ? "opacity-60" : "bg-accent-muted/10"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${typeIcon(n.type)}`}>
                        <div className={`h-full w-full rounded-full ${n.read ? "bg-text-muted" : "bg-current"}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-text-primary">
                          {n.title}
                        </p>
                        <p className="mt-0.5 text-[11px] text-text-muted line-clamp-2">
                          {n.body}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2">
                          {n.action_url && (
                            <Link
                              href={n.action_url}
                              onClick={() => {
                                markAsRead(n.id);
                                setIsOpen(false);
                              }}
                              className="text-[10px] font-medium text-accent hover:underline"
                            >
                              Ver detalle
                            </Link>
                          )}
                          {!n.read && (
                            <button
                              onClick={() => markAsRead(n.id)}
                              className="text-[10px] text-text-muted hover:text-text-secondary"
                            >
                              Marcar leido
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-border px-4 py-2">
              <Link
                href="/dashboard/notificaciones"
                onClick={() => setIsOpen(false)}
                className="text-[11px] font-medium text-accent hover:underline"
              >
                Ver todas
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
