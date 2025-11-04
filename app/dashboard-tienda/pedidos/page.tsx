"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Search, Filter, Download, Eye, Package, Truck, CheckCircle } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ordenesService, OrdenBackend } from "@/lib/api/ordenes"
import { useProfileType } from "@/hooks/use-profile-type"

export default function PedidosTiendaPage() {
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [busqueda, setBusqueda] = useState("")
  const [pedidos, setPedidos] = useState<OrdenBackend[]>([])
  const [loading, setLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { storeInfo } = useProfileType()
  const tiendaId = storeInfo?.id || 0

  const handleChangeEstado = handleChangeEstadoFactory(setUpdatingId, setPedidos)

  useEffect(() => {
    const fetchPedidos = async () => {
      if (!tiendaId) return
      setLoading(true)
      setError(null)
      try {
        const ordenes = await ordenesService.getOrdenesByTienda(tiendaId)
        setPedidos(ordenes)
      } catch (err: any) {
        console.error("Error obteniendo órdenes por tienda:", err)
        setError("No se pudieron cargar los pedidos de la tienda")
      } finally {
        setLoading(false)
      }
    }
    fetchPedidos()
  }, [tiendaId])

  const pedidosFiltrados = pedidos.filter((pedido) => {
    const idToSearch = (pedido.numero_orden || String(pedido.id_orden) || "").toLowerCase()
    const clienteNombre = (pedido.user?.name || "").toLowerCase()
    const coincideBusqueda = idToSearch.includes(busqueda.toLowerCase()) || clienteNombre.includes(busqueda.toLowerCase())
    const coincideEstado = filtroEstado === "todos" || pedido.estado === filtroEstado
    return coincideBusqueda && coincideEstado
  })

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "completado":
        return <Badge className="bg-green-100 text-green-800">Completado</Badge>
      case "entregado":
        return <Badge className="bg-green-100 text-green-800">Entregado</Badge>
      case "procesando":
        return <Badge className="bg-yellow-100 text-yellow-800">Procesando</Badge>
      case "enviado":
        return <Badge className="bg-blue-100 text-blue-800">Enviado</Badge>
      case "pendiente":
        return <Badge className="bg-orange-100 text-orange-800">Pendiente</Badge>
      case "cancelado":
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>
      default:
        return <Badge variant="secondary">{estado}</Badge>
    }
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case "completado":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "entregado":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "procesando":
        return <Package className="h-4 w-4 text-yellow-600" />
      case "enviado":
        return <Truck className="h-4 w-4 text-blue-600" />
      default:
        return <Package className="h-4 w-4 text-gray-600" />
    }
  }

  const contarPorEstado = (estado: string) => pedidos.filter((p) => p.estado === estado).length

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full">
        <div className="px-4 md:px-6 py-6 md:py-10">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" asChild>
              <Link href="/dashboard-tienda">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Link>
            </Button>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Gestión de Pedidos</h1>
              <p className="text-muted-foreground">Administra todos los pedidos de tu tienda</p>
            </div>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>

          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Pendientes</span>
                </div>
                <p className="text-2xl font-bold mt-1">{contarPorEstado("pendiente")}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">Procesando</span>
                </div>
                <p className="text-2xl font-bold mt-1">{contarPorEstado("procesando")}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Enviados</span>
                </div>
                <p className="text-2xl font-bold mt-1">{contarPorEstado("enviado")}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Entregados</span>
                </div>
                <p className="text-2xl font-bold mt-1">{contarPorEstado("entregado")}</p>
              </CardContent>
            </Card>
          </div>

          {/* Filtros y búsqueda */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por ID de pedido o cliente..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                  <SelectTrigger className="w-full md:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="pendiente">Pendientes</SelectItem>
                  <SelectItem value="procesando">Procesando</SelectItem>
                  <SelectItem value="enviado">Enviados</SelectItem>
                  <SelectItem value="entregado">Entregados</SelectItem>
                  <SelectItem value="cancelado">Cancelados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          </Card>

          {/* Lista de pedidos */}
          <Card>
            <CardHeader>
              <CardTitle>Pedidos ({pedidosFiltrados.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="text-center py-6 text-muted-foreground">Cargando pedidos...</div>
              )}
              {error && (
                <div className="text-center py-6 text-red-600">{error}</div>
              )}
              <div className="space-y-4">
                {pedidosFiltrados.map((pedido) => (
                  <div key={pedido.id_orden} className="border rounded-lg p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getEstadoIcon(pedido.estado)}
                          <span className="font-semibold">{pedido.numero_orden || `ORD-${pedido.id_orden}`}</span>
                          {getEstadoBadge(pedido.estado)}
                        </div>

                        <div className="grid md:grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="font-medium">Cliente:</span> {pedido.user?.name || "-"}
                          </div>
                          <div>
                            <span className="font-medium">Email:</span> {pedido.user?.email || "-"}
                          </div>
                          <div>
                            <span className="font-medium">Fecha:</span> {new Date(pedido.created_at).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Total:</span> ${Number(pedido.total).toFixed(2)}
                          </div>
                        </div>

                        <div className="mt-2">
                          <span className="font-medium text-sm">Productos:</span>
                          <ul className="text-sm text-muted-foreground">
                            {(pedido.detalles || []).map((detalle, index) => (
                              <li key={index}>
                                {detalle.cantidad}x {detalle.producto?.nombre || `Producto ${detalle.id_producto}`} - $
                                {Number(detalle.precio_unitario ?? detalle.producto?.precio ?? 0).toFixed(2)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button asChild variant="outline" size="sm" disabled={updatingId === pedido.id_orden}>
                          <Link href={`/dashboard-tienda/pedidos/${pedido.id_orden}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Link>
                        </Button>
                        {pedido.estado === "pendiente" && (
                          <>
                            <Button size="sm" disabled={updatingId === pedido.id_orden} onClick={() => handleChangeEstado(pedido, "procesando")}>
                              Procesar
                            </Button>
                            <Button variant="destructive" size="sm" disabled={updatingId === pedido.id_orden} onClick={() => handleChangeEstado(pedido, "cancelado")}>
                              Rechazar
                            </Button>
                          </>
                        )}
                        {pedido.estado === "procesando" && (
                          <>
                            <Button size="sm" disabled={updatingId === pedido.id_orden} onClick={() => handleChangeEstado(pedido, "enviado")}>
                              Marcar como Enviado
                            </Button>
                            <Button variant="destructive" size="sm" disabled={updatingId === pedido.id_orden} onClick={() => handleChangeEstado(pedido, "cancelado")}>
                              Cancelar
                            </Button>
                          </>
                        )}
                        {pedido.estado === "enviado" && (
                          <Button size="sm" disabled={updatingId === pedido.id_orden} onClick={() => handleChangeEstado(pedido, "entregado")}>
                            Marcar como Entregado
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {pedidosFiltrados.length === 0 && (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No se encontraron pedidos</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function handleChangeEstadoFactory(
  setUpdatingId: (id: number | null) => void,
  setPedidos: React.Dispatch<React.SetStateAction<OrdenBackend[]>>
) {
  return async (orden: OrdenBackend, nuevoEstado: string) => {
    setUpdatingId(orden.id_orden)
    try {
      await ordenesService.updateOrdenEstado(orden.id_orden, nuevoEstado)
      setPedidos((prev) => prev.map((p) => (p.id_orden === orden.id_orden ? { ...p, estado: nuevoEstado } : p)))
    } catch (e) {
      console.error("No se pudo actualizar el estado", e)
    } finally {
      setUpdatingId(null)
    }
  }
}
