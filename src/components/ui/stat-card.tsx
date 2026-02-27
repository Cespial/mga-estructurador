import { type ReactNode } from "react";

interface StatCardProps {
  icon?: ReactNode;
  label: string;
  value: string | number;
  trend?: { value: number; label: string };
  className?: string;
}

export function StatCard({ icon, label, value, trend, className = "" }: StatCardProps) {
  return (
    <div className={`card-premium p-5 ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-muted">{label}</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">{value}</p>
          {trend && (
            <p className={`mt-1 text-xs font-medium ${trend.value >= 0 ? "text-success" : "text-danger"}`}>
              {trend.value >= 0 ? "+" : ""}{trend.value}% {trend.label}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-input)] bg-accent-muted text-accent">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
