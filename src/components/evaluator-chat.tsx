"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Evaluator Chat
 *
 * Real-time bidirectional chat between municipality and entity.
 * Messages are persisted and threaded.
 */

interface Message {
  id: string;
  sender_id: string;
  sender_role: string;
  content: string;
  created_at: string;
}

interface EvaluatorChatProps {
  convocatoriaId: string;
  submissionId: string;
  currentUserId: string;
  currentUserRole: string;
}

export function EvaluatorChat({
  convocatoriaId,
  submissionId,
  currentUserId,
  currentUserRole,
}: EvaluatorChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);
  const userScrolledUpRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(
      `/api/messages?convocatoria_id=${convocatoriaId}&submission_id=${submissionId}`,
    )
      .then((r) => (r.ok ? r.json() : { messages: [] }))
      .then((json) => setMessages(json.messages ?? []))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [open, convocatoriaId, submissionId]);

  useEffect(() => {
    const isNewMessage = messages.length !== prevMessageCountRef.current;
    prevMessageCountRef.current = messages.length;

    if (isNewMessage) {
      userScrolledUpRef.current = false;
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (!userScrolledUpRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  async function handleSend() {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          convocatoria_id: convocatoriaId,
          submission_id: submissionId,
          content: newMessage.trim(),
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setMessages((prev) => [...prev, json.message]);
        setNewMessage("");
      }
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-lg hover:bg-accent-hover transition-colors"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
        </svg>
        {messages.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
            {messages.length}
          </span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-40 w-80 rounded-xl border border-border bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-[13px] font-semibold text-text-primary">
              Chat con evaluador
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-text-muted hover:text-text-primary"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollContainerRef}
            onScroll={() => {
              const el = scrollContainerRef.current;
              if (!el) return;
              userScrolledUpRef.current =
                el.scrollHeight - el.scrollTop - el.clientHeight >= 100;
            }}
            className="h-64 overflow-y-auto p-3 space-y-2"
          >
            {loading && (
              <p className="text-[11px] text-text-muted text-center">
                Cargando...
              </p>
            )}
            {!loading && messages.length === 0 && (
              <p className="text-[11px] text-text-muted text-center py-8">
                No hay mensajes. Inicia la conversacion.
              </p>
            )}
            {messages.map((msg) => {
              const isMine = msg.sender_id === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      isMine
                        ? "bg-accent text-white"
                        : "bg-bg-elevated text-text-primary"
                    }`}
                  >
                    <p className="text-[11px]">{msg.content}</p>
                    <p
                      className={`mt-0.5 text-[9px] ${
                        isMine ? "text-white/60" : "text-text-muted"
                      }`}
                    >
                      {new Date(msg.created_at).toLocaleTimeString("es-CO", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Escribe un mensaje..."
                className="flex-1 rounded-md border border-border px-2 py-1.5 text-[12px] placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent/30"
              />
              <button
                onClick={handleSend}
                disabled={!newMessage.trim() || sending}
                className="rounded-md bg-accent px-3 py-1.5 text-white disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
