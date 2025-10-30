export default function ProductsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-neutral-800 overflow-hidden">
          <div className="aspect-square bg-neutral-900 animate-pulse" />
          <div className="p-5 space-y-3">
            <div className="h-4 w-2/3 bg-neutral-900 animate-pulse rounded" />
            <div className="h-3 w-full bg-neutral-900 animate-pulse rounded" />
            <div className="h-3 w-4/5 bg-neutral-900 animate-pulse rounded" />
            <div className="h-4 w-24 bg-neutral-900 animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}