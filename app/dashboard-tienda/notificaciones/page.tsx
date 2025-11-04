"use client"

import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { Bell, Check, CheckCheck, Trash2, Eye, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useNotifications } from "@/hooks/use-notifications"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

interface Notification {
  id_notificacion: number
  tipo: string
  titulo: string
  mensaje: string
  leida: boolean
  url_accion?: string
  data?: any
  created_at: string
  fecha_leida?: string
}

export default function NotificacionesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  
  const { 
    getNotifications, 
    markAsRead, 
    markAllAsRead,
    getUnreadCount 
  } = useNotifications()

  useEffect(() => {
    loadNotifications()
  }, [filter])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      let data: Notification[] = []
      
      if (filter === 'unread') {
        data = await getNotifications(true) // Solo no leídas
      } else {
        data = await getNotifications() // Todas
        if (filter === 'read') {
          data = data.filter(n => n.leida)
        }
      }
      
      setNotifications(data)
    } catch (error) {
      console.error('Error cargando notificaciones:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markAsRead(notificationId)
      await loadNotifications() // Recargar lista
    } catch (error) {
      console.error('Error marcando como leída:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      await loadNotifications() // Recargar lista
    } catch (error) {
      console.error('Error marcando todas como leídas:', error)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    // Marcar como leída si no lo está
    if (!notification.leida) {
      await handleMarkAsRead(notification.id_notificacion)
    }

    // Navegar a la URL de acción si existe
    if (notification.url_accion) {
      router.push(notification.url_accion)
    }
  }

  const getNotificationIcon = (tipo: string) => {
    switch (tipo) {
      case 'nuevo_pedido':
        return '🛒'
      case 'pedido_cancelado':
        return '❌'
      case 'pedido_completado':
        return '✅'
      case 'pago_recibido':
        return '💰'
      case 'producto_agotado':
        return '📦'
      case 'nueva_resena':
        return '⭐'
      default:
        return '🔔'
    }
  }

  const getNotificationColor = (tipo: string) => {
    switch (tipo) {
      case 'nuevo_pedido':
        return 'bg-blue-100 text-blue-800'
      case 'pedido_cancelado':
        return 'bg-red-100 text-red-800'
      case 'pedido_completado':
        return 'bg-green-100 text-green-800'
      case 'pago_recibido':
        return 'bg-emerald-100 text-emerald-800'
      case 'producto_agotado':
        return 'bg-orange-100 text-orange-800'
      case 'nueva_resena':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.leida
    if (filter === 'read') return notification.leida
    return true
  })

  const unreadCount = notifications.filter(n => !n.leida).length

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Notificaciones
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona las notificaciones de tu tienda
          </p>
        </div>
        
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead} variant="outline">
            <CheckCheck className="h-4 w-4 mr-2" />
            Marcar todas como leídas ({unreadCount})
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          Todas ({notifications.length})
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'outline'}
          onClick={() => setFilter('unread')}
          size="sm"
        >
          No leídas ({unreadCount})
        </Button>
        <Button
          variant={filter === 'read' ? 'default' : 'outline'}
          onClick={() => setFilter('read')}
          size="sm"
        >
          Leídas ({notifications.length - unreadCount})
        </Button>
      </div>

      {/* Lista de notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filter === 'all' && 'Todas las notificaciones'}
            {filter === 'unread' && 'Notificaciones no leídas'}
            {filter === 'read' && 'Notificaciones leídas'}
          </CardTitle>
          <CardDescription>
            {filteredNotifications.length === 0 
              ? 'No hay notificaciones para mostrar'
              : `${filteredNotifications.length} notificación${filteredNotifications.length !== 1 ? 'es' : ''}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay notificaciones para mostrar</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {filteredNotifications.map((notification, index) => (
                  <div key={notification.id_notificacion}>
                    <div
                      className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                        !notification.leida ? 'bg-blue-50 border-blue-200' : 'bg-background'
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="text-2xl">
                            {getNotificationIcon(notification.tipo)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-sm">
                                {notification.titulo}
                              </h3>
                              <Badge 
                                variant="secondary" 
                                className={getNotificationColor(notification.tipo)}
                              >
                                {notification.tipo.replace('_', ' ')}
                              </Badge>
                              {!notification.leida && (
                                <Badge variant="default" className="bg-blue-600">
                                  Nueva
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {notification.mensaje}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>
                                {formatDistanceToNow(new Date(notification.created_at), {
                                  addSuffix: true,
                                  locale: es
                                })}
                              </span>
                              {notification.fecha_leida && (
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  Leída {formatDistanceToNow(new Date(notification.fecha_leida), {
                                    addSuffix: true,
                                    locale: es
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          {notification.url_accion && (
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          {!notification.leida && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMarkAsRead(notification.id_notificacion)
                              }}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    {index < filteredNotifications.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}