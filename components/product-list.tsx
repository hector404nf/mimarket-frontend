"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Heart, ShoppingCart, Package, Clock, Truck, ChevronLeft, ChevronRight, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useProductos } from "@/hooks/useProductos"
import { useCart } from "@/lib/cart-store"
import { useBehaviorTracking } from "@/hooks/use-behavior-tracking"
import { toast } from "@/components/ui/use-toast"
import { formatearPrecioParaguayo } from "@/lib/utils"
import { Producto } from "@/lib/types/producto"
import { getImagenesProducto, getImagenPorIndice } from "@/lib/image-utils"

export default function ProductList() {
  const searchParams = useSearchParams()
  const categoriaParam = searchParams.get("categoria") // Para compatibilidad con enlaces existentes
  const categoriasParam = searchParams.get("categorias") // Para múltiples categorías
  const busquedaParam = searchParams.get("busqueda")
  const tipoVentaParam = searchParams.get("tipoVenta") // Para compatibilidad con enlaces existentes
  const tiposVentaParam = searchParams.get("tiposVenta") // Para múltiples tipos de venta
  // Filtro por tienda (marca)
  const tiendaParam = searchParams.get("tienda")
  const precioMinParam = searchParams.get("precio_min")
  const precioMaxParam = searchParams.get("precio_max")

  // Construir filtros para el backend
  const filters = {
    search: busquedaParam || undefined,
    categoria: categoriaParam || categoriasParam || undefined,
    tienda: tiendaParam || undefined,
    sort_by: 'fecha_creacion' as const,
    sort_order: 'desc' as const,
    per_page: 20,
    // Tipo de venta desde la URL
    ...(tiposVentaParam ? { tiposVenta: tiposVentaParam.split(',') as Array<'directa'|'pedido'|'delivery'> } : {}),
    ...(tipoVentaParam ? { tipoVenta: tipoVentaParam as 'directa'|'pedido'|'delivery' } : {}),
    ...(precioMinParam ? { precio_min: parseInt(precioMinParam) } : {}),
    ...(precioMaxParam ? { precio_max: parseInt(precioMaxParam) } : {}),
  }

  const { productos: productosFiltrados, loading, error, pagination, refetch } = useProductos(filters)
  const [imagenesActuales, setImagenesActuales] = useState<{ [key: number]: number }>({})
  const { addItem } = useCart()
  const { trackProductClick } = useBehaviorTracking()

  // Refetch cuando cambien los parámetros de búsqueda
  useEffect(() => {
    const newFilters = {
      search: busquedaParam || undefined,
      categoria: categoriaParam || categoriasParam || undefined,
      tienda: tiendaParam || undefined,
      sort_by: 'fecha_creacion' as const,
      sort_order: 'desc' as const,
      per_page: 20,
      ...(tiposVentaParam ? { tiposVenta: tiposVentaParam.split(',') as Array<'directa'|'pedido'|'delivery'> } : {}),
      ...(tipoVentaParam ? { tipoVenta: tipoVentaParam as 'directa'|'pedido'|'delivery' } : {}),
      ...(precioMinParam ? { precio_min: parseInt(precioMinParam) } : {}),
      ...(precioMaxParam ? { precio_max: parseInt(precioMaxParam) } : {}),
    }
    refetch(newFilters)
  }, [categoriaParam, categoriasParam, busquedaParam, tipoVentaParam, tiposVentaParam, tiendaParam, precioMinParam, precioMaxParam])

  const getTipoVentaInfo = (tipoVenta?: string) => {
    switch (tipoVenta) {
      case "directa":
        return {
          icon: Package,
          label: "Compra directa",
          color: "bg-green-500",
          textColor: "text-green-700",
          bgColor: "bg-green-50",
        }
      case "pedido":
        return {
          icon: Clock,
          label: "Por pedido",
          color: "bg-orange-500",
          textColor: "text-orange-700",
          bgColor: "bg-orange-50",
        }
      case "delivery":
        return {
          icon: Truck,
          label: "Delivery/Retiro",
          color: "bg-blue-500",
          textColor: "text-blue-700",
          bgColor: "bg-blue-50",
        }
      default:
        return {
          icon: Package,
          label: "Disponible",
          color: "bg-gray-500",
          textColor: "text-gray-700",
          bgColor: "bg-gray-50",
        }
    }
  }

  const handleProductClick = (productId: number) => {
    trackProductClick(productId, "product-list")
  }

  const getImagenPrincipal = (producto: any) => {
    const todasLasImagenes = getImagenesProducto(producto)
    const imagenActual = imagenesActuales[producto.id] || 0
    const imagenUrl = todasLasImagenes[imagenActual]
    
    // Asegurar que siempre retornemos una URL válida
    if (!imagenUrl || typeof imagenUrl !== 'string' || imagenUrl.trim() === '') {
      return "/placeholder.svg"
    }
    
    return imagenUrl
  }

  const getImagenes = (producto: any) => {
    return getImagenesProducto(producto)
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

  const handleAddToCart = async (producto: any, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      const precio = parseFloat(producto.precio.toString())
      await addItem(producto.id_producto, 1, precio)
      toast({
        title: "Producto añadido",
        description: `${producto.nombre} ha sido añadido al carrito.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar el producto al carrito. Inicia sesión para continuar.",
        variant: "destructive"
      })
    }
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {productosFiltrados.map((producto, index) => {
          const tipoInfo = getTipoVentaInfo(producto.tipoVenta)
          const IconComponent = tipoInfo.icon
          const imagenes = getImagenes(producto)
          const tieneMultiplesImagenes = imagenes.length > 1

          return (
            <Card
              key={producto.id}
              className="group relative overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              {producto.descuento > 0 && (
                <Badge className="absolute top-2 left-2 z-10 bg-red-500 hover:bg-red-600">-{producto.descuento}%</Badge>
              )}

              <div className="absolute top-2 right-2 z-10 flex flex-col gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-white/80 hover:bg-white h-8 w-8"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    toast({
                      title: "Añadido a favoritos",
                      description: `${producto.nombre} ha sido añadido a tus favoritos.`,
                    })
                  }}
                >
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>

              <Link
                href={`/productos/${producto.id}`}
                className="block"
                onClick={() => handleProductClick(producto.id)}
              >
                <div className="aspect-square relative bg-muted overflow-hidden">
                  <Image
                    src={getImagenPrincipal(producto)}
                    alt={producto.nombre}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    priority={index === 0}
                  />

                  {/* Controles de navegación para múltiples imágenes */}
                  {tieneMultiplesImagenes && (
                    <>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white/90 h-8 w-8"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          cambiarImagen(producto.id, "anterior", imagenes)
                        }}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white/90 h-8 w-8"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          cambiarImagen(producto.id, "siguiente", imagenes)
                        }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>

                      {/* Indicadores de imagen */}
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                        {imagenes.map((_, index) => (
                          <div
                            key={index}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              index === (imagenesActuales[producto.id] || 0) ? "bg-white" : "bg-white/50"
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </Link>

              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${tipoInfo.bgColor}`}>
                    <IconComponent className={`h-3 w-3 ${tipoInfo.textColor}`} />
                    <span className={`text-xs font-medium ${tipoInfo.textColor}`}>{tipoInfo.label}</span>
                  </div>
                  {tieneMultiplesImagenes && (
                    <Badge variant="outline" className="text-xs">
                      {imagenes.length} fotos
                    </Badge>
                  )}
                </div>

                <Link href={`/productos/${producto.id}`} onClick={() => handleProductClick(producto.id)}>
                  <h3 className="font-medium line-clamp-1 hover:text-primary transition-colors">{producto.nombre}</h3>
                </Link>
                <p className="text-muted-foreground text-sm line-clamp-2 mt-1">{producto.descripcion}</p>

                {/* Rating */}
                <div className="flex items-center gap-1 mt-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${i < Math.floor(producto.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">({producto.reviews})</span>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between">
                    <div>
                      {producto.descuento > 0 ? (
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">
                            {formatearPrecioParaguayo(producto.precio * (1 - producto.descuento / 100))}
                          </p>
                          <p className="text-sm text-muted-foreground line-through">{formatearPrecioParaguayo(producto.precio)}</p>
                        </div>
                      ) : (
                        <p className="font-semibold">{formatearPrecioParaguayo(producto.precio)}</p>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full"
                      onClick={(e) => handleAddToCart(producto, e)}
                      disabled={producto.stock === 0 && producto.tipoVenta !== "delivery"}
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mt-2 text-xs text-muted-foreground">
                    {producto.tipoVenta === "directa" && producto.stock > 0 && (
                      <span>Stock: {producto.stock} unidades</span>
                    )}
                    {producto.tipoVenta === "pedido" && <span>Entrega: {producto.tiempoEntrega}</span>}
                    {producto.tipoVenta === "delivery" && <span>Entrega: {producto.tiempoEntrega}</span>}
                    {producto.stock === 0 && producto.tipoVenta !== "delivery" && (
                      <span className="text-red-600">Sin stock</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Cargando productos...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-red-600">Error al cargar productos</h3>
          <p className="text-muted-foreground mt-2">{error}</p>
          <Button 
            onClick={() => refetch()} 
            variant="outline" 
            className="mt-4"
          >
            Reintentar
          </Button>
        </div>
      )}

      {!loading && !error && productosFiltrados.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">No se encontraron productos</h3>
          <p className="text-muted-foreground mt-2">Intenta con otra búsqueda o categoría</p>
        </div>
      )}
    </div>
  )
}
