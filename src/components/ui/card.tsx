import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "interactive";
  padding?: "sm" | "md" | "lg";
}

export function Card({ children, className = "", variant = "default", padding = "md" }: CardProps) {
  const base = "rounded-[var(--radius-card)] border border-border";
  const variants = {
    default: "bg-bg-card shadow-[var(--shadow-card)]",
    elevated: "bg-bg-elevated shadow-[var(--shadow-elevated)]",
    interactive: "bg-bg-card shadow-[var(--shadow-card)] hover:border-border-hover hover:shadow-[var(--shadow-elevated)] transition-all duration-200 cursor-pointer",
  };
  const paddings = { sm: "p-3", md: "p-5", lg: "p-6" };
  return <div className={`${base} ${variants[variant]} ${paddings[padding]} ${className}`}>{children}</div>;
}

export function CardHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h3 className={`text-lg font-semibold text-text-primary ${className}`}>{children}</h3>;
}

export function CardDescription({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`mt-1 text-sm text-text-secondary ${className}`}>{children}</p>;
}
