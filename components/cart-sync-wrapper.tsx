"use client"

import { useCartSync } from "@/hooks/use-cart-sync"

interface CartSyncWrapperProps {
  children: React.ReactNode
}

export function CartSyncWrapper({ children }: CartSyncWrapperProps) {
  useCartSync()
  return <>{children}</>
}