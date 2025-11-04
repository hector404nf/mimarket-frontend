"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  Package,
  CreditCard,
  MapPin,
  Heart,
  Settings,
  HelpCircle,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit,
  Star,
  Phone,
  Mail,
  Shield,
  Bell,
  Globe,
  Download,
  ChevronRight,
  LogOut,
} from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { productos } from "@/lib/data"
import { tiendas } from "@/lib/stores-data"
import { useAuth } from "@/contexts/auth-context"
import { ordenesService, OrdenBackend } from "@/lib/api/ordenes"

// Órdenes del backend
type OrdenUI = {
  idOrden: number
  numero: string
  fecha: string
  total: number
  estado: string
  productosTexto: string
  imagen: string
}

// Normaliza valores numéricos que pueden venir como string desde el backend
const normalizeNumber = (value: unknown) => {
  const num = typeof value === "number" ? value : parseFloat(String(value))
  return Number.isFinite(num) ? num : 0
}

const tarjetasSimuladas = [
  {
    id: 1,
    tipo: "visa",
    numero: "**** **** **** 1234",
    nombre: "Juan Pérez",
    expiracion: "12/26",
    principal: true,
  },
  {
    id: 2,
    tipo: "mastercard",
    numero: "**** **** **** 5678",
    nombre: "Juan Pérez",
    expiracion: "08/25",
    principal: false,
  },
]

const direccionesSimuladas = [
  {
    id: 1,
    nombre: "Casa",
    direccion: "Calle Principal 123",
    ciudad: "Asunción",
    codigoPostal: "001001",
    telefono: "+34 612 345 678",
    instrucciones: "Portero automático, piso 3B",
    principal: true,
  },
  {
    id: 2,
    nombre: "Oficina",
    direccion: "Avenida Empresarial 456",
    ciudad: "Asunción",
    codigoPostal: "001002",
    telefono: "+34 698 765 432",
    instrucciones: "Recepción, preguntar por Juan",
    principal: false,
  },
]

export default function PerfilPage() {
  const { user, isLoading, isAuthenticated, refreshUser, logout } = useAuth()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState("pedidos")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("todos")
  const [showAddCard, setShowAddCard] = useState(false)
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [orders, setOrders] = useState<OrdenUI[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState<string>("")

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    if (isAuthenticated && !user) {
      // Solo refrescar datos del usuario si está autenticado pero no hay datos de usuario
      refreshUser()
    }
  }, [isAuthenticated, refreshUser])

  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAuthenticated || !user?.id) return
      setOrdersLoading(true)
      setOrdersError("")
      try {
        const data: OrdenBackend[] = await ordenesService.getOrdenesByUsuario(user.id)
        const mapped: OrdenUI[] = data.map((o) => {
          const nombres = (o.detalles || [])
            .map((d) => d.producto?.nombre)
            .filter(Boolean) as string[]
          const productosTexto = nombres.length > 0 ? nombres.join(", ") : `${o.detalles?.length || 0} productos`
          const firstImg = (o.detalles?.[0]?.producto?.imagen_principal_url || o.detalles?.[0]?.producto?.imagen_url || "/placeholder.svg")
          return {
            idOrden: o.id_orden,
            numero: o.numero_orden,
            fecha: new Date(o.created_at).toLocaleDateString(),
            total: normalizeNumber(o.total),
            estado: o.estado || "confirmado",
            productosTexto,
            imagen: firstImg,
          }
        })
        setOrders(mapped)
      } catch (err) {
        console.error("Error cargando órdenes:", err)
        setOrdersError("No se pudieron cargar tus pedidos")
      } finally {
        setOrdersLoading(false)
      }
    }

    fetchOrders()
  }, [isAuthenticated, user?.id])

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "entregado":
        return <Badge className="bg-green-100 text-green-800 text-xs">Entregado</Badge>
      case "en_camino":
        return <Badge className="bg-blue-100 text-blue-800 text-xs">En camino</Badge>
      case "preparando":
        return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Preparando</Badge>
      case "confirmado":
        return <Badge className="bg-green-100 text-green-800 text-xs">Confirmado</Badge>
      case "pendiente":
        return <Badge className="bg-gray-100 text-gray-800 text-xs">Pendiente</Badge>
      case "cancelado":
        return <Badge className="bg-red-100 text-red-800 text-xs">Cancelado</Badge>
      default:
        return (
          <Badge variant="secondary" className="text-xs">
            {estado}
          </Badge>
        )
    }
  }
  const pedidosFiltrados = orders.filter((pedido) => {
    const matchesSearch =
      pedido.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pedido.productosTexto.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "todos" || pedido.estado === filterStatus
    return matchesSearch && matchesFilter
  })

  const productosFavoritos = productos.slice(0, 4)
  const tiendasFavoritas = tiendas.slice(0, 3)

  const sidebarItems = [
    { id: "pedidos", label: "Mis Pedidos", icon: Package },
    { id: "pagos", label: "Métodos de Pago", icon: CreditCard },
    { id: "direcciones", label: "Direcciones", icon: MapPin },
    { id: "favoritos", label: "Favoritos", icon: Heart },
    { id: "configuracion", label: "Configuración", icon: Settings },
    { id: "ayuda", label: "Ayuda", icon: HelpCircle },
    { id: "logout", label: "Cerrar Sesión", icon: LogOut },
  ]

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-xl md:text-2xl font-bold mb-2">Cargando perfil...</h1>
            <p className="text-muted-foreground">Por favor espera un momento</p>
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
        <div className="px-4 md:px-6 py-4 md:py-6 lg:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 md:h-16 md:w-16 rounded-full bg-muted overflow-hidden flex-shrink-0">
                      <Image
                        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
                        alt="Avatar"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-semibold text-sm md:text-base truncate">
                        {user.name} {user.apellido}
                      </h2>
                      <p className="text-xs md:text-sm text-muted-foreground truncate">
                        {user.email}
                      </p>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        Cliente {user.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <nav className="space-y-1">
                    {sidebarItems.map((item) => {
                      const Icon = item.icon
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            if (item.id === "logout") {
                              handleLogout()
                            } else {
                              setActiveSection(item.id)
                            }
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                            item.id === "logout" 
                              ? "hover:bg-red-50 hover:text-red-600 text-red-500" 
                              : activeSection === item.id 
                                ? "bg-primary text-primary-foreground" 
                                : "hover:bg-muted"
                          }`}
                        >
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      )
                    })}
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Contenido principal */}
            <div className="lg:col-span-3">
              {/* Mis Pedidos */}
              {activeSection === "pedidos" && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold mb-2">Mis Pedidos</h1>
                    <p className="text-muted-foreground text-sm md:text-base">Gestiona y revisa tus pedidos</p>
                  </div>

                  {/* Filtros */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar por ID o tienda..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                          <SelectTrigger className="w-full sm:w-48">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Filtrar por estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos</SelectItem>
                            <SelectItem value="entregado">Entregado</SelectItem>
                            <SelectItem value="en_camino">En camino</SelectItem>
                            <SelectItem value="preparando">Preparando</SelectItem>
                            <SelectItem value="cancelado">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Lista de pedidos */}
                  <div className="space-y-4">
                    {ordersLoading && (
                      <Card>
                        <CardContent className="p-4 md:p-6">
                          <p className="text-sm text-muted-foreground">Cargando pedidos...</p>
                        </CardContent>
                      </Card>
                    )}
                    {ordersError && !ordersLoading && (
                      <Card>
                        <CardContent className="p-4 md:p-6">
                          <p className="text-sm text-red-600">{ordersError}</p>
                        </CardContent>
                      </Card>
                    )}
                    {!ordersLoading && pedidosFiltrados.map((pedido) => (
                      <Card key={pedido.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4 md:p-6">
                          <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative h-16 w-16 md:h-20 md:w-20 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                              <Image
                                src={pedido.imagen || "/placeholder.svg"}
                                alt="Producto"
                                fill
                                className="object-cover"
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-sm md:text-base">{pedido.numero}</h3>
                                    {getEstadoBadge(pedido.estado)}
                                  </div>
                                  <p className="text-xs md:text-sm text-muted-foreground">{pedido.productosTexto}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="font-semibold text-sm md:text-base">${pedido.total.toFixed(2)}</p>
                                  <p className="text-xs md:text-sm text-muted-foreground">{pedido.fecha}</p>
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row gap-2">
                                <Button variant="outline" size="sm" asChild className="w-full sm:w-auto bg-transparent">
                                  <Link href={`/perfil/pedidos/${pedido.idOrden}`}>Ver detalles</Link>
                                </Button>
                                <Button variant="outline" size="sm" className="w-full sm:w-auto bg-transparent">
                                  Repetir pedido
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {!ordersLoading && pedidosFiltrados.length === 0 && (
                    <Card>
                      <CardContent className="text-center py-12">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No se encontraron pedidos</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Métodos de Pago */}
              {activeSection === "pagos" && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold mb-2">Métodos de Pago</h1>
                      <p className="text-muted-foreground text-sm md:text-base">
                        Gestiona tus tarjetas y métodos de pago
                      </p>
                    </div>
                    <Dialog open={showAddCard} onOpenChange={setShowAddCard}>
                      <DialogTrigger asChild>
                        <Button className="w-full sm:w-auto">
                          <Plus className="h-4 w-4 mr-2" />
                          Añadir tarjeta
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Añadir nueva tarjeta</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="cardNumber">Número de tarjeta</Label>
                            <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="expiry">Fecha de expiración</Label>
                              <Input id="expiry" placeholder="MM/AA" />
                            </div>
                            <div>
                              <Label htmlFor="cvv">CVV</Label>
                              <Input id="cvv" placeholder="123" />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="cardName">Nombre en la tarjeta</Label>
                            <Input id="cardName" placeholder="Juan Pérez" />
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button className="w-full">Guardar tarjeta</Button>
                            <Button variant="outline" onClick={() => setShowAddCard(false)} className="w-full">
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="space-y-4">
                    {tarjetasSimuladas.map((tarjeta) => (
                      <Card key={tarjeta.id}>
                        <CardContent className="p-4 md:p-6">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center flex-shrink-0">
                                <CreditCard className="h-5 w-5 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-sm md:text-base">{tarjeta.numero}</p>
                                  {tarjeta.principal && (
                                    <Badge variant="secondary" className="text-xs">
                                      Principal
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs md:text-sm text-muted-foreground">{tarjeta.nombre}</p>
                                <p className="text-xs md:text-sm text-muted-foreground">Expira: {tarjeta.expiracion}</p>
                              </div>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                              <Button variant="outline" size="sm" className="flex-1 sm:flex-none bg-transparent">
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 sm:flex-none text-red-600 hover:text-red-700 bg-transparent"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg md:text-xl">Historial de transacciones</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { fecha: "2024-01-15", descripcion: "Pedido ORD-001", monto: -899.99 },
                          { fecha: "2024-01-10", descripcion: "Pedido ORD-002", monto: -129.98 },
                          { fecha: "2024-01-05", descripcion: "Reembolso ORD-003", monto: 89.99 },
                        ].map((transaccion, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                            <div>
                              <p className="font-medium text-sm md:text-base">{transaccion.descripcion}</p>
                              <p className="text-xs md:text-sm text-muted-foreground">{transaccion.fecha}</p>
                            </div>
                            <p
                              className={`font-semibold text-sm md:text-base ${transaccion.monto > 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              {transaccion.monto > 0 ? "+" : ""}${Math.abs(transaccion.monto).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Direcciones */}
              {activeSection === "direcciones" && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold mb-2">Direcciones</h1>
                      <p className="text-muted-foreground text-sm md:text-base">Gestiona tus direcciones de entrega</p>
                    </div>
                    <Dialog open={showAddAddress} onOpenChange={setShowAddAddress}>
                      <DialogTrigger asChild>
                        <Button className="w-full sm:w-auto">
                          <Plus className="h-4 w-4 mr-2" />
                          Añadir dirección
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Añadir nueva dirección</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="addressName">Nombre de la dirección</Label>
                            <Input id="addressName" placeholder="Casa, Oficina, etc." />
                          </div>
                          <div>
                            <Label htmlFor="street">Dirección</Label>
                            <Input id="street" placeholder="Calle Principal 123" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="city">Ciudad</Label>
                              <Input id="city" placeholder="Asunción" />
                            </div>
                            <div>
                              <Label htmlFor="postal">Código postal</Label>
                              <Input id="postal" placeholder="28001" />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="phone">Teléfono</Label>
                            <Input id="phone" placeholder="+34 612 345 678" />
                          </div>
                          <div>
                            <Label htmlFor="instructions">Instrucciones de entrega</Label>
                            <Textarea id="instructions" placeholder="Portero automático, piso 3B..." />
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button className="w-full">Guardar dirección</Button>
                            <Button variant="outline" onClick={() => setShowAddAddress(false)} className="w-full">
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="space-y-4">
                    {direccionesSimuladas.map((direccion) => (
                      <Card key={direccion.id}>
                        <CardContent className="p-4 md:p-6">
                          <div className="flex flex-col sm:flex-row justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-sm md:text-base">{direccion.nombre}</h3>
                                {direccion.principal && (
                                  <Badge variant="secondary" className="text-xs">
                                    Principal
                                  </Badge>
                                )}
                              </div>
                              <div className="space-y-1 text-xs md:text-sm text-muted-foreground">
                                <p>{direccion.direccion}</p>
                                <p>
                                  {direccion.codigoPostal} {direccion.ciudad}
                                </p>
                                <p className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {direccion.telefono}
                                </p>
                                {direccion.instrucciones && <p className="italic">{direccion.instrucciones}</p>}
                              </div>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                              <Button variant="outline" size="sm" className="flex-1 sm:flex-none bg-transparent">
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 sm:flex-none text-red-600 hover:text-red-700 bg-transparent"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Favoritos */}
              {activeSection === "favoritos" && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold mb-2">Favoritos</h1>
                    <p className="text-muted-foreground text-sm md:text-base">Tus productos y tiendas favoritas</p>
                  </div>

                  <Tabs defaultValue="productos" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="productos">Productos</TabsTrigger>
                      <TabsTrigger value="tiendas">Tiendas</TabsTrigger>
                    </TabsList>

                    <TabsContent value="productos" className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {productosFavoritos.map((producto) => (
                          <Card key={producto.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="aspect-square relative bg-muted rounded-lg overflow-hidden mb-3">
                                <Image
                                  src={producto.imagen || "/placeholder.svg"}
                                  alt={producto.nombre}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <h3 className="font-medium text-sm md:text-base line-clamp-2 mb-2">{producto.nombre}</h3>
                              <p className="font-semibold text-sm md:text-base mb-3">${producto.precio.toFixed(2)}</p>
                              <div className="flex gap-2">
                                <Button size="sm" className="flex-1">
                                  Añadir al carrito
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Heart className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="tiendas" className="space-y-4">
                      <div className="space-y-4">
                        {tiendasFavoritas.map((tienda) => (
                          <Card key={tienda.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4 md:p-6">
                              <div className="flex gap-4">
                                <div className="relative h-16 w-16 md:h-20 md:w-20 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                                  <Image
                                    src={tienda.logo || "/placeholder.svg"}
                                    alt={tienda.nombre}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                                    <div className="min-w-0">
                                      <h3 className="font-semibold text-sm md:text-base">{tienda.nombre}</h3>
                                      <div className="flex items-center gap-2 mt-1">
                                        <div className="flex items-center gap-1">
                                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                          <span className="text-xs md:text-sm">{tienda.calificacion}</span>
                                        </div>
                                        <span className="text-xs md:text-sm text-muted-foreground">•</span>
                                        <span className="text-xs md:text-sm text-muted-foreground">
                                          {tienda.ciudad}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        asChild
                                        className="flex-1 sm:flex-none bg-transparent"
                                      >
                                        <Link href={`/tiendas/${tienda.id}`}>Ver tienda</Link>
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 sm:flex-none bg-transparent"
                                      >
                                        <Heart className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                                    {tienda.descripcion}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              {/* Configuración */}
              {activeSection === "configuracion" && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold mb-2">Configuración</h1>
                    <p className="text-muted-foreground text-sm md:text-base">Personaliza tu experiencia</p>
                  </div>

                  <div className="space-y-6">
                    {/* Información Personal */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                          <Settings className="h-5 w-5" />
                          Información Personal
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="nombre">Nombre</Label>
                            <Input id="nombre" value={user.name} readOnly className="bg-muted" />
                          </div>
                          <div>
                            <Label htmlFor="apellido">Apellido</Label>
                            <Input id="apellido" value={user.apellido} readOnly className="bg-muted" />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="email">Correo Electrónico</Label>
                          <Input id="email" value={user.email} readOnly className="bg-muted" />
                        </div>
                        {user.telefono && (
                          <div>
                            <Label htmlFor="telefono">Teléfono</Label>
                            <Input id="telefono" value={user.telefono} readOnly className="bg-muted" />
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Label htmlFor="estado">Estado de la cuenta:</Label>
                          <Badge variant={user.activo ? "default" : "destructive"}>
                            {user.activo ? "Activa" : "Inactiva"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor="fecha">Miembro desde:</Label>
                          <span className="text-sm text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Notificaciones */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                          <Bell className="h-5 w-5" />
                          Notificaciones
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm md:text-base">Notificaciones push</p>
                            <p className="text-xs md:text-sm text-muted-foreground">
                              Recibe notificaciones en tu dispositivo
                            </p>
                          </div>
                          <Switch />
                        </div>
                        <Separator />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm md:text-base">Notificaciones por email</p>
                            <p className="text-xs md:text-sm text-muted-foreground">
                              Recibe actualizaciones por correo
                            </p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <Separator />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm md:text-base">SMS</p>
                            <p className="text-xs md:text-sm text-muted-foreground">Recibe SMS importantes</p>
                          </div>
                          <Switch />
                        </div>
                        <Separator />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm md:text-base">Ofertas y promociones</p>
                            <p className="text-xs md:text-sm text-muted-foreground">Recibe ofertas especiales</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Privacidad */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                          <Shield className="h-5 w-5" />
                          Privacidad y Seguridad
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm md:text-base">Perfil público</p>
                            <p className="text-xs md:text-sm text-muted-foreground">Permite que otros vean tu perfil</p>
                          </div>
                          <Switch />
                        </div>
                        <Separator />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm md:text-base">Compartir datos de uso</p>
                            <p className="text-xs md:text-sm text-muted-foreground">Ayuda a mejorar la plataforma</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <Separator />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm md:text-base">Autenticación de dos factores</p>
                            <p className="text-xs md:text-sm text-muted-foreground">
                              Añade una capa extra de seguridad
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            Configurar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Preferencias */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                          <Globe className="h-5 w-5" />
                          Preferencias
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="language">Idioma</Label>
                            <Select defaultValue="es">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="es">Español</SelectItem>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="fr">Français</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="currency">Moneda</Label>
                            <Select defaultValue="pyg">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pyg">PYG (₲)</SelectItem>
                                <SelectItem value="usd">USD ($)</SelectItem>
                                <SelectItem value="eur">EUR (€)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="timezone">Zona horaria</Label>
                            <Select defaultValue="america/asuncion">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="america/asuncion">America/Asunción</SelectItem>
                                <SelectItem value="america/new_york">América/Nueva York</SelectItem>
                                <SelectItem value="asia/tokyo">Asia/Tokio</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="theme">Tema</Label>
                            <Select defaultValue="system">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="light">Claro</SelectItem>
                                <SelectItem value="dark">Oscuro</SelectItem>
                                <SelectItem value="system">Sistema</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Gestión de datos */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                          <Download className="h-5 w-5" />
                          Gestión de Datos
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-medium text-sm md:text-base">Descargar mis datos</p>
                            <p className="text-xs md:text-sm text-muted-foreground">
                              Obtén una copia de toda tu información
                            </p>
                          </div>
                          <Button variant="outline" size="sm" className="w-full sm:w-auto bg-transparent">
                            <Download className="h-4 w-4 mr-2" />
                            Descargar
                          </Button>
                        </div>
                        <Separator />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-medium text-sm md:text-base text-red-600">Eliminar cuenta</p>
                            <p className="text-xs md:text-sm text-muted-foreground">Esta acción no se puede deshacer</p>
                          </div>
                          <Button variant="destructive" size="sm" className="w-full sm:w-auto">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Ayuda */}
              {activeSection === "ayuda" && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold mb-2">Centro de Ayuda</h1>
                    <p className="text-muted-foreground text-sm md:text-base">Encuentra respuestas a tus preguntas</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* FAQs */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg md:text-xl">Preguntas Frecuentes</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="p-3 border rounded-lg">
                            <h4 className="font-medium text-sm md:text-base mb-1">¿Cómo puedo rastrear mi pedido?</h4>
                            <p className="text-xs md:text-sm text-muted-foreground">
                              Ve a "Mis Pedidos" y haz clic en "Ver detalles"
                            </p>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <h4 className="font-medium text-sm md:text-base mb-1">
                              ¿Puedo cambiar mi dirección de entrega?
                            </h4>
                            <p className="text-xs md:text-sm text-muted-foreground">
                              Sí, antes de que el pedido sea enviado
                            </p>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <h4 className="font-medium text-sm md:text-base mb-1">¿Cómo cancelo un pedido?</h4>
                            <p className="text-xs md:text-sm text-muted-foreground">
                              Contacta con soporte dentro de las primeras 2 horas
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" className="w-full bg-transparent">
                          Ver todas las FAQs
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Contacto */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg md:text-xl">Contactar Soporte</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <Mail className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm md:text-base">Chat en vivo</p>
                              <p className="text-xs md:text-sm text-muted-foreground">Respuesta inmediata</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <Phone className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm md:text-base">Teléfono</p>
                              <p className="text-xs md:text-sm text-muted-foreground">+34 900 123 456</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <Mail className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm md:text-base">Email</p>
                              <p className="text-xs md:text-sm text-muted-foreground">soporte@mimarket.com</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs md:text-sm text-center">
                            <strong>Horario de atención:</strong>
                            <br />
                            Lunes a Viernes: 9:00 - 21:00
                            <br />
                            Sábados y Domingos: 10:00 - 18:00
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Guías */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg md:text-xl">Guías Paso a Paso</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                          <Package className="h-8 w-8 text-blue-600 mb-3" />
                          <h4 className="font-medium text-sm md:text-base mb-2">Cómo hacer un pedido</h4>
                          <p className="text-xs md:text-sm text-muted-foreground">
                            Guía completa para realizar tu primera compra
                          </p>
                        </div>

                        <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                          <CreditCard className="h-8 w-8 text-green-600 mb-3" />
                          <h4 className="font-medium text-sm md:text-base mb-2">Métodos de pago</h4>
                          <p className="text-xs md:text-sm text-muted-foreground">
                            Aprende sobre las opciones de pago disponibles
                          </p>
                        </div>

                        <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                          <MapPin className="h-8 w-8 text-purple-600 mb-3" />
                          <h4 className="font-medium text-sm md:text-base mb-2">Gestionar direcciones</h4>
                          <p className="text-xs md:text-sm text-muted-foreground">
                            Cómo añadir y editar tus direcciones de entrega
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
