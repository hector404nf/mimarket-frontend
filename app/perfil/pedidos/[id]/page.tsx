"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft,
  Package,
  Clock,
  Truck,
  CheckCircle,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Download,
  Star,
  RotateCcw,
} from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useCart } from "@/lib/cart-store"
import { toast } from "@/components/ui/use-toast"

interface OrderData {
  customerInfo: {
    name: string
    email: string
    phone: string
  }
  paymentMethod: string
  deliveryMethod: string
  address?: {
    street: string
    number: string
    city: string
    postalCode: string
    notes: string
    coordinates?: [number, number]
  }
  total: number
  items: any[]
  status: string
  estimatedDelivery: string
  orderDate: string
  storeInfo: {
    name: string
    phone: string
    rating: number
    id: number
  }
}

export default function PedidoDetallesPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { addItem } = useCart()
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [currentStatus, setCurrentStatus] = useState("confirmado")
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState("")

  useEffect(() => {
    // Cargar datos del pedido desde localStorage
    const storedOrder = localStorage.getItem(`order-${params.id}`)
    if (storedOrder) {
      const order = JSON.parse(storedOrder)

      // Simular datos adicionales del pedido
      const enhancedOrder: OrderData = {
        ...order,
        status: "confirmado",
        estimatedDelivery: getEstimatedDelivery(order.items),
        orderDate: new Date().toLocaleString(),
        storeInfo: {
          name: "TechStore Premium",
          phone: "+34 912 345 678",
          rating: 4.8,
          id: 1,
        },
      }

      setOrderData(enhancedOrder)
      setCurrentStatus("confirmado")

      // Simular progreso del pedido
      simulateOrderProgress()
    } else {
      router.push("/perfil")
    }
  }, [params.id, router])

  const simulateOrderProgress = () => {
    const statuses = ["confirmado", "preparando", "en_camino", "entregado"]
    let currentIndex = 0

    const interval = setInterval(() => {
      currentIndex++
      if (currentIndex < statuses.length) {
        setCurrentStatus(statuses[currentIndex])
      } else {
        clearInterval(interval)
      }
    }, 15000) // Cambiar estado cada 15 segundos para demo
  }

  const getEstimatedDelivery = (items: any[]) => {
    const hasDelivery = items.some((item) => item.producto?.tipoVenta === "delivery")
    const hasPedido = items.some((item) => item.producto?.tipoVenta === "pedido")

    if (hasDelivery) return "30-45 minutos"
    if (hasPedido) return "7-10 días hábiles"
    return "3-5 días hábiles"
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "confirmado":
        return {
          label: "Pedido confirmado",
          description: "Tu pedido ha sido confirmado y está siendo procesado",
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-100",
        }
      case "preparando":
        return {
          label: "Preparando",
          description: "Estamos preparando tu pedido",
          icon: Package,
          color: "text-orange-600",
          bgColor: "bg-orange-100",
        }
      case "en_camino":
        return {
          label: "En camino",
          description: "Tu pedido está en camino",
          icon: Truck,
          color: "text-blue-600",
          bgColor: "bg-blue-100",
        }
      case "entregado":
        return {
          label: "Entregado",
          description: "Tu pedido ha sido entregado",
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-100",
        }
      default:
        return {
          label: "Procesando",
          description: "Procesando tu pedido",
          icon: Clock,
          color: "text-gray-600",
          bgColor: "bg-gray-100",
        }
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "card":
        return "Tarjeta de crédito/débito"
      case "paypal":
        return "PayPal"
      case "transfer":
        return "Transferencia bancaria"
      case "cash":
        return "Efectivo al recibir"
      default:
        return method
    }
  }

  const getDeliveryMethodLabel = (method: string) => {
    switch (method) {
      case "delivery":
        return "Delivery a domicilio"
      case "pickup":
        return "Retiro en local"
      case "shipping":
        return "Envío a domicilio"
      default:
        return method
    }
  }

  const handleRepeatOrder = () => {
    if (!orderData) return

    orderData.items.forEach((item) => {
      if (item.producto) {
        for (let i = 0; i < item.cantidad; i++) {
          addItem(item.producto.id)
        }
      }
    })

    toast({
      title: "Productos añadidos al carrito",
      description: `Se han añadido ${orderData.items.length} productos a tu carrito`,
    })
  }

  const handleDownloadReceipt = () => {
    toast({
      title: "Descargando comprobante",
      description: "El comprobante se descargará en breve",
    })
  }

  const handleSubmitReview = () => {
    if (rating === 0) {
      toast({
        title: "Error",
        description: "Por favor selecciona una calificación",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Reseña enviada",
      description: "Gracias por tu opinión",
    })

    setShowReviewForm(false)
    setRating(0)
    setReviewText("")
  }

  if (!orderData) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-xl md:text-2xl font-bold mb-2">Cargando pedido...</h1>
            <p className="text-muted-foreground">Por favor espera un momento</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const statusInfo = getStatusInfo(currentStatus)
  const StatusIcon = statusInfo.icon

  const deliveryCost =
    orderData.deliveryMethod === "delivery" ? 3.99 : orderData.deliveryMethod === "shipping" ? 5.99 : 0

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full">
        <div className="px-4 md:px-6 py-4 md:py-6 lg:py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <Button variant="ghost" asChild className="self-start">
              <Link href="/perfil">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al perfil
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Estado del pedido */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className={`p-3 rounded-full ${statusInfo.bgColor} flex-shrink-0`}>
                      <StatusIcon className={`h-6 w-6 ${statusInfo.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg md:text-xl">{statusInfo.label}</CardTitle>
                      <p className="text-muted-foreground text-sm md:text-base">{statusInfo.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                      Tiempo estimado de entrega: <span className="font-medium">{orderData.estimatedDelivery}</span>
                    </p>
                    <Badge variant="outline" className="self-start sm:self-auto">
                      Pedido #{params.id}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Progreso del pedido */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl">Seguimiento del pedido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { status: "confirmado", label: "Pedido confirmado", time: orderData.orderDate },
                      {
                        status: "preparando",
                        label: "Preparando pedido",
                        time: currentStatus === "preparando" ? "Ahora" : "",
                      },
                      { status: "en_camino", label: "En camino", time: currentStatus === "en_camino" ? "Ahora" : "" },
                      { status: "entregado", label: "Entregado", time: currentStatus === "entregado" ? "Ahora" : "" },
                    ].map((step, index) => {
                      const isCompleted =
                        ["confirmado", "preparando", "en_camino", "entregado"].indexOf(currentStatus) >= index
                      const isCurrent = currentStatus === step.status

                      return (
                        <div key={step.status} className="flex items-center gap-4">
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                              isCompleted ? "bg-primary border-primary" : "bg-background border-muted-foreground"
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm md:text-base ${isCurrent ? "text-primary" : ""}`}>
                              {step.label}
                            </p>
                            {step.time && <p className="text-xs md:text-sm text-muted-foreground">{step.time}</p>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Información de la tienda */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Package className="h-5 w-5" />
                    Información de la tienda
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium text-base md:text-lg">{orderData.storeInfo.name}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {orderData.storeInfo.phone}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {orderData.storeInfo.rating}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <Button variant="outline" size="sm" asChild className="w-full sm:w-auto bg-transparent">
                        <Link href={`/tiendas/${orderData.storeInfo.id}`}>Ver tienda</Link>
                      </Button>
                      <Button variant="outline" size="sm" className="w-full sm:w-auto bg-transparent">
                        <Phone className="h-4 w-4 mr-2" />
                        Llamar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Productos del pedido */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl">Productos ({orderData.items.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orderData.items.map((item, index) => {
                      const { producto } = item
                      if (!producto) return null

                      const precioFinal =
                        producto.descuento > 0 ? producto.precio * (1 - producto.descuento / 100) : producto.precio

                      return (
                        <div key={index} className="flex gap-4 p-4 border rounded-lg">
                          <div className="relative h-16 w-16 md:h-20 md:w-20 flex-shrink-0">
                            <Image
                              src={producto.imagen || "/placeholder.svg"}
                              alt={producto.nombre}
                              fill
                              className="object-cover rounded"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-sm md:text-base line-clamp-2">{producto.nombre}</h3>
                                <p className="text-xs md:text-sm text-muted-foreground">Cantidad: {item.cantidad}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="font-semibold text-sm md:text-base">
                                  ${(precioFinal * item.cantidad).toFixed(2)}
                                </p>
                                {producto.descuento > 0 && (
                                  <p className="text-xs text-muted-foreground line-through">
                                    ${(producto.precio * item.cantidad).toFixed(2)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Dirección de entrega */}
              {orderData.address && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                      <MapPin className="h-5 w-5" />
                      Dirección de entrega
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="font-medium text-sm md:text-base">
                        {orderData.address.street} {orderData.address.number}
                      </p>
                      <p className="text-muted-foreground text-sm md:text-base">
                        {orderData.address.postalCode} {orderData.address.city}
                      </p>
                      {orderData.address.notes && (
                        <p className="text-xs md:text-sm text-muted-foreground">Notas: {orderData.address.notes}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Formulario de reseña */}
              {currentStatus === "entregado" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg md:text-xl">¿Cómo fue tu experiencia?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!showReviewForm ? (
                      <Button onClick={() => setShowReviewForm(true)} className="w-full sm:w-auto">
                        <Star className="h-4 w-4 mr-2" />
                        Escribir reseña
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Tu calificación</label>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button key={star} onClick={() => setRating(star)} className="p-1">
                                <Star
                                  className={`h-6 w-6 ${
                                    star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-2 block">Tu comentario</label>
                          <Textarea
                            placeholder="Comparte tu experiencia con este pedido..."
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            className="min-h-[100px] resize-none"
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button onClick={handleSubmitReview} className="w-full sm:w-auto">
                            Enviar reseña
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowReviewForm(false)}
                            className="w-full sm:w-auto"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Información del pedido */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl">Información del pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 text-sm md:text-base">Información de contacto</h4>
                    <div className="space-y-1 text-xs md:text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 flex-shrink-0" />
                        <span className="break-all">{orderData.customerInfo.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 flex-shrink-0" />
                        <span className="break-all">{orderData.customerInfo.email}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2 text-sm md:text-base">Método de pago</h4>
                    <div className="flex items-center gap-2 text-xs md:text-sm">
                      <CreditCard className="h-3 w-3 flex-shrink-0" />
                      <span>{getPaymentMethodLabel(orderData.paymentMethod)}</span>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2 text-sm md:text-base">Método de entrega</h4>
                    <div className="flex items-center gap-2 text-xs md:text-sm">
                      <Truck className="h-3 w-3 flex-shrink-0" />
                      <span>{getDeliveryMethodLabel(orderData.deliveryMethod)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl">Resumen de pago</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${orderData.total.toFixed(2)}</span>
                  </div>

                  {deliveryCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>{orderData.deliveryMethod === "delivery" ? "Delivery" : "Envío"}</span>
                      <span>${deliveryCost.toFixed(2)}</span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${(orderData.total + deliveryCost).toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <Button onClick={handleRepeatOrder} className="w-full">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Repetir pedido
                </Button>

                <Button variant="outline" onClick={handleDownloadReceipt} className="w-full bg-transparent">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar comprobante
                </Button>

                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/">Seguir comprando</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
