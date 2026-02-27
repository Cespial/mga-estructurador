import { PageHeaderSkeleton, CardSkeleton, Skeleton } from "@/components/skeleton";

export default function MunicipioConvocatoriaLoading() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeaderSkeleton />
      <div className="mt-6 rounded-lg border border-border bg-white p-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-12" />
        </div>
        <Skeleton className="mt-2 h-3 w-full" />
      </div>
      <div className="mt-6 space-y-2">
        <Skeleton className="h-5 w-32" />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
