"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Search, Users, Mail, Phone, MapPin, Calendar, DollarSign } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useProfileType } from "@/hooks/use-profile-type"
import { clientesService, ClienteResumenBackend } from "@/lib/api/clientes"

interface ClienteResumen {
  id: number
  nombre: string
  email: string
  telefono?: string
  avatar?: string
  fechaRegistro: string
  totalPedidos: number
  totalGastado: number
  ultimoPedido: string
  estado: string
  direccion?: string
}

export default function ClientesTiendaPage() {
  const { storeInfo } = useProfileType()
  const [busqueda, setBusqueda] = useState("")
  const [clientes, setClientes] = useState<ClienteResumen[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    const tiendaId = storeInfo?.id
    if (!tiendaId) return

    setLoading(true)
    clientesService
      .getClientesByTienda(tiendaId)
      .then((list: ClienteResumenBackend[]) => {
        // El backend ya devuelve agregación y estado; normalizar y ordenar por último pedido
        const finalList: ClienteResumen[] = list.map((c) => ({
          id: c.id,
          nombre: c.nombre,
          email: c.email,
          telefono: c.telefono,
          avatar: c.avatar || "/placeholder-user.jpg",
          fechaRegistro: new Date(c.fechaRegistro).toISOString(),
          totalPedidos: c.totalPedidos,
          totalGastado: c.totalGastado,
          ultimoPedido: new Date(c.ultimoPedido).toISOString(),
          estado: c.estado,
          direccion: c.direccion,
        }))
        finalList.sort((a, b) => new Date(b.ultimoPedido).getTime() - new Date(a.ultimoPedido).getTime())
        setClientes(finalList)
      })
      .catch(() => setClientes([]))
      .finally(() => setLoading(false))
  }, [storeInfo?.id])
  const clientesFiltrados = clientes.filter(
    (cliente) =>
      cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      cliente.email.toLowerCase().includes(busqueda.toLowerCase()),
  )

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "vip":
        return <Badge className="bg-purple-100 text-purple-800">VIP</Badge>
      case "activo":
        return <Badge className="bg-green-100 text-green-800">Activo</Badge>
      case "inactivo":
        return <Badge className="bg-gray-100 text-gray-800">Inactivo</Badge>
      default:
        return <Badge variant="secondary">{estado}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const contarPorEstado = (estado: string) => clientes.filter((c) => c.estado === estado).length
  const totalClientes = clientes.length
  const totalIngresos = clientes.reduce((sum, cliente) => sum + cliente.totalGastado, 0)
  const promedioGasto = totalClientes > 0 ? totalIngresos / totalClientes : 0

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
              <h1 className="text-3xl font-bold mb-2">Gestión de Clientes</h1>
              <p className="text-muted-foreground">Administra y conoce mejor a tus clientes</p>
            </div>
          </div>

          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Total Clientes</span>
                </div>
                <p className="text-2xl font-bold mt-1">{totalClientes}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Clientes Activos</span>
                </div>
                <p className="text-2xl font-bold mt-1">{contarPorEstado("activo")}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Clientes VIP</span>
                </div>
                <p className="text-2xl font-bold mt-1">{contarPorEstado("vip")}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Gasto Promedio</span>
                </div>
                <p className="text-2xl font-bold mt-1">${promedioGasto.toFixed(0)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Búsqueda */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar clientes por nombre o email..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Lista de clientes */}
          <Card>
            <CardHeader>
              <CardTitle>Clientes ({clientesFiltrados.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clientesFiltrados.map((cliente) => (
                  <div key={cliente.id} className="border rounded-lg p-4">
                    <div className="flex gap-4">
                      <div className="relative h-16 w-16 flex-shrink-0">
                        <Image
                          src={cliente.avatar || "/placeholder.svg"}
                          alt={cliente.nombre}
                          fill
                          className="object-cover rounded-full"
                        />
                      </div>

                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{cliente.nombre}</h3>
                              {getEstadoBadge(cliente.estado)}
                            </div>

                            <div className="grid md:grid-cols-2 gap-2 text-sm mb-3">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{cliente.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{cliente.telefono}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>{cliente.direccion}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>Cliente desde {formatDate(cliente.fechaRegistro)}</span>
                              </div>
                            </div>

                          <div className="grid md:grid-cols-3 gap-4 text-sm">
                            <div className="bg-muted/50 p-3 rounded-lg">
                              <p className="font-medium">Total Pedidos</p>
                              <p className="text-xl font-bold">{cliente.totalPedidos}</p>
                            </div>
                            <div className="bg-muted/50 p-3 rounded-lg">
                              <p className="font-medium">Total Gastado</p>
                              <p className="text-xl font-bold">{cliente.totalGastado.toLocaleString("es-PY")}</p>
                            </div>
                            <div className="bg-muted/50 p-3 rounded-lg">
                              <p className="font-medium">Último Pedido</p>
                              <p className="text-xl font-bold">{formatDate(cliente.ultimoPedido)}</p>
                            </div>
                          </div>
                        </div>

                          <div className="flex flex-col gap-2">
                            <Button variant="outline" size="sm">
                              <Mail className="h-4 w-4 mr-1" />
                              Contactar
                            </Button>

                            <Button variant="outline" size="sm">
                              Ver Pedidos
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {loading && (
                <div className="text-center py-4 text-sm text-muted-foreground">Cargando clientes…</div>
              )}

              {clientesFiltrados.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No se encontraron clientes</p>
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
