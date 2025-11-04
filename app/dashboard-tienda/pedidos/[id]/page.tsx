"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { useParams } from "next/navigation"
import Link from "next/link"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { ordenesService, OrdenBackend } from "@/lib/api/ordenes"
import { ArrowLeft, Package, Truck, CheckCircle } from "lucide-react"
// Eliminado Google Maps; usamos solo el selector de Leaflet/OSM
const MapSelectorLeaflet = dynamic(() => import("@/components/map-selector-leaflet"), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-muted rounded-lg animate-pulse flex items-center justify-center">
      <p className="text-muted-foreground">Cargando mapa OSM...</p>
    </div>
  ),
})

export default function DetallePedidoTiendaPage() {
  const DEBUG = true
  const params = useParams()
  const idParam = Array.isArray(params?.id) ? params.id[0] : params?.id
  const id = Number(idParam)

  const [orden, setOrden] = useState<OrdenBackend | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [coords, setCoords] = useState<[number, number] | null>(null)
  // Solo OSM: no se usa Google Maps

  useEffect(() => {
    const fetchOrden = async () => {
      if (!id || Number.isNaN(id)) {
        setError("ID de pedido inválido")
        setLoading(false)
        return
      }
      try {
        const data = await ordenesService.getOrden(id)
        if (DEBUG) console.log('[Pedido] Datos cargados', data)
        setOrden(data)
        // Si viene coordenadas en la respuesta futura, úsalas
        const anyData = data as any
        // Compatibilidad con distintos nombres de campos
        const backendLat = anyData?.direccion_envio_meta?.latitud ?? anyData?.latitud ?? anyData?.direccion_envio_lat ?? anyData?.envio?.latitud
        const backendLng = anyData?.direccion_envio_meta?.longitud ?? anyData?.longitud ?? anyData?.direccion_envio_lng ?? anyData?.envio?.longitud
        if (backendLat != null && backendLng != null) {
          const latNum = Number(backendLat)
          const lngNum = Number(backendLng)
          if (!Number.isNaN(latNum) && !Number.isNaN(lngNum)) {
            setCoords([latNum, lngNum])
            if (DEBUG) console.log('[Pedido] Coords desde backend', latNum, lngNum)
          }
        }
      } catch (e) {
        console.error("Error cargando pedido", e)
        setError("No se pudo cargar el pedido")
      } finally {
        setLoading(false)
      }
    }
    fetchOrden()
  }, [id])

  // Geocodificar dirección si no hay coordenadas (solo Nominatim/OSM)
  useEffect(() => {
    const geocodeAddress = async () => {
      if (!orden?.direccion_envio || coords) return
      if (DEBUG) console.log('[Geocode] Iniciando geocodificación para', orden?.direccion_envio)
      geocodeWithNominatim(orden.direccion_envio)
    }
    const geocodeWithNominatim = async (address: string) => {
      try {
        const cleaned = address.replace(/[()]/g, ' ')
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&countrycodes=py&accept-language=es&q=${encodeURIComponent(cleaned)}`
        const res = await fetch(url, { headers: { Accept: "application/json" } })
        const data = (await res.json()) as Array<{ lat: string; lon: string }>
        if (data && data[0]) {
          const lat = parseFloat(data[0].lat)
          const lon = parseFloat(data[0].lon)
          setCoords([lat, lon])
          if (DEBUG) console.log('[Geocode] OSM OK', lat, lon)
        }
      } catch (err) {
        console.warn("Nominatim geocoding failed", err)
        if (DEBUG) console.log('[Geocode] OSM fallo', err)
      }
    }
    geocodeAddress()
  }, [orden?.direccion_envio, coords])

  // Resolver lat/lon bajo demanda para compartir/copiar
  const resolveCoords = async (): Promise<[number, number] | null> => {
    if (coords) return coords
    const address = orden?.direccion_envio || ""
    if (!address) return null
    if (DEBUG) console.log('[Resolve] Buscando coords (OSM) para', address)
    try {
      const cleaned = address.replace(/[()]/g, ' ')
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&countrycodes=py&accept-language=es&q=${encodeURIComponent(cleaned)}`
      const res = await fetch(url, { headers: { Accept: "application/json" } })
      const data = (await res.json()) as Array<{ lat: string; lon: string }>
      if (data && data[0]) {
        const lat = parseFloat(data[0].lat)
        const lon = parseFloat(data[0].lon)
        setCoords([lat, lon])
        if (DEBUG) console.log('[Resolve] OSM OK', lat, lon)
        return [lat, lon]
      }
    } catch (e) {
      if (DEBUG) console.log('[Resolve] OSM error', e)
    }
    if (DEBUG) console.log('[Resolve] Sin coordenadas')
    return null
  }

  const getEstadoBadge = (estado?: string) => {
    switch (estado) {
      case "completado":
        return <Badge className="bg-green-100 text-green-800">Completado</Badge>
      case "entregado":
        return <Badge className="bg-green-100 text-green-800">Entregado</Badge>
      case "procesando":
        return <Badge className="bg-yellow-100 text-yellow-800">Procesando</Badge>
      case "enviado":
        return <Badge className="bg-blue-100 text-blue-800">Enviado</Badge>
      case "pendiente":
        return <Badge className="bg-orange-100 text-orange-800">Pendiente</Badge>
      case "cancelado":
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>
      default:
        return estado ? <Badge variant="secondary">{estado}</Badge> : null
    }
  }

  const getEstadoIcon = (estado?: string) => {
    switch (estado) {
      case "completado":
      case "entregado":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "procesando":
        return <Package className="h-4 w-4 text-yellow-600" />
      case "enviado":
        return <Truck className="h-4 w-4 text-blue-600" />
      default:
        return <Package className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full">
        <div className="px-4 md:px-6 py-6 md:py-10">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" asChild>
              <Link href="/dashboard-tienda/pedidos">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Pedidos
              </Link>
            </Button>
          </div>

          {loading && (
            <div className="text-center py-6 text-muted-foreground">Cargando pedido...</div>
          )}
          {error && (
            <div className="text-center py-6 text-red-600">{error}</div>
          )}

          {!loading && !error && orden && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    {getEstadoIcon(orden.estado)}
                    <span>{orden.numero_orden || `ORD-${orden.id_orden}`}</span>
                    {getEstadoBadge(orden.estado)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 mb-6 text-sm">
                    <div>
                      <p><span className="font-medium">Fecha:</span> {new Date(orden.created_at).toLocaleString()}</p>
                      {orden.metodo_pago && (
                        <p><span className="font-medium">Método de pago:</span> {orden.metodo_pago}</p>
                      )}
                      <p><span className="font-medium">Total:</span> ${Number(orden.total).toFixed(2)}</p>
                    </div>
                    <div>
                      <p><span className="font-medium">Cliente:</span> {orden.user?.name || "-"}</p>
                      <p><span className="font-medium">Email:</span> {orden.user?.email || "-"}</p>
                      {orden.user?.telefono && (
                        <p><span className="font-medium">Teléfono:</span> {orden.user.telefono}</p>
                      )}
                    </div>
                  </div>

                  {orden.direccion_envio && (
                    <div className="mb-6 space-y-3">
                      <h3 className="text-base font-semibold">Dirección de envío</h3>
                      <p className="text-sm text-muted-foreground">{orden.direccion_envio}</p>
                      <div className="mt-2">
                        {coords ? (
                          <MapSelectorLeaflet
                            initialLocation={coords}
                            onLocationSelect={(c: [number, number]) => setCoords(c)}
                            initialAddress={orden.direccion_envio}
                            interactive={false}
                          />
                        ) : (
                          <MapSelectorLeaflet
                            onLocationSelect={(c: [number, number]) => setCoords(c)}
                            initialAddress={orden.direccion_envio}
                            interactive={false}
                          />
                        )}
                      </div>
                      {(coords || orden.direccion_envio) && (
                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            variant="outline"
                            onClick={async () => {
                              if (DEBUG) console.log('[UI] Click Compartir ubicación')
                              let finalCoords = coords
                              if (!finalCoords) {
                                toast({ title: "Geolocalizando dirección…", description: "Intentando obtener coordenadas", duration: 2000 })
                                finalCoords = await resolveCoords()
                              }
                              if (!finalCoords) {
                                toast({ title: "No se pudo obtener coordenadas", description: "No se puede compartir con lat/lng" })
                                return
                              }
                              const lat = Number(finalCoords[0]).toFixed(6)
                              const lng = Number(finalCoords[1]).toFixed(6)
                              const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
                              if (DEBUG) console.log('[Share] url', url)
                              try {
                                if (navigator.share) {
                                  await navigator.share({ title: "Ubicación del pedido", text: `Coordenadas: ${lat},${lng}`, url })
                                } else if (navigator.clipboard?.writeText) {
                                  await navigator.clipboard.writeText(url)
                                  toast({ title: "Enlace copiado", description: "Se copió la ubicación (lat/lng)" })
                                } else {
                                  window.prompt("Copia este enlace para compartir", url)
                                }
                              } catch {
                                // Ignorar cancelación del share
                                if (DEBUG) console.log('[Share] cancelado o error')
                              }
                            }}
                          >
                            Compartir ubicación
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={async () => {
                              if (DEBUG) console.log('[UI] Click Copiar lat/long')
                              let finalCoords = coords
                              if (!finalCoords) finalCoords = await resolveCoords()
                              if (finalCoords) {
                                const text = `${finalCoords[0]}, ${finalCoords[1]}`
                                if (navigator.clipboard?.writeText) {
                                  await navigator.clipboard.writeText(text)
                                  toast({ title: "Coordenadas copiadas", description: text })
                                } else {
                                  window.prompt("Coordenadas", text)
                                }
                              } else {
                                toast({ title: "No se pudo obtener coordenadas", description: "Comparte usando la dirección textual" })
                              }
                            }}
                          >
                            Copiar lat/long
                          </Button>
                          <Button
                            onClick={async () => {
                              if (DEBUG) console.log('[UI] Click Abrir en Google Maps')
                              let finalCoords = coords
                              if (!finalCoords) {
                                toast({ title: "Geolocalizando dirección…", description: "Intentando obtener coordenadas", duration: 2000 })
                                finalCoords = await resolveCoords()
                              }
                              if (!finalCoords) {
                                toast({ title: "No se pudo obtener coordenadas", description: "Verifica la dirección o ajusta el marcador" })
                                return
                              }
                              const lat = Number(finalCoords[0]).toFixed(6)
                              const lng = Number(finalCoords[1]).toFixed(6)
                              const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
                              if (DEBUG) console.log('[Open] url', url)
                              window.open(url, "_blank", "noopener,noreferrer")
                            }}
                          >
                            Abrir en Google Maps
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <h3 className="text-base font-semibold mb-3">Productos</h3>
                    <div className="space-y-3">
                      {(orden.detalles || []).map((d, idx) => (
                        <div key={idx} className="flex items-center justify-between border rounded-md p-3">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 bg-muted rounded" />
                            <div>
                              <p className="text-sm font-medium">{d.producto?.nombre || `Producto ${d.id_producto}`}</p>
                              <p className="text-xs text-muted-foreground">{d.cantidad} x ${Number(d.precio_unitario ?? d.producto?.precio ?? 0).toFixed(2)}</p>
                            </div>
                          </div>
                          <div className="text-sm font-medium">${Number(d.subtotal ?? (d.cantidad * (d.precio_unitario ?? d.producto?.precio ?? 0))).toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Acciones</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <Button asChild variant="outline">
                    <Link href={`/dashboard-tienda/pedidos/${orden.id_orden}`}>Actualizar estado desde lista</Link>
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Usa la lista para cambiar el estado del pedido. Aquí mostramos la información completa del pedido.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}