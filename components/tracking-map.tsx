"use client"

import { useEffect, useRef, useState } from "react"
import { routingService } from "@/lib/api/routing"
import L from "leaflet"

type LatLng = { lat: number; lng: number }

interface TrackingMapProps {
  destination: LatLng
  tracking: boolean
  onPositionUpdate?: (pos: LatLng | null) => void
  debug?: boolean
  // Posición externa (por ejemplo, del repartidor) para modo lectura
  originExternal?: LatLng | null
}

// Simple div icons to avoid asset issues
const redIcon = L.divIcon({
  className: "mimarket-marker-dest",
  html:
    '<div style="width:22px;height:22px;border-radius:50%;background:#ef4444;border:2px solid white;box-shadow:0 1px 6px rgba(0,0,0,0.4)"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

const blueIcon = L.divIcon({
  className: "mimarket-marker-origin",
  html:
    '<div style="width:22px;height:22px;border-radius:50%;background:#3b82f6;border:2px solid white;box-shadow:0 1px 6px rgba(0,0,0,0.4)"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

export default function TrackingMap({ destination, tracking, onPositionUpdate, debug = false, originExternal = null }: TrackingMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const destMarkerRef = useRef<L.Marker | null>(null)
  const originMarkerRef = useRef<L.Marker | null>(null)
  const routeLayerRef = useRef<L.GeoJSON | null>(null)
  const lastRouteFetchRef = useRef<number>(0)
  const lastRouteOriginRef = useRef<LatLng | null>(null)
  const ROUTE_FETCH_INTERVAL_MS = 12000
  const routePolylineRef = useRef<L.Polyline | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const [origin, setOrigin] = useState<LatLng | null>(null)
  const [permState, setPermState] = useState<"granted" | "prompt" | "denied" | "unknown">("unknown")
  const [watchActive, setWatchActive] = useState(false)
  const [lastError, setLastError] = useState<{ code?: number; message?: string } | null>(null)
  const [lastOptions, setLastOptions] = useState<{ enableHighAccuracy: boolean; maximumAge: number; timeout: number } | null>(null)
  const [lastFixTime, setLastFixTime] = useState<string | null>(null)
  const [manualMode, setManualMode] = useState(false)
  const simTimerRef = useRef<number | null>(null)

  // Inject Leaflet CSS
  useEffect(() => {
    const existing = document.querySelector<HTMLLinkElement>("link[data-leaflet-css]")
    if (!existing) {
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      link.setAttribute("data-leaflet-css", "true")
      document.head.appendChild(link)
    }
  }, [])

  // Initialize map
  useEffect(() => {
    if (!containerRef.current) return
    if (mapRef.current) return

    const initialCenter: [number, number] = [destination.lat, destination.lng]
    mapRef.current = L.map(containerRef.current).setView(initialCenter, 15)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(mapRef.current)

    destMarkerRef.current = L.marker(initialCenter, { icon: redIcon }).addTo(mapRef.current)

    // Map click to set manual origin
    mapRef.current.on("click", (e: any) => {
      if (!manualMode) return
      const latlng = e?.latlng
      if (!latlng) return
      const current: LatLng = { lat: latlng.lat, lng: latlng.lng }
      setOrigin(current)
      onPositionUpdate?.(current)
      setLastFixTime(new Date().toISOString())
    })
  }, [destination])

  // Update destination marker when prop changes
  useEffect(() => {
    if (!mapRef.current) return
    const newPos: [number, number] = [destination.lat, destination.lng]
    if (destMarkerRef.current) {
      destMarkerRef.current.setLatLng(newPos as any)
    } else {
      destMarkerRef.current = L.marker(newPos, { icon: redIcon }).addTo(mapRef.current)
    }
    mapRef.current.setView(newPos, 15)
  }, [destination.lat, destination.lng])

  // Permitir actualizar el origen desde props externas (modo lectura)
  useEffect(() => {
    if (!originExternal) return
    const current: LatLng = { lat: originExternal.lat, lng: originExternal.lng }
    setOrigin(current)
    onPositionUpdate?.(current)
    setLastFixTime(new Date().toISOString())
  }, [originExternal?.lat, originExternal?.lng])

  // Watch geolocation when tracking
  useEffect(() => {
    const stopWatch = () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      setWatchActive(false)
    }

    if (!tracking) {
      stopWatch()
      return
    }

    if (manualMode) {
      // En modo manual no iniciamos watch
      stopWatch()
      return
    }

    if (!("geolocation" in navigator)) {
      console.warn("Geolocation no soportada")
      return
    }

    const startWatch = (highAccuracy: boolean) => {
      const options = {
        enableHighAccuracy: highAccuracy,
        maximumAge: highAccuracy ? 5000 : 20000,
        timeout: highAccuracy ? 15000 : 30000,
      }
      setLastOptions(options)
      if (debug) {
        console.groupCollapsed("[Geoloc] startWatch")
        console.log("options", options)
        console.log("permState", permState)
        console.groupEnd()
      }
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const current: LatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setOrigin(current)
          onPositionUpdate?.(current)
          setLastError(null)
          setLastFixTime(new Date().toISOString())
        },
        (err) => {
          const code = (err as GeolocationPositionError).code
          const msg = (err as GeolocationPositionError).message
          setLastError({ code, message: msg })
          if (debug) {
            console.groupCollapsed("[Geoloc] error")
            console.log("code", code, "message", msg)
            console.groupEnd()
          }
          // 1: PERMISSION_DENIED, 2: POSITION_UNAVAILABLE, 3: TIMEOUT
          if (code === 3 || code === 2) {
            // Fallback: intentar con menor precisión y mayor tiempo
            if (watchIdRef.current !== null) {
              navigator.geolocation.clearWatch(watchIdRef.current)
              watchIdRef.current = null
            }
            if (highAccuracy) {
              startWatch(false)
            }
          }
        },
        options
      )
      setWatchActive(true)
    }

    // Seed initial position to trigger permission prompt and reduce time-to-first-fix
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const current: LatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setOrigin(current)
        onPositionUpdate?.(current)
        setLastError(null)
        setLastFixTime(new Date().toISOString())
      },
      (err) => {
        const code = (err as GeolocationPositionError).code
        const msg = (err as GeolocationPositionError).message
        setLastError({ code, message: msg })
        if (debug) console.warn("Error geolocalización (initial):", msg)
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    )

    // Start watch with high accuracy, fallback handled in handler
    startWatch(true)

    return () => stopWatch()
  }, [tracking, onPositionUpdate, debug, permState])

  // Permissions state (chrome/edge soportado)
  useEffect(() => {
    let canceled = false
    const updatePerm = async () => {
      try {
        // @ts-ignore: geolocation está en PermissionName en navegadores modernos
        const p = await (navigator as any).permissions?.query?.({ name: "geolocation" })
        if (p && !canceled) {
          setPermState(p.state || "unknown")
          p.onchange = () => setPermState(p.state || "unknown")
        }
      } catch {
        setPermState("unknown")
      }
    }
    updatePerm()
    return () => {
      canceled = true
    }
  }, [])

  // Simulation mode: move origin towards destination when manual mode enabled
  useEffect(() => {
    const stopSim = () => {
      if (simTimerRef.current !== null) {
        window.clearInterval(simTimerRef.current)
        simTimerRef.current = null
      }
    }

    if (!manualMode) {
      stopSim()
      return
    }

    // if no origin yet, seed near destination
    if (!origin) {
      const seed: LatLng = {
        lat: destination.lat + (Math.random() - 0.5) * 0.01,
        lng: destination.lng + (Math.random() - 0.5) * 0.01,
      }
      setOrigin(seed)
      onPositionUpdate?.(seed)
    }

    simTimerRef.current = window.setInterval(() => {
      if (!origin) return
      const step = 0.0003
      const dx = destination.lng - origin.lng
      const dy = destination.lat - origin.lat
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < step) {
        stopSim()
        return
      }
      const nx = origin.lng + (dx / dist) * step
      const ny = origin.lat + (dy / dist) * step
      const next: LatLng = { lat: ny, lng: nx }
      setOrigin(next)
      onPositionUpdate?.(next)
      setLastFixTime(new Date().toISOString())
    }, 1500)

    return () => stopSim()
  }, [manualMode, origin, destination, onPositionUpdate])

  // Update origin marker and route when origin changes
  useEffect(() => {
    if (!mapRef.current || !origin) return

    const originPos: [number, number] = [origin.lat, origin.lng]
    if (originMarkerRef.current) {
      originMarkerRef.current.setLatLng(originPos as any)
    } else {
      originMarkerRef.current = L.marker(originPos, { icon: blueIcon }).addTo(mapRef.current)
    }

    // Fit bounds to include both points
    const bounds = L.latLngBounds([originPos, [destination.lat, destination.lng]])
    mapRef.current.fitBounds(bounds, { padding: [40, 40] })

    // Throttle route fetches to avoid network/resource exhaustion
    const now = Date.now()
    const last = lastRouteFetchRef.current || 0
    // Small distance threshold (~30 m) to skip minor updates
    const distMeters = (() => {
      const prev = lastRouteOriginRef.current
      if (!prev) return Infinity
      const R = 6371000
      const dLat = ((origin.lat - prev.lat) * Math.PI) / 180
      const dLng = ((origin.lng - prev.lng) * Math.PI) / 180
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((prev.lat * Math.PI) / 180) *
          Math.cos((origin.lat * Math.PI) / 180) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return R * c
    })()

    if (now - last < ROUTE_FETCH_INTERVAL_MS || distMeters < 30) {
      if (debug) {
        console.debug(
          `[OSRM] skip fetch: interval ${(now - last)}ms (<${ROUTE_FETCH_INTERVAL_MS}) | dist ${Math.round(
            distMeters
          )}m (<30)`
        )
      }
      return
    }

    lastRouteFetchRef.current = now
    lastRouteOriginRef.current = origin

    // Solicitar ruta vía backend (proxy OSRM) sin abortar del lado cliente
    routingService
      .driving({ lat: origin.lat, lng: origin.lng }, { lat: destination.lat, lng: destination.lng })
      .then((data) => {
        if (!data?.ok || !data.geometry) {
          // Fallback: línea directa si el backend no devuelve ruta
          if (debug) console.debug("[Routing] sin ruta, dibujando fallback")
          if (routePolylineRef.current) {
            routePolylineRef.current.remove()
            routePolylineRef.current = null
          }
          const destPos: [number, number] = [destination.lat, destination.lng]
          routePolylineRef.current = L.polyline([originPos, destPos], {
            color: "#10b981",
            weight: 3,
            opacity: 0.7,
            dashArray: "6 6",
          }).addTo(mapRef.current!)
          return
        }
        // Dibujar ruta exacta
        if (routeLayerRef.current) {
          routeLayerRef.current.remove()
          routeLayerRef.current = null
        }
        if (routePolylineRef.current) {
          routePolylineRef.current.remove()
          routePolylineRef.current = null
        }
        routeLayerRef.current = L.geoJSON(data.geometry as any, {
          style: { color: "#10b981", weight: 5, opacity: 0.7 },
        }).addTo(mapRef.current!)
      })
      .catch((err) => {
        console.warn("Error en routing backend:", err)
        // Fallback: línea directa entre origen y destino
        if (routePolylineRef.current) {
          routePolylineRef.current.remove()
          routePolylineRef.current = null
        }
        const destPos: [number, number] = [destination.lat, destination.lng]
        routePolylineRef.current = L.polyline([originPos, destPos], {
          color: "#10b981",
          weight: 3,
          opacity: 0.7,
          dashArray: "6 6",
        }).addTo(mapRef.current!)
      })
  }, [origin, destination.lat, destination.lng])

  return (
    <div>
      <div ref={containerRef} className="w-full h-80 rounded-lg border border-border" />
      {debug && (
        <div className="mt-2 p-2 border rounded bg-muted text-xs text-muted-foreground">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div>Permisos: {permState}</div>
              <div>Tracking activo: {watchActive ? "sí" : "no"}</div>
              <div>watchId: {watchIdRef.current ?? "-"}</div>
              <div>Modo manual: {manualMode ? "activo" : "inactivo"}</div>
            </div>
            <div>
              <div>
                Opciones: {lastOptions ? `${lastOptions.enableHighAccuracy ? "alta" : "baja"} / timeout ${lastOptions.timeout} / maxAge ${lastOptions.maximumAge}` : "-"}
              </div>
              <div>Último fix: {lastFixTime ?? "-"}</div>
              <div>
                Último error: {lastError ? `${lastError.code} - ${lastError.message}` : "-"}
              </div>
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            <button
              className="px-2 py-1 border rounded"
              onClick={() => {
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    const current: LatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude }
                    setOrigin(current)
                    onPositionUpdate?.(current)
                    setLastError(null)
                    setLastFixTime(new Date().toISOString())
                  },
                  (err) => {
                    const code = (err as GeolocationPositionError).code
                    const msg = (err as GeolocationPositionError).message
                    setLastError({ code, message: msg })
                  },
                  { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
                )
              }}
            >
              Reintentar fix
            </button>
            <button
              className="px-2 py-1 border rounded"
              onClick={() => {
                if (watchIdRef.current !== null) {
                  navigator.geolocation.clearWatch(watchIdRef.current)
                  watchIdRef.current = null
                }
                setWatchActive(false)
                // Reiniciar en alta precisión
                const options = { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
                setLastOptions(options)
                watchIdRef.current = navigator.geolocation.watchPosition(
                  (pos) => {
                    const current: LatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude }
                    setOrigin(current)
                    onPositionUpdate?.(current)
                    setLastError(null)
                    setLastFixTime(new Date().toISOString())
                  },
                  (err) => {
                    const code = (err as GeolocationPositionError).code
                    const msg = (err as GeolocationPositionError).message
                    setLastError({ code, message: msg })
                  },
                  options
                )
                setWatchActive(true)
              }}
            >
              Reiniciar seguimiento
            </button>
            <button
              className="px-2 py-1 border rounded"
              onClick={() => {
                const next = !manualMode
                setManualMode(next)
                // Al activar manual, detener cualquier watch activo
                if (next && watchIdRef.current !== null) {
                  navigator.geolocation.clearWatch(watchIdRef.current)
                  watchIdRef.current = null
                  setWatchActive(false)
                }
              }}
            >
              {manualMode ? "Desactivar modo manual" : "Activar modo manual"}
            </button>
            <span className="self-center">Click en el mapa para fijar origen</span>
          </div>
          <div className="mt-2 text-[11px]">
            Consejos: activa Wi‑Fi y servicios de ubicación de Windows; si ves código 2 (POSITION_UNAVAILABLE), usa modo manual o reintenta.
          </div>
        </div>
      )}
    </div>
  )
}