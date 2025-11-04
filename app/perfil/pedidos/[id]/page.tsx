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
  XCircle,
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
import { ordenesService, OrdenBackend, OrdenDetalle } from "@/lib/api/ordenes"
import { storeService } from "@/lib/store"

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

// Normaliza valores numéricos que pueden venir como string desde el backend
const normalizeNumber = (value: unknown) => {
  const num = typeof value === "number" ? value : parseFloat(String(value))
  return Number.isFinite(num) ? num : 0
}

// Extrae tiendas únicas desde los ítems del pedido
const extractUniqueStores = (items: OrdenDetalle[]) => {
  const map = new Map<number | string, { id?: number; name?: string }>()
  items.forEach((it) => {
    const prod: any = it.producto
    const tiendaId = prod?.tienda?.id_tienda ?? prod?.id_tienda
    const tiendaNombre = prod?.tienda?.nombre_tienda ?? prod?.tienda_nombre ?? undefined
    const key = tiendaId ?? tiendaNombre
    if (key) {
      if (!map.has(key)) {
        map.set(key, { id: typeof tiendaId === "number" ? tiendaId : undefined, name: tiendaNombre })
      }
    }
  })
  return Array.from(map.values())
}

export default function PedidoDetallesPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { addItem } = useCart()
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [currentStatus, setCurrentStatus] = useState("confirmado")
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState("")
  const [storeNames, setStoreNames] = useState<Record<number, string>>({})

  useEffect(() => {
    const fetchOrder = async () => {
      const idNum = Number(params.id)
      if (!idNum || Number.isNaN(idNum)) {
        router.push("/perfil")
        return
      }

      try {
        const orden: OrdenBackend = await ordenesService.getOrden(idNum)

        const deliveryMethod = getDeliveryMethodFromDetalles(orden.detalles)
        const mappedStatus = mapBackendStatus(orden.estado)

        const customerName = [orden.user?.name, orden.user?.apellido].filter(Boolean).join(" ")

        const mapped: OrderData = {
          customerInfo: {
            name: customerName || "",
            email: orden.user?.email || "",
            phone: orden.user?.telefono || "",
          },
          paymentMethod: orden.metodo_pago || "",
          deliveryMethod,
          address: orden.direccion_envio
            ? { street: orden.direccion_envio, number: "", city: "", postalCode: "", notes: orden.notas || "" }
            : undefined,
          total: normalizeNumber(orden.total),
          items: orden.detalles,
          status: mappedStatus,
          estimatedDelivery: getEstimatedDelivery(orden.detalles),
          orderDate: new Date(orden.created_at).toLocaleString(),
          storeInfo: orden.store_info
            ? {
                name: orden.store_info.nombre,
                phone: orden.store_info.telefono || "",
                rating: orden.store_info.rating ?? 4.5,
                id: orden.store_info.id,
              }
            : {
                name: "MiMarket",
                phone: "",
                rating: 4.5,
                id: 0,
              },
        }

        setOrderData(mapped)
        setCurrentStatus(mappedStatus)

        // Cargar nombres de tiendas para IDs presentes en los ítems
        const ids = Array.from(
          new Set(
            (orden.detalles || [])
              .map((it) => (it.producto as any)?.tienda?.id_tienda ?? (it.producto as any)?.id_tienda)
              .filter((id): id is number => typeof id === "number")
          )
        )
        if (ids.length) {
          Promise.all(
            ids.map(async (id) => {
              try {
                const resp = await storeService.getStore(id)
                const data = resp.data || resp
                const name =
                  (data?.nombre_tienda as string) ||
                  (data?.nombre as string) ||
                  (data?.tienda?.nombre_tienda as string) ||
                  ""
                if (name) {
                  setStoreNames((prev) => ({ ...prev, [id]: name }))
                }
              } catch {
                // Ignorar errores puntuales de carga de tienda
              }
            })
          )
        }
      } catch (err) {
        console.error("Error cargando orden:", err)
        router.push("/perfil")
      }
    }

    fetchOrder()
  }, [params.id, router])

  const mapBackendStatus = (estado: string) => {
    const normalized = (estado || "").toLowerCase()
    if (["pendiente", "confirmado", "pagado", "aceptado"].includes(normalized)) return "confirmado"
    if (["procesando", "preparando", "preparado"].includes(normalized)) return "preparando"
    if (["enviado", "en_camino", "en_transito", "reparto"].includes(normalized)) return "en_camino"
    if (["entregado", "finalizado"].includes(normalized)) return "entregado"
    // Estados no cubiertos (cancelado, rechazado, fallido) se muestran como procesando por ahora
    return "confirmado"
  }

  const getEstimatedDelivery = (items: OrdenDetalle[]) => {
    const hasDelivery = items.some((item) => {
      const tipo = (item.producto?.tipoVenta || item.producto?.tipo_venta || "").toLowerCase()
      return tipo === "delivery"
    })
    const hasPedido = items.some((item) => {
      const tipo = (item.producto?.tipoVenta || item.producto?.tipo_venta || "").toLowerCase()
      return tipo === "pedido"
    })

    if (hasDelivery) return "30-45 minutos"
    if (hasPedido) return "7-10 días hábiles"
    return "3-5 días hábiles"
  }

  const getDeliveryMethodFromDetalles = (items: OrdenDetalle[]) => {
    const hasDelivery = items.some((item) => {
      const tipo = (item.producto?.tipoVenta || item.producto?.tipo_venta || "").toLowerCase()
      return tipo === "delivery"
    })
    return hasDelivery ? "delivery" : "shipping"
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
      case "cancelado":
        return {
          label: "Pedido cancelado",
          description: "Tu pedido ha sido cancelado",
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-100",
        }
      case "rechazado":
        return {
          label: "Pedido rechazado",
          description: "Tu pedido fue rechazado por la tienda",
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-100",
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
    const m = (method || "").toLowerCase()
    if (m === "card" || m === "tarjeta") return "Tarjeta de crédito/débito"
    if (m === "cash" || m === "efectivo") return "Efectivo al recibir"
    if (m === "transfer" || m === "transferencia") return "Transferencia bancaria"
    if (m === "paypal") return "PayPal"
    return method
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

    (orderData.items as OrdenDetalle[]).forEach((item) => {
      const productId = item.id_producto || item.producto?.id_producto
      if (productId) {
        for (let i = 0; i < item.cantidad; i++) {
          addItem(productId)
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
                  {currentStatus === "cancelado" || currentStatus === "rechazado" ? (
                    <div className="flex items-center gap-4 p-4 border rounded-lg bg-red-50">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="font-medium">
                          {currentStatus === "cancelado" ? "Pedido cancelado" : "Pedido rechazado"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {currentStatus === "cancelado"
                            ? "Tu pedido ha sido cancelado. Si tienes dudas, contacta a la tienda."
                            : "Tu pedido fue rechazado por la tienda. Puedes revisar alternativas o contactar a la tienda."}
                        </p>
                      </div>
                    </div>
                  ) : (
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
                        const order = ["confirmado", "preparando", "en_camino", "entregado"]
                        const currentIndex = order.indexOf(currentStatus)
                        const isCompleted = currentIndex >= index && currentIndex !== -1
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
                  )}
                </CardContent>
              </Card>

              {/* Información de tiendas del pedido */}
              <Card>
                {(() => {
                  const stores = extractUniqueStores(orderData.items as OrdenDetalle[])
                  const multiple = stores.length > 1
                  return (
                    <>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                          <Package className="h-5 w-5" />
                          {multiple ? "Tiendas del pedido" : "Información de la tienda"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {stores.length === 0 ? (
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
                        ) : multiple ? (
                          <div className="space-y-3">
                            {stores.map((st, idx) => (
                              <div key={idx} className="flex items-center justify-between gap-4 p-3 border rounded">
                                <div>
                                  <h4 className="font-medium text-sm md:text-base">{st.name ?? (st.id && storeNames[st.id]) ?? (st.id ? `Tienda ID: ${st.id}` : "Tienda")}</h4>
                                  {st.name && st.id && (
                                    <p className="text-xs text-muted-foreground">ID: {st.id}</p>
                                  )}
                                </div>
                                {st.id ? (
                                  <Button variant="outline" size="sm" asChild className="bg-transparent">
                                    <Link href={`/tiendas/${st.id}`}>Ver tienda</Link>
                                  </Button>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="font-medium text-base md:text-lg">{stores[0].name ?? (stores[0].id && storeNames[stores[0].id]) ?? (stores[0].id ? `Tienda ID: ${stores[0].id}` : "Tienda")}</h3>
                            </div>
                            {stores[0].id ? (
                              <Button variant="outline" size="sm" asChild className="w-full sm:w-auto bg-transparent">
                                <Link href={`/tiendas/${stores[0].id}`}>Ver tienda</Link>
                              </Button>
                            ) : null}
                          </div>
                        )}
                      </CardContent>
                    </>
                  )
                })()}
              </Card>

              {/* Productos del pedido */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl">Productos ({orderData.items.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(orderData.items as OrdenDetalle[]).map((item, index) => {
                      const { producto } = item
                      if (!producto) return null

                      const unitPrice = item.precio_unitario ?? producto.precio ?? 0
                      const descuento = producto.descuento ?? 0
                      const precioFinalUnit = descuento > 0 && producto.precio ? producto.precio * (1 - descuento / 100) : unitPrice

                      return (
                        <div key={index} className="flex gap-4 p-4 border rounded-lg">
                          <div className="relative h-16 w-16 md:h-20 md:w-20 flex-shrink-0">
                            <Image
                              src={producto.imagen_principal_url || producto.imagen_url || "/placeholder.svg"}
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
                                {/* Información de tienda por producto si está disponible */}
                                <div className="text-xs md:text-sm text-muted-foreground mt-1">
                                  {producto.tienda?.nombre_tienda ? (
                                    <span>
                                      Tienda: {producto.tienda.nombre_tienda}{" "}
                                      {producto.tienda.id_tienda ? (
                                        <Link href={`/tiendas/${producto.tienda.id_tienda}`} className="underline">
                                          Ver tienda
                                        </Link>
                                      ) : null}
                                    </span>
                                  ) : producto.id_tienda ? (
                                    <span>
                                      Tienda: {storeNames[producto.id_tienda] || `Tienda ${producto.id_tienda}`}{" "}
                                      <Link href={`/tiendas/${producto.id_tienda}`} className="underline">Ver tienda</Link>
                                    </span>
                                  ) : (
                                    orderData.storeInfo?.name && (
                                      <span>
                                        Tienda: {orderData.storeInfo.name}{" "}
                                        {orderData.storeInfo.id ? (
                                          <Link href={`/tiendas/${orderData.storeInfo.id}`} className="underline">Ver tienda</Link>
                                        ) : null}
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="font-semibold text-sm md:text-base">
                                  ${(precioFinalUnit * item.cantidad).toFixed(2)}
                                </p>
                                {descuento > 0 && producto.precio && (
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
