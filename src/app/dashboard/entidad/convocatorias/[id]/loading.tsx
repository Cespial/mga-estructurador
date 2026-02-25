import { PageHeaderSkeleton, CardSkeleton } from "@/components/skeleton";

export default function ConvocatoriaDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeaderSkeleton />
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
