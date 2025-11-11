"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Search, Plus, Edit, Trash2, Eye, Package, ChevronLeft, ChevronRight } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useProfileType } from "@/hooks/use-profile-type"
import { useProductosByTienda } from "@/hooks/useProductos"
import { productosService } from "@/lib/api/productos"
import { toast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

export default function ProductosTiendaPage() {
  const [busqueda, setBusqueda] = useState("")
  const [imagenesActuales, setImagenesActuales] = useState<{ [key: number]: number }>({})
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; nombre: string } | null>(null)
  const { storeInfo } = useProfileType()
  const tiendaId = storeInfo?.id || 0
  const { productos, loading, error, pagination, refetch } = useProductosByTienda(tiendaId, { per_page: 12 })

  useEffect(() => {
    if (tiendaId) {
      refetch({ search: busqueda })
    }
  }, [busqueda, tiendaId])

  const getTipoVentaBadge = (tipoVenta: string) => {
    switch (tipoVenta) {
      case "directa":
        return <Badge className="bg-green-100 text-green-800">Directa</Badge>
      case "pedido":
        return <Badge className="bg-orange-100 text-orange-800">Por Pedido</Badge>
      case "delivery":
        return <Badge className="bg-blue-100 text-blue-800">Delivery</Badge>
      default:
        return <Badge variant="secondary">{tipoVenta}</Badge>
    }
  }

  const getStockStatus = (stock: number, tipoVenta: string) => {
    if (tipoVenta === "delivery") return "Disponible"
    if (stock === 0) return "Sin stock"
    if (stock < 5) return "Stock bajo"
    return "En stock"
  }

  const getStockBadge = (stock: number, tipoVenta: string) => {
    const status = getStockStatus(stock, tipoVenta)
    switch (status) {
      case "Sin stock":
        return <Badge variant="destructive">Sin stock</Badge>
      case "Stock bajo":
        return <Badge className="bg-yellow-100 text-yellow-800">Stock bajo</Badge>
      case "En stock":
        return <Badge className="bg-green-100 text-green-800">En stock</Badge>
      default:
        return <Badge className="bg-blue-100 text-blue-800">Disponible</Badge>
    }
  }

  const getImagenPrincipal = (producto: any) => {
    const todasLasImagenes = getImagenes(producto)
    const key = producto.id_producto || producto.id
    const imagenActual = imagenesActuales[key] || 0
    return todasLasImagenes[imagenActual] || "/placeholder.svg"
  }

  const getImagenes = (producto: any) => {
    const imagenes: string[] = []

    if (Array.isArray(producto.imagenes) && producto.imagenes.length > 0) {
      imagenes.push(...producto.imagenes)
    } else if (producto.imagen) {
      imagenes.push(producto.imagen)
    }

    if (producto.imagen_principal) {
      imagenes.unshift(producto.imagen_principal)
    }
    if (producto.imagenes_adicionales && Array.isArray(producto.imagenes_adicionales)) {
      producto.imagenes_adicionales.forEach((img: any) => {
        if (img?.url) imagenes.push(img.url)
      })
    }

    return imagenes.length > 0 ? imagenes : ["/placeholder.svg"]
  }

  const cambiarImagen = (productoId: number, direccion: "siguiente" | "anterior", imagenes: string[]) => {
    setImagenesActuales((prev) => {
      const actual = prev[productoId] || 0
      let nueva = actual

      if (direccion === "siguiente") {
        nueva = (actual + 1) % imagenes.length
      } else {
        nueva = (actual - 1 + imagenes.length) % imagenes.length
      }

      return { ...prev, [productoId]: nueva }
    })
  }

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return
    const id = confirmDelete.id
    try {
      setDeletingId(id)
      await productosService.deleteProducto(id)
      toast({ title: "Producto eliminado", description: `Se eliminó el producto #${id}` })
      setConfirmDelete(null)
      refetch()
    } catch (err) {
      toast({ title: "Error al eliminar", description: "No se pudo eliminar el producto", variant: "destructive" })
      console.error("Error deleting product", err)
    } finally {
      setDeletingId(null)
    }
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

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Gestión de Productos</h1>
              <p className="text-muted-foreground">Administra el inventario de tu tienda</p>
            </div>
            <Button asChild>
              <Link href="/subir-producto">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Producto
              </Link>
            </Button>
          </div>

          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Total Productos</span>
                </div>
                <p className="text-xl md:text-2xl font-bold mt-1">{productos.length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">En Stock</span>
                </div>
                <p className="text-xl md:text-2xl font-bold mt-1">
                  {productos.filter((p: any) => p.stock > 0 || p.tipoVenta === "delivery").length}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">Stock Bajo</span>
                </div>
                <p className="text-xl md:text-2xl font-bold mt-1">
                  {productos.filter((p: any) => p.stock > 0 && p.stock < 5 && p.tipoVenta !== "delivery").length}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">Sin Stock</span>
                </div>
                <p className="text-xl md:text-2xl font-bold mt-1">
                  {productos.filter((p: any) => p.stock === 0 && p.tipoVenta !== "delivery").length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Búsqueda */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar productos por nombre o categoría..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Lista de productos */}
          <Card>
            <CardHeader>
              <CardTitle>Productos ({productos.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {error && <div className="text-red-600 mb-4">{error}</div>}
              {loading && <div className="text-muted-foreground mb-4">Cargando productos...</div>}
              <div className="space-y-4">
                {productos.map((producto: any) => {
                  const imagenes = getImagenes(producto)
                  const tieneMultiplesImagenes = imagenes.length > 1

                  return (
                    <div key={producto.id_producto || producto.id} className="border rounded-lg p-4">
                      <div className="flex flex-col lg:flex-row gap-4">
                        {/* Imagen del producto con navegación */}
                        <div className="relative h-20 w-20 lg:h-24 lg:w-24 flex-shrink-0 mx-auto lg:mx-0">
                          <Image
                            src={getImagenPrincipal(producto) || "/placeholder.svg"}
                            alt={producto.nombre}
                            fill
                            className="object-cover rounded-md"
                          />

                          {/* Controles para múltiples imágenes */}
                          {tieneMultiplesImagenes && (
                            <>
                              <Button
                                variant="secondary"
                                size="icon"
                                className="absolute -left-2 top-1/2 transform -translate-y-1/2 h-6 w-6 bg-white/80 hover:bg-white/90"
                                onClick={() => cambiarImagen(producto.id_producto || producto.id, "anterior", imagenes)}
                              >
                                <ChevronLeft className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="secondary"
                                size="icon"
                                className="absolute -right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 bg-white/80 hover:bg-white/90"
                                onClick={() => cambiarImagen(producto.id_producto || producto.id, "siguiente", imagenes)}
                              >
                                <ChevronRight className="h-3 w-3" />
                              </Button>

                              {/* Indicador de imagen */}
                              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs px-1 rounded">
                                {(imagenesActuales[producto.id_producto || producto.id] || 0) + 1}/{imagenes.length}
                              </div>
                            </>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <h3 className="font-semibold text-base lg:text-lg">{producto.nombre}</h3>
                                {getTipoVentaBadge(producto.tipoVenta)}
                                {getStockBadge(producto.stock, producto.tipoVenta)}
                                {imagenes.length > 1 && (
                                  <Badge variant="outline" className="text-xs">
                                    {imagenes.length} fotos
                                  </Badge>
                                )}
                              </div>

                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{producto.descripcion}</p>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                                <div>
                                  <span className="font-medium">Precio:</span> ₲{producto.precio.toLocaleString()}
                                  {producto.descuento > 0 && (
                                    <span className="text-green-600 ml-1">(-{producto.descuento}%)</span>
                                  )}
                                </div>
                                <div>
                                  <span className="font-medium">Categoría:</span> {producto.categoria}
                                </div>
                                <div>
                                  <span className="font-medium">Stock:</span>{" "}
                                  {producto.tipoVenta === "delivery" ? "Disponible" : producto.stock}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-row lg:flex-col gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="flex-1 lg:flex-none bg-transparent"
                              >
                                <Link href={`/productos/${producto.id_producto || producto.id}`}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  <span className="hidden sm:inline">Ver</span>
                                </Link>
                              </Button>

                              <Button variant="outline" size="sm" asChild className="flex-1 lg:flex-none bg-transparent">
                                <Link href={`/dashboard-tienda/productos/${producto.id_producto || producto.id}/editar`}>
                                  <Edit className="h-4 w-4 mr-1" />
                                  <span className="hidden sm:inline">Editar</span>
                                </Link>
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 flex-1 lg:flex-none bg-transparent"
                                onClick={() => setConfirmDelete({ id: (producto.id_producto || producto.id), nombre: producto.nombre })}
                                disabled={deletingId === (producto.id_producto || producto.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">{deletingId === (producto.id_producto || producto.id) ? "Eliminando..." : "Eliminar"}</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {!loading && productos.length === 0 && (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No se encontraron productos</p>
                  <Button asChild className="mt-4">
                    <Link href="/subir-producto">
                      <Plus className="h-4 w-4 mr-2" />
                      Añadir tu primer producto
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      {/* Modal de confirmación de eliminación */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => { if (!open) setConfirmDelete(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar producto</DialogTitle>
            <DialogDescription>
              {confirmDelete ? (
                <>¿Estás seguro de que deseas eliminar "{confirmDelete.nombre}"? Esta acción no se puede deshacer.</>
              ) : (
                <>¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)} disabled={deletingId !== null}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDeleteAction} disabled={deletingId !== null}>
              {deletingId !== null ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  )
}
