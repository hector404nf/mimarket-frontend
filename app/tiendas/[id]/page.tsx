"use client"

import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, MapPin, Phone, Mail, Clock, Star } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { tiendas } from "@/lib/stores-data"
import { productos } from "@/lib/data"
import ReviewsSection from "@/components/reviews-section"
import { useBehaviorTracking } from "@/hooks/use-behavior-tracking"
import RecommendationsSection from "@/components/recommendations-section"
import { formatearPrecioParaguayo } from "@/lib/utils"

export default function TiendaPage({ params }: { params: { id: string } }) {
  const { trackStoreView } = useBehaviorTracking()
  const tienda = tiendas.find((t) => t.id.toString() === params.id)

  // Rastrear vista de la tienda
  trackStoreView(tienda?.id || 0)

  if (!tienda) {
    return notFound()
  }

  // Filtrar productos de esta tienda
  const productosTienda = productos.filter((p) => p.tiendaId === tienda.id)

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full">
        <div className="px-4 md:px-6 py-6 md:py-10">
          <Link
            href="/tiendas"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a tiendas
          </Link>

          {/* Header de la tienda */}
          <div className="relative mb-8">
            <div className="h-48 md:h-64 relative rounded-lg overflow-hidden bg-muted">
              <Image
                src={tienda.imagenPortada || "/placeholder.svg?height=300&width=800"}
                alt={`Portada de ${tienda.nombre}`}
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-12 left-6">
              <div className="relative h-24 w-24 rounded-full border-4 border-background bg-muted overflow-hidden">
                <Image
                  src={tienda.logo || "/placeholder.svg?height=100&width=100"}
                  alt={`Logo de ${tienda.nombre}`}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          <div className="mt-16 grid md:grid-cols-3 gap-8">
            {/* Información principal */}
            <div className="md:col-span-2 space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{tienda.nombre}</h1>
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{tienda.calificacion}</span>
                    <span className="text-muted-foreground">({tienda.totalReseñas} reseñas)</span>
                  </div>
                </div>
                <p className="text-muted-foreground">{tienda.descripcion}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {tienda.categorias.map((categoria) => (
                  <Badge key={categoria} variant="secondary">
                    {categoria}
                  </Badge>
                ))}
              </div>

              {/* Productos de la tienda */}
              <div>
                <h2 className="text-2xl font-bold mb-6">Productos ({productosTienda.length})</h2>
                {productosTienda.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {productosTienda.map((producto) => (
                      <Link
                        key={producto.id}
                        href={`/productos/${producto.id}`}
                        className="group border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="aspect-square relative bg-muted">
                          <Image
                            src={producto.imagen || "/placeholder.svg"}
                            alt={producto.nombre}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                          {producto.descuento > 0 && (
                            <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600">
                              -{producto.descuento}%
                            </Badge>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-medium truncate">{producto.nombre}</h3>
                          <p className="text-muted-foreground text-sm truncate">{producto.descripcion}</p>
                          <div className="mt-2">
                            {producto.descuento > 0 ? (
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">
                                  {formatearPrecioParaguayo(producto.precio * (1 - producto.descuento / 100))}
                                </p>
                                <p className="text-sm text-muted-foreground line-through">
                                  {formatearPrecioParaguayo(producto.precio)}
                                </p>
                              </div>
                            ) : (
                              <p className="font-semibold">{formatearPrecioParaguayo(producto.precio)}</p>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Esta tienda aún no tiene productos publicados.</p>
                  </div>
                )}
              </div>

              {/* Sección de reseñas de la tienda */}
              <div className="mt-12">
                <ReviewsSection storeId={tienda.id} type="store" />
              </div>
            </div>

            {/* Información de contacto */}
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Información de contacto</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Dirección</p>
                        <p className="text-sm text-muted-foreground">{tienda.direccion}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Teléfono</p>
                        <p className="text-sm text-muted-foreground">{tienda.telefono}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">{tienda.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Horarios</p>
                        <div className="text-sm text-muted-foreground">
                          {tienda.horarios.map((horario, index) => (
                            <p key={index}>{horario}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Estadísticas</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Productos</span>
                      <span className="text-sm font-medium">{productosTienda.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Miembro desde</span>
                      <span className="text-sm font-medium">{tienda.fechaRegistro}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Ventas totales</span>
                      <span className="text-sm font-medium">{tienda.ventasTotales}+</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button className="w-full">Contactar tienda</Button>
            </div>
          </div>

          {/* Sección de recomendaciones */}
          <div className="mt-16">
            <RecommendationsSection
              currentStoreId={tienda.id}
              showRecentlyViewed={true}
              showRecommended={true}
              showStores={false}
              maxItems={6}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
