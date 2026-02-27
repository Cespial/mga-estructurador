export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-56 rounded-lg bg-gray-100 animate-shimmer" />
        <div className="h-4 w-72 rounded bg-gray-100 animate-shimmer" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card-premium px-5 py-5">
            <div className="h-3 w-24 rounded bg-gray-100 animate-shimmer" />
            <div className="mt-3 flex items-end justify-between">
              <div className="h-8 w-16 rounded bg-gray-100 animate-shimmer" />
              <div className="flex items-end gap-[3px] h-7">
                {Array.from({ length: 7 }).map((_, j) => (
                  <div key={j} className="w-[4px] rounded-[1px] bg-gray-100 animate-shimmer" style={{ height: `${30 + Math.random() * 70}%` }} />
                ))}
              </div>
            </div>
            <div className="mt-3 h-3 w-20 rounded bg-gray-100 animate-shimmer" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="card-premium">
            <div className="px-6 pt-5 pb-4">
              <div className="h-3 w-40 rounded bg-gray-100 animate-shimmer" />
            </div>
            <div className="divide-y divide-border">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center justify-between px-6 py-3.5">
                  <div className="space-y-1.5">
                    <div className="h-4 w-48 rounded bg-gray-100 animate-shimmer" />
                    <div className="h-3 w-24 rounded bg-gray-100 animate-shimmer" />
                  </div>
                  <div className="h-5 w-16 rounded-full bg-gray-100 animate-shimmer" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
