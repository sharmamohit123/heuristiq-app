'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export function FixUrlsButton() {
  const [isFixing, setIsFixing] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleFix = async () => {
    if (!confirm('This will regenerate screenshot URLs for all experiments. Continue?')) {
      return
    }

    setIsFixing(true)
    setResult(null)

    try {
      const response = await fetch('/api/fix-screenshot-urls', {
        method: 'POST',
      })

      const data = await response.json()
      
      if (response.ok) {
        setResult(data)
        console.log('[Fix URLs] Result:', data)
        
        if (data.errors && data.errors.length > 0) {
          console.error('[Fix URLs] Errors:', data.errors)
          toast.error(`Fixed ${data.fixed}, but ${data.errors.length} experiments had errors. Check console.`)
        } else {
          toast.success(`Fixed ${data.fixed} out of ${data.totalExperiments} experiments!`)
        }
        
        // Refresh page to show updated thumbnails
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        console.error('[Fix URLs] API error:', data)
        toast.error(data.error || 'Failed to fix URLs')
      }
    } catch (error) {
      console.error('Fix URLs error:', error)
      toast.error('Failed to fix screenshot URLs')
    } finally {
      setIsFixing(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={handleFix}
        disabled={isFixing}
        className="shadow-lg"
        variant="outline"
      >
        {isFixing ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Fixing URLs...
          </>
        ) : result ? (
          <>
            <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
            Fixed {result.fixed} URLs
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            Fix Screenshot URLs
          </>
        )}
      </Button>
    </div>
  )
}
