"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, ShoppingCart, User, Menu, X, Store, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import SmartSearch from "@/components/smart-search"
import { useCart } from "@/lib/cart-store"
import { useProfileType, useStoreAccess } from "@/hooks/use-profile-type"
import { useAuth } from "@/contexts/auth-context"
import NotificationsDropdown from "@/components/notifications-dropdown"

export default function Navbar() {
  const pathname = usePathname()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { isAuthenticated, user } = useAuth()
  const { isStoreOwner, isPersonalUser, needsOnboarding } = useProfileType()
  const { canAccessStoreDashboard } = useStoreAccess()

  // Elementos de navegación base
  const baseNavItems = [
    { name: "Inicio", href: "/" },
    { name: "Tiendas", href: "/tiendas" },
    { name: "Electrónica", href: "/?categoria=electronica" },
    { name: "Ropa", href: "/?categoria=ropa" },
    { name: "Hogar", href: "/?categoria=hogar" },
    { name: "Deportes", href: "/?categoria=deportes" },
    { name: "Belleza", href: "/?categoria=belleza" },
  ]

  // Elementos condicionales basados en el estado del usuario
  const conditionalNavItems = []
  
  if (!isAuthenticated) {
    conditionalNavItems.push({ name: "Iniciar Sesión", href: "/login" })
  } else {
    if (needsOnboarding) {
      conditionalNavItems.push({ name: "Configurar Perfil", href: "/onboarding" })
    } else if (user?.tipo_usuario === 'administrador') {
      conditionalNavItems.push({ name: "Dashboard Admin", href: "/admin-dashboard" })
    } else if (isStoreOwner && canAccessStoreDashboard) {
      conditionalNavItems.push({ name: "Mi Tienda", href: "/dashboard-tienda" })
      conditionalNavItems.push({ name: "Productos", href: "/subir-producto" })
    }
  }

  const navItems = [...baseNavItems, ...conditionalNavItems]
  // Evitar hydration mismatch: obtener datos del carrito solo en cliente
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const { getTotalItems } = useCart()
  const totalItems = mounted ? getTotalItems() : 0

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex gap-6 md:gap-10 items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">MiMarket</span>
          </Link>

          <nav className="hidden md:flex gap-6">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-foreground/80 ${
                  pathname === item.href ? "text-foreground" : "text-foreground/60"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {isSearchOpen ? (
            <div className="relative w-full max-w-sm">
              <SmartSearch variant="navbar" />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => setIsSearchOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)}>
              <Search className="h-5 w-5" />
              <span className="sr-only">Buscar</span>
            </Button>
          )}

          <Button variant="ghost" size="icon" asChild>
            <Link href="/carrito" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {/* Texto accesible como primer nodo para evitar mismatch */}
              <span className="sr-only">Carrito</span>
              {/* Renderizar siempre el badge, ocultándolo cuando el conteo sea 0 */}
              <Badge
                className={`absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-[10px] transition-opacity ${totalItems > 0 ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                aria-hidden="true"
              >
                <span suppressHydrationWarning>{totalItems}</span>
              </Badge>
            </Link>
          </Button>

          {/* Componente de notificaciones - solo para usuarios autenticados */}
          {isAuthenticated && <NotificationsDropdown />}

          <Button variant="ghost" size="icon" asChild>
            <Link href={isStoreOwner ? "/dashboard-tienda" : "/perfil"}>
              {isStoreOwner ? <Store className="h-5 w-5" /> : <User className="h-5 w-5" />}
              <span className="sr-only">{isStoreOwner ? "Mi Tienda" : "Perfil"}</span>
            </Link>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <Link href="/" className="flex items-center space-x-2 mb-8">
                <span className="text-xl font-bold">MiMarket</span>
              </Link>
              <nav className="grid gap-4">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`text-sm font-medium transition-colors hover:text-foreground/80 ${
                      pathname === item.href ? "text-foreground" : "text-foreground/60"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
