"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Save, Clock, Phone, Globe, Truck, Bell, Shield, CreditCard } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import MapSelector from "@/components/map-selector"
import DeliveryZonesConfigurator from "@/components/delivery-zones-configurator"

interface DeliveryZone {
  id: string
  name: string
  price: number
  estimatedTime: string
  coordinates: Array<{ lat: number; lng: number }>
  color: string
}

interface StoreConfig {
  // Información básica
  storeName: string
  description: string
  category: string
  logo: string
  banner: string

  // Contacto
  phone: string
  email: string
  website: string
  address: string
  coordinates: [number, number]

  // Horarios
  schedule: {
    [key: string]: {
      isOpen: boolean
      openTime: string
      closeTime: string
    }
  }

  // Delivery
  deliveryEnabled: boolean
  deliveryZones: DeliveryZone[]
  freeDeliveryMinimum: number

  // Políticas
  returnPolicy: string
  shippingPolicy: string
  privacyPolicy: string

  // Pagos
  acceptedPayments: string[]

  // Notificaciones
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
}

const defaultConfig: StoreConfig = {
  storeName: "",
  description: "",
  category: "",
  logo: "",
  banner: "",
  phone: "",
  email: "",
  website: "",
  address: "",
  coordinates: [40.4168, -3.7038],
  schedule: {
    monday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
    tuesday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
    wednesday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
    thursday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
    friday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
    saturday: { isOpen: true, openTime: "10:00", closeTime: "16:00" },
    sunday: { isOpen: false, openTime: "10:00", closeTime: "16:00" },
  },
  deliveryEnabled: true,
  deliveryZones: [],
  freeDeliveryMinimum: 25,
  returnPolicy: "",
  shippingPolicy: "",
  privacyPolicy: "",
  acceptedPayments: ["credit_card", "debit_card", "paypal"],
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
}

const daysOfWeek = [
  { key: "monday", label: "Lunes" },
  { key: "tuesday", label: "Martes" },
  { key: "wednesday", label: "Miércoles" },
  { key: "thursday", label: "Jueves" },
  { key: "friday", label: "Viernes" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
]

const paymentMethods = [
  { id: "credit_card", label: "Tarjeta de Crédito" },
  { id: "debit_card", label: "Tarjeta de Débito" },
  { id: "paypal", label: "PayPal" },
  { id: "bank_transfer", label: "Transferencia Bancaria" },
  { id: "cash", label: "Efectivo" },
  { id: "crypto", label: "Criptomonedas" },
]

export default function ConfiguracionTiendaPage() {
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [config, setConfig] = useState<StoreConfig>(defaultConfig)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Cargar perfil del usuario
    const profile = localStorage.getItem("userProfile")
    if (profile) {
      const parsedProfile = JSON.parse(profile)
      setUserProfile(parsedProfile)

      // Cargar configuración existente si existe
      const existingConfig = localStorage.getItem("storeConfig")
      if (existingConfig) {
        setConfig({ ...defaultConfig, ...JSON.parse(existingConfig) })
      } else if (parsedProfile.storeInfo) {
        // Usar datos del perfil como base
        setConfig((prev) => ({
          ...prev,
          storeName: parsedProfile.storeInfo.storeName || "",
          description: parsedProfile.storeInfo.description || "",
          category: parsedProfile.storeInfo.category || "",
          phone: parsedProfile.storeInfo.phone || "",
          email: parsedProfile.storeInfo.email || "",
          address: parsedProfile.storeInfo.address || "",
          coordinates: parsedProfile.storeInfo.coordinates || [40.4168, -3.7038],
        }))
      }
    }
  }, [])

  const handleSave = async () => {
    setIsLoading(true)

    try {
      // Simular guardado
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Guardar configuración
      localStorage.setItem("storeConfig", JSON.stringify(config))

      // Actualizar perfil del usuario con la nueva información
      if (userProfile) {
        const updatedProfile = {
          ...userProfile,
          storeInfo: {
            ...userProfile.storeInfo,
            storeName: config.storeName,
            description: config.description,
            category: config.category,
            phone: config.phone,
            email: config.email,
            address: config.address,
            coordinates: config.coordinates,
          },
        }
        localStorage.setItem("userProfile", JSON.stringify(updatedProfile))
        setUserProfile(updatedProfile)
      }

      toast({
        title: "Configuración guardada",
        description: "Los cambios se han guardado correctamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const togglePaymentMethod = (methodId: string) => {
    setConfig((prev) => ({
      ...prev,
      acceptedPayments: prev.acceptedPayments.includes(methodId)
        ? prev.acceptedPayments.filter((id) => id !== methodId)
        : [...prev.acceptedPayments, methodId],
    }))
  }

  if (!userProfile || userProfile.type !== "store") {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Acceso denegado</h1>
            <p className="text-muted-foreground mb-4">Esta página es solo para tiendas</p>
            <Button onClick={() => router.push("/")}>Volver al inicio</Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full">
        <div className="px-4 md:px-6 py-6 md:py-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Configuración de Tienda</h1>
              <p className="text-muted-foreground">Gestiona todos los aspectos de tu tienda</p>
            </div>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? (
                <>Guardando...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>

          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="horarios">Horarios</TabsTrigger>
              <TabsTrigger value="delivery">Delivery</TabsTrigger>
              <TabsTrigger value="contacto">Contacto</TabsTrigger>
              <TabsTrigger value="pagos">Pagos</TabsTrigger>
              <TabsTrigger value="politicas">Políticas</TabsTrigger>
            </TabsList>

            {/* Información General */}
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Información General
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="storeName">Nombre de la tienda</Label>
                      <Input
                        id="storeName"
                        value={config.storeName}
                        onChange={(e) => setConfig((prev) => ({ ...prev, storeName: e.target.value }))}
                        placeholder="Mi Tienda Online"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoría</Label>
                      <Select
                        value={config.category}
                        onValueChange={(value) => setConfig((prev) => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="electronics">Electrónicos</SelectItem>
                          <SelectItem value="clothing">Ropa y Accesorios</SelectItem>
                          <SelectItem value="food">Comida y Bebidas</SelectItem>
                          <SelectItem value="home">Hogar y Jardín</SelectItem>
                          <SelectItem value="sports">Deportes</SelectItem>
                          <SelectItem value="books">Libros</SelectItem>
                          <SelectItem value="health">Salud y Belleza</SelectItem>
                          <SelectItem value="automotive">Automotriz</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción de la tienda</Label>
                    <Textarea
                      id="description"
                      value={config.description}
                      onChange={(e) => setConfig((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe tu tienda, productos y servicios..."
                      rows={4}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="logo">URL del Logo</Label>
                      <Input
                        id="logo"
                        value={config.logo}
                        onChange={(e) => setConfig((prev) => ({ ...prev, logo: e.target.value }))}
                        placeholder="https://ejemplo.com/logo.png"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="banner">URL del Banner</Label>
                      <Input
                        id="banner"
                        value={config.banner}
                        onChange={(e) => setConfig((prev) => ({ ...prev, banner: e.target.value }))}
                        placeholder="https://ejemplo.com/banner.jpg"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Horarios */}
            <TabsContent value="horarios">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Horarios de Atención
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {daysOfWeek.map((day) => (
                      <div key={day.key} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="w-24">
                          <span className="font-medium">{day.label}</span>
                        </div>
                        <Switch
                          checked={config.schedule[day.key].isOpen}
                          onCheckedChange={(checked) =>
                            setConfig((prev) => ({
                              ...prev,
                              schedule: {
                                ...prev.schedule,
                                [day.key]: { ...prev.schedule[day.key], isOpen: checked },
                              },
                            }))
                          }
                        />
                        {config.schedule[day.key].isOpen && (
                          <>
                            <Input
                              type="time"
                              value={config.schedule[day.key].openTime}
                              onChange={(e) =>
                                setConfig((prev) => ({
                                  ...prev,
                                  schedule: {
                                    ...prev.schedule,
                                    [day.key]: { ...prev.schedule[day.key], openTime: e.target.value },
                                  },
                                }))
                              }
                              className="w-32"
                            />
                            <span>a</span>
                            <Input
                              type="time"
                              value={config.schedule[day.key].closeTime}
                              onChange={(e) =>
                                setConfig((prev) => ({
                                  ...prev,
                                  schedule: {
                                    ...prev.schedule,
                                    [day.key]: { ...prev.schedule[day.key], closeTime: e.target.value },
                                  },
                                }))
                              }
                              className="w-32"
                            />
                          </>
                        )}
                        {!config.schedule[day.key].isOpen && <span className="text-muted-foreground">Cerrado</span>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Delivery */}
            <TabsContent value="delivery">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Configuración de Delivery
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Habilitar delivery</Label>
                        <p className="text-sm text-muted-foreground">Permite entregas a domicilio</p>
                      </div>
                      <Switch
                        checked={config.deliveryEnabled}
                        onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, deliveryEnabled: checked }))}
                      />
                    </div>

                    {config.deliveryEnabled && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="freeDelivery">Envío gratis desde ($)</Label>
                          <Input
                            id="freeDelivery"
                            type="number"
                            value={config.freeDeliveryMinimum}
                            onChange={(e) =>
                              setConfig((prev) => ({ ...prev, freeDeliveryMinimum: Number(e.target.value) }))
                            }
                            placeholder="25.00"
                          />
                        </div>

                        {config.deliveryEnabled && (
                          <div>
                            <Label className="text-base font-medium">Zonas de Delivery</Label>
                            <p className="text-sm text-muted-foreground mb-4">
                              Configura las zonas donde realizas entregas y sus precios
                            </p>
                            <DeliveryZonesConfigurator
                              storeLocation={config.coordinates}
                              zones={config.deliveryZones}
                              onZonesChange={(zones) => setConfig((prev) => ({ ...prev, deliveryZones: zones }))}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Contacto */}
            <TabsContent value="contacto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Información de Contacto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        value={config.phone}
                        onChange={(e) => setConfig((prev) => ({ ...prev, phone: e.target.value }))}
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={config.email}
                        onChange={(e) => setConfig((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder="contacto@mitienda.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Sitio web</Label>
                    <Input
                      id="website"
                      value={config.website}
                      onChange={(e) => setConfig((prev) => ({ ...prev, website: e.target.value }))}
                      placeholder="https://mitienda.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input
                      id="address"
                      value={config.address}
                      onChange={(e) => setConfig((prev) => ({ ...prev, address: e.target.value }))}
                      placeholder="Calle Principal 123, Ciudad"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Ubicación en el mapa</Label>
                    <MapSelector
                      onLocationSelect={(coordinates) => setConfig((prev) => ({ ...prev, coordinates }))}
                      initialLocation={config.coordinates}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pagos */}
            <TabsContent value="pagos">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Métodos de Pago
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Label>Métodos de pago aceptados</Label>
                    <div className="grid md:grid-cols-2 gap-4">
                      {paymentMethods.map((method) => (
                        <div key={method.id} className="flex items-center space-x-2">
                          <Switch
                            checked={config.acceptedPayments.includes(method.id)}
                            onCheckedChange={() => togglePaymentMethod(method.id)}
                          />
                          <Label>{method.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Políticas */}
            <TabsContent value="politicas">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Políticas de la Tienda
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="returnPolicy">Política de Devoluciones</Label>
                      <Textarea
                        id="returnPolicy"
                        value={config.returnPolicy}
                        onChange={(e) => setConfig((prev) => ({ ...prev, returnPolicy: e.target.value }))}
                        placeholder="Describe tu política de devoluciones..."
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="shippingPolicy">Política de Envíos</Label>
                      <Textarea
                        id="shippingPolicy"
                        value={config.shippingPolicy}
                        onChange={(e) => setConfig((prev) => ({ ...prev, shippingPolicy: e.target.value }))}
                        placeholder="Describe tu política de envíos..."
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="privacyPolicy">Política de Privacidad</Label>
                      <Textarea
                        id="privacyPolicy"
                        value={config.privacyPolicy}
                        onChange={(e) => setConfig((prev) => ({ ...prev, privacyPolicy: e.target.value }))}
                        placeholder="Describe tu política de privacidad..."
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Notificaciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Notificaciones por email</Label>
                        <p className="text-sm text-muted-foreground">Recibe notificaciones de pedidos por email</p>
                      </div>
                      <Switch
                        checked={config.emailNotifications}
                        onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, emailNotifications: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Notificaciones por SMS</Label>
                        <p className="text-sm text-muted-foreground">Recibe notificaciones de pedidos por SMS</p>
                      </div>
                      <Switch
                        checked={config.smsNotifications}
                        onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, smsNotifications: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Notificaciones push</Label>
                        <p className="text-sm text-muted-foreground">Recibe notificaciones push en el navegador</p>
                      </div>
                      <Switch
                        checked={config.pushNotifications}
                        onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, pushNotifications: checked }))}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  )
}
