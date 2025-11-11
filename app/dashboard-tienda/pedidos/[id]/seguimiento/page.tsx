"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import dynamic from "next/dynamic"
import Link from "next/link"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ordenesService } from "@/lib/api/ordenes"
import { ArrowLeft, Play, Pause, CheckCircle, MapPin } from "lucide-react"

const TrackingMap = dynamic(() => import("@/components/tracking-map"), {
  ssr: false,
  loading: () => (
    <div className="h-80 bg-muted rounded-lg animate-pulse flex items-center justify-center">
      <p className="text-muted-foreground">Cargando mapa de seguimiento…</p>
    </div>
  ),
})

export default function SeguimientoPedidoPage() {
  const params = useParams<{ id: string }>()
  const orderId = Number(params?.id)

  const [orden, setOrden] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tracking, setTracking] = useState(false)
  const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number } | null>(null)
  const [geoStatus, setGeoStatus] = useState<'unknown'|'granted'|'denied'|'prompt'>('unknown')
  const [geoError, setGeoError] = useState<string | null>(null)
  const [lastUpdateSentAt, setLastUpdateSentAt] = useState<number>(0)

  const destination = useMemo(() => {
    const latRaw = orden?.direccion_envio_meta?.latitud ?? orden?.envio?.latitud
    const lngRaw = orden?.direccion_envio_meta?.longitud ?? orden?.envio?.longitud
    const lat = latRaw === undefined || latRaw === null ? NaN : Number(latRaw)
    const lng = lngRaw === undefined || lngRaw === null ? NaN : Number(lngRaw)
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng }
    return null
  }, [orden])

  useEffect(() => {
    const fetchOrden = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await ordenesService.getOrden(orderId)
        setOrden(data)
      } catch (e: any) {
        console.error("Error cargando orden:", e)
        setError(e?.message || "No se pudo cargar el pedido")
      } finally {
        setLoading(false)
      }
    }
    if (!Number.isNaN(orderId)) fetchOrden()
  }, [orderId])

  // Pre-prompt de permisos de geolocalización
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const nav: any = navigator
        if (nav?.permissions?.query) {
          const status = await nav.permissions.query({ name: 'geolocation' as any })
          setGeoStatus(status.state as any)
          status.onchange = () => setGeoStatus(status.state as any)
        } else {
          setGeoStatus('unknown')
        }
      } catch {
        setGeoStatus('unknown')
      }
    }
    if (typeof window !== 'undefined') checkPermissions()
  }, [])

  const handleRequestGeo = () => {
    setGeoError(null)
    if (!('geolocation' in navigator)) {
      setGeoError('Geolocalización no disponible en este navegador')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoStatus('granted')
        setCurrentPos({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        toast('Ubicación obtenida', { description: 'Permisos de ubicación concedidos' })
      },
      (err) => {
        setGeoStatus('denied')
        setGeoError(err?.message || 'No se pudo obtener la ubicación')
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    )
  }

  const handleStartTracking = async () => {
    if (!destination) {
      toast('Sin destino', { description: 'La orden no tiene coordenadas de envío' })
      return
    }
    setTracking(true)
    // Opcional: marcar como enviado al iniciar seguimiento
    try {
      if (orden?.estado === "procesando") {
        const updated = await ordenesService.updateOrdenEstado(orderId, "enviado")
        // Preservar metadatos de envío si la respuesta los omite
        setOrden((prev: any) => ({
          ...updated,
          direccion_envio_meta: updated?.direccion_envio_meta ?? prev?.direccion_envio_meta,
          envio: updated?.envio ?? prev?.envio,
        }))
      }
    } catch (e) {
      // Silenciar errores de estado
    }
  }

  const handleStopTracking = () => {
    setTracking(false)
  }

  const handleMarkDelivered = async () => {
    try {
      const updated = await ordenesService.updateOrdenEstado(orderId, "entregado")
      // Preservar metadatos de envío si la respuesta los omite
      setOrden((prev: any) => ({
        ...updated,
        direccion_envio_meta: updated?.direccion_envio_meta ?? prev?.direccion_envio_meta,
        envio: updated?.envio ?? prev?.envio,
      }))
      toast('Pedido entregado', { description: 'Se actualizó el estado del pedido' })
    } catch (e: any) {
      toast('Error al entregar', { description: e?.message || 'Intenta nuevamente' })
    }
  }

  const handleOpenGoogleMaps = () => {
    if (!destination) return
    const lat = destination.lat.toFixed(6)
    const lng = destination.lng.toFixed(6)
    const base = "https://www.google.com/maps/dir/?api=1"
    const originParam = currentPos ? `&origin=${currentPos.lat.toFixed(6)},${currentPos.lng.toFixed(6)}` : ""
    const url = `${base}&destination=${lat},${lng}${originParam}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" asChild>
            <Link href={`/dashboard-tienda/pedidos/${orderId}`}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Volver al pedido
            </Link>
          </Button>
          <h1 className="text-xl font-semibold">Seguimiento del pedido #{orderId}</h1>
        </div>

        {loading && (
          <Card>
            <CardContent>
              <div className="h-80 bg-muted rounded-lg animate-pulse" />
            </CardContent>
          </Card>
        )}

        {!loading && error && (
          <Card>
            <CardContent>
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {!loading && orden && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {destination ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" /> Mapa de seguimiento
                      </CardTitle>
                      <div className="text-xs text-muted-foreground">
                        Permisos ubicación: {geoStatus === 'granted' ? (
                          <span className="text-green-600">concedidos</span>
                        ) : geoStatus === 'denied' ? (
                          <span className="text-red-600">denegados</span>
                        ) : geoStatus === 'prompt' ? (
                          <span>solicitados</span>
                        ) : (
                          <span>desconocido</span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {geoStatus !== 'granted' && (
                      <div className="p-2 mb-3 border rounded text-xs flex items-center justify-between">
                        <span>
                          Es necesario permitir la ubicación para enviar el tracking.
                          {geoError ? ` (${geoError})` : ''}
                        </span>
                        <Button size="sm" variant="outline" onClick={handleRequestGeo} className="bg-transparent">Permitir</Button>
                      </div>
                    )}
                    <TrackingMap
                      destination={destination}
                      tracking={tracking}
                      onPositionUpdate={async (p) => {
                        setCurrentPos(p)
                        if (p) {
                          // Throttle: evitar enviar updates al backend en exceso
                          const now = Date.now()
                          if (now - lastUpdateSentAt < 2000) {
                            return
                          }
                          setLastUpdateSentAt(now)
                          try {
                            await ordenesService.updateTracking(orderId, {
                              latitud: p.lat,
                              longitud: p.lng,
                              fuente: 'store_app',
                              tracking_activo: true,
                            })
                          } catch (e) {
                            // Evitar bloquear la UI por fallos puntuales
                            if (process.env.NODE_ENV === 'development') {
                              console.warn('updateTracking error', e)
                            }
                          }
                        }
                      }}
                      debug={true}
                    />
                    <div className="flex items-center gap-2 mt-4">
                      {!tracking ? (
                        <Button onClick={handleStartTracking}>
                          <Play className="w-4 h-4 mr-1" /> Iniciar seguimiento
                        </Button>
                      ) : (
                        <Button variant="secondary" onClick={handleStopTracking}>
                          <Pause className="w-4 h-4 mr-1" /> Pausar seguimiento
                        </Button>
                      )}
                      <Button variant="outline" onClick={handleOpenGoogleMaps}>
                        Abrir en Google Maps
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent>
                    <p className="text-muted-foreground">Este pedido no tiene coordenadas de destino. Verifica la dirección.</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Estado del pedido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm">Estado actual:</span>
                    <Badge>{orden?.estado || "desconocido"}</Badge>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button variant="success" onClick={handleMarkDelivered}>
                      <CheckCircle className="w-4 h-4 mr-1" /> Marcar como entregado
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Se actualizará el estado del pedido y se notificará al cliente según configuración.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}