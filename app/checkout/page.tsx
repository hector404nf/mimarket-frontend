"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import dynamic from "next/dynamic"
import { ArrowLeft, CreditCard, Truck, MapPin, User, Package } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/lib/cart-store"
import { toast } from "@/components/ui/use-toast"
import { getDeliveryPriceForLocation } from "@/lib/delivery-zone-detector"
import { formatearPrecioParaguayo } from "@/lib/utils"

// Importar el mapa dinámicamente para evitar problemas de SSR
const MapSelector = dynamic(() => import("@/components/map-selector"), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-muted rounded-lg animate-pulse flex items-center justify-center">
      <p className="text-muted-foreground">Cargando mapa...</p>
    </div>
  ),
})

interface Address {
  street: string
  number: string
  city: string
  postalCode: string
  notes: string
  coordinates?: [number, number]
}

interface OrderData {
  customerInfo: {
    name: string
    email: string
    phone: string
  }
  paymentMethod: string
  deliveryMethod: string
  address?: Address
  total: number
  items: any[]
}

export default function CheckoutPage() {
  const router = useRouter()
  const { getCartProducts, getTotalPrice, clearCart } = useCart()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState(1)

  const cartProducts = getCartProducts()
  const total = getTotalPrice()

  // Estados del formulario
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
  })

  const [paymentMethod, setPaymentMethod] = useState("")
  const [deliveryMethod, setDeliveryMethod] = useState("")
  const [address, setAddress] = useState<Address>({
    street: "",
    number: "",
    city: "",
    postalCode: "",
    notes: "",
    coordinates: undefined,
  })

  const [detectedDeliveryPrice, setDetectedDeliveryPrice] = useState<{
    price: number
    zoneName: string
    estimatedTime: string
  } | null>(null)

  // Verificar si hay productos de delivery
  const hasDeliveryItems = cartProducts.some((item) => item.producto?.tipoVenta === "delivery")
  const hasDirectItems = cartProducts.some((item) => item.producto?.tipoVenta === "directa")
  const hasPedidoItems = cartProducts.some((item) => item.producto?.tipoVenta === "pedido")

  useEffect(() => {
    if (cartProducts.length === 0) {
      router.push("/carrito")
    }
  }, [cartProducts, router])

  const handleSubmitOrder = async () => {
    setIsSubmitting(true)

    try {
      // Simular procesamiento del pedido
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const orderData: OrderData = {
        customerInfo,
        paymentMethod,
        deliveryMethod,
        address: hasDeliveryItems ? address : undefined,
        total,
        items: cartProducts,
      }

      // Simular guardado del pedido
      const orderId = `ORD-${Date.now()}`
      localStorage.setItem(`order-${orderId}`, JSON.stringify(orderData))

      clearCart()

      toast({
        title: "¡Pedido realizado con éxito!",
        description: `Tu pedido ${orderId} ha sido procesado.`,
      })

      router.push(`/pedidos/${orderId}`)
    } catch (error) {
      toast({
        title: "Error al procesar el pedido",
        description: "Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isStepValid = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return customerInfo.name && customerInfo.email && customerInfo.phone
      case 2:
        return paymentMethod
      case 3:
        if ((hasDeliveryItems && deliveryMethod === "delivery") || deliveryMethod === "shipping") {
          return deliveryMethod && address.street && address.number && address.city && address.coordinates
        }
        return deliveryMethod
      default:
        return false
    }
  }

  const handleLocationSelect = (coordinates: [number, number]) => {
    setAddress((prev) => ({ ...prev, coordinates }))

    // Detectar zona de delivery
    if (hasDeliveryItems && deliveryMethod === "delivery") {
      const deliveryInfo = getDeliveryPriceForLocation(coordinates, "current_store")
      setDetectedDeliveryPrice(deliveryInfo)

      if (deliveryInfo) {
        toast({
          title: "Zona de delivery detectada",
          description: `${deliveryInfo.zoneName} - ${formatearPrecioParaguayo(deliveryInfo.price)}`,
        })
      } else {
        toast({
          title: "Zona no disponible",
          description: "Esta ubicación no está en nuestras zonas de delivery",
          variant: "destructive",
        })
      }
    }
  }

  if (cartProducts.length === 0) {
    return null
  }

  const deliveryPrice = detectedDeliveryPrice?.price || (deliveryMethod === "delivery" ? 3.99 : 0)

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full">
        <div className="px-4 md:px-6 py-6 md:py-10">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al carrito
            </Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h1 className="text-2xl font-bold mb-6">Finalizar pedido</h1>

              <Tabs value={step.toString()} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="1" disabled={step < 1}>
                    <User className="h-4 w-4 mr-2" />
                    Información
                  </TabsTrigger>
                  <TabsTrigger value="2" disabled={step < 2}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pago
                  </TabsTrigger>
                  <TabsTrigger value="3" disabled={step < 3}>
                    <Truck className="h-4 w-4 mr-2" />
                    Entrega
                  </TabsTrigger>
                </TabsList>

                {/* Paso 1: Información del cliente */}
                <TabsContent value="1" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Información de contacto</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Nombre completo</Label>
                          <Input
                            id="name"
                            value={customerInfo.name}
                            onChange={(e) => setCustomerInfo((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="Juan Pérez"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Teléfono</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={customerInfo.phone}
                            onChange={(e) => setCustomerInfo((prev) => ({ ...prev, phone: e.target.value }))}
                            placeholder="+34 612 345 678"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="email">Correo electrónico</Label>
                        <Input
                          id="email"
                          type="email"
                          value={customerInfo.email}
                          onChange={(e) => setCustomerInfo((prev) => ({ ...prev, email: e.target.value }))}
                          placeholder="juan@ejemplo.com"
                        />
                      </div>

                      <Button onClick={() => setStep(2)} disabled={!isStepValid(1)} className="w-full">
                        Continuar
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Paso 2: Método de pago */}
                <TabsContent value="2" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Método de pago</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2 p-4 border rounded-lg">
                            <RadioGroupItem value="card" id="card" />
                            <Label htmlFor="card" className="flex items-center gap-2 flex-1 cursor-pointer">
                              <CreditCard className="h-4 w-4" />
                              Tarjeta de crédito/débito
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2 p-4 border rounded-lg">
                            <RadioGroupItem value="paypal" id="paypal" />
                            <Label htmlFor="paypal" className="flex items-center gap-2 flex-1 cursor-pointer">
                              <div className="h-4 w-4 bg-blue-600 rounded-sm" />
                              PayPal
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2 p-4 border rounded-lg">
                            <RadioGroupItem value="transfer" id="transfer" />
                            <Label htmlFor="transfer" className="flex items-center gap-2 flex-1 cursor-pointer">
                              <div className="h-4 w-4 bg-green-600 rounded-sm" />
                              Transferencia bancaria
                            </Label>
                          </div>

                          {hasDeliveryItems && (
                            <div className="flex items-center space-x-2 p-4 border rounded-lg">
                              <RadioGroupItem value="cash" id="cash" />
                              <Label htmlFor="cash" className="flex items-center gap-2 flex-1 cursor-pointer">
                                <div className="h-4 w-4 bg-orange-600 rounded-sm" />
                                Efectivo al recibir
                              </Label>
                            </div>
                          )}
                        </div>
                      </RadioGroup>

                      <div className="flex gap-4 mt-6">
                        <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                          Anterior
                        </Button>
                        <Button onClick={() => setStep(3)} disabled={!isStepValid(2)} className="flex-1">
                          Continuar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Paso 3: Entrega */}
                <TabsContent value="3" className="mt-6">
                  <div className="space-y-6">
                    {/* Método de entrega */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Método de entrega</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod}>
                          <div className="space-y-4">
                            {hasDeliveryItems && (
                              <>
                                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                                  <RadioGroupItem value="delivery" id="delivery" />
                                  <Label htmlFor="delivery" className="flex items-center gap-2 flex-1 cursor-pointer">
                                    <Truck className="h-4 w-4" />
                                    <div>
                                      <p className="font-medium">Delivery a domicilio</p>
                                      <p className="text-sm text-muted-foreground">Entrega en tu dirección</p>
                                    </div>
                                  </Label>
                                </div>

                                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                                  <RadioGroupItem value="pickup" id="pickup" />
                                  <Label htmlFor="pickup" className="flex items-center gap-2 flex-1 cursor-pointer">
                                    <Package className="h-4 w-4" />
                                    <div>
                                      <p className="font-medium">Retiro en local</p>
                                      <p className="text-sm text-muted-foreground">Recoger en la tienda</p>
                                    </div>
                                  </Label>
                                </div>
                              </>
                            )}

                            {(hasDirectItems || hasPedidoItems) && (
                              <div className="flex items-center space-x-2 p-4 border rounded-lg">
                                <RadioGroupItem value="shipping" id="shipping" />
                                <Label htmlFor="shipping" className="flex items-center gap-2 flex-1 cursor-pointer">
                                  <Truck className="h-4 w-4" />
                                  <div>
                                    <p className="font-medium">Envío a domicilio</p>
                                    <p className="text-sm text-muted-foreground">Envío estándar (3-5 días)</p>
                                  </div>
                                </Label>
                              </div>
                            )}
                          </div>
                        </RadioGroup>
                      </CardContent>
                    </Card>

                    {/* Dirección (solo si es delivery o shipping) */}
                    {(deliveryMethod === "delivery" || deliveryMethod === "shipping") && (
                      <Card>
                        <CardHeader>
                          <CardTitle>
                            <MapPin className="h-5 w-5 mr-2 inline" />
                            Dirección de entrega
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="street">Calle</Label>
                              <Input
                                id="street"
                                value={address.street}
                                onChange={(e) => setAddress((prev) => ({ ...prev, street: e.target.value }))}
                                placeholder="Calle Principal"
                              />
                            </div>
                            <div>
                              <Label htmlFor="number">Número</Label>
                              <Input
                                id="number"
                                value={address.number}
                                onChange={(e) => setAddress((prev) => ({ ...prev, number: e.target.value }))}
                                placeholder="123"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="city">Ciudad</Label>
                              <Input
                                id="city"
                                value={address.city}
                                onChange={(e) => setAddress((prev) => ({ ...prev, city: e.target.value }))}
                                placeholder="Asunción"
                              />
                            </div>
                            <div>
                              <Label htmlFor="postal">Código postal</Label>
                              <Input
                                id="postal"
                                value={address.postalCode}
                                onChange={(e) => setAddress((prev) => ({ ...prev, postalCode: e.target.value }))}
                                placeholder="28001"
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="notes">Notas adicionales (opcional)</Label>
                            <Textarea
                              id="notes"
                              value={address.notes}
                              onChange={(e) => setAddress((prev) => ({ ...prev, notes: e.target.value }))}
                              placeholder="Piso 2, puerta B. Tocar el timbre..."
                              className="resize-none"
                            />
                          </div>

                          {(deliveryMethod === "delivery" || deliveryMethod === "shipping") && (
                            <div>
                              <Label>Ubicación en el mapa</Label>
                              <p className="text-sm text-muted-foreground mb-2">
                                Selecciona tu ubicación exacta para una{" "}
                                {deliveryMethod === "delivery" ? "entrega" : "envío"} más preciso
                              </p>
                              <MapSelector
                                onLocationSelect={handleLocationSelect}
                                initialLocation={address.coordinates}
                              />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    <div className="flex gap-4">
                      <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                        Anterior
                      </Button>
                      <Button onClick={handleSubmitOrder} disabled={!isStepValid(3) || isSubmitting} className="flex-1">
                        {isSubmitting ? "Procesando..." : "Confirmar pedido"}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Resumen del pedido */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Resumen del pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {cartProducts.map((item) => {
                      const { producto } = item
                      if (!producto) return null

                      const precioFinal =
                        producto.descuento > 0 ? producto.precio * (1 - producto.descuento / 100) : producto.precio

                      const getTipoVentaInfo = (tipoVenta: string) => {
                        switch (tipoVenta) {
                          case "directa":
                            return { label: "Directa", color: "bg-green-100 text-green-800" }
                          case "pedido":
                            return { label: "Pedido", color: "bg-orange-100 text-orange-800" }
                          case "delivery":
                            return { label: "Delivery", color: "bg-blue-100 text-blue-800" }
                          default:
                            return { label: "Disponible", color: "bg-gray-100 text-gray-800" }
                        }
                      }

                      const tipoInfo = getTipoVentaInfo(producto.tipoVenta)

                      return (
                        <div key={item.id} className="flex gap-3">
                          <div className="relative h-12 w-12 flex-shrink-0">
                            <Image
                              src={producto.imagen || "/placeholder.svg"}
                              alt={producto.nombre}
                              fill
                              className="object-cover rounded"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{producto.nombre}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className={`text-xs ${tipoInfo.color}`}>
                                {tipoInfo.label}
                              </Badge>
                              <span className="text-sm text-muted-foreground">× {item.cantidad}</span>
                            </div>
                            <p className="text-sm font-medium">{formatearPrecioParaguayo(precioFinal * item.cantidad)}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{formatearPrecioParaguayo(total)}</span>
                    </div>

                    {deliveryMethod === "delivery" && detectedDeliveryPrice && (
                      <div className="flex justify-between text-sm">
                        <span>Delivery ({detectedDeliveryPrice.zoneName})</span>
                        <span>{formatearPrecioParaguayo(detectedDeliveryPrice.price)}</span>
                      </div>
                    )}

                    {deliveryMethod === "shipping" && (
                      <div className="flex justify-between text-sm">
                        <span>Envío</span>
                        <span>{formatearPrecioParaguayo(deliveryPrice)}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>{formatearPrecioParaguayo(total + deliveryPrice + (deliveryMethod === "shipping" ? 44200 : 0))}</span>
                    </div>
                  </div>
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
