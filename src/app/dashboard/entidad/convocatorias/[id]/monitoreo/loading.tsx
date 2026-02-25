import { PageHeaderSkeleton, TableSkeleton } from "@/components/skeleton";

export default function MonitoreoLoading() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeaderSkeleton />
      <div className="mt-6">
        <TableSkeleton rows={5} cols={5} />
      </div>
    </div>
  );
}
