"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/lib/cart-store"
import { formatearPrecioParaguayo } from "@/lib/utils"

export default function CarritoPage() {
  const { items, updateQuantity, removeItem, getTotalPrice, getCartProducts, clearCart } = useCart()
  const [isClearing, setIsClearing] = useState(false)

  const cartProducts = getCartProducts()
  const total = getTotalPrice()

  const handleClearCart = async () => {
    setIsClearing(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    clearCart()
    setIsClearing(false)
  }

  const getTipoVentaInfo = (tipoVenta: string) => {
    switch (tipoVenta) {
      case "directa":
        return { label: "Compra directa", color: "bg-green-100 text-green-800" }
      case "pedido":
        return { label: "Por pedido", color: "bg-orange-100 text-orange-800" }
      case "delivery":
        return { label: "Delivery", color: "bg-blue-100 text-blue-800" }
      default:
        return { label: "Disponible", color: "bg-gray-100 text-gray-800" }
    }
  }

  if (cartProducts.length === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto w-full">
          <div className="px-4 md:px-6 py-6 md:py-10">
            <div className="text-center py-12">
              <ShoppingBag className="mx-auto h-24 w-24 text-muted-foreground mb-4" />
              <h1 className="text-2xl font-bold mb-2">Tu carrito está vacío</h1>
              <p className="text-muted-foreground mb-6">
                Añade algunos productos a tu carrito para continuar con la compra.
              </p>
              <Button asChild>
                <Link href="/">Continuar comprando</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full">
        <div className="px-4 md:px-6 py-6 md:py-10">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Continuar comprando
            </Link>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Carrito de compras ({cartProducts.length} productos)</h1>
                <Button variant="outline" onClick={handleClearCart} disabled={isClearing}>
                  {isClearing ? "Limpiando..." : "Limpiar carrito"}
                </Button>
              </div>

              <div className="space-y-4">
                {cartProducts.map((item) => {
                  const { producto } = item
                  if (!producto) return null

                  const tipoInfo = getTipoVentaInfo(producto.tipoVenta)
                  const precioFinal =
                    producto.descuento > 0 ? producto.precio * (1 - producto.descuento / 100) : producto.precio

                  return (
                    <Card key={item.id}>
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div className="relative h-20 w-20 flex-shrink-0">
                            <Image
                              src={producto.imagen || "/placeholder.svg"}
                              alt={producto.nombre}
                              fill
                              className="object-cover rounded-md"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <Link
                                  href={`/productos/${producto.id}`}
                                  className="font-medium hover:text-primary line-clamp-2"
                                >
                                  {producto.nombre}
                                </Link>
                                <Badge variant="secondary" className={`mt-1 ${tipoInfo.color}`}>
                                  {tipoInfo.label}
                                </Badge>
                              </div>

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeItem(item.id)}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center gap-3">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="font-medium min-w-[3ch] text-center">{item.cantidad}</span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>

                              <div className="text-right">
                                {producto.descuento > 0 && (
                                  <p className="text-sm text-muted-foreground line-through">
                                    {formatearPrecioParaguayo(producto.precio * item.cantidad)}
                                  </p>
                                )}
                                <p className="font-semibold">{formatearPrecioParaguayo(precioFinal * item.cantidad)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Resumen del pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {cartProducts.map((item) => {
                      const { producto } = item
                      if (!producto) return null

                      const precioFinal =
                        producto.descuento > 0 ? producto.precio * (1 - producto.descuento / 100) : producto.precio

                      return (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="truncate mr-2">
                            {producto.nombre} × {item.cantidad}
                          </span>
                          <span>{formatearPrecioParaguayo(precioFinal * item.cantidad)}</span>
                        </div>
                      )
                    })}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Subtotal</span>
                      <span className="text-sm">{formatearPrecioParaguayo(total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Envío</span>
                      <span className="text-sm">Calculado en checkout</span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>{formatearPrecioParaguayo(total)}</span>
                    </div>
                  </div>

                  <Button asChild className="w-full" size="lg">
                    <Link href="/checkout">Proceder al pago</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
