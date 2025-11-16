"use client"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { MapPin, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { CategoryIcon } from "@/lib/category-icons"
import { tiendasService, type TiendaFrontend } from "@/lib/api/tiendas"

export default function StoreList() {
  const [stores, setStores] = useState<TiendaFrontend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const fetchStores = async () => {
      try {
        setLoading(true)
        setError(null)
        const resp = await tiendasService.getTiendas({ per_page: 12, with_products_count: true })
        if (!mounted) return
        setStores(resp.data || [])
      } catch (err: any) {
        if (!mounted) return
        setError(err?.message || 'No se pudo cargar las tiendas')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchStores()
    return () => { mounted = false }
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(6).fill(0).map((_, i) => (
          <div key={i} className="border rounded-lg overflow-hidden">
            <div className="aspect-video bg-muted" />
            <div className="p-6 space-y-3">
              <div className="h-6 w-3/4 bg-muted rounded" />
              <div className="h-4 w-full bg-muted rounded" />
              <div className="h-4 w-2/3 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return <div className="text-sm text-red-600">{error}</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stores.map((tienda) => (
        <Link
          key={tienda.id}
          href={`/tiendas/${tienda.id}`}
          className="group border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
        >
          <div className="aspect-video relative bg-muted">
            <Image
              src={tienda.imagenPortada || "/placeholder.svg?height=200&width=400"}
              alt={tienda.nombre}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-3 right-3">
              <div className="flex items-center gap-1 bg-white/90 rounded-full px-2 py-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium">{tienda.calificacion ?? '-'}</span>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-start gap-3 mb-3">
              <div className="relative h-12 w-12 rounded-full bg-muted overflow-hidden shrink-0">
                <Image
                  src={tienda.logo || "/placeholder.svg?height=50&width=50"}
                  alt={`Logo de ${tienda.nombre}`}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-lg truncate">{tienda.nombre}</h3>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="text-sm truncate">{tienda.ciudad || '—'}</span>
                </div>
              </div>
            </div>

            <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{tienda.descripcion}</p>

            <div className="flex flex-wrap gap-1 mb-3">
              {(tienda.categorias || []).slice(0, 2).map((categoria) => (
                <Badge key={categoria} variant="secondary" className="text-xs flex items-center gap-1">
                  <CategoryIcon 
                    categorySlug={categoria.toLowerCase().replace(/\s+/g, '')}
                    categoryName={categoria}
                    className="h-3 w-3"
                  />
                  {categoria}
                </Badge>
              ))}
              {(tienda.categorias || []).length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{(tienda.categorias || []).length - 2}
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {typeof tienda.productosCount === 'number' ? (
                  <>
                    {tienda.productosCount} producto{tienda.productosCount !== 1 ? 's' : ''}
                  </>
                ) : (
                  '—'
                )}
              </span>
              <span className="text-muted-foreground">{tienda.ventasTotales ? `${tienda.ventasTotales}+ ventas` : ''}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
