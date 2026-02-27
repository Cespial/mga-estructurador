import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "interactive";
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({ children, className = "", variant = "default", padding = "md" }: CardProps) {
  const base = "rounded-[var(--radius-card)] border border-border bg-bg-card";
  const variants = {
    default: "shadow-[var(--shadow-card)]",
    elevated: "shadow-[var(--shadow-elevated)]",
    interactive: "shadow-[var(--shadow-card)] hover:border-border-hover transition-all duration-150 cursor-pointer",
  };
  const paddings = { none: "", sm: "p-4", md: "p-5", lg: "p-6" };
  return <div className={`${base} ${variants[variant]} ${paddings[padding]} ${className}`}>{children}</div>;
}

export function CardHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h3 className={`text-[15px] font-semibold text-text-primary ${className}`}>{children}</h3>;
}

export function CardDescription({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`mt-1 text-[13px] text-text-secondary ${className}`}>{children}</p>;
}
