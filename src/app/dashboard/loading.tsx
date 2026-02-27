export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-lg bg-white/5 animate-shimmer" />
        <div className="h-4 w-72 rounded bg-white/5 animate-shimmer" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card-premium p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="h-3 w-20 rounded bg-white/5 animate-shimmer" />
                <div className="h-7 w-12 rounded bg-white/5 animate-shimmer" />
              </div>
              <div className="h-10 w-10 rounded-[var(--radius-input)] bg-white/5 animate-shimmer" />
            </div>
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="card-premium p-5">
            <div className="h-5 w-40 rounded bg-white/5 animate-shimmer mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center justify-between p-3">
                  <div className="space-y-1.5">
                    <div className="h-4 w-48 rounded bg-white/5 animate-shimmer" />
                    <div className="h-3 w-24 rounded bg-white/5 animate-shimmer" />
                  </div>
                  <div className="h-5 w-16 rounded-full bg-white/5 animate-shimmer" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
