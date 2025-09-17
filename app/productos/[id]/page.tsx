"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  Heart,
  Share2,
  ShoppingCart,
  Star,
  ChevronLeft,
  ChevronRight,
  Package,
  Clock,
  Truck,
  Shield,
  RotateCcw,
} from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { productos } from "@/lib/data"
import { useCart } from "@/lib/cart-store"
import { toast } from "@/components/ui/use-toast"
import ReviewsSection from "@/components/reviews-section"
import RecommendationsSection from "@/components/recommendations-section"
import { formatearPrecioParaguayo } from "@/lib/utils"

export default function ProductoPage() {
  const params = useParams()
  const { addItem } = useCart()
  const [imagenActual, setImagenActual] = useState(0)
  const [cantidad, setCantidad] = useState(1)
  const [producto, setProducto] = useState<any>(null)

  useEffect(() => {
    const id = Number.parseInt(params.id as string)
    const productoEncontrado = productos.find((p) => p.id === id)
    setProducto(productoEncontrado)
  }, [params.id])

  if (!producto) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Producto no encontrado</h1>
            <p className="text-muted-foreground mb-4">El producto que buscas no existe o ha sido eliminado.</p>
            <Button asChild>
              <Link href="/">Volver al inicio</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const imagenes = producto.imagenes || (producto.imagen ? [producto.imagen] : [])
  const tieneMultiplesImagenes = imagenes.length > 1

  const cambiarImagen = (direccion: "siguiente" | "anterior") => {
    if (direccion === "siguiente") {
      setImagenActual((prev) => (prev + 1) % imagenes.length)
    } else {
      setImagenActual((prev) => (prev - 1 + imagenes.length) % imagenes.length)
    }
  }

  const seleccionarImagen = (index: number) => {
    setImagenActual(index)
  }

  const handleAddToCart = () => {
    for (let i = 0; i < cantidad; i++) {
      addItem(producto.id)
    }
    toast({
      title: "Producto añadido",
      description: `${cantidad} ${producto.nombre}(s) añadido(s) al carrito.`,
    })
  }

  const precioConDescuento = producto.descuento > 0 ? producto.precio * (1 - producto.descuento / 100) : producto.precio

  const getTipoVentaInfo = (tipoVenta: string) => {
    switch (tipoVenta) {
      case "directa":
        return {
          icon: Package,
          label: "Compra directa",
          description: "Disponible para entrega inmediata",
          color: "text-green-600",
        }
      case "pedido":
        return {
          icon: Clock,
          label: "Por pedido",
          description: "Se prepara especialmente para ti",
          color: "text-orange-600",
        }
      case "delivery":
        return {
          icon: Truck,
          label: "Delivery/Retiro",
          description: "Entrega a domicilio o retiro en tienda",
          color: "text-blue-600",
        }
      default:
        return {
          icon: Package,
          label: "Disponible",
          description: "Producto disponible",
          color: "text-gray-600",
        }
    }
  }

  const tipoInfo = getTipoVentaInfo(producto.tipoVenta)
  const IconComponent = tipoInfo.icon

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full">
        <div className="px-4 md:px-6 py-6 md:py-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              Inicio
            </Link>
            <span>/</span>
            <Link href={`/?categoria=${producto.categoria}`} className="hover:text-foreground">
              {producto.categoria}
            </Link>
            <span>/</span>
            <span className="text-foreground">{producto.nombre}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Galería de imágenes */}
            <div className="space-y-4">
              {/* Imagen principal */}
              <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                <Image
                  src={imagenes[imagenActual] || "/placeholder.svg"}
                  alt={`${producto.nombre} - Imagen ${imagenActual + 1}`}
                  fill
                  className="object-cover"
                  priority
                />

                {/* Controles de navegación */}
                {tieneMultiplesImagenes && (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white/90"
                      onClick={() => cambiarImagen("anterior")}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white/90"
                      onClick={() => cambiarImagen("siguiente")}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>

                    {/* Indicador de imagen */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-sm px-3 py-1 rounded-full">
                      {imagenActual + 1} / {imagenes.length}
                    </div>
                  </>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {producto.descuento > 0 && <Badge variant="destructive">-{producto.descuento}%</Badge>}
                  {producto.stock === 0 && producto.tipoVenta !== "delivery" && (
                    <Badge variant="secondary">Sin stock</Badge>
                  )}
                </div>

                {/* Botones de acción */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <Button variant="secondary" size="icon" className="bg-white/80 hover:bg-white/90">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button variant="secondary" size="icon" className="bg-white/80 hover:bg-white/90">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Miniaturas */}
              {tieneMultiplesImagenes && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {imagenes.map((imagen, index) => (
                    <button
                      key={index}
                      onClick={() => seleccionarImagen(index)}
                      className={`relative aspect-square rounded-md overflow-hidden border-2 transition-colors ${
                        index === imagenActual
                          ? "border-primary"
                          : "border-transparent hover:border-muted-foreground/50"
                      }`}
                    >
                      <Image
                        src={imagen || "/placeholder.svg"}
                        alt={`${producto.nombre} - Miniatura ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Información del producto */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <IconComponent className={`h-5 w-5 ${tipoInfo.color}`} />
                  <span className={`text-sm font-medium ${tipoInfo.color}`}>{tipoInfo.label}</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">{producto.nombre}</h1>
                <p className="text-muted-foreground">{tipoInfo.description}</p>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(producto.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {producto.rating} ({producto.reviews} reseñas)
                </span>
              </div>

              {/* Precio */}
              <div className="space-y-2">
                {producto.descuento > 0 ? (
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-primary">{formatearPrecioParaguayo(precioConDescuento)}</span>
        <span className="text-xl text-muted-foreground line-through">{formatearPrecioParaguayo(producto.precio)}</span>
        <Badge variant="destructive">Ahorra {formatearPrecioParaguayo(producto.precio - precioConDescuento)}</Badge>
                  </div>
                ) : (
                  <span className="text-3xl font-bold">{formatearPrecioParaguayo(producto.precio)}</span>
                )}
              </div>

              {/* Descripción */}
              <div>
                <h3 className="font-semibold mb-2">Descripción</h3>
                <p className="text-muted-foreground leading-relaxed">{producto.descripcion}</p>
              </div>

              {/* Información de stock y entrega */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Disponibilidad:</span>
                    <span
                      className={`font-medium ${
                        producto.stock > 0 || producto.tipoVenta === "delivery" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {producto.tipoVenta === "delivery"
                        ? "Disponible"
                        : producto.stock > 0
                          ? `${producto.stock} en stock`
                          : "Sin stock"}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Tiempo de entrega:</span>
                    <span className="text-muted-foreground">{producto.tiempoEntrega}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Controles de compra */}
              <div className="space-y-4">
                {producto.tipoVenta === "directa" && producto.stock > 0 && (
                  <div className="flex items-center gap-4">
                    <label className="font-medium">Cantidad:</label>
                    <div className="flex items-center border rounded-md">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                        disabled={cantidad <= 1}
                      >
                        -
                      </Button>
                      <span className="px-4 py-2 min-w-[3rem] text-center">{cantidad}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCantidad(Math.min(producto.stock, cantidad + 1))}
                        disabled={cantidad >= producto.stock}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    className="flex-1"
                    onClick={handleAddToCart}
                    disabled={producto.stock === 0 && producto.tipoVenta !== "delivery"}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {producto.tipoVenta === "delivery" ? "Pedir ahora" : "Añadir al carrito"}
                  </Button>
                  <Button variant="outline" size="lg">
                    Comprar ahora
                  </Button>
                </div>
              </div>

              {/* Garantías y políticas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span>Garantía incluida</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <RotateCcw className="h-4 w-4 text-blue-600" />
                  <span>Devolución gratis</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="h-4 w-4 text-purple-600" />
                  <span>Envío seguro</span>
                </div>
              </div>

              {/* Tags */}
              {producto.tags && producto.tags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Etiquetas:</h4>
                  <div className="flex flex-wrap gap-2">
                    {producto.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tabs con información adicional */}
          <div className="mt-12">
            <Tabs defaultValue="detalles" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="detalles">Detalles</TabsTrigger>
                <TabsTrigger value="especificaciones">Especificaciones</TabsTrigger>
                <TabsTrigger value="envio">Envío y Devoluciones</TabsTrigger>
              </TabsList>

              <TabsContent value="detalles" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4">Información detallada</h3>
                    <div className="space-y-4 text-muted-foreground">
                      <p>{producto.descripcion}</p>
                      <p>
                        Este producto de la marca {producto.marca} pertenece a la categoría {producto.categoria}y está
                        disponible para {tipoInfo.label.toLowerCase()}.
                      </p>
                      {producto.descuento > 0 && (
                        <p className="text-green-600 font-medium">
                          ¡Oferta especial! Ahorra {producto.descuento}% en este producto.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="especificaciones" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4">Especificaciones técnicas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">Marca:</span>
                          <span>{producto.marca}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Categoría:</span>
                          <span>{producto.categoria}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Tipo de venta:</span>
                          <span>{tipoInfo.label}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">Stock:</span>
                          <span>{producto.tipoVenta === "delivery" ? "Disponible" : `${producto.stock} unidades`}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Tiempo de entrega:</span>
                          <span>{producto.tiempoEntrega}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Imágenes:</span>
                          <span>
                            {imagenes.length} foto{imagenes.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="envio" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4">Políticas de envío y devoluciones</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Envío</h4>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          <li>Tiempo de entrega: {producto.tiempoEntrega}</li>
                          <li>Envío gratuito en compras superiores a {formatearPrecioParaguayo(2770000)}</li>
                          <li>Seguimiento en tiempo real disponible</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Devoluciones</h4>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          <li>30 días para devoluciones gratuitas</li>
                          <li>Producto debe estar en condiciones originales</li>
                          <li>Reembolso completo garantizado</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Reseñas */}
          <div className="mt-12">
            <ReviewsSection productId={producto.id} />
          </div>

          {/* Productos recomendados */}
          <div className="mt-12">
            <RecommendationsSection currentProductId={producto.id} categoria={producto.categoria} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
