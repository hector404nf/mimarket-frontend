"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { productos } from "./data"

export interface CartItem {
  id: number
  cantidad: number
  precio: number
  tipoVenta: string
}

interface CartStore {
  items: CartItem[]
  addItem: (productId: number, cantidad?: number) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, cantidad: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
  getCartProducts: () => Array<CartItem & { producto: any }>
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (productId, cantidad = 1) => {
        const producto = productos.find((p) => p.id === productId)
        if (!producto) return

        set((state) => {
          const existingItem = state.items.find((item) => item.id === productId)

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.id === productId ? { ...item, cantidad: item.cantidad + cantidad } : item,
              ),
            }
          } else {
            return {
              items: [
                ...state.items,
                {
                  id: productId,
                  cantidad,
                  precio: producto.precio,
                  tipoVenta: producto.tipoVenta,
                },
              ],
            }
          }
        })
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId),
        }))
      },

      updateQuantity: (productId, cantidad) => {
        if (cantidad <= 0) {
          get().removeItem(productId)
          return
        }

        set((state) => ({
          items: state.items.map((item) => (item.id === productId ? { ...item, cantidad } : item)),
        }))
      },

      clearCart: () => {
        set({ items: [] })
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.cantidad, 0)
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          const producto = productos.find((p) => p.id === item.id)
          if (!producto) return total

          const precioFinal =
            producto.descuento > 0 ? producto.precio * (1 - producto.descuento / 100) : producto.precio

          return total + precioFinal * item.cantidad
        }, 0)
      },

      getCartProducts: () => {
        return get()
          .items.map((item) => {
            const producto = productos.find((p) => p.id === item.id)
            return { ...item, producto }
          })
          .filter((item) => item.producto)
      },
    }),
    {
      name: "cart-storage",
    },
  ),
)
