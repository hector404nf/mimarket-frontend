"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useStoreAccess } from '@/hooks/use-profile-type'
import { api } from '@/lib/axios'

export interface Notification {
  id_notificacion: number
  user_id: number
  tipo: string
  titulo: string
  mensaje: string
  data?: any
  leida: boolean
  fecha_leida?: string
  url_accion?: string
  created_at: string
  updated_at: string
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { storeInfo } = useStoreAccess()

  // Obtener notificaciones
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      
      // Si es dueño de tienda, usar el endpoint de tienda
      const endpoint = storeInfo?.id_tienda 
        ? `/v1/notificaciones/tienda/${storeInfo.id_tienda}`
        : `/v1/notificaciones/usuario/${user.id}`

      const response = await api.get<any>(endpoint)
      const data = Array.isArray(response.data) ? response.data : (response.data?.data || [])
      setNotifications(data)

      // Contar no leídas
      const unread = data.filter((n: Notification) => !n.leida).length
      setUnreadCount(unread)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id, storeInfo?.id_tienda])

  // Obtener notificaciones y devolver opcionalmente solo no leídas
  const getNotifications = useCallback(async (onlyUnread?: boolean): Promise<Notification[]> => {
    if (!user?.id) return []

    try {
      // Endpoint según contexto (tienda o usuario)
      const endpoint = storeInfo?.id_tienda 
        ? `/v1/notificaciones/tienda/${storeInfo.id_tienda}`
        : `/v1/notificaciones/usuario/${user.id}`

      const response = await api.get<any>(endpoint)
      const data = Array.isArray(response.data) ? response.data : (response.data?.data || [])
      const result = onlyUnread ? data.filter((n: Notification) => !n.leida) : data
      return result
    } catch (error) {
      console.error('Error fetching notifications:', error)
      return []
    }
  }, [user?.id, storeInfo?.id_tienda])

  // Obtener solo el conteo de no leídas
  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) return

    try {
      const response = await api.get<any>(`/v1/notificaciones/usuario/${user.id}/unread-count`)
      const count = response.data?.unread_count ?? response.data?.data?.unread_count ?? 0
      setUnreadCount(count)
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }, [user?.id])

  // Marcar notificación como leída
  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await api.patch(`/v1/notificaciones/${notificationId}/read`)
      // Actualizar el estado local
      setNotifications(prev => 
        prev.map(n => 
          n.id_notificacion === notificationId 
            ? { ...n, leida: true, fecha_leida: new Date().toISOString() }
            : n
        )
      )
      
      // Decrementar contador
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }, [])

  // Marcar todas como leídas
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return

    try {
      await api.patch(`/v1/notificaciones/usuario/${user.id}/read-all`)
      // Actualizar el estado local
      setNotifications(prev => 
        prev.map(n => ({ ...n, leida: true, fecha_leida: new Date().toISOString() }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }, [user?.id])

  // Obtener notificaciones no leídas
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(n => !n.leida)
  }, [notifications])

  // Efecto para cargar notificaciones iniciales
  useEffect(() => {
    if (user?.id) {
      fetchNotifications()
    }
  }, [fetchNotifications, user?.id])

  // Polling para actualizar notificaciones cada 30 segundos
  useEffect(() => {
    if (!user?.id) return

    const interval = setInterval(() => {
      fetchUnreadCount()
    }, 30000) // 30 segundos

    return () => clearInterval(interval)
  }, [fetchUnreadCount, user?.id])

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    getNotifications,
    getUnreadCount: fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    getUnreadNotifications,
  }
}