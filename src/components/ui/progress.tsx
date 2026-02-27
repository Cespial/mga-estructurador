interface ProgressProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function Progress({ value, max = 100, label, showValue = true, size = "md", className = "" }: ProgressProps) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  const heights = { sm: "h-1.5", md: "h-2.5" };
  return (
    <div className={`space-y-1.5 ${className}`}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs">
          {label && <span className="text-text-secondary">{label}</span>}
          {showValue && <span className="text-text-muted">{Math.round(pct)}%</span>}
        </div>
      )}
      <div className={`w-full rounded-full bg-slate-100 overflow-hidden ${heights[size]}`}>
        <div
          className={`${heights[size]} rounded-full bg-accent transition-all duration-500 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
