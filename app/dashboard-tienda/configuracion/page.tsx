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
import { subscribeUser, unsubscribeUser } from "@/lib/push"
import { storeService } from "@/lib/store"
import { categoriasService } from "@/lib/api/categorias"
import { api } from "@/lib/axios"
import MapSelectorLeaflet from "@/components/map-selector-leaflet"
import DeliveryZonesConfigurator from "@/components/delivery-zones-configurator"
import { useStoreAccess, useProfileType } from "@/hooks/use-profile-type"

interface DeliveryZone {
  id: string
  name: string
  price: number
  estimatedTime: string
  coordinates: Array<{ lat: number; lng: number }>
  color: string
  shape?: "polygon" | "circle"
  center?: { lat: number; lng: number }
  radius?: number
}

interface StoreConfig {
  // Información básica
  storeName: string
  description: string
  category: string
  logo: string
  banner: string
  logoFile?: File | null
  bannerFile?: File | null

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
  bankName: string
  bankAccountNumber: string
  bankAccountHolder: string
  bankAccountType: string

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
  acceptedPayments: ["credit_card", "debit_card", "cash", "bank_transfer"],
  bankName: "",
  bankAccountNumber: "",
  bankAccountHolder: "",
  bankAccountType: "",
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: false,
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
  { id: "bank_transfer", label: "Transferencia Bancaria" },
  { id: "cash", label: "Efectivo al recibir o retirar" },
]

export default function ConfiguracionTiendaPage() {
  const router = useRouter()
  const { canAccessStoreDashboard } = useStoreAccess()
  const { storeInfo } = useProfileType()
  const [config, setConfig] = useState<StoreConfig>(defaultConfig)
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<{ id: number; nombre: string }[]>([])

  useEffect(() => {
    categoriasService.getCategorias().then((cats) => {
      setCategories(cats.map((c) => ({ id: c.id, nombre: c.nombre })))
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (storeInfo?.id) {
      storeService.getStore(storeInfo.id).then(async (res) => {
        const data = res.data || {}
        const ct = (data?.configuracion_tienda as any) || {}
        let horarios = await storeService.getHorarios(storeInfo.id)
        let zonas = await storeService.getDeliveryZones(storeInfo.id)
        let metodos = await storeService.getAcceptedPayments(storeInfo.id)
        const scheduleFromDb: StoreConfig['schedule'] = { ...defaultConfig.schedule }
        if (Array.isArray(horarios)) {
          horarios.forEach((h: any) => {
            const key = String(h.dia_semana)
            if (scheduleFromDb[key]) {
              scheduleFromDb[key] = {
                isOpen: !h.cerrado,
                openTime: h.hora_apertura || scheduleFromDb[key].openTime,
                closeTime: h.hora_cierre || scheduleFromDb[key].closeTime,
              }
            }
          })
        }
        const deliveryZonesFromDb: DeliveryZone[] = Array.isArray(zonas) ? zonas.map((z: any) => {
          let coords: Array<{ lat: number; lng: number }> = []
          let color = '#00AEEF'
          let center: { lat: number; lng: number } | undefined
          let radius: number | undefined
          let shape: "polygon" | "circle" | undefined
          try {
            const parsed = z.zona_cobertura ? JSON.parse(z.zona_cobertura) : null
            if (parsed && typeof parsed.color === 'string') color = parsed.color
            if (parsed && parsed.center && typeof parsed.center.lat === 'number' && typeof parsed.center.lng === 'number') {
              center = { lat: Number(parsed.center.lat), lng: Number(parsed.center.lng) }
              if (typeof parsed.radius === 'number') radius = Number(parsed.radius)
              shape = 'circle'
            } else if (parsed && Array.isArray(parsed.coordinates)) {
              coords = parsed.coordinates
              shape = 'polygon'
            }
          } catch {}
          if (!center && (z.latitud != null && z.longitud != null)) {
            const latN = Number(z.latitud)
            const lngN = Number(z.longitud)
            if (Number.isFinite(latN) && Number.isFinite(lngN)) {
              center = { lat: latN, lng: lngN }
            }
          }
          return {
            id: String(z.id_direccion_envio),
            name: z.nombre,
            price: Number(z.precio_envio),
            estimatedTime: String(z.minutos_entrega),
            coordinates: coords,
            color,
            shape,
            center,
            radius,
          }
        }) : []
        const acceptedFromDb: string[] = Array.isArray(metodos) ? metodos.filter((m: any) => m.activo).map((m: any) => String(m.metodo)) : []
        setConfig((prev) => ({
          ...prev,
          storeName: data?.nombre_tienda || storeInfo.nombre || "",
          description: data?.descripcion || storeInfo.descripcion || "",
          category: data?.categoria_principal || storeInfo.categoria || "",
          phone: data?.telefono_contacto || "",
          email: data?.email_contacto || "",
          website: data?.sitio_web || "",
          address: data?.direccion || "",
          logo: data?.logo || "",
          banner: data?.banner || "",
          coordinates: (Number.isFinite(Number(data?.latitud)) && Number.isFinite(Number(data?.longitud)))
            ? [Number(data.latitud), Number(data.longitud)] as [number, number]
            : prev.coordinates,
          schedule: scheduleFromDb,
          deliveryEnabled: deliveryZonesFromDb.length > 0 ? true : (typeof ct?.deliveryEnabled === 'boolean' ? ct.deliveryEnabled : prev.deliveryEnabled),
          deliveryZones: deliveryZonesFromDb.length > 0 ? deliveryZonesFromDb : prev.deliveryZones,
          freeDeliveryMinimum: typeof ct?.freeDeliveryMinimum === 'number' ? ct.freeDeliveryMinimum : prev.freeDeliveryMinimum,
          acceptedPayments: acceptedFromDb.length > 0 ? acceptedFromDb : prev.acceptedPayments,
          bankName: typeof data?.banco_nombre === 'string' ? data.banco_nombre : prev.bankName,
          bankAccountNumber: typeof data?.banco_cuenta === 'string' ? data.banco_cuenta : prev.bankAccountNumber,
          bankAccountHolder: typeof data?.banco_titular === 'string' ? data.banco_titular : prev.bankAccountHolder,
          bankAccountType: typeof data?.banco_tipo === 'string' ? data.banco_tipo : prev.bankAccountType,
          returnPolicy: ct?.policies?.returnPolicy || prev.returnPolicy,
          shippingPolicy: ct?.policies?.shippingPolicy || prev.shippingPolicy,
          privacyPolicy: ct?.policies?.privacyPolicy || prev.privacyPolicy,
          emailNotifications: ct?.notifications?.email ?? prev.emailNotifications,
          smsNotifications: ct?.notifications?.sms ?? prev.smsNotifications,
          pushNotifications: ct?.notifications?.push ?? prev.pushNotifications,
        }))
      }).catch(() => {
        setConfig((prev) => ({
          ...prev,
          storeName: storeInfo.nombre || "",
          description: storeInfo.descripcion || "",
          category: storeInfo.categoria || "",
        }))
      })
    }
  }, [storeInfo])

  const handleSave = async () => {
    setIsLoading(true)

    try {
      if (storeInfo?.id) {
        await storeService.updateStore(storeInfo.id, {
          nombre_tienda: config.storeName || undefined,
          descripcion: config.description || undefined,
          categoria_principal: config.category || undefined,
          telefono_contacto: config.phone || undefined,
          email_contacto: config.email || undefined,
          sitio_web: config.website || undefined,
          direccion: config.address || undefined,
          banco_nombre: config.bankName || undefined,
          banco_cuenta: config.bankAccountNumber || undefined,
          banco_titular: config.bankAccountHolder || undefined,
          banco_tipo: config.bankAccountType || undefined,
          logo: config.logo || undefined,
          banner: config.banner || undefined,
          logoFile: config.logoFile || undefined,
          bannerFile: config.bannerFile || undefined,
          configuracion_tienda: {
            freeDeliveryMinimum: config.freeDeliveryMinimum,
            policies: {
              returnPolicy: config.returnPolicy,
              shippingPolicy: config.shippingPolicy,
              privacyPolicy: config.privacyPolicy,
            },
            notifications: {
              email: config.emailNotifications,
              sms: config.smsNotifications,
              push: config.pushNotifications,
            },
          },
        })

        const horariosPayload = Object.keys(config.schedule).map((key) => ({
          dia_semana: key,
          hora_apertura: config.schedule[key].isOpen ? config.schedule[key].openTime : null,
          hora_cierre: config.schedule[key].isOpen ? config.schedule[key].closeTime : null,
          cerrado: !config.schedule[key].isOpen,
        }))
        await storeService.updateHorarios(storeInfo.id, horariosPayload)

        const zonasPayload = (config.deliveryZones || []).map((z) => {
          const isCircle = z.center && typeof z.radius === 'number'
          const lat = isCircle ? Number(z.center!.lat) : (z.coordinates?.[0]?.lat ?? 0)
          const lng = isCircle ? Number(z.center!.lng) : (z.coordinates?.[0]?.lng ?? 0)
          const zonaCobertura = isCircle
            ? { center: z.center, radius: z.radius, color: z.color || '#00AEEF' }
            : { coordinates: z.coordinates || [], color: z.color || '#00AEEF' }

          return {
            nombre: z.name,
            precio_envio: z.price,
            minutos_entrega: parseInt(String(z.estimatedTime).replace(/[^0-9]/g, '')) || 0,
            latitud: lat,
            longitud: lng,
            direccion_completa: z.name,
            zona_cobertura: JSON.stringify(zonaCobertura),
            activo: true,
          }
        })
        await storeService.replaceDeliveryZones(storeInfo.id, config.deliveryEnabled ? zonasPayload : [])

        await storeService.setAcceptedPayments(storeInfo.id, config.acceptedPayments || [])
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

  const handlePushNotificationsChange = async (checked: boolean) => {
    try {
      if (checked) {
        await subscribeUser('dashboard')
        setConfig((prev) => ({ ...prev, pushNotifications: true }))
        toast({ title: 'Push habilitado', description: 'Suscripción creada correctamente' })
      } else {
        await unsubscribeUser()
        setConfig((prev) => ({ ...prev, pushNotifications: false }))
        toast({ title: 'Push deshabilitado', description: 'Suscripción cancelada' })
      }
    } catch (error: any) {
      console.error('[Push] Error cambiando estado de notificaciones:', error)
      toast({ title: 'Error con notificaciones push', description: error?.message || 'No se pudo cambiar el estado', variant: 'destructive' })
    }
  }

  const handleSendPushTest = async () => {
    try {
      await api.post('/v1/push/send-test', { url: '/dashboard-tienda/notificaciones' })
      toast({ title: 'Push de prueba enviado', description: 'Revisa la notificación del navegador' })
    } catch (error: any) {
      const message = error?.message || (error?.errors ? Object.values(error.errors).join('\n') : 'No se pudo enviar el push de prueba')
      toast({ title: 'Error enviando push de prueba', description: message, variant: 'destructive' })
    }
  }

  if (!canAccessStoreDashboard) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Acceso denegado</h1>
            <p className="text-muted-foreground mb-4">Esta página es solo para tiendas</p>
            <Button onClick={() => router.push("/onboarding")}>Configurar perfil de tienda</Button>
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
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={c.nombre}>{c.nombre}</SelectItem>
                          ))}
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
                      <Label htmlFor="logo">Logo</Label>
                      <Input
                        id="logo"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null
                          setConfig((prev) => ({ ...prev, logoFile: file }))
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="banner">Banner</Label>
                      <Input
                        id="banner"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null
                          setConfig((prev) => ({ ...prev, bannerFile: file }))
                        }}
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
                    <MapSelectorLeaflet
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
                  <div className="pt-4 space-y-3">
                    <Label className="text-base">Cuenta bancaria para transferencias</Label>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bankName">Banco</Label>
                        <Input id="bankName" value={config.bankName} onChange={(e) => setConfig((prev) => ({ ...prev, bankName: e.target.value }))} placeholder="Nombre del banco" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bankAccountNumber">Número de cuenta</Label>
                        <Input id="bankAccountNumber" value={config.bankAccountNumber} onChange={(e) => setConfig((prev) => ({ ...prev, bankAccountNumber: e.target.value }))} placeholder="000-0000000-0" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bankAccountHolder">Titular</Label>
                        <Input id="bankAccountHolder" value={config.bankAccountHolder} onChange={(e) => setConfig((prev) => ({ ...prev, bankAccountHolder: e.target.value }))} placeholder="Nombre del titular" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bankAccountType">Tipo de cuenta</Label>
                        <Input id="bankAccountType" value={config.bankAccountType} onChange={(e) => setConfig((prev) => ({ ...prev, bankAccountType: e.target.value }))} placeholder="Corriente / Ahorros" />
                      </div>
                    </div>
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
                    {/* <div className="flex items-center justify-between">
                      <div>
                        <Label>Notificaciones por email</Label>
                        <p className="text-sm text-muted-foreground">Recibe notificaciones de pedidos por email</p>
                      </div>
                      <Switch
                        checked={config.emailNotifications}
                        onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, emailNotifications: checked }))}
                      />
                    </div> */}

                    {/* <div className="flex items-center justify-between">
                      <div>
                        <Label>Notificaciones por SMS</Label>
                        <p className="text-sm text-muted-foreground">Recibe notificaciones de pedidos por SMS</p>
                      </div>
                      <Switch
                        checked={config.smsNotifications}
                        onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, smsNotifications: checked }))}
                      />
                    </div> */}

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Notificaciones push</Label>
                        <p className="text-sm text-muted-foreground">Recibe notificaciones push en el navegador</p>
                      </div>
                      <Switch
                        checked={config.pushNotifications}
                        onCheckedChange={handlePushNotificationsChange}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Puedes enviar una notificación de prueba para verificar la configuración</p>
                      <Button variant="outline" onClick={handleSendPushTest} disabled={!config.pushNotifications}>
                        Enviar push de prueba
                      </Button>
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
