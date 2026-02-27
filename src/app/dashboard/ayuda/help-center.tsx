"use client";

import { useState, useCallback } from "react";
import { helpSections, type HelpSection } from "./help-content";

export function HelpCenter() {
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const normalize = (s: string) =>
    s.toLowerCase().replace(/[áàä]/g, "a").replace(/[éèë]/g, "e")
      .replace(/[íìï]/g, "i").replace(/[óòö]/g, "o").replace(/[úùü]/g, "u");

  const query = normalize(search.trim());

  const matches = (section: HelpSection): boolean => {
    if (!query) return true;
    if (normalize(section.title).includes(query)) return true;
    if (normalize(section.content).includes(query)) return true;
    if (section.subsections?.some(
      (s) => normalize(s.title).includes(query) || normalize(s.content).includes(query),
    )) return true;
    return false;
  };

  const filtered = helpSections.filter(matches);

  const copyLink = useCallback((id: string) => {
    const url = `${window.location.origin}/dashboard/ayuda#${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }, []);

  return (
    <div className="flex gap-8">
      {/* Sidebar */}
      <nav className="hidden w-56 shrink-0 lg:block" aria-label="Indice de ayuda">
        <div className="sticky top-6">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            Contenido
          </p>
          <ul className="space-y-1">
            {helpSections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="block truncate rounded px-2 py-1 text-xs text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Main content */}
      <div className="min-w-0 flex-1">
        {/* Search */}
        <div className="mb-6">
          <label htmlFor="help-search" className="sr-only">
            Buscar en ayuda
          </label>
          <input
            id="help-search"
            type="search"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-[var(--radius-input)] border border-border bg-bg-input px-4 py-2.5 text-[13px] text-text-primary shadow-sm placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/8"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-[14px] border border-border bg-bg-app p-6 text-center">
            <p className="text-[13px] text-text-muted">
              No se encontraron resultados para &quot;{search}&quot;
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filtered.map((section) => (
              <SectionCard
                key={section.id}
                section={section}
                copiedId={copiedId}
                onCopyLink={copyLink}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionCard({
  section,
  copiedId,
  onCopyLink,
}: {
  section: HelpSection;
  copiedId: string | null;
  onCopyLink: (id: string) => void;
}) {
  return (
    <section
      id={section.id}
      className="scroll-mt-6 rounded-[14px] border border-border bg-bg-card"
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h2 className="text-base font-semibold text-text-primary">
          {section.title}
        </h2>
        <button
          onClick={() => onCopyLink(section.id)}
          aria-label={`Copiar link a ${section.title}`}
          className="rounded px-2 py-1 text-[10px] font-medium text-text-muted hover:bg-bg-hover hover:text-text-secondary"
        >
          {copiedId === section.id ? "Copiado" : "Copiar link"}
        </button>
      </div>

      <div className="px-5 py-4">
        {section.content && (
          <div className="whitespace-pre-line text-[13px] leading-relaxed text-text-secondary">
            {section.content}
          </div>
        )}

        {section.subsections && (
          <div className="mt-3 space-y-3">
            {section.subsections.map((sub) => (
              <div
                key={sub.id}
                id={sub.id}
                className="scroll-mt-6 rounded-[8px] bg-bg-app px-4 py-3"
              >
                <h3 className="text-[13px] font-medium text-text-primary">
                  {sub.title}
                </h3>
                <p className="mt-1 text-[13px] text-text-secondary">{sub.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
