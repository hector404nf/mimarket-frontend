"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Package,
  ShoppingCart,
  DollarSign,
  Users,
  TrendingUp,
  Eye,
  Star,
  Plus,
  BarChart3,
  Settings,
} from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatearPrecioParaguayo } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

// Datos simulados para el dashboard
const dashboardData = {
  stats: {
    totalVentas: 113800000,
    pedidosHoy: 12,
    productosActivos: 45,
    calificacionPromedio: 4.8,
    visitasHoy: 234,
    clientesNuevos: 8,
  },
  ventasRecientes: [
    {
      id: "ORD-001",
      cliente: "María González",
      producto: "Smartphone Galaxy S23",
      monto: 6640000,
      estado: "completado",
      fecha: "2024-01-15",
    },
    {
      id: "ORD-002",
      cliente: "Carlos Ruiz",
      producto: "Laptop ProBook X360",
      monto: 9600000,
      estado: "procesando",
      fecha: "2024-01-15",
    },
    {
      id: "ORD-003",
      cliente: "Ana López",
      producto: "Auriculares Pro",
      monto: 1480000,
      estado: "enviado",
      fecha: "2024-01-14",
    },
    {
      id: "ORD-004",
      cliente: "Pedro Martín",
      producto: "Smart TV 4K",
      monto: 5170000,
      estado: "completado",
      fecha: "2024-01-14",
    },
  ],
  productosPopulares: [
    { nombre: "Smartphone Galaxy S23", ventas: 45, ingresos: 298800000, stock: 15 },
    { nombre: "Auriculares Pro", ventas: 32, ingresos: 47200000, stock: 12 },
    { nombre: "Smart TV 4K", ventas: 18, ingresos: 93000000, stock: 3 },
    { nombre: "Laptop ProBook X360", ventas: 12, ingresos: 115200000, stock: 0 },
  ],
  ventasPorMes: [
    { mes: "Ene", ventas: 92300000 },
    { mes: "Feb", ventas: 112200000 },
    { mes: "Mar", ventas: 139500000 },
    { mes: "Abr", ventas: 124000000 },
    { mes: "May", ventas: 157300000 },
    { mes: "Jun", ventas: 144000000 },
  ],
}

export default function DashboardTiendaPage() {
  const [userProfile, setUserProfile] = useState<any>(null)

  useEffect(() => {
    // Cargar perfil del usuario
    const profile = localStorage.getItem("userProfile")
    if (profile) {
      setUserProfile(JSON.parse(profile))
    }
  }, [])

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "completado":
        return <Badge className="bg-green-100 text-green-800">Completado</Badge>
      case "procesando":
        return <Badge className="bg-yellow-100 text-yellow-800">Procesando</Badge>
      case "enviado":
        return <Badge className="bg-blue-100 text-blue-800">Enviado</Badge>
      case "cancelado":
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>
      default:
        return <Badge variant="secondary">{estado}</Badge>
    }
  }

  if (!userProfile || userProfile.type !== "store") {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Acceso denegado</h1>
            <p className="text-muted-foreground mb-4">Esta página es solo para tiendas</p>
            <Button asChild>
              <Link href="/onboarding">Configurar perfil de tienda</Link>
            </Button>
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
              <h1 className="text-3xl font-bold mb-2">Dashboard - {userProfile.storeInfo.storeName}</h1>
              <p className="text-muted-foreground">Gestiona tu tienda y supervisa tus ventas</p>
            </div>
            <div className="flex gap-2 mt-4 md:mt-0">
              <Button asChild>
                <Link href="/subir-producto">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Producto
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard-tienda/configuracion">
                  <Settings className="h-4 w-4 mr-2" />
                  Configuración
                </Link>
              </Button>
            </div>
          </div>

          {/* Estadísticas principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatearPrecioParaguayo(dashboardData.stats.totalVentas)}</div>
                <p className="text-xs text-muted-foreground">+12% desde el mes pasado</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pedidos Hoy</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.stats.pedidosHoy}</div>
                <p className="text-xs text-muted-foreground">+3 desde ayer</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Productos Activos</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.stats.productosActivos}</div>
                <p className="text-xs text-muted-foreground">5 sin stock</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Calificación</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.stats.calificacionPromedio}</div>
                <p className="text-xs text-muted-foreground">De 127 reseñas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Visitas Hoy</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.stats.visitasHoy}</div>
                <p className="text-xs text-muted-foreground">+18% vs ayer</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clientes Nuevos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.stats.clientesNuevos}</div>
                <p className="text-xs text-muted-foreground">Esta semana</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="ventas" className="space-y-6">
            <TabsList>
              <TabsTrigger value="ventas">Ventas Recientes</TabsTrigger>
              <TabsTrigger value="productos">Productos Populares</TabsTrigger>
              <TabsTrigger value="analytics">Analíticas</TabsTrigger>
            </TabsList>

            {/* Ventas Recientes */}
            <TabsContent value="ventas">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Ventas Recientes</CardTitle>
                  <Button variant="outline" asChild>
                    <Link href="/dashboard-tienda/pedidos">Ver todos</Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.ventasRecientes.map((venta) => (
                      <div key={venta.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-medium">{venta.id}</span>
                            {getEstadoBadge(venta.estado)}
                          </div>
                          <p className="text-sm text-muted-foreground">{venta.cliente}</p>
                          <p className="text-sm">{venta.producto}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatearPrecioParaguayo(venta.monto)}</p>
                          <p className="text-sm text-muted-foreground">{venta.fecha}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Productos Populares */}
            <TabsContent value="productos">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Productos Más Vendidos</CardTitle>
                  <Button variant="outline" asChild>
                    <Link href="/dashboard-tienda/productos">Gestionar productos</Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.productosPopulares.map((producto, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-medium">{producto.nombre}</h3>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm text-muted-foreground">{producto.ventas} ventas</span>
                            <span className="text-sm text-muted-foreground">
                              Stock: {producto.stock > 0 ? producto.stock : "Agotado"}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatearPrecioParaguayo(producto.ingresos)}</p>
                          <p className="text-sm text-muted-foreground">Ingresos totales</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analíticas */}
            <TabsContent value="analytics">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Ventas por Mes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboardData.ventasPorMes.map((mes) => (
                        <div key={mes.mes} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{mes.mes}</span>
                          <div className="flex items-center gap-3 flex-1 ml-4">
                            <Progress value={(mes.ventas / 25000) * 100} className="flex-1" />
                            <span className="text-sm font-medium w-20 text-right">{formatearPrecioParaguayo(mes.ventas)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Métricas de Rendimiento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Tasa de conversión</span>
                      <span className="font-semibold">3.2%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Valor promedio del pedido</span>
                      <span className="font-semibold">{formatearPrecioParaguayo(8700000)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Tiempo promedio de entrega</span>
                      <span className="font-semibold">2.3 días</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Productos devueltos</span>
                      <span className="font-semibold">1.8%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Satisfacción del cliente</span>
                      <span className="font-semibold">96%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Acciones rápidas */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button asChild className="h-auto p-6 flex-col">
                <Link href="/subir-producto">
                  <Plus className="h-8 w-8 mb-2" />
                  <span>Añadir Producto</span>
                </Link>
              </Button>

              <Button asChild variant="outline" className="h-auto p-6 flex-col">
                <Link href="/dashboard-tienda/pedidos">
                  <Package className="h-8 w-8 mb-2" />
                  <span>Ver Pedidos</span>
                </Link>
              </Button>

              <Button asChild variant="outline" className="h-auto p-6 flex-col">
                <Link href="/dashboard-tienda/clientes">
                  <Users className="h-8 w-8 mb-2" />
                  <span>Gestionar Clientes</span>
                </Link>
              </Button>

              <Button asChild variant="outline" className="h-auto p-6 flex-col">
                <Link href="/dashboard-tienda/reportes">
                  <BarChart3 className="h-8 w-8 mb-2" />
                  <span>Ver Reportes</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
