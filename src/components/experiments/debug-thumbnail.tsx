'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'

interface DebugThumbnailProps {
  experiment: any
}

export function DebugThumbnail({ experiment }: DebugThumbnailProps) {
  const [showDebug, setShowDebug] = useState(false)

  if (!showDebug) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowDebug(true)}
        className="absolute bottom-2 left-2 z-20 text-xs"
      >
        <Eye className="h-3 w-3 mr-1" />
        Debug
      </Button>
    )
  }

  return (
    <div className="absolute inset-0 bg-black/90 text-white p-4 z-30 overflow-auto text-xs">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowDebug(false)}
        className="absolute top-2 right-2 text-white"
      >
        Close
      </Button>
      <div className="space-y-2 mt-8">
        <p><strong>Input Mode:</strong> {experiment.input_mode || 'N/A'}</p>
        <p><strong>Thumbnail URL:</strong> {experiment.thumbnail_url || 'NOT SET'}</p>
        <p><strong>Device Targets:</strong> {experiment.device_targets?.join(', ') || 'N/A'}</p>
        <p><strong>Has Screenshots:</strong> {experiment.screenshots ? 'Yes' : 'No'}</p>
        {experiment.screenshots && (
          <p><strong>Screenshots Count:</strong> {Array.isArray(experiment.screenshots) ? experiment.screenshots.length : 'Not an array'}</p>
        )}
      </div>
    </div>
  )
}
