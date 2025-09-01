import React from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useNotifications, useMarkNotificationRead } from '@/hooks/useDatabase'
import { useAuth } from '@/hooks/useAuth'
import { Bell, CheckCircle, Clock, AlertTriangle, Info } from 'lucide-react'
import type { Tables } from '@/types/supabase'

type Notification = Tables<'notifications'>

export default function NotificationsPage() {
  const { user } = useAuth()
  const { data: notifications, isLoading } = useNotifications(user?.id)
  const markAsRead = useMarkNotificationRead()

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead.mutate(notificationId)
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'application_update':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'deadline_reminder':
        return <Clock className="h-5 w-5 text-orange-600" />
      case 'urgent':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      default:
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50'
      case 'medium':
        return 'border-l-orange-500 bg-orange-50'
      case 'low':
        return 'border-l-blue-500 bg-blue-50'
      default:
        return 'border-l-gray-500 bg-gray-50'
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Notifications
          </h1>
          <p className="text-lg text-gray-600">
            Restez informé des dernières mises à jour sur vos candidatures et bourses.
          </p>
        </div>

        <div className="space-y-4">
          {notifications?.length === 0 ? (
            <Card className="text-center py-12">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune notification
              </h3>
              <p className="text-gray-600">
                Vous n'avez aucune notification pour le moment.
              </p>
            </Card>
          ) : (
            notifications?.map((notification) => (
              <Card 
                key={notification.id} 
                className={`border-l-4 ${getPriorityColor(notification.priority)} ${
                  notification.is_read ? 'opacity-75' : ''
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className={`text-lg font-medium ${
                          notification.is_read ? 'text-gray-700' : 'text-gray-900'
                        }`}>
                          {notification.title}
                        </h3>
                        <p className={`mt-1 ${
                          notification.is_read ? 'text-gray-500' : 'text-gray-700'
                        }`}>
                          {notification.message}
                        </p>
                        <p className="mt-2 text-sm text-gray-500">
                          {new Date(notification.created_at!).toLocaleString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!notification.is_read && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            Marquer comme lue
                          </Button>
                        )}
                        {notification.action_url && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => window.open(notification.action_url!, '_blank')}
                          >
                            Voir détails
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
