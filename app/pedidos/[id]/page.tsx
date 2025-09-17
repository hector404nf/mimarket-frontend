"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Package, Clock, Truck, CheckCircle, MapPin, Phone, Mail, CreditCard } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

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
}

export default function PedidoPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [currentStatus, setCurrentStatus] = useState("confirmado")

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
      }

      setOrderData(enhancedOrder)
      setCurrentStatus("confirmado")

      // Simular progreso del pedido
      simulateOrderProgress()
    } else {
      router.push("/")
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

  if (!orderData) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Cargando pedido...</h1>
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
    orderData.deliveryMethod === "delivery" ? 29500 : orderData.deliveryMethod === "shipping" ? 44200 : 0

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full">
        <div className="px-4 md:px-6 py-6 md:py-10">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" asChild>
              <Link href="/perfil">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Mis pedidos
              </Link>
            </Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Estado del pedido */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${statusInfo.bgColor}`}>
                      <StatusIcon className={`h-6 w-6 ${statusInfo.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{statusInfo.label}</CardTitle>
                      <p className="text-muted-foreground">{statusInfo.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Tiempo estimado de entrega: <span className="font-medium">{orderData.estimatedDelivery}</span>
                    </p>
                    <Badge variant="outline">Pedido #{params.id}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Progreso del pedido */}
              <Card>
                <CardHeader>
                  <CardTitle>Seguimiento del pedido</CardTitle>
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
                            className={`w-4 h-4 rounded-full border-2 ${
                              isCompleted ? "bg-primary border-primary" : "bg-background border-muted-foreground"
                            }`}
                          />
                          <div className="flex-1">
                            <p className={`font-medium ${isCurrent ? "text-primary" : ""}`}>{step.label}</p>
                            {step.time && <p className="text-sm text-muted-foreground">{step.time}</p>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Productos del pedido */}
              <Card>
                <CardHeader>
                  <CardTitle>Productos ({orderData.items.length})</CardTitle>
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
                          <div className="relative h-16 w-16 flex-shrink-0">
                            <Image
                              src={producto.imagen || "/placeholder.svg"}
                              alt={producto.nombre}
                              fill
                              className="object-cover rounded"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">{producto.nombre}</h3>
                            <p className="text-sm text-muted-foreground">Cantidad: {item.cantidad}</p>
                            <p className="font-semibold">₲{(precioFinal * item.cantidad).toLocaleString()}</p>
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
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Dirección de entrega
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="font-medium">
                        {orderData.address.street} {orderData.address.number}
                      </p>
                      <p className="text-muted-foreground">
                        {orderData.address.postalCode} {orderData.address.city}
                      </p>
                      {orderData.address.notes && (
                        <p className="text-sm text-muted-foreground">Notas: {orderData.address.notes}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Información del pedido */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Información del pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Información de contacto</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        {orderData.customerInfo.phone}
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {orderData.customerInfo.email}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">Método de pago</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="h-3 w-3" />
                      {getPaymentMethodLabel(orderData.paymentMethod)}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">Método de entrega</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <Truck className="h-3 w-3" />
                      {getDeliveryMethodLabel(orderData.deliveryMethod)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resumen de pago</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>₲{orderData.total.toLocaleString()}</span>
                  </div>

                  {deliveryCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>{orderData.deliveryMethod === "delivery" ? "Delivery" : "Envío"}</span>
                      <span>₲{deliveryCost.toLocaleString()}</span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>₲{(orderData.total + deliveryCost).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              <Button variant="outline" className="w-full" asChild>
                <Link href="/">Seguir comprando</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
