"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { api } from "./axios"
import { useAuth } from "@/contexts/auth-context"

export interface CartItem {
  id_carrito: number
  id_producto: number
  cantidad: number
  precio_unitario: number
  producto?: any
}

export interface TiendaGroup {
  id_tienda: number
  nombre_tienda: string
  logo?: string
  productos: CartItem[]
  subtotal: number
  metodosDisponibles: string[]
  planTienda?: 'basico' | 'pro' | 'enterprise'
  comisionPorcentaje?: number
}

interface CartStore {
  items: CartItem[]
  isLoading: boolean
  error: string | null
  addItem: (productId: number, cantidad?: number, precio?: number) => Promise<void>
  removeItem: (carritoId: number) => Promise<void>
  updateQuantity: (carritoId: number, cantidad: number) => Promise<void>
  clearCart: () => Promise<void>
  loadCart: () => Promise<void>
  getTotalItems: () => number
  getTotalPrice: () => number
  getCartProducts: () => CartItem[]
  getGroupedByStore: () => TiendaGroup[]
  getStoreSubtotal: (tiendaId: number) => number
  getAvailableDeliveryMethods: (tiendaId: number) => string[]
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      error: null,

      addItem: async (productId, cantidad = 1, precio = 0) => {
        console.log('addItem llamado con:', { productId, cantidad, precio })
        
        try {
          set({ isLoading: true, error: null })
          
          // Obtener el usuario actual
          const userResponse = await api.get('/auth/me')
          const userId = userResponse.data.data.id

          // Verificar si el producto ya está en el carrito
          const existingItem = get().items.find((item) => item.id_producto === productId)
          
          if (existingItem) {
            // Actualizar cantidad del producto existente
            await get().updateQuantity(existingItem.id_carrito, existingItem.cantidad + cantidad)
          } else {
            // Obtener información del producto si no se proporciona precio
            let precioUnitario = precio
            if (precio === 0) {
              const productoResponse = await api.get(`/v1/productos/${productId}`)
              precioUnitario = productoResponse.data.precio
            }

            const payload = {
              user_id: userId,
              id_producto: productId,
              cantidad,
              precio_unitario: precioUnitario
            }

            // Agregar nuevo producto al carrito
            const response = await api.post('/v1/carrito', payload)

            // Actualizar el estado local
            set((state) => ({
              items: [...state.items, response.data],
              isLoading: false
            }))
          }
        } catch (error: any) {
          console.error('Error adding item to cart:', error)
          console.error('Error response:', error.response?.data)
          set({ 
            error: error.response?.data?.message || 'Error al agregar producto al carrito',
            isLoading: false 
          })
          throw error
        }
      },

      removeItem: async (carritoId) => {
        try {
          set({ isLoading: true, error: null })
          
          await api.delete(`/v1/carrito/${carritoId}`)
          
          set((state) => ({
            items: state.items.filter((item) => item.id_carrito !== carritoId),
            isLoading: false
          }))
        } catch (error: any) {
          console.error('Error removing item from cart:', error)
          set({ 
            error: error.response?.data?.message || 'Error al eliminar producto del carrito',
            isLoading: false 
          })
        }
      },

      updateQuantity: async (carritoId, cantidad) => {
        try {
          set({ isLoading: true, error: null })
          
          if (cantidad <= 0) {
            await get().removeItem(carritoId)
            return
          }

          const response = await api.put(`/v1/carrito/${carritoId}`, { cantidad })
          
          set((state) => ({
            items: state.items.map((item) => 
              item.id_carrito === carritoId ? { ...item, cantidad } : item
            ),
            isLoading: false
          }))
        } catch (error: any) {
          console.error('Error updating cart quantity:', error)
          set({ 
            error: error.response?.data?.message || 'Error al actualizar cantidad',
            isLoading: false 
          })
        }
      },

      clearCart: async () => {
        try {
          set({ isLoading: true, error: null })
          
          const userResponse = await api.get('/auth/me')
          const userId = userResponse.data.data.id
          
          await api.delete(`/v1/carrito/usuario/${userId}/clear`)
          
          set({ items: [], isLoading: false })
        } catch (error: any) {
          console.error('Error clearing cart:', error)
          set({ 
            error: error.response?.data?.message || 'Error al limpiar carrito',
            isLoading: false 
          })
        }
      },

      loadCart: async () => {
        try {
          set({ isLoading: true, error: null })
          
          const userResponse = await api.get('/auth/me')
          const userId = userResponse.data.data.id
          
          const response = await api.get(`/v1/carrito/usuario/${userId}`)
          
          set({ 
            items: response.data || [],
            isLoading: false 
          })
        } catch (error: any) {
          console.error('Error loading cart:', error)
          set({ 
            error: error.response?.data?.message || 'Error al cargar carrito',
            isLoading: false,
            items: [] // Fallback a carrito vacío si hay error
          })
        }
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.cantidad, 0)
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          const precio = parseFloat(item.precio_unitario.toString())
          return total + (precio * item.cantidad)
        }, 0)
      },

      getCartProducts: () => {
        return get().items
      },

      // Nuevas funciones para agrupación por tienda
      getGroupedByStore: (): TiendaGroup[] => {
        const items = get().items
        if (!items.length) return []

        const grupos = items.reduce((acc, item) => {
          const tiendaId = item.producto?.tienda?.id_tienda || item.producto?.id_tienda || 0
          const tiendaNombre = item.producto?.tienda?.nombre_tienda || `Tienda ${tiendaId}`
          const tiendaLogo = item.producto?.tienda?.logo

          if (!acc[tiendaId]) {
            acc[tiendaId] = {
              id_tienda: tiendaId,
              nombre_tienda: tiendaNombre,
              logo: tiendaLogo,
              productos: [],
              subtotal: 0,
              metodosDisponibles: [],
              planTienda: 'basico', // Por defecto, se actualizará con datos de la API
              comisionPorcentaje: 5 // Por defecto para plan básico
            }
          }
          
          acc[tiendaId].productos.push(item)
          acc[tiendaId].subtotal += item.precio_unitario * item.cantidad
          
          return acc
        }, {} as Record<number, TiendaGroup>)

        // Determinar métodos disponibles por tienda basado en productos
        Object.values(grupos).forEach(grupo => {
          const metodosSet = new Set<string>()
          
          grupo.productos.forEach(item => {
            const tipoVenta = item.producto?.tipoVenta
            if (tipoVenta === 'delivery') {
              metodosSet.add('delivery')
              metodosSet.add('pickup') // Las tiendas con delivery generalmente también tienen pickup
            }
            if (tipoVenta === 'directa' || tipoVenta === 'pedido') {
              metodosSet.add('pickup')
            }
            // Todas las tiendas pueden tener envío estándar
            metodosSet.add('shipping')
          })
          
          grupo.metodosDisponibles = Array.from(metodosSet)
        })

        return Object.values(grupos)
      },

      getStoreSubtotal: (tiendaId: number): number => {
        const items = get().items
        return items
          .filter(item => {
            const itemTiendaId = item.producto?.tienda?.id_tienda || item.producto?.id_tienda || 0
            return itemTiendaId === tiendaId
          })
          .reduce((total, item) => total + (item.precio_unitario * item.cantidad), 0)
      },

      getAvailableDeliveryMethods: (tiendaId: number): string[] => {
        const items = get().items
        const tiendaItems = items.filter(item => {
          const itemTiendaId = item.producto?.tienda?.id_tienda || item.producto?.id_tienda || 0
          return itemTiendaId === tiendaId
        })

        const metodosSet = new Set<string>()
        
        tiendaItems.forEach(item => {
          const tipoVenta = item.producto?.tipoVenta
          if (tipoVenta === 'delivery') {
            metodosSet.add('delivery')
            metodosSet.add('pickup')
          }
          if (tipoVenta === 'directa' || tipoVenta === 'pedido') {
            metodosSet.add('pickup')
          }
          metodosSet.add('shipping')
        })

        return Array.from(metodosSet)
      },
    }),
    {
      name: "cart-storage",
      // Solo persistir items básicos, no el estado de loading/error
      partialize: (state) => ({ items: state.items }),
    },
  ),
)
