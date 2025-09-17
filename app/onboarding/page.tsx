"use client"

import { useState } from "react"
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
import dynamic from "next/dynamic"

// Importar el mapa dinámicamente para evitar problemas de SSR
const MapSelector = dynamic(() => import("@/components/map-selector"), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-muted rounded-lg animate-pulse flex items-center justify-center">
      <p className="text-muted-foreground">Cargando mapa...</p>
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
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const validateStep = (step: number): boolean => {
    switch (step) {
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
      // Simular guardado del perfil
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Guardar en localStorage para persistencia
      localStorage.setItem("userProfile", JSON.stringify(profile))

      toast({
        title: "¡Bienvenido a MiMarket!",
        description: "Tu perfil ha sido configurado correctamente",
      })

      // Redireccionar según el tipo de perfil
      if (profile.type === "store") {
        router.push("/dashboard-tienda")
      } else {
        router.push("/")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo completar la configuración. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalSteps = 4

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
              Paso {currentStep} de {totalSteps}
            </span>
            <span className="text-sm text-muted-foreground">{Math.round((currentStep / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <Card>
          <CardContent className="p-8">
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
                      <Label htmlFor="storeAddress">Dirección</Label>
                      <Input
                        id="storeAddress"
                        value={profile.storeInfo.address}
                        onChange={(e) => handleStoreInfoChange("address", e.target.value)}
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
                        onLocationSelect={(coordinates) => {
                          setProfile((prev) => ({
                            ...prev,
                            storeInfo: { ...prev.storeInfo, coordinates },
                          }))
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
            {currentStep < 4 && (
              <div className="flex justify-between pt-6">
                <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
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
