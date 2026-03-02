"use client";

import { useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "#desafio", label: "El desafío" },
  { href: "#funcionalidades", label: "Funcionalidades" },
  { href: "#como-funciona", label: "Proceso" },
  { href: "#piloto", label: "Piloto" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-bg-hover transition-colors"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
      >
        {open ? (
          <svg className="h-5 w-5 text-text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-5 w-5 text-text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full border-b border-border bg-white/95 backdrop-blur-xl animate-fade-in">
          <div className="mx-auto max-w-7xl px-6 py-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-4 py-2.5 text-[14px] font-medium text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="block rounded-[var(--radius-button)] bg-accent px-4 py-2.5 text-center text-[14px] font-semibold text-white hover:bg-accent-hover transition-colors"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
