"use client"

import { useState, useEffect } from 'react'
import { Bell, Check, CheckCheck, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useNotifications, type Notification } from '@/hooks/use-notifications'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export default function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead,
    getUnreadNotifications,
    fetchNotifications,
  } = useNotifications()

  // Normaliza URLs antiguas de notificaciones que apuntaban al dashboard
  const normalizeNotificationUrl = (url: string) => {
    if (!url) return url
    return url.startsWith('/dashboard-tienda/productos/')
      ? url.replace('/dashboard-tienda/productos/', '/productos/')
      : url
  }

  // Actualizar la lista cuando se abre el dropdown
  // para reflejar nuevas notificaciones más allá del polling del contador
  // y evitar que solo se actualice el número.
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.leida) {
      await markAsRead(notification.id_notificacion)
    }
    
    // Si tiene URL de acción, navegar
    if (notification.url_accion) {
      const href = normalizeNotificationUrl(notification.url_accion)
      window.location.href = href
    }
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: es 
      })
    } catch {
      return 'Hace un momento'
    }
  }

  const getNotificationIcon = (tipo: string) => {
    switch (tipo) {
      case 'nuevo_pedido':
        return '🛒'
      case 'pago_recibido':
        return '💰'
      case 'producto_agotado':
        return '📦'
      case 'nueva_resena':
        return '⭐'
      default:
        return '📢'
    }
  }

  const recentNotifications = notifications.slice(0, 10) // Mostrar solo las 10 más recientes

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-[10px] bg-red-500 hover:bg-red-600"
              variant="destructive"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">
            Notificaciones {unreadCount > 0 && `(${unreadCount} nuevas)`}
          </span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificaciones</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-auto p-1 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Marcar todas como leídas
            </Button>
          )}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Cargando notificaciones...
          </div>
        ) : recentNotifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No tienes notificaciones
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            {recentNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id_notificacion}
                className={`flex flex-col items-start p-3 cursor-pointer ${
                  !notification.leida ? 'bg-blue-50 hover:bg-blue-100' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex items-start space-x-2 flex-1">
                    <span className="text-lg">
                      {getNotificationIcon(notification.tipo)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">
                          {notification.titulo}
                        </p>
                        {!notification.leida && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.mensaje}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}
        
        {notifications.length > 10 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Button variant="ghost" className="w-full justify-center" asChild>
                <a href="/dashboard-tienda?tab=notificaciones">
                  Ver todas las notificaciones
                </a>
              </Button>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}