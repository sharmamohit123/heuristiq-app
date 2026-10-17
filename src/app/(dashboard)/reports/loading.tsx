import { Skeleton } from '@/components/ui/skeleton'

export default function ReportsLoading() {
  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-5 w-56" />
        </div>

        {/* Report list */}
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-64" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-9 w-28 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
