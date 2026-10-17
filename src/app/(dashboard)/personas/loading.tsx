import { Skeleton } from '@/components/ui/skeleton'

export default function PersonasLoading() {
  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-5 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-36 rounded-lg" />
            <Skeleton className="h-10 w-36 rounded-lg" />
          </div>
        </div>

        {/* Search & filter */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-72 rounded-lg" />
          <Skeleton className="h-10 w-40 rounded-lg" />
        </div>

        {/* Persona cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
