'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FlaskConical,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useSidebar } from '@/lib/stores/sidebar-store'
import { useNavigation } from '@/lib/stores/navigation-store'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

interface SidebarProps {
  user: {
    email: string
    name?: string | null
    avatar_url?: string | null
  } | null
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Experiments', href: '/experiments', icon: FlaskConical },
  { name: 'Personas', href: '/personas', icon: Users },
  { name: 'Reports', href: '/reports', icon: FileText },
]

const bottomNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const { isCollapsed, toggleCollapsed } = useSidebar()
  const { isNavigating, targetPath, startNavigation } = useNavigation()

  const handleNavClick = (href: string) => {
    // Only trigger loading if navigating to a different route
    const currentBase = '/' + pathname.split('/').filter(Boolean)[0]
    const targetBase = '/' + href.split('/').filter(Boolean)[0]
    if (pathname !== href && currentBase !== targetBase) {
      startNavigation(href)
    }
    setIsOpen(false)
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-6",
        isCollapsed && "justify-center px-2"
      )}>
        <Image
          src="/heuristiq-logo-192.png"
          alt="Heuristiq"
          width={40}
          height={40}
          className="flex-shrink-0"
        />
        {!isCollapsed && (
        <div className="flex flex-col">
          <h1 className="text-lg font-bold leading-tight tracking-tight">Heuristiq</h1>
          <p className="text-xs font-medium text-muted-foreground">UX Research Agent</p>
        </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 px-3 relative">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const isLoadingThis = isNavigating && targetPath === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => handleNavClick(item.href)}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                isLoadingThis && 'bg-primary/10 text-primary',
                isCollapsed && 'justify-center px-2'
              )}
              title={isCollapsed ? item.name : undefined}
            >
              {isLoadingThis ? (
                <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin" />
              ) : (
                <item.icon className="h-5 w-5 flex-shrink-0" />
              )}
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
        
        {/* Collapse/Expand Toggle Button - Middle Right */}
        <div className="absolute top-1/2 -right-3 -translate-y-1/2">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleCollapsed}
            className="h-6 w-6 rounded-full bg-background border-2 shadow-md hover:shadow-lg transition-all"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronsRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronsLeft className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto border-t px-3 py-4">
        {bottomNavigation.map((item) => {
          const isActive = pathname === item.href
          const isLoadingThis = isNavigating && targetPath === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => handleNavClick(item.href)}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                isLoadingThis && 'bg-primary/10 text-primary',
                isCollapsed && 'justify-center px-2'
              )}
              title={isCollapsed ? item.name : undefined}
            >
              {isLoadingThis ? (
                <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin" />
              ) : (
                <item.icon className="h-5 w-5 flex-shrink-0" />
              )}
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          )
        })}

        {/* User Profile */}
        {user && !isCollapsed && (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-muted/50 p-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback>
                {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-col overflow-hidden">
              <p className="truncate text-sm font-medium">
                {user.name || user.email.split('@')[0]}
              </p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {/* Collapsed User Avatar */}
        {user && isCollapsed && (
          <div className="mt-4 flex justify-center">
            <Avatar className="h-9 w-9 cursor-pointer" onClick={handleSignOut} title="Sign Out">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback>
                {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild className="lg:hidden no-print">
          <Button variant="ghost" size="icon" className="fixed left-4 top-4 z-50">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col border-r bg-card no-print transition-all duration-300",
        isCollapsed ? "w-20" : "w-72"
      )}>
        <SidebarContent />
      </aside>
    </>
  )
}
