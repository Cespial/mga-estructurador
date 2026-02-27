"use client";

import Link from "next/link";

export function HelpButton({
  section,
  label = "Ayuda",
}: {
  section: string;
  label?: string;
}) {
  return (
    <Link
      href={`/dashboard/ayuda#${section}`}
      className="inline-flex items-center gap-1 rounded-[var(--radius-button)] border border-border px-2 py-1 text-xs text-text-muted hover:bg-white/5 hover:text-text-secondary transition-colors"
      aria-label={label}
    >
      <svg
        className="h-3.5 w-3.5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
        />
      </svg>
      {label}
    </Link>
  );
}
