"use client";
import { type ReactNode, useEffect, useRef } from "react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function Dialog({ open, onClose, children, title, description, className = "" }: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div ref={overlayRef} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative glass rounded-[var(--radius-shell)] p-6 shadow-[var(--shadow-elevated)] max-w-lg w-full animate-fade-in-up ${className}`}>
        {title && <h2 className="text-lg font-semibold text-text-primary">{title}</h2>}
        {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
        <div className={title ? "mt-4" : ""}>{children}</div>
      </div>
    </div>
  );
}
