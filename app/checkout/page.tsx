"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import dynamic from "next/dynamic"
import { ArrowLeft, CreditCard, Truck, MapPin, User, Package, Store, CheckCircle } from "lucide-react"
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
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/lib/cart-store"
import { useCheckout } from "@/lib/use-checkout"
import { toast } from "@/components/ui/use-toast"
import { getDeliveryPriceForLocation } from "@/lib/delivery-zone-detector"
import { formatearPrecioParaguayo } from "@/lib/utils"
import PremiumServices from "@/components/premium-services"

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

interface StoreDeliveryMethod {
  tiendaId: number
  metodo: string
  costoEnvio?: number
}

interface OrderData {
  customerInfo: {
    name: string
    email: string
    phone: string
  }
  paymentMethod: string
  storeDeliveryMethods: StoreDeliveryMethod[]
  address?: Address
  total: number
  items: any[]
  premiumServices?: string[]
}

export default function CheckoutPage() {
  const router = useRouter()
  const { getCartProducts, getTotalPrice, clearCart, getGroupedByStore } = useCart()
  const { processCheckout, calculateTotals, totals, isLoading } = useCheckout()
  const [step, setStep] = useState(1)
  const [codigoCupon, setCodigoCupon] = useState("")
  const [isMounted, setIsMounted] = useState(false)

  // Estados del formulario
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
  })

  const [paymentMethod, setPaymentMethod] = useState("")
  const [storeDeliveryMethods, setStoreDeliveryMethods] = useState<StoreDeliveryMethod[]>([])
  const [deliveryMethod, setDeliveryMethod] = useState("")
  const [selectedPremiumServices, setSelectedPremiumServices] = useState<string[]>([])
  
  // Estados para datos de tarjeta
  const [cardData, setCardData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
  })

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

  // Evitar problemas de hidratación
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const cartProducts = isMounted ? getCartProducts() : []
  const total = isMounted ? getTotalPrice() : 0

  // Agrupar productos por tienda usando el store del carrito
  const gruposPorTienda = useMemo(() => {
    if (!isMounted) return []
    return getGroupedByStore()
  }, [isMounted, getGroupedByStore])

  // Inicializar métodos de entrega por tienda
  useEffect(() => {
    if (gruposPorTienda.length > 0 && storeDeliveryMethods.length === 0) {
      const initialMethods = gruposPorTienda.map(grupo => ({
        tiendaId: grupo.id_tienda,
        metodo: grupo.metodosDisponibles.includes('pickup') ? 'pickup' : grupo.metodosDisponibles[0] || 'pickup',
        costoEnvio: 0
      }))
      setStoreDeliveryMethods(initialMethods)
    }
  }, [gruposPorTienda, storeDeliveryMethods.length])

  // Función para actualizar método de entrega de una tienda específica
  const updateStoreDeliveryMethod = (tiendaId: number, metodo: string) => {
    setStoreDeliveryMethods(prev => 
      prev.map(item => 
        item.tiendaId === tiendaId 
          ? { ...item, metodo, costoEnvio: metodo === 'delivery' ? 15000 : metodo === 'shipping' ? 25000 : 0 }
          : item
      )
    )
  }

  // Verificar si se necesita dirección (al menos una tienda usa delivery o shipping)
  const needsAddress = storeDeliveryMethods.some(method => 
    method.metodo === 'delivery' || method.metodo === 'shipping'
  )

  // Calcular costo total de envío
  const totalShippingCost = storeDeliveryMethods.reduce((total, method) => 
    total + (method.costoEnvio || 0), 0
  )

  // Verificar si hay productos de delivery (basado en tipoVenta del producto)
  const hasDeliveryItems = cartProducts.some((item) => item.producto?.tipoVenta === "delivery")
  const hasDirectItems = cartProducts.some((item) => item.producto?.tipoVenta === "directa")
  const hasPedidoItems = cartProducts.some((item) => item.producto?.tipoVenta === "pedido")

  // Verificar métodos disponibles por tienda (nueva lógica)
  const metodosGlobalesDisponibles = useMemo(() => {
    const metodos = new Set<string>()
    
    // Por ahora, usar la lógica existente basada en tipoVenta
    // TODO: Reemplazar con consulta a API de capacidades de tienda
    if (hasDeliveryItems) {
      metodos.add("delivery")
      metodos.add("pickup") // Las tiendas con delivery generalmente también tienen pickup
    }
    if (hasDirectItems || hasPedidoItems) {
      metodos.add("pickup")
    }
    
    return Array.from(metodos)
  }, [hasDeliveryItems, hasDirectItems, hasPedidoItems])

  useEffect(() => {
    if (isMounted && cartProducts.length === 0) {
      router.push("/carrito")
    } else if (isMounted) {
      // Calcular totales al cargar la página
      calculateTotals()
    }
  }, [cartProducts, router, isMounted])

  // Función para aplicar cupón
  const handleApplyCoupon = async () => {
    if (codigoCupon.trim()) {
      await calculateTotals(codigoCupon.trim())
    }
  }

  // Función para manejar servicios premium
  const handlePremiumServiceToggle = (serviceId: string, price: number) => {
    setSelectedPremiumServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId)
      } else {
        return [...prev, serviceId]
      }
    })
  }

  // Calcular precio total de servicios premium
  const premiumServicesTotal = useMemo(() => {
    const PREMIUM_SERVICES_PRICES: Record<string, number> = {
      'extended-warranty': 25000,
      'express-delivery': 35000,
      'premium-packaging': 15000,
      'white-glove-delivery': 50000,
      'damage-protection': 20000
    }
    
    return selectedPremiumServices.reduce((total, serviceId) => {
      return total + (PREMIUM_SERVICES_PRICES[serviceId] || 0)
    }, 0)
  }, [selectedPremiumServices])

  const handleSubmitOrder = async () => {
    if (!isStepValid(3)) return

    try {
      // Mapear método de pago al formato del backend
      const metodoPago =
        paymentMethod === "card"
          ? "tarjeta"
          : paymentMethod === "cash"
          ? "efectivo"
          : paymentMethod === "transfer"
          ? "transferencia"
          : paymentMethod || "efectivo"

      // Serializar dirección si es requerida
      const direccionEnvio = needsAddress && address
        ? `${address.street} ${address.number}, ${address.city}${address.postalCode ? ` (${address.postalCode})` : ""}${address.coordinates ? ` [${address.coordinates[0]}, ${address.coordinates[1]}]` : ""}`
        : undefined

      // Enviar notas y código de cupón desde la UI
      const notas = address?.notes || ""
      const codigoCuponValor = codigoCupon || ""

      // Extraer coordenadas para enviar al backend
      const latitud = address?.coordinates?.[0]
      const longitud = address?.coordinates?.[1]

      // Construir payload compatible con el backend
      const checkoutData = {
        metodo_pago: metodoPago,
        direccion_envio: direccionEnvio,
        notas,
        codigo_cupon: codigoCuponValor,
        latitud,
        longitud,
      }

      const result = await processCheckout(checkoutData)

      if (result) {
        toast({
          title: "Pedido confirmado",
          description: "Tu pedido ha sido procesado exitosamente",
        })
        clearCart()
        router.push(`/pedidos/${result.orden.id_orden}`)
      } else {
        toast({
          title: "Error",
          description: "Error al procesar el pedido",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al procesar el pedido",
        variant: "destructive",
      })
    }
  }

  const isStepValid = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return customerInfo.name && customerInfo.email && customerInfo.phone
      case 2:
        if (paymentMethod === "card") {
          return paymentMethod && cardData.cardNumber && cardData.expiryDate && cardData.cvv && cardData.cardholderName
        }
        return paymentMethod
      case 3:
        const allStoresHaveMethod = storeDeliveryMethods.length === gruposPorTienda.length &&
          storeDeliveryMethods.every(method => method.metodo !== "")
        
        if (!allStoresHaveMethod) return false
        
        if (needsAddress) {
          return address.street && address.number && address.city && address.coordinates
        }
        return true
      default:
        return false
    }
  }

  const handleLocationSelect = (coordinates: [number, number]) => {
    setAddress((prev) => ({ ...prev, coordinates }))

    // Detectar zona de delivery
    if (needsAddress && storeDeliveryMethods.some(method => method.metodo === "delivery")) {
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

  if (!isMounted) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto w-full">
          <div className="px-4 md:px-6 py-6 md:py-10">
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Cargando...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
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

                      {/* Campos de tarjeta - solo se muestran si se selecciona tarjeta */}
                      {paymentMethod === "card" && (
                        <div className="mt-6 p-4 border rounded-lg bg-muted/50">
                          <h4 className="font-medium mb-4">Datos de la tarjeta</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                              <Label htmlFor="cardNumber">Número de tarjeta</Label>
                              <Input
                                id="cardNumber"
                                type="text"
                                value={cardData.cardNumber}
                                onChange={(e) => setCardData((prev) => ({ ...prev, cardNumber: e.target.value }))}
                                placeholder="1234 5678 9012 3456"
                                maxLength={19}
                              />
                            </div>
                            <div>
                              <Label htmlFor="expiryDate">Fecha de vencimiento</Label>
                              <Input
                                id="expiryDate"
                                type="text"
                                value={cardData.expiryDate}
                                onChange={(e) => setCardData((prev) => ({ ...prev, expiryDate: e.target.value }))}
                                placeholder="MM/AA"
                                maxLength={5}
                              />
                            </div>
                            <div>
                              <Label htmlFor="cvv">CVV</Label>
                              <Input
                                id="cvv"
                                type="text"
                                value={cardData.cvv}
                                onChange={(e) => setCardData((prev) => ({ ...prev, cvv: e.target.value }))}
                                placeholder="123"
                                maxLength={4}
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Label htmlFor="cardholderName">Nombre del titular</Label>
                              <Input
                                id="cardholderName"
                                type="text"
                                value={cardData.cardholderName}
                                onChange={(e) => setCardData((prev) => ({ ...prev, cardholderName: e.target.value }))}
                                placeholder="Juan Pérez"
                              />
                            </div>
                          </div>
                        </div>
                      )}

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
                    {/* Métodos de entrega por tienda */}
                    <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Métodos de entrega por tienda</h3>
                  {isMounted ? (
                    gruposPorTienda.map((grupo) => {
                      const storeMethod = storeDeliveryMethods.find(method => method.tiendaId === grupo.id_tienda)
                      const currentMethod = storeMethod?.metodo || ''
                      
                      return (
                        <Card key={grupo.id_tienda}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                              {grupo.logo ? (
                                <div className="relative h-10 w-10 flex-shrink-0">
                                  <Image
                                    src={grupo.logo}
                                    alt={grupo.nombre_tienda}
                                    fill
                                    className="object-cover rounded-full"
                                  />
                                </div>
                              ) : (
                                <Store className="h-10 w-10 text-muted-foreground" />
                              )}
                              <div className="flex-1">
                                <CardTitle className="text-base">{grupo.nombre_tienda}</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                  {grupo.productos.length} producto{grupo.productos.length !== 1 ? 's' : ''} - {formatearPrecioParaguayo(grupo.subtotal)}
                                </p>
                              </div>
                              {currentMethod && (
                                <Badge variant="outline" className="text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  {currentMethod === 'pickup' ? 'Retiro' : currentMethod === 'delivery' ? 'Delivery' : 'Envío'}
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <RadioGroup 
                              value={currentMethod} 
                              onValueChange={(value) => updateStoreDeliveryMethod(grupo.id_tienda, value)}
                            >
                              <div className="space-y-3">
                                {grupo.metodosDisponibles.includes('pickup') && (
                                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                                    <RadioGroupItem value="pickup" id={`pickup-${grupo.id_tienda}`} />
                                    <Label htmlFor={`pickup-${grupo.id_tienda}`} className="flex items-center gap-2 flex-1 cursor-pointer">
                                      <Package className="h-4 w-4" />
                                      <div>
                                        <p className="font-medium">Retiro en local</p>
                                        <p className="text-sm text-muted-foreground">Gratis - Recoger en la tienda</p>
                                      </div>
                                    </Label>
                                  </div>
                                )}

                                {grupo.metodosDisponibles.includes('delivery') && (
                                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                                    <RadioGroupItem value="delivery" id={`delivery-${grupo.id_tienda}`} />
                                    <Label htmlFor={`delivery-${grupo.id_tienda}`} className="flex items-center gap-2 flex-1 cursor-pointer">
                                      <Truck className="h-4 w-4" />
                                      <div className="flex-1">
                                        <p className="font-medium">Delivery a domicilio</p>
                                        <p className="text-sm text-muted-foreground">
                                          {formatearPrecioParaguayo(15000)} - Entrega en tu dirección
                                        </p>
                                      </div>
                                    </Label>
                                  </div>
                                )}

                                {grupo.metodosDisponibles.includes('shipping') && (
                                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                                    <RadioGroupItem value="shipping" id={`shipping-${grupo.id_tienda}`} />
                                    <Label htmlFor={`shipping-${grupo.id_tienda}`} className="flex items-center gap-2 flex-1 cursor-pointer">
                                      <Truck className="h-4 w-4" />
                                      <div>
                                        <p className="font-medium">Envío a domicilio</p>
                                        <p className="text-sm text-muted-foreground">
                                          {formatearPrecioParaguayo(25000)} - Envío estándar (3-5 días)
                                        </p>
                                      </div>
                                    </Label>
                                  </div>
                                )}
                              </div>
                            </RadioGroup>
                          </CardContent>
                        </Card>
                      )
                    })
                  ) : (
                    <p>Cargando métodos de entrega...</p>
                  )}
                </div>

                {/* Resumen de costos de envío */}
                    {totalShippingCost > 0 && (
                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Truck className="h-5 w-5 text-blue-600" />
                              <span className="font-medium text-blue-900">Costo total de envío</span>
                            </div>
                            <span className="font-semibold text-blue-900">{formatearPrecioParaguayo(totalShippingCost)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Dirección (solo si al menos una tienda necesita dirección) */}
                    {needsAddress && (
                      <Card>
                        <CardHeader>
                          <CardTitle>
                            <MapPin className="h-5 w-5 mr-2 inline" />
                            Dirección de entrega
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Esta dirección se usará para todas las tiendas que requieran entrega a domicilio
                          </p>
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

                          <div>
                            <Label>Ubicación en el mapa</Label>
                            <p className="text-sm text-muted-foreground mb-2">
                              Selecciona tu ubicación exacta para una entrega más precisa
                            </p>
                            <MapSelector
                              onLocationSelect={handleLocationSelect}
                              initialLocation={address.coordinates}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <div className="flex gap-4">
                      <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                        Anterior
                      </Button>
                      <Button onClick={handleSubmitOrder} disabled={!isStepValid(3) || isLoading} className="flex-1">
                        {isLoading ? "Procesando..." : "Confirmar pedido"}
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

                  {/* Sección de cupón */}
                  <div className="border-t pt-4 space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="coupon">Código de cupón</Label>
                      <div className="flex gap-2">
                        <Input
                          id="coupon"
                          placeholder="Ingresa tu cupón"
                          value={codigoCupon}
                          onChange={(e) => setCodigoCupon(e.target.value)}
                        />
                        <Button 
                          variant="outline" 
                          onClick={handleApplyCoupon}
                          disabled={isLoading || !codigoCupon.trim()}
                        >
                          Aplicar
                        </Button>
                      </div>
                      {totals?.cupon_aplicado && (
                        <div className="text-sm text-green-600">
                          ✓ Cupón "{totals.cupon_aplicado.codigo}" aplicado
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Servicios Premium */}
                  <div className="border-t pt-4">
                    <PremiumServices
                      selectedServices={selectedPremiumServices}
                      onServiceToggle={handlePremiumServiceToggle}
                      cartTotal={totals?.subtotal || total}
                    />
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{formatearPrecioParaguayo(totals?.subtotal || total)}</span>
                    </div>

                    {totals?.impuestos > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>IVA (19%)</span>
                        <span>{formatearPrecioParaguayo(totals.impuestos)}</span>
                      </div>
                    )}

                    {/* Costos de envío por tienda */}
                    {storeDeliveryMethods.length > 0 && storeDeliveryMethods.some(method => method.costoEnvio && method.costoEnvio > 0) && (
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-muted-foreground">Costos de envío:</div>
                        {storeDeliveryMethods.map((method) => {
                          if (!method.costoEnvio || method.costoEnvio === 0) return null
                          const tienda = gruposPorTienda.find(g => g.id_tienda === method.tiendaId)
                          return (
                            <div key={method.tiendaId} className="flex justify-between text-sm pl-2">
                              <span className="text-muted-foreground">
                                {tienda?.nombre_tienda} ({method.metodo === 'delivery' ? 'Delivery' : 'Envío'})
                              </span>
                              <span>{formatearPrecioParaguayo(method.costoEnvio)}</span>
                            </div>
                          )
                        })}
                        <div className="flex justify-between text-sm font-medium">
                          <span>Total envío</span>
                          <span>{formatearPrecioParaguayo(totalShippingCost)}</span>
                        </div>
                      </div>
                    )}

                    {totals?.descuento > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Descuento</span>
                        <span>-{formatearPrecioParaguayo(totals.descuento)}</span>
                      </div>
                    )}

                    {premiumServicesTotal > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Servicios Premium</span>
                        <span>{formatearPrecioParaguayo(premiumServicesTotal)}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>{formatearPrecioParaguayo((totals?.total || total) + totalShippingCost + premiumServicesTotal)}</span>
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
