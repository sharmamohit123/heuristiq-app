import { Skeleton } from '@/components/ui/skeleton'

export default function SettingsLoading() {
  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-5 w-56" />
        </div>

        {/* Profile Card */}
        <div className="rounded-xl border bg-card p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-52" />
            </div>
          </div>
          <Skeleton className="h-px w-full" />
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>

        {/* Password Card */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-10 w-40 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
