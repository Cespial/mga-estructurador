"use client";

import { useState, useRef, useEffect } from "react";
import type { GlossaryTerm } from "@/lib/mga-glossary";
import { MGA_GLOSSARY } from "@/lib/mga-glossary";

/**
 * Renders text with glossary terms highlighted and tooltips on hover.
 * Used in wizard field labels and descriptions.
 */
export function GlossaryText({ text }: { text: string }) {
  const lower = text.toLowerCase();

  // Find all term matches with positions
  const matches: { start: number; end: number; term: GlossaryTerm }[] = [];

  for (const entry of MGA_GLOSSARY) {
    const searchTerms = [entry.term.toLowerCase(), ...(entry.aliases ?? [])];
    for (const searchTerm of searchTerms) {
      let idx = lower.indexOf(searchTerm);
      while (idx !== -1) {
        // Check word boundaries
        const before = idx > 0 ? lower[idx - 1] : " ";
        const after =
          idx + searchTerm.length < lower.length
            ? lower[idx + searchTerm.length]
            : " ";
        const isWordBoundary =
          /[\s,.;:()[\]{}!?"'-]/.test(before) || idx === 0;
        const isWordEnd =
          /[\s,.;:()[\]{}!?"'-]/.test(after) ||
          idx + searchTerm.length === lower.length;

        if (isWordBoundary && isWordEnd) {
          matches.push({
            start: idx,
            end: idx + searchTerm.length,
            term: entry,
          });
          break; // Only first occurrence per term
        }
        idx = lower.indexOf(searchTerm, idx + 1);
      }
    }
  }

  if (matches.length === 0) {
    return <>{text}</>;
  }

  // Sort by position, remove overlaps
  matches.sort((a, b) => a.start - b.start);
  const filtered: typeof matches = [];
  let lastEnd = 0;
  for (const m of matches) {
    if (m.start >= lastEnd) {
      filtered.push(m);
      lastEnd = m.end;
    }
  }

  // Build segments
  const segments: React.ReactNode[] = [];
  let cursor = 0;
  for (const m of filtered) {
    if (cursor < m.start) {
      segments.push(text.slice(cursor, m.start));
    }
    segments.push(
      <GlossaryTermSpan
        key={m.start}
        originalText={text.slice(m.start, m.end)}
        term={m.term}
      />,
    );
    cursor = m.end;
  }
  if (cursor < text.length) {
    segments.push(text.slice(cursor));
  }

  return <>{segments}</>;
}

function GlossaryTermSpan({
  originalText,
  term,
}: {
  originalText: string;
  term: GlossaryTerm;
}) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show) return;
    // Close on outside click
    function handleClick(e: MouseEvent) {
      if (
        ref.current &&
        !ref.current.contains(e.target as Node) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node)
      ) {
        setShow(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [show]);

  return (
    <span className="relative inline" ref={ref}>
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="cursor-help border-b border-dashed border-purple-300 text-purple-700"
      >
        {originalText}
        <svg
          className="mb-0.5 ml-0.5 inline h-3 w-3 text-purple-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
          />
        </svg>
      </span>
      {show && (
        <div
          ref={tooltipRef}
          className="absolute bottom-full left-1/2 z-50 mb-2 w-72 -translate-x-1/2 rounded-lg border border-purple-200 bg-white p-3 shadow-lg"
        >
          <p className="mb-1 text-xs font-semibold text-purple-800">
            {term.term}
          </p>
          <p className="text-[11px] leading-relaxed text-text-secondary">
            {term.definition}
          </p>
          {term.example && (
            <div className="mt-2 rounded-md bg-purple-50 px-2 py-1.5">
              <p className="text-[10px] font-medium text-purple-600">
                Ejemplo:
              </p>
              <p className="text-[10px] text-purple-700">{term.example}</p>
            </div>
          )}
          <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-purple-200 bg-white" />
        </div>
      )}
    </span>
  );
}
