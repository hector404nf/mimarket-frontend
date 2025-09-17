"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "@/components/ui/use-toast"
import { MapPin, Plus, Trash2, Edit, Save, RotateCcw, Palette, Pipette, Shuffle, Check } from "lucide-react"
import { loadGoogleMaps, isGoogleMapsLoaded } from "@/lib/google-maps-loader"

interface DeliveryZone {
  id: string
  name: string
  price: number
  time: string
  color: string
  coordinates: { lat: number; lng: number }[]
  area: number
}

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

export default function DeliveryZonesConfigurator() {
  const [zones, setZones] = useState<DeliveryZone[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
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

  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null)
  const currentPolygonRef = useRef<google.maps.Polygon | null>(null)

  // Detectar tema oscuro
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"))
    }

    checkDarkMode()

    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (isModalOpen && !isMapLoaded) {
      initializeMap()
    }
  }, [isModalOpen])

  const initializeMap = async () => {
    if (!mapRef.current) return

    try {
      setMapError(null)
      await loadGoogleMaps()

      if (!isGoogleMapsLoaded()) {
        throw new Error("Google Maps no se cargó correctamente")
      }

      // Configuración del mapa
      const mapOptions: google.maps.MapOptions = {
        center: { lat: -25.2637, lng: -57.5759 }, // Asunción
        zoom: 12,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        gestureHandling: "greedy",
        styles: isDarkMode
          ? [
              { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
              { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
              { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
              {
                featureType: "administrative.locality",
                elementType: "labels.text.fill",
                stylers: [{ color: "#d59563" }],
              },
              {
                featureType: "poi",
                elementType: "labels.text.fill",
                stylers: [{ color: "#d59563" }],
              },
              {
                featureType: "poi.park",
                elementType: "geometry",
                stylers: [{ color: "#263c3f" }],
              },
              {
                featureType: "poi.park",
                elementType: "labels.text.fill",
                stylers: [{ color: "#6b9a76" }],
              },
              {
                featureType: "road",
                elementType: "geometry",
                stylers: [{ color: "#38414e" }],
              },
              {
                featureType: "road",
                elementType: "geometry.stroke",
                stylers: [{ color: "#212a37" }],
              },
              {
                featureType: "road",
                elementType: "labels.text.fill",
                stylers: [{ color: "#9ca5b3" }],
              },
              {
                featureType: "road.highway",
                elementType: "geometry",
                stylers: [{ color: "#746855" }],
              },
              {
                featureType: "road.highway",
                elementType: "geometry.stroke",
                stylers: [{ color: "#1f2835" }],
              },
              {
                featureType: "road.highway",
                elementType: "labels.text.fill",
                stylers: [{ color: "#f3d19c" }],
              },
              {
                featureType: "transit",
                elementType: "geometry",
                stylers: [{ color: "#2f3948" }],
              },
              {
                featureType: "transit.station",
                elementType: "labels.text.fill",
                stylers: [{ color: "#d59563" }],
              },
              {
                featureType: "water",
                elementType: "geometry",
                stylers: [{ color: "#17263c" }],
              },
              {
                featureType: "water",
                elementType: "labels.text.fill",
                stylers: [{ color: "#515c6d" }],
              },
              {
                featureType: "water",
                elementType: "labels.text.stroke",
                stylers: [{ color: "#17263c" }],
              },
            ]
          : [],
      }

      // Crear el mapa
      mapInstanceRef.current = new google.maps.Map(mapRef.current, mapOptions)

      // Configurar Drawing Manager
      drawingManagerRef.current = new google.maps.drawing.DrawingManager({
        drawingMode: null,
        drawingControl: true,
        drawingControlOptions: {
          position: google.maps.ControlPosition.TOP_CENTER,
          drawingModes: [google.maps.drawing.OverlayType.POLYGON],
        },
        polygonOptions: {
          fillColor: selectedColor,
          fillOpacity: 0.3,
          strokeColor: selectedColor,
          strokeOpacity: 0.8,
          strokeWeight: 2,
          clickable: false,
          editable: true,
          draggable: false,
        },
      })

      drawingManagerRef.current.setMap(mapInstanceRef.current)

      // Event listeners
      drawingManagerRef.current.addListener("overlaycomplete", (event: google.maps.drawing.OverlayCompleteEvent) => {
        if (event.type === google.maps.drawing.OverlayType.POLYGON) {
          currentPolygonRef.current = event.overlay as google.maps.Polygon
          setIsDrawing(false)

          // Calcular área aproximada
          const path = currentPolygonRef.current.getPath()
          const area = google.maps.geometry.spherical.computeArea(path)

          toast({
            title: "Zona dibujada",
            description: `Área aproximada: ${(area / 1000000).toFixed(2)} km²`,
          })
        }
      })

      drawingManagerRef.current.addListener("drawingmode_changed", () => {
        const mode = drawingManagerRef.current?.getDrawingMode()
        setIsDrawing(mode === google.maps.drawing.OverlayType.POLYGON)
      })

      // Renderizar zonas existentes
      zones.forEach((zone) => {
        renderZoneOnMap(zone)
      })

      setIsMapLoaded(true)

      toast({
        title: "Mapa cargado",
        description: "El mapa está listo para configurar zonas de delivery",
      })
    } catch (error) {
      console.error("Error loading map:", error)
      setMapError(error instanceof Error ? error.message : "Error desconocido al cargar el mapa")

      toast({
        title: "Error al cargar el mapa",
        description: "Verifica tu conexión a internet y la clave de API",
        variant: "destructive",
      })
    }
  }

  const renderZoneOnMap = (zone: DeliveryZone) => {
    if (!mapInstanceRef.current) return

    const polygon = new google.maps.Polygon({
      paths: zone.coordinates,
      fillColor: zone.color,
      fillOpacity: 0.3,
      strokeColor: zone.color,
      strokeOpacity: 0.8,
      strokeWeight: 2,
      clickable: true,
    })

    polygon.setMap(mapInstanceRef.current)

    // Info window
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div class="p-2">
          <h3 class="font-semibold">${zone.name}</h3>
          <p class="text-sm">Precio: ₲{(zone.price * 7400).toLocaleString()}</p>
          <p class="text-sm">Tiempo: ${zone.time}</p>
        </div>
      `,
    })

    polygon.addListener("click", (event: google.maps.PolygonMouseEvent) => {
      infoWindow.setPosition(event.latLng)
      infoWindow.open(mapInstanceRef.current)
    })
  }

  const updateDrawingColor = useCallback((color: string) => {
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setOptions({
        polygonOptions: {
          fillColor: color,
          fillOpacity: 0.3,
          strokeColor: color,
          strokeOpacity: 0.8,
          strokeWeight: 2,
          clickable: false,
          editable: true,
          draggable: false,
        },
      })
    }

    if (currentPolygonRef.current) {
      currentPolygonRef.current.setOptions({
        fillColor: color,
        strokeColor: color,
      })
    }
  }, [])

  useEffect(() => {
    updateDrawingColor(selectedColor)
  }, [selectedColor, updateDrawingColor])

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
    setZoneName("")
    setZonePrice("")
    setZoneTime("")
    setSelectedColor(predefinedColors[0].value)
    if (currentPolygonRef.current) {
      currentPolygonRef.current.setMap(null)
      currentPolygonRef.current = null
    }
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

    if (!currentPolygonRef.current) {
      toast({
        title: "Zona no dibujada",
        description: "Por favor dibuja una zona en el mapa",
        variant: "destructive",
      })
      return
    }

    const path = currentPolygonRef.current.getPath()
    const coordinates: google.maps.LatLng[] = []

    for (let i = 0; i < path.getLength(); i++) {
      coordinates.push(path.getAt(i))
    }

    const area = google.maps.geometry.spherical.computeArea(path)

    const newZone: DeliveryZone = {
      id: Date.now().toString(),
      name: zoneName,
      price: Number.parseFloat(zonePrice),
      time: zoneTime,
      color: selectedColor,
      coordinates,
      area,
    }

    setZones((prev) => [...prev, newZone])

    toast({
      title: "Zona guardada",
      description: `La zona "${zoneName}" ha sido creada exitosamente`,
    })

    resetForm()
    setIsModalOpen(false)
  }

  const handleDeleteZone = (zoneId: string) => {
    setZones((prev) => prev.filter((zone) => zone.id !== zoneId))
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
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Nueva Zona
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg md:text-xl">Crear Nueva Zona de Delivery</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Formulario */}
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
                    </div>

                    {isDrawing && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          🖱️ Haz clic en el mapa para dibujar la zona de delivery
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Mapa */}
                  <div className="space-y-4">
                    <div className="relative">
                      <div
                        ref={mapRef}
                        className="w-full h-64 lg:h-96 rounded-lg border"
                        style={{ minHeight: "300px" }}
                      />

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

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>• Selecciona la herramienta de polígono en el mapa</p>
                      <p>• Haz clic para crear puntos y formar la zona</p>
                      <p>• Haz clic en el primer punto para cerrar la zona</p>
                      <p>• Puedes editar la zona arrastrando los puntos</p>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {zones.length === 0 ? (
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
                          <Button variant="ghost" size="icon" className="h-8 w-8">
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
                          <span className="font-medium">${zone.price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tiempo:</span>
                          <span className="font-medium">{zone.time}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Área:</span>
                          <span className="font-medium">{(zone.area / 1000000).toFixed(2)} km²</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t">
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
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
