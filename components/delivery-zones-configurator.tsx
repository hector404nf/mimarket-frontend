"use client"

import { useState, useEffect, useRef } from "react"
import L from "leaflet"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { toast } from "@/components/ui/use-toast"
import { MapPin, Plus, Trash2, Edit, Save, RotateCcw, Palette, Pipette, Shuffle, Check, Minus } from "lucide-react"
import { formatearPrecioParaguayo } from "@/lib/utils"

interface DeliveryZone {
  id: string
  name: string
  price: number
  estimatedTime: string
  color: string
  coordinates: { lat: number; lng: number }[]
  shape?: "polygon" | "circle"
  center?: { lat: number; lng: number }
  radius?: number
}

const vertexIcon = L.divIcon({
  className: "mimarket-vertex",
  html:
    '<div style="width:14px;height:14px;border-radius:50%;background:#111827;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

interface ColorOption {
  name: string
  value: string
  lightMode: string
  darkMode: string
}

const predefinedColors: ColorOption[] = [
  { name: "Azul Océano", value: "#3B82F6", lightMode: "#3B82F6", darkMode: "#60A5FA" },
  { name: "Verde Esmeralda", value: "#10B981", lightMode: "#10B981", darkMode: "#34D399" },
  { name: "Rojo Coral", value: "#EF4444", lightMode: "#EF4444", darkMode: "#F87171" },
  { name: "Púrpura Real", value: "#8B5CF6", lightMode: "#8B5CF6", darkMode: "#A78BFA" },
  { name: "Naranja Vibrante", value: "#F59E0B", lightMode: "#F59E0B", darkMode: "#FBBF24" },
  { name: "Rosa Fucsia", value: "#EC4899", lightMode: "#EC4899", darkMode: "#F472B6" },
  { name: "Turquesa", value: "#06B6D4", lightMode: "#06B6D4", darkMode: "#22D3EE" },
  { name: "Lima", value: "#84CC16", lightMode: "#84CC16", darkMode: "#A3E635" },
  { name: "Índigo", value: "#6366F1", lightMode: "#6366F1", darkMode: "#818CF8" },
  { name: "Ámbar", value: "#F59E0B", lightMode: "#F59E0B", darkMode: "#FBBF24" },
  { name: "Esmeralda", value: "#059669", lightMode: "#059669", darkMode: "#10B981" },
  { name: "Rosa", value: "#F472B6", lightMode: "#F472B6", darkMode: "#F9A8D4" },
  { name: "Violeta", value: "#7C3AED", lightMode: "#7C3AED", darkMode: "#8B5CF6" },
  { name: "Cian", value: "#0891B2", lightMode: "#0891B2", darkMode: "#06B6D4" },
  { name: "Amarillo", value: "#EAB308", lightMode: "#EAB308", darkMode: "#FACC15" },
  { name: "Magenta", value: "#D946EF", lightMode: "#D946EF", darkMode: "#E879F9" },
  { name: "Teal", value: "#0D9488", lightMode: "#0D9488", darkMode: "#14B8A6" },
  { name: "Slate", value: "#64748B", lightMode: "#64748B", darkMode: "#94A3B8" },
]

const quickColors = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E9",
  "#F8C471",
  "#82E0AA",
  "#F1948A",
  "#85C1E9",
  "#F4D03F",
  "#AED6F1",
  "#A9DFBF",
  "#F5B7B1",
  "#D7BDE2",
  "#A3E4D7",
]

export default function DeliveryZonesConfigurator({
  storeLocation,
  zones,
  onZonesChange,
}: {
  storeLocation?: [number, number]
  zones: DeliveryZone[]
  onZonesChange: (zones: DeliveryZone[]) => void
}) {
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [customColors, setCustomColors] = useState<string[]>([])

  // Form state
  const [zoneName, setZoneName] = useState("")
  const [zonePrice, setZonePrice] = useState("")
  const [zoneTime, setZoneTime] = useState("")
  const [selectedColor, setSelectedColor] = useState(predefinedColors[0].value)
  const [customColorValue, setCustomColorValue] = useState("#FF0000")
  const [customColorHex, setCustomColorHex] = useState("#FF0000")
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [zoneRadius, setZoneRadius] = useState(500)
  const [editingId, setEditingId] = useState<string | null>(null)

  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const currentPolygonRef = useRef<L.Polygon | null>(null)
  const activeMarkersRef = useRef<L.Marker[]>([])
  const isDrawingRef = useRef(false)
  const selectedColorRef = useRef(predefinedColors[0].value)
  const currentCircleRef = useRef<L.Circle | null>(null)
  const centerMarkerRef = useRef<L.Marker | null>(null)
  const zoneRadiusRef = useRef(500)
  const storeMarkerRef = useRef<L.Marker | null>(null)

  // Detectar tema oscuro
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"))
    }
    checkDarkMode()
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

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

  useEffect(() => {
    const tryInit = () => {
      const el = mapRef.current
      if (!el || isMapLoaded) return
      const ready = el.clientWidth > 0 && el.clientHeight > 0
      if (ready) {
        initializeMap()
      } else {
        setTimeout(tryInit, 100)
      }
    }
    tryInit()
  }, [isMapLoaded])

  useEffect(() => {
    isDrawingRef.current = isDrawing
  }, [isDrawing])

  useEffect(() => {
    selectedColorRef.current = selectedColor
  }, [selectedColor])

  useEffect(() => {
    zoneRadiusRef.current = zoneRadius
    if (currentCircleRef.current) {
      try { currentCircleRef.current.setRadius(zoneRadius) } catch {}
    }
  }, [zoneRadius])

  const initializeMap = () => {
    if (!mapRef.current) return
    try {
      setMapError(null)
      mapInstanceRef.current = L.map(mapRef.current).setView(storeLocation || [-25.2637, -57.5759], 13)
      if (storeLocation) {
        try {
          storeMarkerRef.current = L.marker(storeLocation as any).addTo(mapInstanceRef.current)
        } catch {}
      } else if (typeof navigator !== "undefined" && navigator.geolocation) {
        try {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const c: [number, number] = [pos.coords.latitude, pos.coords.longitude]
              try { mapInstanceRef.current?.setView(c, 14) } catch {}
            },
            () => {},
            { enableHighAccuracy: true, timeout: 5000 }
          )
        } catch {}
      }
      mapInstanceRef.current.on('load', () => setIsMapLoaded(true))
      const tl = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(mapInstanceRef.current)
      tl.on('load', () => setIsMapLoaded(true))
      setIsMapLoaded(true)

      setTimeout(() => {
        try { (mapInstanceRef.current as L.Map)?.invalidateSize() } catch {}
      }, 150)
      const ro = new ResizeObserver(() => {
        try { (mapInstanceRef.current as L.Map)?.invalidateSize() } catch {}
      })
      ro.observe(mapRef.current)

      mapInstanceRef.current.on("click", (e: L.LeafletMouseEvent) => {
        if (!isDrawingRef.current) return
        const map = mapInstanceRef.current as L.Map
        if (currentCircleRef.current) {
          try {
            currentCircleRef.current.setLatLng(e.latlng)
            if (centerMarkerRef.current) centerMarkerRef.current.setLatLng(e.latlng)
          } catch {}
        } else {
          try {
            currentCircleRef.current = L.circle(e.latlng, {
              color: selectedColorRef.current,
              weight: 2,
              opacity: 0.8,
              fillColor: selectedColorRef.current,
              fillOpacity: 0.3,
              radius: zoneRadiusRef.current,
            }).addTo(map)
            centerMarkerRef.current = L.marker(e.latlng, { draggable: true, icon: vertexIcon }).addTo(map)
            centerMarkerRef.current.on("drag", () => {
              const p = centerMarkerRef.current?.getLatLng()
              if (p && currentCircleRef.current) currentCircleRef.current.setLatLng(p)
            })
          } catch {}
        }
      })

      zones.forEach((z) => renderZoneOnMap(z))
    } catch (err: any) {
      setMapError(err?.message || "Error al inicializar el mapa")
    }
  }

  useEffect(() => {
    if (!mapInstanceRef.current || !storeLocation) return
    try {
      mapInstanceRef.current.setView(storeLocation, 14)
      if (storeMarkerRef.current) {
        storeMarkerRef.current.setLatLng(storeLocation as any)
      } else {
        storeMarkerRef.current = L.marker(storeLocation as any).addTo(mapInstanceRef.current)
      }
    } catch {}
  }, [storeLocation])

  const renderZoneOnMap = (zone: DeliveryZone) => {
    if (!mapInstanceRef.current) return
    if (zone.radius && zone.center) {
      const circle = L.circle(zone.center as any, {
        color: zone.color,
        weight: 2,
        opacity: 0.8,
        fillColor: zone.color,
        fillOpacity: 0.3,
        radius: zone.radius,
      }).addTo(mapInstanceRef.current)
      circle.bindTooltip(`${zone.name} • ₲${formatearPrecioParaguayo(zone.price)} • ${zone.estimatedTime}`)
    } else {
      const polygon = L.polygon(zone.coordinates as any, {
        color: zone.color,
        weight: 2,
        opacity: 0.8,
        fillColor: zone.color,
        fillOpacity: 0.3,
      }).addTo(mapInstanceRef.current)
      polygon.bindTooltip(`${zone.name} • ₲${formatearPrecioParaguayo(zone.price)} • ${zone.estimatedTime}`)
    }
  }

  useEffect(() => {
    if (currentPolygonRef.current) {
      currentPolygonRef.current.setStyle({ color: selectedColor, fillColor: selectedColor })
    }
    if (currentCircleRef.current) {
      try { currentCircleRef.current.setStyle({ color: selectedColor, fillColor: selectedColor }) } catch {}
    }
  }, [selectedColor])

  const handleColorSelect = (color: string) => {
    setSelectedColor(color)
    setShowColorPicker(false)
  }

  const handleCustomColorChange = (color: string) => {
    setCustomColorValue(color)
    setCustomColorHex(color)
    setSelectedColor(color)
  }

  const generateRandomColor = () => {
    const randomColor = `#${Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0")}`
    handleCustomColorChange(randomColor)
  }

  const addCustomColor = () => {
    if (!customColors.includes(customColorValue)) {
      setCustomColors((prev) => [...prev, customColorValue])
      toast({
        title: "Color personalizado añadido",
        description: "El color se ha guardado en tu paleta personalizada",
      })
    }
    setSelectedColor(customColorValue)
    setShowColorPicker(false)
  }

  const isValidHex = (hex: string) => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)
  }

  const handleHexInputChange = (value: string) => {
    setCustomColorHex(value)
    if (isValidHex(value)) {
      setCustomColorValue(value)
    }
  }

  const getUsedColors = () => {
    return zones.map((zone) => zone.color)
  }

  const resetForm = () => {
    setEditingId(null)
    setZoneName("")
    setZonePrice("")
    setZoneTime("")
    setSelectedColor(predefinedColors[0].value)
    setZoneRadius(500)
    if (currentPolygonRef.current) {
      currentPolygonRef.current.remove()
      currentPolygonRef.current = null
    }
    if (currentCircleRef.current) {
      currentCircleRef.current.remove()
      currentCircleRef.current = null
    }
    if (centerMarkerRef.current) {
      centerMarkerRef.current.remove()
      centerMarkerRef.current = null
    }
    activeMarkersRef.current.forEach((m) => m.remove())
    activeMarkersRef.current = []
  }

  const handleSaveZone = () => {
    if (!zoneName.trim() || !zonePrice || !zoneTime.trim()) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      })
      return
    }

    if (!currentCircleRef.current) {
      toast({
        title: "Zona no dibujada",
        description: "Haz clic en el mapa para agregar el círculo",
        variant: "destructive",
      })
      return
    }

    const center = currentCircleRef.current.getLatLng()
    const newZone: DeliveryZone = {
      id: editingId ?? Date.now().toString(),
      name: zoneName,
      price: Number.parseFloat(zonePrice),
      estimatedTime: zoneTime,
      color: selectedColor,
      coordinates: [],
      shape: "circle",
      center: { lat: center.lat, lng: center.lng },
      radius: zoneRadius,
    }

    if (editingId) {
      onZonesChange((zones || []).map((z) => (z.id === editingId ? newZone : z)))
      toast({ title: "Zona actualizada", description: `La zona "${zoneName}" ha sido actualizada` })
    } else {
      onZonesChange([...(zones || []), newZone])
      toast({ title: "Zona guardada", description: `La zona "${zoneName}" ha sido creada exitosamente` })
    }

    resetForm()
  }

  const loadZoneIntoForm = (zone: DeliveryZone) => {
    resetForm()
    setEditingId(zone.id)
    setZoneName(zone.name)
    setZonePrice(String(zone.price))
    setZoneTime(String(zone.estimatedTime))
    setSelectedColor(zone.color)
    if (zone.radius) setZoneRadius(Number(zone.radius))
    try {
      const map = mapInstanceRef.current as L.Map
      if (zone.center) {
        const c = L.latLng(zone.center.lat, zone.center.lng)
        currentCircleRef.current = L.circle(c, {
          color: zone.color,
          weight: 2,
          opacity: 0.8,
          fillColor: zone.color,
          fillOpacity: 0.3,
          radius: zone.radius || zoneRadiusRef.current,
        }).addTo(map)
        centerMarkerRef.current = L.marker(c, { draggable: true, icon: vertexIcon }).addTo(map)
        centerMarkerRef.current.on("drag", () => {
          const p = centerMarkerRef.current?.getLatLng()
          if (p && currentCircleRef.current) currentCircleRef.current.setLatLng(p)
        })
        try { map.setView(c, 14) } catch {}
      }
      setIsDrawing(true)
    } catch {}
  }

  const handleDeleteZone = (zoneId: string) => {
    onZonesChange((zones || []).filter((zone) => zone.id !== zoneId))
    toast({
      title: "Zona eliminada",
      description: "La zona ha sido eliminada correctamente",
    })
  }

  const usedColors = getUsedColors()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <MapPin className="h-5 w-5" />
                Zonas de Delivery
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Configura las zonas de entrega y sus precios</p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="zoneName">Nombre de la zona</Label>
                  <Input
                    id="zoneName"
                    value={zoneName}
                    onChange={(e) => setZoneName(e.target.value)}
                    placeholder="Ej: Centro Ciudad"
                  />
                </div>
                <div>
                  <Label htmlFor="zonePrice">Precio de delivery (₲)</Label>
                  <Input
                    id="zonePrice"
                    type="number"
                    step="0.01"
                    value={zonePrice}
                    onChange={(e) => setZonePrice(e.target.value)}
                    placeholder="5.99"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zoneRadius">Radio (m)</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="bg-transparent"
                    onClick={() => setZoneRadius(Math.max(10, zoneRadius - 100))}
                    title="-100m"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="zoneRadius"
                    type="number"
                    value={zoneRadius}
                    onChange={(e) => setZoneRadius(Number(e.target.value) || 0)}
                    placeholder="500"
                    className="w-24"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="bg-transparent"
                    onClick={() => setZoneRadius(zoneRadius + 100)}
                    title="+100m"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Slider value={[zoneRadius]} min={50} max={10000} onValueChange={(v) => setZoneRadius(v[0] || 50)} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="zoneTime">Tiempo de entrega</Label>
                  <Input
                    id="zoneTime"
                    value={zoneTime}
                    onChange={(e) => setZoneTime(e.target.value)}
                    placeholder="30-45 minutos"
                  />
                </div>
                <div>
                  <Label>Color de la zona</Label>
                  <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                        <div className="w-4 h-4 rounded border" style={{ backgroundColor: selectedColor }} />
                        <span className="font-mono text-xs">{selectedColor}</span>
                        <Palette className="h-4 w-4 ml-auto" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4" align="start">
                      <Tabs defaultValue="predefined" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="predefined">Predefinidos</TabsTrigger>
                          <TabsTrigger value="custom">Personalizado</TabsTrigger>
                        </TabsList>

                        <TabsContent value="predefined" className="space-y-4">
                          <div className="grid grid-cols-6 gap-2">
                            {predefinedColors.map((color) => {
                              const isUsed = usedColors.includes(color.value)
                              const currentColor = isDarkMode ? color.darkMode : color.lightMode

                              return (
                                <button
                                  key={color.value}
                                  onClick={() => !isUsed && handleColorSelect(color.value)}
                                  disabled={isUsed}
                                  className={`
                                    w-8 h-8 rounded border-2 transition-all relative
                                    ${selectedColor === color.value ? "border-foreground scale-110" : "border-border"}
                                    ${isUsed ? "opacity-50 cursor-not-allowed" : "hover:scale-105 cursor-pointer"}
                                  `}
                                  style={{ backgroundColor: currentColor }}
                                  title={`${color.name}${isUsed ? " (En uso)" : ""}`}
                                >
                                  {selectedColor === color.value && (
                                    <Check className="h-3 w-3 text-white absolute inset-0 m-auto" />
                                  )}
                                </button>
                              )
                            })}
                          </div>

                          {customColors.length > 0 && (
                            <div>
                              <Label className="text-sm font-medium">Colores personalizados</Label>
                              <div className="grid grid-cols-6 gap-2 mt-2">
                                {customColors.map((color, index) => {
                                  const isUsed = usedColors.includes(color)

                                  return (
                                    <button
                                      key={index}
                                      onClick={() => !isUsed && handleColorSelect(color)}
                                      disabled={isUsed}
                                      className={`
                                        w-8 h-8 rounded border-2 transition-all relative
                                        ${selectedColor === color ? "border-foreground scale-110" : "border-border"}
                                        ${isUsed ? "opacity-50 cursor-not-allowed" : "hover:scale-105 cursor-pointer"}
                                      `}
                                      style={{ backgroundColor: color }}
                                      title={`Color Personalizado ${index + 1}${isUsed ? " (En uso)" : ""}`}
                                    >
                                      {selectedColor === color && (
                                        <Check className="h-3 w-3 text-white absolute inset-0 m-auto" />
                                      )}
                                      <Pipette className="h-2 w-2 text-white absolute top-0 right-0" />
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="custom" className="space-y-4">
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor="colorPicker">Selector de color</Label>
                              <div className="flex gap-2 mt-1">
                                <input
                                  id="colorPicker"
                                  type="color"
                                  value={customColorValue}
                                  onChange={(e) => handleCustomColorChange(e.target.value)}
                                  className="w-12 h-10 rounded border cursor-pointer"
                                />
                                <div className="flex-1">
                                  <Input
                                    value={customColorHex}
                                    onChange={(e) => handleHexInputChange(e.target.value)}
                                    placeholder="#FF0000"
                                    className="font-mono"
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={generateRandomColor}
                                  title="Color aleatorio"
                                >
                                  <Shuffle className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <div>
                              <Label>Colores sugeridos</Label>
                              <div className="grid grid-cols-10 gap-1 mt-2">
                                {quickColors.map((color, index) => (
                                  <button
                                    key={index}
                                    onClick={() => handleCustomColorChange(color)}
                                    className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                                    style={{ backgroundColor: color }}
                                    title={color}
                                  />
                                ))}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                type="button"
                                onClick={addCustomColor}
                                className="flex-1"
                                disabled={!isValidHex(customColorHex) || usedColors.includes(customColorValue)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Usar este color
                              </Button>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleSaveZone} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Zona
                </Button>
                <Button variant="outline" onClick={resetForm} className="flex-1 bg-transparent">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Limpiar
                </Button>
                {/* <Button type="button" variant="secondary" onClick={() => setIsDrawing((v) => !v)} className="flex-1">
                  {isDrawing ? "Terminar Dibujo" : "Dibujar Zona"}
                </Button> */}
              </div>

              {isDrawing && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    🖱️ Haz clic en el mapa para colocar el círculo y arrastra el centro
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="relative">
                <div ref={mapRef} className="w-full h-64 lg:h-96 rounded-lg border" style={{ minHeight: "300px" }} />
                {!isMapLoaded && !mapError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Cargando mapa...</p>
                    </div>
                  </div>
                )}
                {mapError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
                    <div className="text-center p-4">
                      <p className="text-sm text-red-600 mb-2">Error al cargar el mapa</p>
                      <p className="text-xs text-muted-foreground">{mapError}</p>
                      <Button variant="outline" size="sm" onClick={initializeMap} className="mt-2 bg-transparent">
                        Reintentar
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {/* {storeLocation && (
                  <Button variant="outline" className="bg-transparent" onClick={() => {
                    try { mapInstanceRef.current?.setView(storeLocation, 14) } catch {}
                  }}>
                    Centrar en tienda
                  </Button>
                )} */}
                {/* <Button variant="outline" className="bg-transparent" onClick={() => {
                  if (typeof navigator !== "undefined" && navigator.geolocation) {
                    try {
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          try { mapInstanceRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 14) } catch {}
                        },
                        () => {}
                      )
                    } catch {}
                  }
                }}>
                  Mi ubicación
                </Button> */}
                <Button variant="outline" className="bg-transparent" onClick={() => {
                  const map = mapInstanceRef.current as L.Map
                  if (!map) return
                  const c = map.getCenter()
                  if (currentCircleRef.current) {
                    try {
                      currentCircleRef.current.setLatLng(c)
                      if (centerMarkerRef.current) centerMarkerRef.current.setLatLng(c)
                    } catch {}
                  } else {
                    try {
                      currentCircleRef.current = L.circle(c, {
                        color: selectedColorRef.current,
                        weight: 2,
                        opacity: 0.8,
                        fillColor: selectedColorRef.current,
                        fillOpacity: 0.3,
                        radius: zoneRadiusRef.current,
                      }).addTo(map)
                      centerMarkerRef.current = L.marker(c, { draggable: true, icon: vertexIcon }).addTo(map)
                      centerMarkerRef.current.on("drag", () => {
                        const p = centerMarkerRef.current?.getLatLng()
                        if (p && currentCircleRef.current) currentCircleRef.current.setLatLng(p)
                      })
                    } catch {}
                  }
                }}>
                  Agregar círculo
                </Button>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Pulsa "Agregar ciruclo"</p>
                <p>• Arrastra el punto central para mover el círculo</p>
                <p>• Ajusta el radio y pulsa "Guardar Zona"</p>
              </div>
            </div>
          </div>

          <div className="mt-6">
          {(!zones || zones.length === 0) ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No hay zonas de delivery configuradas</p>
              <p className="text-sm text-muted-foreground">Crea tu primera zona para comenzar a ofrecer delivery</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {zones.map((zone) => (
                  <Card key={zone.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border" style={{ backgroundColor: zone.color }} />
                          <h3 className="font-semibold text-sm md:text-base">{zone.name}</h3>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => loadZoneIntoForm(zone)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteZone(zone.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Precio:</span>
                          <span className="font-medium">{formatearPrecioParaguayo(zone.price)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tiempo:</span>
                          <span className="font-medium">{zone.estimatedTime}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Total: {zones.length} zona{zones.length !== 1 ? "s" : ""} configurada{zones.length !== 1 ? "s" : ""}
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button variant="outline" className="flex-1 sm:flex-none bg-transparent">
                    Exportar configuración
                  </Button>
                  <Button variant="outline" className="flex-1 sm:flex-none bg-transparent">
                    Vista previa
                  </Button>
                </div>
              </div> */}
            </div>
          )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
