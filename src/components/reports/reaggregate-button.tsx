'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ReaggregateButtonProps {
  experimentId: string
}

export function ReaggregateButton({ experimentId }: ReaggregateButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleReaggregate = async () => {
    if (!confirm('This will re-analyze all runs and regenerate the report. Continue?')) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/experiments/${experimentId}/reaggregate`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to re-aggregate')
      }

      const result = await response.json()
      
      console.log('[Re-aggregate] Success:', result)
      
      toast.success('Report re-generated successfully!')
      
      // Refresh the page to show updated data
      router.refresh()
    } catch (error) {
      console.error('[Re-aggregate] Error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to re-aggregate')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleReaggregate}
      disabled={isLoading}
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      {isLoading ? 'Re-analyzing...' : 'Re-analyze Report'}
    </Button>
  )
}
