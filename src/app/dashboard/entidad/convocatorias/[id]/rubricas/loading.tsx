import { PageHeaderSkeleton, CardSkeleton, Skeleton } from "@/components/skeleton";

export default function RubricasLoading() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeaderSkeleton />
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
        <Skeleton className="mb-2 h-4 w-48" />
        <Skeleton className="h-9 w-full" />
      </div>
      <div className="mt-6 space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
