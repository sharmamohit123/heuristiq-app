'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell, CheckCheck, FlaskConical, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useNotifications } from '@/lib/stores/notification-store'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'

export function NotificationBell() {
  const { 
    notifications, 
    unreadCount, 
    isLoaded,
    fetchNotifications, 
    markAsRead, 
    markAllAsRead,
    deleteNotification,
    subscribeToRealtime,
  } = useNotifications()

  const cleanupRef = useRef<(() => void) | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // Get user ID and set up notifications
  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        fetchNotifications()
        cleanupRef.current = subscribeToRealtime(user.id)
      }
    }
    init()

    return () => {
      cleanupRef.current?.()
    }
  }, [])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'experiment_completed':
        return <FlaskConical className="h-4 w-4 text-green-500" />
      default:
        return <Bell className="h-4 w-4 text-primary" />
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4.5 w-4.5 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <Badge className="relative h-4.5 min-w-[18px] px-1 rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-background hover:bg-red-500">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-muted-foreground h-7 px-2"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notification List */}
        <div className="max-h-[400px] overflow-y-auto">
          {!isLoaded ? (
            <div className="p-6 text-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-primary mx-auto" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                You&apos;ll be notified when experiments complete
              </p>
            </div>
          ) : (
            notifications.map((notification) => {
              const data = notification.data as { experimentId?: string; experimentName?: string }
              const href = data.experimentId 
                ? `/experiments/${data.experimentId}/report` 
                : '#'

              return (
                <div
                  key={notification.id}
                  className={cn(
                    "group flex items-start gap-3 px-4 py-3 border-b last:border-0 transition-colors hover:bg-muted/50",
                    !notification.read && "bg-primary/[0.03]"
                  )}
                >
                  {/* Icon with unread dot */}
                  <div className="relative flex-shrink-0">
                    {!notification.read && (
                      <span className="absolute -left-1 top-0 flex h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
                    )}
                  <div className={cn(
                    "mt-0.5 h-8 w-8 rounded-full flex items-center justify-center",
                    notification.type === 'experiment_completed' 
                      ? "bg-green-100 dark:bg-green-900/30" 
                      : "bg-primary/10"
                  )}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={href}
                      onClick={() => {
                        if (!notification.read) markAsRead(notification.id)
                      }}
                      className="block"
                    >
                      <p className={cn(
                        "text-sm leading-snug",
                        !notification.read ? "font-medium" : "text-muted-foreground"
                      )}>
                        {notification.title}
                      </p>
                      {notification.message && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                      )}
                    </Link>
                    <p className="text-[11px] text-muted-foreground/60 mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 py-2.5 border-t bg-muted/30">
            <Link href="/settings" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Notification settings
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
