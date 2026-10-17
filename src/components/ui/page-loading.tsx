'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export function PageLoading() {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const [previousPath, setPreviousPath] = useState(pathname)

  useEffect(() => {
    // When pathname changes, show loading briefly
    if (pathname !== previousPath) {
      setPreviousPath(pathname)
      setIsLoading(true)
      
      // Hide loading after component mounts (page has rendered)
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        const timer = setTimeout(() => {
          setIsLoading(false)
        }, 300) // Shorter delay
        
        return () => clearTimeout(timer)
      })
    }
  }, [pathname, previousPath])

  // Don't block initial render
  if (!isLoading || pathname === previousPath) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border bg-card p-6 animate-pulse">
      <div className="space-y-3">
        <div className="h-4 bg-muted rounded w-3/4"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
        <div className="h-4 bg-muted rounded w-2/3"></div>
      </div>
    </div>
  )
}
