'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useNavigation } from '@/lib/stores/navigation-store'

/**
 * NavigationLoader listens for pathname changes and clears the
 * navigation loading state set by the sidebar (or any link click).
 * 
 * The actual loading UI is handled by:
 * 1. Sidebar spinner on the target nav item (immediate feedback)
 * 2. Next.js loading.tsx skeletons (while page renders)
 */
export function NavigationLoader() {
  const pathname = usePathname()
  const prevPathname = useRef(pathname)
  const endNavigation = useNavigation((s) => s.endNavigation)

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname
      // Page has rendered, clear the navigation loading state
      endNavigation()
    }
  }, [pathname, endNavigation])

  // Also add a safety timeout to clear stale navigation state
  const isNavigating = useNavigation((s) => s.isNavigating)
  useEffect(() => {
    if (!isNavigating) return
    const timer = setTimeout(() => {
      endNavigation()
    }, 8000) // Safety: clear after 8s max
    return () => clearTimeout(timer)
  }, [isNavigating, endNavigation])

  return null // No visual overlay - loading is handled by sidebar + loading.tsx
}
