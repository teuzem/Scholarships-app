import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, invokeEdgeFunction } from '@/lib/supabase'
import { useAuth } from './useAuth'
import toast from 'react-hot-toast'

interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  priority?: string
  is_read: boolean
  related_scholarship_id?: string
  related_application_id?: string
  action_url?: string
  created_at: string
  expires_at?: string
}

interface NotificationsContextType {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  createNotification: (notification: Omit<Notification, 'id' | 'user_id' | 'is_read' | 'created_at'>) => Promise<void>
  refreshNotifications: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  // Load notifications when user changes
  useEffect(() => {
    if (user) {
      loadNotifications()
      setupRealtimeSubscription()
    } else {
      setNotifications([])
      setUnreadCount(0)
    }
  }, [user])

  // Setup realtime subscription for notifications
  function setupRealtimeSubscription() {
    if (!user) return

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNotification = payload.new as Notification
            setNotifications(prev => [newNotification, ...prev])
            setUnreadCount(prev => prev + 1)
            
            // Show toast for new notifications
            toast(
              <div>
                <div className="font-medium">{newNotification.title}</div>
                <div className="text-sm text-gray-600">{newNotification.message}</div>
              </div>,
              {
                icon: getNotificationIcon(newNotification.type),
                duration: 5000
              }
            )
          } else if (payload.eventType === 'UPDATE') {
            const updatedNotification = payload.new as Notification
            setNotifications(prev =>
              prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
            )
            updateUnreadCount()
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id
            setNotifications(prev => prev.filter(n => n.id !== deletedId))
            updateUnreadCount()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  // Load notifications from database
  async function loadNotifications() {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setNotifications(data || [])
      updateUnreadCount(data || [])
    } catch (error) {
      console.error('Error loading notifications:', error)
      toast.error('Erreur lors du chargement des notifications')
    } finally {
      setLoading(false)
    }
  }

  // Update unread count
  function updateUnreadCount(notificationsList?: Notification[]) {
    const list = notificationsList || notifications
    const count = list.filter(n => !n.is_read).length
    setUnreadCount(count)
  }

  // Mark notification as read
  async function markAsRead(notificationId: string) {
    try {
      await invokeEdgeFunction('notification-manager', {
        action: 'mark_read',
        notificationId
      })
      
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
      updateUnreadCount()
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error('Erreur lors du marquage de la notification')
    }
  }

  // Mark all notifications as read
  async function markAllAsRead() {
    try {
      await invokeEdgeFunction('notification-manager', {
        action: 'mark_all_read',
        userId: user?.id
      })
      
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      )
      setUnreadCount(0)
      toast.success('Toutes les notifications marquées comme lues')
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      toast.error('Erreur lors du marquage des notifications')
    }
  }

  // Delete notification
  async function deleteNotification(notificationId: string) {
    try {
      await invokeEdgeFunction('notification-manager', {
        action: 'delete',
        notificationId
      })
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      updateUnreadCount()
      toast.success('Notification supprimée')
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  // Create new notification
  async function createNotification(notification: Omit<Notification, 'id' | 'user_id' | 'is_read' | 'created_at'>) {
    try {
      await invokeEdgeFunction('notification-manager', {
        action: 'create',
        notificationData: notification
      })
      
      // Notification will be added via realtime subscription
    } catch (error) {
      console.error('Error creating notification:', error)
      toast.error('Erreur lors de la création de la notification')
    }
  }

  // Refresh notifications
  async function refreshNotifications() {
    await loadNotifications()
  }

  // Get notification icon based on type
  function getNotificationIcon(type: string) {
    switch (type) {
      case 'scholarship_update':
        return '🎓'
      case 'application_status':
        return '📋'
      case 'deadline_reminder':
        return '⏰'
      case 'system':
        return '🔔'
      default:
        return '📧'
    }
  }

  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    refreshNotifications
  }

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider')
  }
  return context
}
