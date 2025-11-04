"use client"

import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from "react"
import L from "leaflet"
// Fix marker icons when bundling with Next.js
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// Usamos un DivIcon simple para evitar problemas de bundling con imágenes
const customIcon = L.divIcon({
  className: "mimarket-marker",
  html:
    '<div style="width:24px;height:24px;border-radius:50%;background:#ef4444;border:2px solid white;box-shadow:0 1px 6px rgba(0,0,0,0.4)"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

interface MapSelectorLeafletProps {
  onLocationSelect: (coordinates: [number, number]) => void
  initialLocation?: [number, number]
  initialAddress?: string
  onMapReady?: (mapRef: MapSelectorLeafletRef) => void
  /** Cuando false, el mapa y el marcador no permiten interacción */
  interactive?: boolean
}

export interface MapSelectorLeafletRef {
  centerMapOnCoordinates: (coordinates: [number, number]) => void
}

const MapSelectorLeaflet = forwardRef<MapSelectorLeafletRef, MapSelectorLeafletProps>(
  ({ onLocationSelect, initialLocation, initialAddress, onMapReady, interactive = true }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<L.Map | null>(null)
    const markerRef = useRef<L.Marker | null>(null)
    const [coordinates, setCoordinates] = useState<[number, number]>(
      initialLocation || [-25.2637, -57.5759] // Asunción por defecto
    )

    useImperativeHandle(ref, () => ({
      centerMapOnCoordinates: (newCoordinates: [number, number]) => {
        if (!mapRef.current) return
        mapRef.current.setView(newCoordinates, 15)
        if (markerRef.current) {
          markerRef.current.setLatLng(newCoordinates as any)
        }
      },
    }))

    useEffect(() => {
      // Inject Leaflet CSS from CDN to avoid Next.js global CSS import constraints
      const existing = document.querySelector<HTMLLinkElement>("link[data-leaflet-css]")
      if (!existing) {
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        link.setAttribute("data-leaflet-css", "true")
        document.head.appendChild(link)
      }

      if (!containerRef.current) return

      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current).setView(coordinates, 15)
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 19,
        }).addTo(mapRef.current)

        markerRef.current = L.marker(coordinates, { draggable: interactive, icon: customIcon }).addTo(mapRef.current)

        if (interactive) {
          markerRef.current.on("dragend", () => {
            if (!markerRef.current) return
            const pos = markerRef.current.getLatLng()
            const newCoords: [number, number] = [pos.lat, pos.lng]
            setCoordinates(newCoords)
            onLocationSelect(newCoords)
          })

          mapRef.current.on("click", (e: L.LeafletMouseEvent) => {
            const newCoords: [number, number] = [e.latlng.lat, e.latlng.lng]
            setCoordinates(newCoords)
            if (markerRef.current) markerRef.current.setLatLng(e.latlng)
            onLocationSelect(newCoords)
          })
        } else {
          // Deshabilitar todas las interacciones del mapa
          mapRef.current.dragging.disable()
          mapRef.current.touchZoom.disable()
          mapRef.current.doubleClickZoom.disable()
          mapRef.current.scrollWheelZoom.disable()
          mapRef.current.boxZoom.disable()
          mapRef.current.keyboard.disable()
          // Quitar controles de zoom si existen
          if ((mapRef.current as any).zoomControl) {
            (mapRef.current as any).zoomControl.remove()
          }
        }

        if (onMapReady) {
          onMapReady({
            centerMapOnCoordinates: (c: [number, number]) => {
              if (!mapRef.current) return
              mapRef.current.setView(c, 15)
              if (markerRef.current) markerRef.current.setLatLng(c as any)
            },
          })
        }
      }
    }, [])

    // Geocodificar dirección inicial con Nominatim si no hay coordenadas
    useEffect(() => {
      const geocodeWithNominatim = async (address: string) => {
        try {
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            address
          )}&limit=1&addressdetails=1`
          const res = await fetch(url, {
            headers: {
              Accept: "application/json",
            },
          })
          const data = (await res.json()) as Array<{ lat: string; lon: string }>
          if (data && data[0]) {
            const lat = parseFloat(data[0].lat)
            const lon = parseFloat(data[0].lon)
            const newCoords: [number, number] = [lat, lon]
            setCoordinates(newCoords)
            if (mapRef.current) mapRef.current.setView(newCoords, 15)
            if (markerRef.current) markerRef.current.setLatLng([lat, lon] as any)
            onLocationSelect(newCoords)
          }
        } catch (err) {
          console.warn("Nominatim geocoding failed", err)
        }
      }

      if (!initialLocation && initialAddress && mapRef.current) {
        geocodeWithNominatim(initialAddress)
      }
    }, [initialAddress, initialLocation])

    return <div ref={containerRef} className="w-full h-64 rounded-lg border border-border" />
  }
)

MapSelectorLeaflet.displayName = "MapSelectorLeaflet"

export default MapSelectorLeaflet