"use client"

import { useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useCart } from '@/lib/cart-store'

export function useCartSync() {
  const { user, isAuthenticated } = useAuth()
  const { loadCart, items } = useCart()

  useEffect(() => {
    if (isAuthenticated && user) {
      // Cargar el carrito del usuario cuando se autentique
      loadCart()
    }
  }, [isAuthenticated, user, loadCart])

  return {
    isCartLoaded: isAuthenticated ? items.length >= 0 : true
  }
}