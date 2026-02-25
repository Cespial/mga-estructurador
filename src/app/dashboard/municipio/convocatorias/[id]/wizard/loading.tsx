import { Skeleton } from "@/components/skeleton";

export default function WizardLoading() {
  return (
    <div className="mx-auto max-w-3xl">
      <Skeleton className="mb-1 h-3 w-32" />
      <Skeleton className="mb-6 h-6 w-48" />
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <Skeleton className="mb-2 h-4 w-40" />
        <Skeleton className="mb-4 h-3 w-full" />
        <div className="space-y-4">
          <div>
            <Skeleton className="mb-1 h-3 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div>
            <Skeleton className="mb-1 h-3 w-32" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div>
            <Skeleton className="mb-1 h-3 w-28" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
