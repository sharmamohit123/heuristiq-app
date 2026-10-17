'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface HeatmapPreviewProps {
  imageUrl?: string
  className?: string
}

export function HeatmapPreview({ imageUrl, className }: HeatmapPreviewProps) {
  // This is a placeholder heatmap visualization
  // In a real implementation, this would overlay actual interaction data
  return (
    <div className={cn('relative rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 border', className)}>
      <div className="absolute top-3 left-3 z-10">
        <Badge className="bg-white/90 text-gray-700 shadow-sm">
          Interaction Heatmap
        </Badge>
      </div>
      
      {/* Simulated heatmap visualization */}
      <div className="aspect-[16/10] relative">
        {/* Page mockup */}
        <div className="absolute inset-6 bg-white rounded-lg shadow-sm border overflow-hidden">
          {/* Header */}
          <div className="h-12 bg-gray-100 border-b flex items-center px-4 gap-3">
            <div className="h-6 w-6 rounded bg-primary/20" />
            <div className="h-3 w-24 rounded bg-gray-200" />
            <div className="ml-auto flex gap-2">
              <div className="h-3 w-12 rounded bg-gray-200" />
              <div className="h-3 w-12 rounded bg-gray-200" />
            </div>
          </div>
          
          {/* Content area with heat spots */}
          <div className="relative p-6">
            {/* Simulated heat spots */}
            <div className="absolute top-8 left-1/4 h-16 w-16 rounded-full bg-red-500/40 blur-xl" />
            <div className="absolute top-20 right-1/3 h-12 w-12 rounded-full bg-orange-500/30 blur-lg" />
            <div className="absolute bottom-12 left-1/2 h-20 w-20 rounded-full bg-yellow-500/25 blur-xl" />
            <div className="absolute top-1/3 right-1/4 h-10 w-10 rounded-full bg-red-400/35 blur-lg" />
            
            {/* Content placeholders */}
            <div className="space-y-4 relative z-10">
              <div className="h-6 w-3/4 rounded bg-gray-100" />
              <div className="h-4 w-1/2 rounded bg-gray-100" />
              <div className="flex gap-4 mt-6">
                <div className="h-24 w-32 rounded-lg bg-gray-50 border" />
                <div className="h-24 w-32 rounded-lg bg-gray-50 border" />
                <div className="h-24 w-32 rounded-lg bg-gray-50 border" />
              </div>
              <div className="h-10 w-32 rounded-lg bg-primary/20 border border-primary/30 mt-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-white/90 rounded-lg px-3 py-1.5 shadow-sm">
        <span className="text-xs text-muted-foreground">Low</span>
        <div className="flex gap-0.5">
          <div className="h-3 w-3 rounded-sm bg-yellow-300" />
          <div className="h-3 w-3 rounded-sm bg-orange-400" />
          <div className="h-3 w-3 rounded-sm bg-red-500" />
        </div>
        <span className="text-xs text-muted-foreground">High</span>
      </div>
    </div>
  )
}
