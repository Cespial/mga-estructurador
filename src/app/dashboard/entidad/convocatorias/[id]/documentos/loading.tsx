import { PageHeaderSkeleton, CardSkeleton, Skeleton } from "@/components/skeleton";

export default function DocumentosLoading() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeaderSkeleton />
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
        <Skeleton className="mb-2 h-4 w-32" />
        <Skeleton className="mb-4 h-3 w-64" />
        <Skeleton className="h-9 w-full" />
      </div>
      <div className="mt-6 space-y-3">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
