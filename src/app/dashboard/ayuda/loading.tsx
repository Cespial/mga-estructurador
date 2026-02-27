import { Skeleton } from "@/components/skeleton";

export default function AyudaLoading() {
  return (
    <div>
      <Skeleton className="mb-6 h-7 w-48" />
      <div className="flex gap-8">
        <div className="hidden w-56 shrink-0 lg:block">
          <Skeleton className="mb-3 h-3 w-20" />
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <Skeleton className="mb-6 h-10 w-full rounded-lg" />
          <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-white p-5"
              >
                <Skeleton className="mb-3 h-5 w-1/3" />
                <Skeleton className="mb-2 h-3 w-full" />
                <Skeleton className="mb-2 h-3 w-4/5" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
