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
  Bell,
} from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatearPrecioParaguayo } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useStoreAccess, useProfileType } from "@/hooks/use-profile-type"
import { comisionesService, ComisionResumen } from "@/lib/api/comisiones"
import { ordenesService, OrdenBackend } from "@/lib/api/ordenes"
import { productosService } from "@/lib/api/productos"
import type { Producto } from "@/lib/types/producto"
import { analiticasService, AnaliticasTienda } from "@/lib/api/analiticas"

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
  const { canAccessStoreDashboard } = useStoreAccess()
  const { storeInfo, isStoreOwner } = useProfileType()

  const [resumen, setResumen] = useState<ComisionResumen | null>(null)
  const [loadingResumen, setLoadingResumen] = useState<boolean>(true)
  const [errorResumen, setErrorResumen] = useState<string | null>(null)

  // Estado para datos reales
  const [ventasRecientes, setVentasRecientes] = useState<Array<{
    id: string
    cliente: string
    producto: string
    monto: number
    estado: string
    fecha: string
  }>>([])
  const [loadingVentas, setLoadingVentas] = useState<boolean>(false)

  const [productosPopulares, setProductosPopulares] = useState<Array<{
    nombre: string
    ventas: number
    ingresos: number
    stock: number | string
  }>>([])
  const [loadingProductos, setLoadingProductos] = useState<boolean>(false)
  const [productosList, setProductosList] = useState<Producto[]>([])

  const [ventasPorMes, setVentasPorMes] = useState<Array<{ mes: string; ventas: number }>>([])
  const [analiticas, setAnaliticas] = useState<AnaliticasTienda | null>(null)
  const [loadingAnaliticas, setLoadingAnaliticas] = useState<boolean>(false)

  useEffect(() => {
    const tiendaId = storeInfo?.id
    if (!tiendaId) return

    setLoadingResumen(true)
    setErrorResumen(null)
    comisionesService
      .getResumenComisionesTienda(tiendaId)
      .then(({ data }) => {
        setResumen(data)
      })
      .catch((err: any) => {
        const msg = err?.message || "No se pudo cargar el resumen de comisiones"
        setErrorResumen(msg)
      })
      .finally(() => setLoadingResumen(false))
  }, [storeInfo?.id])

  // Cargar analíticas del backend (ingresos, tiempos, conversión, satisfacción)
  useEffect(() => {
    const tiendaId = storeInfo?.id
    if (!tiendaId) return

    setLoadingAnaliticas(true)
    analiticasService
      .getAnaliticasTienda(tiendaId)
      .then((data) => setAnaliticas(data))
      .catch(() => setAnaliticas(null))
      .finally(() => setLoadingAnaliticas(false))
  }, [storeInfo?.id])

  // Cargar ventas recientes y analíticas desde órdenes reales
  useEffect(() => {
    const tiendaId = storeInfo?.id
    if (!tiendaId) return

    setLoadingVentas(true)
    ordenesService
      .getOrdenesByTienda(tiendaId)
      .then((ordenes: OrdenBackend[]) => {
        // Ordenar por fecha desc y tomar las más recientes (hasta 10)
        const recientes = [...ordenes]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10)
          .map((o) => {
            const cliente = [o.user?.name, o.user?.apellido].filter(Boolean).join(" ") || "—"
            const firstProducto = o.detalles?.[0]?.producto?.nombre
            const otrosCount = (o.detalles?.length || 0) - 1
            const producto = firstProducto
              ? otrosCount > 0
                ? `${firstProducto} + ${otrosCount} más`
                : firstProducto
              : `${o.detalles?.[0]?.cantidad || 0} ítems`
            const idStr = o.numero_orden || `ORD-${o.id_orden}`
            const fechaStr = new Date(o.created_at).toLocaleDateString("es-PY")
            return {
              id: idStr,
              cliente,
              producto,
              monto: o.total,
              estado: o.estado,
              fecha: fechaStr,
            }
          })
        setVentasRecientes(recientes)

        // Analítica: ventas por mes (últimos 6 meses)
        const mesesAbrev = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
        const now = new Date()
        const buckets: Array<{ key: string; mes: string; year: number; total: number }> = []
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const key = `${d.getFullYear()}-${d.getMonth()}`
          buckets.push({ key, mes: mesesAbrev[d.getMonth()], year: d.getFullYear(), total: 0 })
        }
        ordenes.forEach((o) => {
          const d = new Date(o.created_at)
          const key = `${d.getFullYear()}-${d.getMonth()}`
          const bucket = buckets.find((b) => b.key === key)
          if (bucket) bucket.total += o.total
        })
        setVentasPorMes(buckets.map((b) => ({ mes: b.mes, ventas: b.total })))
      })
      .catch(() => {
        setVentasRecientes([])
        setVentasPorMes([])
      })
      .finally(() => setLoadingVentas(false))
  }, [storeInfo?.id])

  // Cargar productos populares reales de la tienda
  useEffect(() => {
    const tiendaId = storeInfo?.id
    if (!tiendaId) return

    setLoadingProductos(true)
    productosService
      .getProductosByTienda(tiendaId, { per_page: 100 })
      .then((resp) => {
        const productos = resp.data
        setProductosList(productos)
      })
      .catch(() => setProductosPopulares([]))
      .finally(() => setLoadingProductos(false))
  }, [storeInfo?.id])

  // Derivar productos populares desde analíticas si está disponible; si no, usar total_ventas
  useEffect(() => {
    // Si tenemos top_productos desde analíticas, priorizar esa fuente
    if (analiticas && Array.isArray(analiticas.top_productos) && analiticas.top_productos.length > 0) {
      const top = analiticas.top_productos.slice(0, 8).map((tp) => {
        const cantidad = typeof (tp as any).cantidad_total === 'string' ? parseInt((tp as any).cantidad_total, 10) : (tp as any).cantidad_total || 0
        const monto = typeof (tp as any).monto_total === 'string' ? parseFloat((tp as any).monto_total) : (tp as any).monto_total || 0
        const prod = productosList.find((p) => p.id_producto === tp.id_producto || p.id === tp.id_producto)
        return {
          nombre: prod?.nombre || `Producto #${tp.id_producto}`,
          ventas: cantidad || 0,
          ingresos: monto || 0,
          stock: typeof prod?.stock === 'number' ? prod!.stock : '—',
        }
      })
      setProductosPopulares(top)
      return
    }

    // Fallback: calcular top por total_ventas del listado completo
    if (productosList && productosList.length > 0) {
      const topFallback = [...productosList]
        .sort((a, b) => (b.total_ventas || 0) - (a.total_ventas || 0))
        .slice(0, 8)
        .map((p) => ({
          nombre: p.nombre,
          ventas: p.total_ventas || 0,
          ingresos: (p.total_ventas || 0) * (p.precio || 0),
          stock: typeof p.stock === 'number' ? p.stock : '—',
        }))
      setProductosPopulares(topFallback)
    } else {
      setProductosPopulares([])
    }
  }, [analiticas?.top_productos, productosList])

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

  if (!canAccessStoreDashboard) {
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
              <h1 className="text-3xl font-bold mb-2">Dashboard - {storeInfo?.nombre}</h1>
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

          {/* Estadísticas principales - conectadas a resumen de comisiones */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monto de Comisiones</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingResumen
                    ? "Cargando…"
                    : formatearPrecioParaguayo(resumen?.monto_total ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {errorResumen ? "Sin datos" : "Total acumulado de comisiones"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Comisiones</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingResumen ? "—" : (resumen?.total_comisiones ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground">Comisiones generadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingResumen ? "—" : (resumen?.pendientes ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground">Comisiones sin pagar</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pagadas</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingResumen ? "—" : (resumen?.pagadas ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground">Comisiones liquidadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingResumen ? "—" : (resumen?.vencidas ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground">Comisiones vencidas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Promedio Comisión</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingResumen
                    ? "—"
                    : formatearPrecioParaguayo(resumen?.promedio_comision ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground">Promedio por comisión</p>
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
                    {ventasRecientes.map((venta) => (
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
                    {loadingVentas && (
                      <div className="text-sm text-muted-foreground">Cargando ventas…</div>
                    )}
                    {!loadingVentas && ventasRecientes.length === 0 && (
                      <div className="text-sm text-muted-foreground">No hay ventas recientes.</div>
                    )}
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
                    {productosPopulares.map((producto, index) => (
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
                    {loadingProductos && (
                      <div className="text-sm text-muted-foreground">Cargando productos…</div>
                    )}
                    {!loadingProductos && productosPopulares.length === 0 && (
                      <div className="text-sm text-muted-foreground">No hay productos populares.</div>
                    )}
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
                      {ventasPorMes.map((mes) => (
                        <div key={mes.mes} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{mes.mes}</span>
                          <div className="flex items-center gap-3 flex-1 ml-4">
                            <Progress value={(mes.ventas / 25000) * 100} className="flex-1" />
                            <span className="text-sm font-medium w-20 text-right">{formatearPrecioParaguayo(mes.ventas)}</span>
                          </div>
                        </div>
                      ))}
                      {(loadingVentas || loadingAnaliticas) && (
                        <div className="text-sm text-muted-foreground">Cargando analíticas…</div>
                      )}
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
                    {analiticas ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Tasa de conversión</span>
                          <span className="font-semibold">{typeof analiticas?.conversion?.tasa_conversion_por_usuario === 'number' ? `${analiticas.conversion.tasa_conversion_por_usuario.toFixed(1)}%` : '—'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Valor promedio del pedido</span>
                          <span className="font-semibold">{
                            typeof analiticas?.ordenes?.ingresos_tienda === 'number' && typeof analiticas?.ordenes?.total === 'number' && analiticas.ordenes.total > 0
                              ? formatearPrecioParaguayo(Math.round(analiticas.ordenes.ingresos_tienda / analiticas.ordenes.total))
                              : '—'
                          }</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Tiempo promedio de entrega</span>
                          <span className="font-semibold">{typeof analiticas?.ordenes?.tiempo_promedio_entrega_horas === 'number' ? `${analiticas.ordenes.tiempo_promedio_entrega_horas.toFixed(1)} h` : '—'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Satisfacción del cliente</span>
                          <span className="font-semibold">{typeof analiticas?.satisfaccion?.promedio_calificacion === 'number' ? `${analiticas.satisfaccion.promedio_calificacion.toFixed(1)}/5 (${analiticas.satisfaccion?.total_resenas ?? 0})` : '—'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Ingresos del periodo</span>
                          <span className="font-semibold">{formatearPrecioParaguayo(typeof analiticas?.ordenes?.ingresos_tienda === 'number' ? analiticas.ordenes.ingresos_tienda : 0)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {loadingAnaliticas ? "Cargando analíticas…" : "No hay datos de analíticas disponibles"}
                      </div>
                    )}
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
                <Link href="/dashboard-tienda/notificaciones">
                  <Bell className="h-8 w-8 mb-2" />
                  <span>Notificaciones</span>
                </Link>
              </Button>

              <Button asChild variant="outline" className="h-auto p-6 flex-col">
                <Link href="/dashboard-tienda/clientes">
                  <Users className="h-8 w-8 mb-2" />
                  <span>Gestionar Clientes</span>
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
