"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, ArrowLeft, Store, User, ShoppingBag, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { profileService } from "@/lib/profile"
import { storeService } from "@/lib/store"
import { authService } from "@/lib/auth"
import { useAuth } from "@/contexts/auth-context"
import dynamic from "next/dynamic"

// Importar el mapa dinámicamente para evitar problemas de SSR
const MapSelector = dynamic(() => import("@/components/map-selector").then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-muted rounded-lg animate-pulse flex items-center justify-center">
      <p className="text-muted-foreground">Cargando mapa...</p>
    </div>
  ),
})

// Importar el tipo para la referencia del mapa
import type { MapSelectorRef } from "@/components/map-selector"

// Importar el autocompletado de direcciones dinámicamente
const AddressAutocomplete = dynamic(() => import("@/components/address-autocomplete"), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse">
      <div className="h-4 bg-muted rounded w-20 mb-2"></div>
      <div className="h-10 bg-muted rounded"></div>
    </div>
  ),
})

interface UserProfile {
  type: "personal" | "store" | ""
  personalInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
    interests: string[]
  }
  storeInfo: {
    storeName: string
    description: string
    category: string
    address: string
    phone: string
    email: string
    website: string
    coordinates?: [number, number]
  }
}

const interests = [
  "Electrónica",
  "Ropa y Moda",
  "Hogar y Decoración",
  "Deportes y Fitness",
  "Belleza y Cuidado Personal",
  "Comida y Bebidas",
  "Libros y Educación",
  "Juguetes y Niños",
]

const storeCategories = [
  "Electrónica y Tecnología",
  "Moda y Accesorios",
  "Hogar y Jardín",
  "Deportes y Outdoor",
  "Belleza y Salud",
  "Alimentación",
  "Servicios",
  "Otros",
]

export default function OnboardingPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated, refreshUser } = useAuth()
  const [currentStep, setCurrentStep] = useState(isAuthenticated ? 1 : 0) // Empezar en 0 si no está autenticado
  const [isSubmitting, setIsSubmitting] = useState(false)
  const mapRef = useRef<MapSelectorRef>(null)
  const [mapInstance, setMapInstance] = useState<MapSelectorRef | null>(null)

  // Estado para los datos de registro
  const [registerData, setRegisterData] = useState({
    name: "",
    apellido: "",
    email: "",
    password: "",
    password_confirmation: "",
    telefono: "",
  })

  // Verificar autenticación - COMENTADO para permitir registro
  // useEffect(() => {
  //   if (!isLoading && !isAuthenticated) {
  //     router.push('/login')
  //   }
  // }, [isLoading, isAuthenticated, router])

  const [profile, setProfile] = useState<UserProfile>({
    type: "",
    personalInfo: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      interests: [],
    },
    storeInfo: {
      storeName: "",
      description: "",
      category: "",
      address: "",
      phone: "",
      email: "",
      website: "",
      coordinates: undefined,
    },
  })

  const handleProfileTypeSelect = (type: "personal" | "store") => {
    setProfile((prev) => ({ ...prev, type }))
    setCurrentStep(2)
  }

  // Función para manejar el registro
  const handleRegister = async () => {
    setIsSubmitting(true)
    
    try {
      // Validaciones básicas
      if (!registerData.name || !registerData.apellido || !registerData.email || !registerData.password) {
        throw new Error("Todos los campos son obligatorios")
      }
      
      if (registerData.password !== registerData.password_confirmation) {
        throw new Error("Las contraseñas no coinciden")
      }
      
      if (registerData.password.length < 6) {
        throw new Error("La contraseña debe tener al menos 6 caracteres")
      }

      // Realizar el registro
      const response = await authService.register(registerData)
      
      if (response.success) {
        // Actualizar el contexto de autenticación
        await refreshUser()
        
        // Avanzar al siguiente paso del onboarding
        setCurrentStep(1)
        
        toast({
          title: "¡Registro exitoso!",
          description: "Ahora configuremos tu perfil",
        })
      } else {
        throw new Error(response.message || "Error en el registro")
      }
    } catch (error: any) {
      toast({
        title: "Error en el registro",
        description: error.message || "Ocurrió un error inesperado",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePersonalInfoChange = (field: string, value: string) => {
    setProfile((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value },
    }))
  }

  const handleStoreInfoChange = (field: string, value: string) => {
    setProfile((prev) => ({
      ...prev,
      storeInfo: { ...prev.storeInfo, [field]: value },
    }))
  }

  const handleInterestToggle = (interest: string) => {
    setProfile((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        interests: prev.personalInfo.interests.includes(interest)
          ? prev.personalInfo.interests.filter((i) => i !== interest)
          : [...prev.personalInfo.interests, interest],
      },
    }))
  }

  const handleAddressSelect = (place: google.maps.places.PlaceResult) => {
    console.log('handleAddressSelect called with place:', place)
    
    if (place.geometry?.location && place.formatted_address) {
      const coordinates: [number, number] = [
        place.geometry.location.lat(),
        place.geometry.location.lng()
      ]

      console.log('Coordinates extracted:', coordinates)
      console.log('mapRef.current:', mapRef.current)
      console.log('mapRef type:', typeof mapRef.current)

      // Actualizar la dirección en el perfil
      setProfile((prev) => ({
        ...prev,
        storeInfo: {
          ...prev.storeInfo,
          address: place.formatted_address || '',
          coordinates: coordinates,
        },
      }))

      // Centrar el mapa en las coordenadas seleccionadas
      const mapToUse = mapInstance || mapRef.current
      console.log('mapToUse:', mapToUse)
      console.log('mapInstance:', mapInstance)
      console.log('mapRef.current:', mapRef.current)
      
      if (mapToUse && mapToUse.centerMapOnCoordinates) {
        console.log('Calling centerMapOnCoordinates with:', coordinates)
        mapToUse.centerMapOnCoordinates(coordinates)
      } else {
        console.log('Map not available, trying with delay...')
        
        // Intentar después de un delay
        setTimeout(() => {
          console.log('Retrying after 1 second...')
          const retryMap = mapInstance || mapRef.current
          console.log('retryMap:', retryMap)
          if (retryMap && retryMap.centerMapOnCoordinates) {
            console.log('Calling centerMapOnCoordinates after delay')
            retryMap.centerMapOnCoordinates(coordinates)
          } else {
            console.log('Still not available after delay')
          }
        }, 1000)
      }
    } else {
      console.log('Missing geometry or formatted_address in place:', place)
    }
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        // Validación para el paso de registro
        return (
          registerData.name &&
          registerData.apellido &&
          registerData.email &&
          registerData.password &&
          registerData.password_confirmation &&
          registerData.password === registerData.password_confirmation &&
          registerData.password.length >= 6
        )
      case 1:
        return profile.type !== ""
      case 2:
        if (profile.type === "personal") {
          return profile.personalInfo.firstName && profile.personalInfo.lastName && profile.personalInfo.email
        } else {
          return profile.storeInfo.storeName && profile.storeInfo.description && profile.storeInfo.category
        }
      case 3:
        if (profile.type === "personal") {
          return profile.personalInfo.interests.length > 0
        } else {
          return (
            profile.storeInfo.address &&
            profile.storeInfo.phone &&
            profile.storeInfo.email &&
            profile.storeInfo.coordinates
          )
        }
      default:
        return false
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1)
  }

  const handleFinish = async () => {
    setIsSubmitting(true)

    try {
      // Ya no necesitamos verificar si el usuario está autenticado aquí
      // porque el registro se maneja en el paso anterior

      if (profile.type === "personal") {
        // Preparar datos del perfil personal para enviar al backend
        const profileData = {
          biografia: `Intereses: ${profile.personalInfo.interests.join(", ")}`,
          direccion: "",
          ciudad: "",
          codigo_postal: "",
          pais: "Paraguay",
          preferencias_notificacion: ["email", "ofertas"], // Valores por defecto
        }

        // Completar onboarding y guardar perfil personal en el backend
        const response = await profileService.completeOnboarding(profileData)

        if (!response.message || response.errors) {
          throw new Error(response.message || "Error al guardar el perfil")
        }
      } else {
        // Preparar datos de la tienda para enviar al backend
        const storeData = {
          nombre_tienda: profile.storeInfo.storeName,
          descripcion: profile.storeInfo.description,
          categoria_principal: profile.storeInfo.category,
          direccion: profile.storeInfo.address,
          telefono_contacto: profile.storeInfo.phone,
          email_contacto: profile.storeInfo.email,
          sitio_web: profile.storeInfo.website || "",
          latitud: profile.storeInfo.coordinates?.[0],
          longitud: profile.storeInfo.coordinates?.[1],
        }

        // Guardar tienda en el backend
        const storeResponse = await storeService.createStore(storeData)

        if (!storeResponse.success) {
          throw new Error(storeResponse.message || "Error al crear la tienda")
        }

        // También crear un perfil básico para el usuario de la tienda
        const profileData = {
          biografia: `Propietario de ${profile.storeInfo.storeName}`,
          direccion: profile.storeInfo.address,
          ciudad: "",
          codigo_postal: "",
          pais: "Paraguay",
          preferencias_notificacion: ["email", "ofertas"], // Valores por defecto
        }

        const profileResponse = await profileService.completeOnboarding(profileData)

        if (!profileResponse.message || profileResponse.errors) {
          console.warn("Error al crear perfil del propietario:", profileResponse.message)
        }
      }

      // Actualizar el estado del usuario en el AuthContext
      await refreshUser()

      // Guardar en localStorage para persistencia
      localStorage.setItem("userProfile", JSON.stringify(profile))

      toast({
        title: "¡Bienvenido a MiMarket!",
        description: profile.type === "store" 
          ? "Tu tienda ha sido creada exitosamente" 
          : "Tu perfil ha sido configurado correctamente",
      })

      // Redireccionar al home después del onboarding
      router.push("/")
    } catch (error) {
      console.error("Error al configurar perfil:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo completar la configuración. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalSteps = isAuthenticated ? 4 : 5 // 5 pasos si no está autenticado (incluye registro)

  // Mostrar loading mientras se verifica autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Si no está autenticado, no mostrar nada (se redirigirá) - COMENTADO para permitir registro
  // if (!isAuthenticated) {
  //   return null
  // }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">¡Bienvenido a MiMarket!</h1>
          <p className="text-muted-foreground">Configuremos tu perfil para ofrecerte la mejor experiencia</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {currentStep === 0 ? "Registro" : `Paso ${currentStep} de ${totalSteps}`}
            </span>
            <span className="text-sm text-muted-foreground">
              {currentStep === 0 ? "0%" : `${Math.round((currentStep / totalSteps) * 100)}%`}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: currentStep === 0 ? "0%" : `${(currentStep / totalSteps) * 100}%` 
              }}
            />
          </div>
        </div>

        <Card>
          <CardContent className="p-8">
            {/* Paso 0: Registro (solo si no está autenticado) */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="text-center">
                  <CardTitle className="text-2xl mb-2">Crear tu cuenta</CardTitle>
                  <p className="text-muted-foreground">
                    Completa tus datos para comenzar en MiMarket
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      value={registerData.name}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellido">Apellido</Label>
                    <Input
                      id="apellido"
                      value={registerData.apellido}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, apellido: e.target.value }))}
                      placeholder="Tu apellido"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="tu@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono (opcional)</Label>
                  <Input
                    id="telefono"
                    value={registerData.telefono}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, telefono: e.target.value }))}
                    placeholder="+595 XXX XXX XXX"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password_confirmation">Confirmar contraseña</Label>
                    <Input
                      id="password_confirmation"
                      type="password"
                      value={registerData.password_confirmation}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, password_confirmation: e.target.value }))}
                      placeholder="Repite tu contraseña"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/login')}
                  >
                    ¿Ya tienes cuenta? Inicia sesión
                  </Button>
                  <Button
                    onClick={handleRegister}
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isSubmitting ? "Registrando..." : "Crear cuenta"}
                  </Button>
                </div>
              </div>
            )}

            {/* Paso 1: Selección de tipo de perfil */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <CardTitle className="text-2xl mb-2">¿Cómo planeas usar MiMarket?</CardTitle>
                  <p className="text-muted-foreground">
                    Selecciona el tipo de perfil que mejor se adapte a tus necesidades
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card
                    className={`cursor-pointer transition-all hover:shadow-md ${profile.type === "personal" ? "ring-2 ring-blue-500" : ""}`}
                    onClick={() => handleProfileTypeSelect("personal")}
                  >
                    <CardContent className="p-6 text-center">
                      <User className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                      <h3 className="font-semibold text-lg mb-2">Perfil Personal</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Para comprar productos y vender ocasionalmente
                      </p>
                      <div className="space-y-2 text-xs text-left">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="h-3 w-3" />
                          <span>Comprar productos</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Store className="h-3 w-3" />
                          <span>Vender productos ocasionalmente</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          <span>Perfil de usuario individual</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card
                    className={`cursor-pointer transition-all hover:shadow-md ${profile.type === "store" ? "ring-2 ring-blue-500" : ""}`}
                    onClick={() => handleProfileTypeSelect("store")}
                  >
                    <CardContent className="p-6 text-center">
                      <Store className="h-12 w-12 mx-auto mb-4 text-green-600" />
                      <h3 className="font-semibold text-lg mb-2">Perfil de Tienda</h3>
                      <p className="text-sm text-muted-foreground mb-4">Para empresas y vendedores profesionales</p>
                      <div className="space-y-2 text-xs text-left">
                        <div className="flex items-center gap-2">
                          <Store className="h-3 w-3" />
                          <span>Página de tienda personalizada</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Truck className="h-3 w-3" />
                          <span>Gestión de inventario y pedidos</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          <span>Herramientas de vendedor</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Paso 2: Información básica */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <CardTitle className="text-2xl mb-2">
                    {profile.type === "personal" ? "Información Personal" : "Información de la Tienda"}
                  </CardTitle>
                  <p className="text-muted-foreground">
                    {profile.type === "personal" ? "Cuéntanos un poco sobre ti" : "Cuéntanos sobre tu tienda"}
                  </p>
                </div>

                {profile.type === "personal" ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">Nombre</Label>
                      <Input
                        id="firstName"
                        value={profile.personalInfo.firstName}
                        onChange={(e) => handlePersonalInfoChange("firstName", e.target.value)}
                        placeholder="Tu nombre"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Apellido</Label>
                      <Input
                        id="lastName"
                        value={profile.personalInfo.lastName}
                        onChange={(e) => handlePersonalInfoChange("lastName", e.target.value)}
                        placeholder="Tu apellido"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Correo electrónico</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.personalInfo.email}
                        onChange={(e) => handlePersonalInfoChange("email", e.target.value)}
                        placeholder="tu@email.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profile.personalInfo.phone}
                        onChange={(e) => handlePersonalInfoChange("phone", e.target.value)}
                        placeholder="+34 612 345 678"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="storeName">Nombre de la tienda</Label>
                      <Input
                        id="storeName"
                        value={profile.storeInfo.storeName}
                        onChange={(e) => handleStoreInfoChange("storeName", e.target.value)}
                        placeholder="Mi Tienda Increíble"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Descripción</Label>
                      <Textarea
                        id="description"
                        value={profile.storeInfo.description}
                        onChange={(e) => handleStoreInfoChange("description", e.target.value)}
                        placeholder="Describe qué vendes y qué hace especial a tu tienda..."
                        className="resize-none"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Categoría principal</Label>
                      <RadioGroup
                        value={profile.storeInfo.category}
                        onValueChange={(value) => handleStoreInfoChange("category", value)}
                      >
                        <div className="grid md:grid-cols-2 gap-2">
                          {storeCategories.map((category) => (
                            <div key={category} className="flex items-center space-x-2">
                              <RadioGroupItem value={category} id={category} />
                              <Label htmlFor={category} className="text-sm">
                                {category}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Paso 3: Preferencias/Contacto */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <CardTitle className="text-2xl mb-2">
                    {profile.type === "personal" ? "Tus Intereses" : "Información de Contacto"}
                  </CardTitle>
                  <p className="text-muted-foreground">
                    {profile.type === "personal"
                      ? "Selecciona las categorías que más te interesan"
                      : "Información para que los clientes puedan contactarte"}
                  </p>
                </div>

                {profile.type === "personal" ? (
                  <div className="grid md:grid-cols-2 gap-3">
                    {interests.map((interest) => (
                      <div key={interest} className="flex items-center space-x-2">
                        <Checkbox
                          id={interest}
                          checked={profile.personalInfo.interests.includes(interest)}
                          onCheckedChange={() => handleInterestToggle(interest)}
                        />
                        <Label htmlFor={interest} className="text-sm">
                          {interest}
                        </Label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <AddressAutocomplete
                        value={profile.storeInfo.address}
                        onChange={(address) => handleStoreInfoChange('address', address)}
                        onPlaceSelect={handleAddressSelect}
                        placeholder="Av. Mariscal López 123, Asunción"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="storePhone">Teléfono</Label>
                        <Input
                          id="storePhone"
                          type="tel"
                          value={profile.storeInfo.phone}
                          onChange={(e) => handleStoreInfoChange("phone", e.target.value)}
                          placeholder="+34 912 345 678"
                        />
                      </div>
                      <div>
                        <Label htmlFor="storeEmail">Email</Label>
                        <Input
                          id="storeEmail"
                          type="email"
                          value={profile.storeInfo.email}
                          onChange={(e) => handleStoreInfoChange("email", e.target.value)}
                          placeholder="contacto@mitienda.com"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="website">Sitio web (opcional)</Label>
                      <Input
                        id="website"
                        value={profile.storeInfo.website}
                        onChange={(e) => handleStoreInfoChange("website", e.target.value)}
                        placeholder="https://mitienda.com"
                      />
                    </div>
                    <div>
                      <Label>Ubicación de la tienda</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Selecciona la ubicación exacta de tu tienda en el mapa
                      </p>
                      <MapSelector
                        ref={mapRef}
                        onLocationSelect={(coordinates) => {
                          setProfile((prev) => ({
                            ...prev,
                            storeInfo: { ...prev.storeInfo, coordinates },
                          }))
                        }}
                        onMapReady={(mapInstance) => {
                          console.log('🗺️ Map is ready, setting mapInstance:', mapInstance)
                          setMapInstance(mapInstance)
                        }}
                        initialLocation={profile.storeInfo.coordinates}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Paso 4: Confirmación */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center">
                  <CardTitle className="text-2xl mb-2">¡Todo listo!</CardTitle>
                  <p className="text-muted-foreground">Revisa tu información antes de continuar</p>
                </div>

                <Card className="bg-muted/50">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        {profile.type === "personal" ? (
                          <User className="h-8 w-8 text-blue-600" />
                        ) : (
                          <Store className="h-8 w-8 text-green-600" />
                        )}
                        <div>
                          <h3 className="font-semibold">
                            {profile.type === "personal" ? "Perfil Personal" : "Perfil de Tienda"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {profile.type === "personal"
                              ? `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`
                              : profile.storeInfo.storeName}
                          </p>
                        </div>
                      </div>

                      {profile.type === "personal" ? (
                        <div className="space-y-2">
                          <p className="text-sm">
                            <strong>Email:</strong> {profile.personalInfo.email}
                          </p>
                          <p className="text-sm">
                            <strong>Teléfono:</strong> {profile.personalInfo.phone}
                          </p>
                          <p className="text-sm">
                            <strong>Intereses:</strong> {profile.personalInfo.interests.join(", ")}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm">
                            <strong>Categoría:</strong> {profile.storeInfo.category}
                          </p>
                          <p className="text-sm">
                            <strong>Dirección:</strong> {profile.storeInfo.address}
                          </p>
                          <p className="text-sm">
                            <strong>Email:</strong> {profile.storeInfo.email}
                          </p>
                          <p className="text-sm">
                            <strong>Teléfono:</strong> {profile.storeInfo.phone}
                          </p>
                          {profile.storeInfo.coordinates && (
                            <p className="text-sm">
                              <strong>Coordenadas:</strong> {profile.storeInfo.coordinates[0].toFixed(6)},{" "}
                              {profile.storeInfo.coordinates[1].toFixed(6)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="text-center">
                  <Button onClick={handleFinish} disabled={isSubmitting} size="lg" className="w-full md:w-auto">
                    {isSubmitting ? "Configurando..." : "Completar configuración"}
                  </Button>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            {currentStep > 0 && currentStep < 4 && (
              <div className="flex justify-between pt-6">
                <Button variant="outline" onClick={handleBack} disabled={currentStep === (isAuthenticated ? 1 : 1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Anterior
                </Button>

                <Button onClick={handleNext} disabled={!validateStep(currentStep)}>
                  Siguiente
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
