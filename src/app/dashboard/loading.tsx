import { CardSkeleton, Skeleton } from "@/components/skeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-3xl">
      <Skeleton className="mb-2 h-6 w-48" />
      <Skeleton className="mb-6 h-3 w-72" />
      <div className="space-y-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
