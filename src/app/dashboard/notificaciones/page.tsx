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

export default function NotificacionesPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const res = await fetch("/api/notifications?limit=50");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications ?? []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  async function markAsRead(id: string) {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    } catch {
      // silent
    }
  }

  async function markAllRead() {
    for (const n of notifications.filter((n) => !n.read)) {
      await markAsRead(n.id);
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  const typeStyles: Record<string, { bg: string; dot: string; label: string }> = {
    deadline: { bg: "bg-red-50", dot: "bg-red-500", label: "Fecha limite" },
    improvement: { bg: "bg-purple-50", dot: "bg-purple-500", label: "Mejora" },
    inactive: { bg: "bg-amber-50", dot: "bg-amber-500", label: "Inactividad" },
    comment: { bg: "bg-blue-50", dot: "bg-blue-500", label: "Comentario" },
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-text-primary">
            Notificaciones
          </h1>
          <p className="mt-1 text-[13px] text-text-muted">
            {unreadCount > 0
              ? `${unreadCount} sin leer`
              : "Todas leidas"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-[12px] font-medium text-accent hover:text-accent-hover"
          >
            Marcar todas como leidas
          </button>
        )}
      </div>

      {loading ? (
        <div className="card-premium p-8 text-center">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent" />
          <p className="mt-2 text-xs text-text-muted">Cargando...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="card-premium p-8 text-center">
          <p className="text-sm text-text-muted">No hay notificaciones.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const style = typeStyles[n.type] ?? {
              bg: "bg-bg-elevated",
              dot: "bg-text-muted",
              label: n.type,
            };
            return (
              <div
                key={n.id}
                className={`card-premium transition-colors ${!n.read ? "border-accent/20" : "opacity-60"}`}
              >
                <div className="flex items-start gap-3 px-5 py-4">
                  <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${style.bg} text-text-secondary`}
                      >
                        {style.label}
                      </span>
                      <span className="text-[10px] text-text-muted">
                        {new Date(n.created_at).toLocaleDateString("es-CO", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-[13px] font-medium text-text-primary">
                      {n.title}
                    </p>
                    <p className="mt-0.5 text-xs text-text-muted">{n.body}</p>
                    <div className="mt-2 flex items-center gap-3">
                      {n.action_url && (
                        <Link
                          href={n.action_url}
                          onClick={() => markAsRead(n.id)}
                          className="text-[11px] font-medium text-accent hover:underline"
                        >
                          Ver detalle
                        </Link>
                      )}
                      {!n.read && (
                        <button
                          onClick={() => markAsRead(n.id)}
                          className="text-[11px] text-text-muted hover:text-text-secondary"
                        >
                          Marcar leida
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
