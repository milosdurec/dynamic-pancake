export function SkeletonLine({ w = 'w-full', h = 'h-4' }: { w?: string; h?: string }) {
  return <div className={`skeleton ${w} ${h}`} />;
}

export function SkeletonTable({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-3 mb-3">
        {[...Array(3)].map((_, i) => <SkeletonLine key={i} h="h-3" />)}
      </div>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="grid grid-cols-3 gap-3">
          <SkeletonLine h="h-4" w="w-3/4" />
          <SkeletonLine h="h-4" />
          <SkeletonLine h="h-4" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2.5">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex justify-between gap-4">
          <SkeletonLine w="w-1/2" h="h-4" />
          <SkeletonLine w="w-1/4" h="h-4" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  const widths = ['w-full', 'w-5/6', 'w-4/6', 'w-full', 'w-3/4'];
  return (
    <div className="space-y-2">
      {[...Array(lines)].map((_, i) => (
        <SkeletonLine key={i} w={widths[i % widths.length]} h="h-4" />
      ))}
    </div>
  );
}
