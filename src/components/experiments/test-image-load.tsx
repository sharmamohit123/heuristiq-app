'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function TestImageLoad({ url }: { url: string }) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  const testFetch = async () => {
    setStatus('loading')
    try {
      const response = await fetch(url, { method: 'HEAD' })
      if (response.ok) {
        setStatus('success')
        console.log('[Test] Image is accessible!', {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries())
        })
      } else {
        setStatus('error')
        setErrorMessage(`HTTP ${response.status}: ${response.statusText}`)
        console.error('[Test] Image not accessible:', response.status, response.statusText)
      }
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error')
      console.error('[Test] Fetch failed:', error)
    }
  }

  return (
    <div className="p-4 bg-card border rounded-lg space-y-2">
      <p className="text-xs font-mono break-all">{url}</p>
      <Button size="sm" onClick={testFetch}>Test URL</Button>
      {status === 'success' && <p className="text-green-600 text-sm">✅ Accessible!</p>}
      {status === 'error' && <p className="text-red-600 text-sm">❌ Failed: {errorMessage}</p>}
    </div>
  )
}
