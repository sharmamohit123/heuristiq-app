'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Mail, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

interface TestEmailButtonProps {
  experimentId: string
}

export function TestEmailButton({ experimentId }: TestEmailButtonProps) {
  const [isSending, setIsSending] = useState(false)
  const [lastResult, setLastResult] = useState<'success' | 'error' | null>(null)

  const handleSendTestEmail = async () => {
    setIsSending(true)
    setLastResult(null)

    try {
      const response = await fetch('/api/email/experiment-completed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experimentId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email')
      }

      setLastResult('success')
      toast.success('Test email sent successfully! Check your inbox.')
    } catch (error) {
      setLastResult('error')
      toast.error(error instanceof Error ? error.message : 'Failed to send test email')
      console.error('[TestEmail] Error:', error)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSendTestEmail}
      disabled={isSending}
      className="gap-2"
    >
      {isSending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Sending...
        </>
      ) : lastResult === 'success' ? (
        <>
          <CheckCircle className="h-4 w-4 text-green-500" />
          Email Sent
        </>
      ) : lastResult === 'error' ? (
        <>
          <XCircle className="h-4 w-4 text-red-500" />
          Retry
        </>
      ) : (
        <>
          <Mail className="h-4 w-4" />
          Test Email
        </>
      )}
    </Button>
  )
}
