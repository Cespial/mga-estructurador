export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded bg-slate-100 animate-shimmer ${className}`} />
  );
}

export function CardSkeleton() {
  return (
    <div className="card-premium p-5">
      <Skeleton className="mb-3 h-4 w-1/3" />
      <Skeleton className="mb-2 h-3 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="card-premium overflow-hidden">
      <div className="border-b border-border px-4 py-3">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-20" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-border/50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-3">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} className="h-3 w-20" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="mb-6">
      <Skeleton className="mb-1 h-3 w-32" />
      <Skeleton className="mt-4 h-6 w-64" />
      <Skeleton className="mt-2 h-3 w-96" />
    </div>
  );
}
