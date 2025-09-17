"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Search, Filter, Download, Eye, Package, Truck, CheckCircle } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Datos simulados de pedidos
const pedidos = [
  {
    id: "ORD-001",
    cliente: "María González",
    email: "maria@email.com",
    productos: [{ nombre: "Smartphone Galaxy S23", cantidad: 1, precio: 899.99 }],
    total: 899.99,
    estado: "completado",
    fecha: "2024-01-15",
    direccion: "Av. Mariscal López 123, Asunción",
    metodoPago: "Tarjeta de crédito",
    metodoEntrega: "Envío a domicilio",
  },
  {
    id: "ORD-002",
    cliente: "Carlos Ruiz",
    email: "carlos@email.com",
    productos: [{ nombre: "Laptop ProBook X360", cantidad: 1, precio: 1299.99 }],
    total: 1299.99,
    estado: "procesando",
    fecha: "2024-01-15",
    direccion: "Av. San Martín 456, Ciudad del Este",
    metodoPago: "PayPal",
    metodoEntrega: "Envío a domicilio",
  },
  {
    id: "ORD-003",
    cliente: "Ana López",
    email: "ana@email.com",
    productos: [{ nombre: "Auriculares Pro", cantidad: 2, precio: 199.99 }],
    total: 399.98,
    estado: "enviado",
    fecha: "2024-01-14",
    direccion: "Plaza Mayor 789, Valencia",
    metodoPago: "Transferencia",
    metodoEntrega: "Envío a domicilio",
  },
  {
    id: "ORD-004",
    cliente: "Pedro Martín",
    email: "pedro@email.com",
    productos: [{ nombre: "Smart TV 4K", cantidad: 1, precio: 699.99 }],
    total: 699.99,
    estado: "pendiente",
    fecha: "2024-01-14",
    direccion: "Calle Nueva 321, Sevilla",
    metodoPago: "Efectivo",
    metodoEntrega: "Retiro en tienda",
  },
]

export default function PedidosTiendaPage() {
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [busqueda, setBusqueda] = useState("")

  const pedidosFiltrados = pedidos.filter((pedido) => {
    const coincideBusqueda =
      pedido.id.toLowerCase().includes(busqueda.toLowerCase()) ||
      pedido.cliente.toLowerCase().includes(busqueda.toLowerCase())
    const coincideEstado = filtroEstado === "todos" || pedido.estado === filtroEstado

    return coincideBusqueda && coincideEstado
  })

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "completado":
        return <Badge className="bg-green-100 text-green-800">Completado</Badge>
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
      case "procesando":
        return <Package className="h-4 w-4 text-yellow-600" />
      case "enviado":
        return <Truck className="h-4 w-4 text-blue-600" />
      default:
        return <Package className="h-4 w-4 text-gray-600" />
    }
  }

  const contarPorEstado = (estado: string) => {
    return pedidos.filter((p) => p.estado === estado).length
  }

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
                  <span className="text-sm font-medium">Completados</span>
                </div>
                <p className="text-2xl font-bold mt-1">{contarPorEstado("completado")}</p>
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
                    <SelectItem value="completado">Completados</SelectItem>
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
              <div className="space-y-4">
                {pedidosFiltrados.map((pedido) => (
                  <div key={pedido.id} className="border rounded-lg p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getEstadoIcon(pedido.estado)}
                          <span className="font-semibold">{pedido.id}</span>
                          {getEstadoBadge(pedido.estado)}
                        </div>

                        <div className="grid md:grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="font-medium">Cliente:</span> {pedido.cliente}
                          </div>
                          <div>
                            <span className="font-medium">Email:</span> {pedido.email}
                          </div>
                          <div>
                            <span className="font-medium">Fecha:</span> {pedido.fecha}
                          </div>
                          <div>
                            <span className="font-medium">Total:</span> ${pedido.total.toFixed(2)}
                          </div>
                        </div>

                        <div className="mt-2">
                          <span className="font-medium text-sm">Productos:</span>
                          <ul className="text-sm text-muted-foreground">
                            {pedido.productos.map((producto, index) => (
                              <li key={index}>
                                {producto.cantidad}x {producto.nombre} - ${producto.precio.toFixed(2)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>

                        {pedido.estado === "pendiente" && <Button size="sm">Procesar</Button>}

                        {pedido.estado === "procesando" && <Button size="sm">Marcar como Enviado</Button>}
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
