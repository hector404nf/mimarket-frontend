"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { MapPin, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface MapSelectorProps {
  onLocationSelect: (coordinates: [number, number]) => void
  initialLocation?: [number, number]
}

declare global {
  interface Window {
    google: any
    initMap: () => void
  }
}

export default function MapSelector({ onLocationSelect, initialLocation }: MapSelectorProps) {
  const [coordinates, setCoordinates] = useState<[number, number]>(initialLocation || [-25.2637, -57.5759])
  const [isClient, setIsClient] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  useEffect(() => {
    setIsClient(true)
    if (initialLocation) {
      setCoordinates(initialLocation)
    }
  }, [initialLocation])

  useEffect(() => {
    if (!isClient) return

    // Verificar si Google Maps ya está cargado
    if (window.google && window.google.maps) {
      initializeMap()
      return
    }

    // Cargar Google Maps API
    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCZukkglTPUl6jm2sBfgxikMjlFKwyp5jY&libraries=places`
    script.async = true
    script.defer = true

    script.onload = () => {
      initializeMap()
    }

    script.onerror = () => {
      toast({
        title: "Error al cargar el mapa",
        description: "No se pudo cargar Google Maps. Verifica tu conexión.",
        variant: "destructive",
      })
    }

    document.head.appendChild(script)

    return () => {
      // Cleanup si es necesario
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [isClient])

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return

    const mapOptions = {
      center: { lat: coordinates[0], lng: coordinates[1] },
      zoom: 15,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
      gestureHandling: "cooperative",
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "on" }],
        },
      ],
    }

    // Crear el mapa
    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, mapOptions)

    // Crear el marcador draggable
    markerRef.current = new window.google.maps.Marker({
      position: { lat: coordinates[0], lng: coordinates[1] },
      map: mapInstanceRef.current,
      draggable: true,
      title: "Arrastra para cambiar la ubicación",
      animation: window.google.maps.Animation.DROP,
    })

    // Evento cuando se arrastra el marcador
    markerRef.current.addListener("dragend", (event: any) => {
      const newLat = event.latLng.lat()
      const newLng = event.latLng.lng()
      const newCoords: [number, number] = [newLat, newLng]

      setCoordinates(newCoords)
      onLocationSelect(newCoords)

      toast({
        title: "Ubicación actualizada",
        description: "Marcador movido a nueva posición",
      })
    })

    // Evento cuando se hace clic en el mapa
    mapInstanceRef.current.addListener("click", (event: any) => {
      const newLat = event.latLng.lat()
      const newLng = event.latLng.lng()
      const newCoords: [number, number] = [newLat, newLng]

      // Mover el marcador a la nueva posición
      markerRef.current.setPosition({ lat: newLat, lng: newLng })

      setCoordinates(newCoords)
      onLocationSelect(newCoords)

      toast({
        title: "Ubicación actualizada",
        description: "Marcador movido con clic",
      })
    })

    setIsMapLoaded(true)
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocalización no disponible",
        description: "Tu navegador no soporta geolocalización",
        variant: "destructive",
      })
      return
    }

    setIsGettingLocation(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const newCoords: [number, number] = [latitude, longitude]

        setCoordinates(newCoords)
        onLocationSelect(newCoords)

        // Actualizar mapa y marcador si están cargados
        if (mapInstanceRef.current && markerRef.current) {
          const newPosition = { lat: latitude, lng: longitude }
          mapInstanceRef.current.setCenter(newPosition)
          markerRef.current.setPosition(newPosition)
        }

        setIsGettingLocation(false)

        toast({
          title: "Ubicación detectada",
          description: "Se ha establecido tu ubicación actual",
        })
      },
      (error) => {
        setIsGettingLocation(false)
        let errorMessage = "No se pudo obtener tu ubicación"

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Permiso de ubicación denegado. Por favor, permite el acceso a tu ubicación."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Ubicación no disponible en este momento"
            break
          case error.TIMEOUT:
            errorMessage = "Tiempo de espera agotado al obtener la ubicación"
            break
        }

        toast({
          title: "Error de ubicación",
          description: errorMessage,
          variant: "destructive",
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    )
  }

  const centerMapOnMarker = () => {
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setCenter(markerRef.current.getPosition())
      mapInstanceRef.current.setZoom(15)

      toast({
        title: "Mapa centrado",
        description: "Vista centrada en el marcador",
      })
    }
  }

  if (!isClient) {
    return <div className="h-64 bg-muted rounded-lg animate-pulse" />
  }

  return (
    <div className="space-y-4">
      <div className="relative h-64 w-full rounded-lg overflow-hidden border">
        <div ref={mapRef} className="w-full h-full" />

        {!isMapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Cargando mapa...</p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="text-sm">
          <span className="font-medium">Coordenadas seleccionadas:</span>{" "}
          <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
            {coordinates[0].toFixed(6)}, {coordinates[1].toFixed(6)}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={getCurrentLocation} disabled={isGettingLocation} className="flex-1">
            {isGettingLocation ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Obteniendo ubicación...
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 mr-2" />
                Usar mi ubicación actual
              </>
            )}
          </Button>

          <Button onClick={centerMapOnMarker} variant="outline" disabled={!isMapLoaded}>
            Centrar mapa
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            • <strong>Clic en el mapa:</strong> Mover marcador a esa posición
          </p>
          <p>
            • <strong>Arrastrar marcador:</strong> Posicionar con precisión
          </p>
          <p>
            • <strong>Arrastrar mapa:</strong> Navegar libremente por la zona
          </p>
          <p>
            • <strong>Zoom:</strong> Usar controles del mapa o rueda del mouse
          </p>
          <p>
            • <strong>Vista satélite:</strong> Cambiar tipo de mapa en controles
          </p>
        </div>
      </div>
    </div>
  )
}
