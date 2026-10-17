import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import { Notification } from '@/types/database'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isLoaded: boolean

  // Actions
  fetchNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  addNotification: (notification: Notification) => void
  subscribeToRealtime: (userId: string) => () => void
}

export const useNotifications = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoaded: false,

  fetchNotifications: async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (!error && data) {
      set({
        notifications: data,
        unreadCount: data.filter((n) => !n.read).length,
        isLoaded: true,
      })
    }
  },

  markAsRead: async (id: string) => {
    const supabase = createClient()
    await supabase.from('notifications').update({ read: true }).eq('id', id)

    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }))
  },

  markAllAsRead: async () => {
    const supabase = createClient()
    const unreadIds = get().notifications.filter((n) => !n.read).map((n) => n.id)
    
    if (unreadIds.length === 0) return

    await supabase.from('notifications').update({ read: true }).in('id', unreadIds)

    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }))
  },

  deleteNotification: async (id: string) => {
    const supabase = createClient()
    const notification = get().notifications.find((n) => n.id === id)
    
    await supabase.from('notifications').delete().eq('id', id)

    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
      unreadCount: notification && !notification.read 
        ? Math.max(0, state.unreadCount - 1) 
        : state.unreadCount,
    }))
  },

  addNotification: (notification: Notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: notification.read ? state.unreadCount : state.unreadCount + 1,
    }))
  },

  subscribeToRealtime: (userId: string) => {
    const supabase = createClient()

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification
          get().addNotification(newNotification)
        }
      )
      .subscribe()

    // Return cleanup function
    return () => {
      supabase.removeChannel(channel)
    }
  },
}))
