"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronRight, Clock, TrendingUp, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BehaviorTracker } from "@/lib/behavior-tracker"
import { productosService } from "@/lib/api/productos"
import { tiendasService } from "@/lib/api/tiendas"
import { nlpEngine } from "@/lib/nlp-engine"
import { categoriasService } from "@/lib/api/categorias"
import { formatearPrecioParaguayo } from "@/lib/utils"

interface RecommendationsSectionProps {
  showRecentlyViewed?: boolean
  showRecommended?: boolean
  showStores?: boolean
  maxItems?: number
}

export default function RecommendationsSection({
  showRecentlyViewed = true,
  showRecommended = true,
  showStores = true,
  maxItems = 4,
}: RecommendationsSectionProps) {
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([])
  const [recommended, setRecommended] = useState<any[]>([])
  const [recommendedStores, setRecommendedStores] = useState<any[]>([])
  const [avgViewedPrice, setAvgViewedPrice] = useState<number>(0)

  useEffect(() => {
    const tracker = BehaviorTracker.getInstance()
    const behavior = tracker.getBehaviorData()

    // Recently viewed products (datos reales + métricas)
    if (showRecentlyViewed) {
      const views = Object.entries(behavior.productViews)
        .map(([productId, v]) => ({ productId: Number(productId), metrics: v }))
        .sort((a, b) => b.metrics.lastViewed - a.metrics.lastViewed)
        .slice(0, maxItems)

      Promise.all(
        views.map(async ({ productId, metrics }) => {
          try {
            const { data } = await productosService.getProducto(productId)
            return { product: data, metrics }
          } catch {
            return null
          }
        })
      ).then((items) => {
        const filtered = items.filter(Boolean) as any[]
        setRecentlyViewed(filtered)
        const avg =
          filtered.reduce((sum: number, it: any) => sum + (it.product?.precio || 0), 0) /
          (filtered.length || 1)
        setAvgViewedPrice(avg || 0)
      })
    }

    // Recommended products based on behavior
    if (showRecommended) {
      buildProductRecommendations(behavior, maxItems).then((list) => setRecommended(list))
    }

    // Recommended stores (datos reales + métricas)
    if (showStores) {
      buildStoreRecommendations(behavior, maxItems).then((list) => setRecommendedStores(list))
    }
  }, [showRecentlyViewed, showRecommended, showStores, maxItems])

  const buildProductRecommendations = async (behavior: any, limit: number) => {
    // 1) Intereses desde búsquedas (NLP)
    const categoryScores: Record<string, number> = {}
    const searches = Array.isArray(behavior?.searches) ? behavior.searches : []
    searches.forEach((search: any) => {
      const analysis = nlpEngine.analyze(search?.query || "")
      const cats = Array.isArray((analysis as any)?.categories) ? (analysis as any).categories : []
      cats.forEach((category: string) => {
        categoryScores[category] = (categoryScores[category] || 0) + 0.5
      })
    })

    // 2) Categorías basadas en productos más vistos
    const viewsArray = Object.entries(behavior.productViews).map(([productId, v]) => ({ productId: Number(productId), metrics: v }))
    const topViewed = viewsArray.sort((a, b) => b.metrics.viewCount - a.metrics.viewCount).slice(0, 12)
    const viewedProducts = await Promise.all(
      topViewed.map(async ({ productId }) => {
        try {
          const { data } = await productosService.getProducto(productId)
          return data
        } catch {
          return null
        }
      })
    )
    viewedProducts.filter(Boolean).forEach((p: any) => {
      const cat = p?.categoria
      if (cat) categoryScores[cat] = (categoryScores[cat] || 0) + 1
    })

    // 2b) Refuerzo por productos clickeados y agregados al carrito recientemente
    const clicks = Array.isArray(behavior?.clicks) ? behavior.clicks : []
    const lastClickedIds = Array.from(new Set(clicks.filter((c: any) => c?.type === "product").slice(-5).map((c: any) => c.id))).slice(-3)
    const cartActions = Array.isArray(behavior?.cartActions) ? behavior.cartActions : []
    const lastCartIds = Array.from(new Set(cartActions.slice(-3).map((ca: any) => ca.productId)))
    const engageIds = Array.from(new Set([...lastClickedIds, ...lastCartIds]))
    if (engageIds.length > 0) {
      const engageProducts = await Promise.all(
        engageIds.map(async (pid) => {
          try {
            const { data } = await productosService.getProducto(pid)
            return data
          } catch {
            return null
          }
        })
      )
      engageProducts.filter(Boolean).forEach((p: any) => {
        const cat = p?.categoria
        if (cat) categoryScores[cat] = (categoryScores[cat] || 0) + 0.7
      })
    }

    // 3) Mapear nombres de categorías a IDs reales
    const categorias = await categoriasService.getCategorias().catch(() => [])
    const normalize = (s: string) => s?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
    const categoriaNameToId = new Map<string, number>()
    categorias.forEach((c: any) => {
      if (c?.nombre) categoriaNameToId.set(normalize(c.nombre), c.id_categoria)
    })

    const maxScore = Object.values(categoryScores).reduce((m, v) => (v > m ? v : m), 0) || 1
    const topCategories = Object.entries(categoryScores)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name)
      .slice(0, 3)

    // 3b) Preferencia de precio a partir de búsquedas con rango
    const lastWithRange = [...searches].reverse()
      .map((s: any) => nlpEngine.analyze(s?.query || ""))
      .find((a) => !!a?.priceRange)
    const priceMin = lastWithRange?.priceRange?.min
    const priceMax = lastWithRange?.priceRange?.max

    // 4) Construir candidatos: por categoría + por búsqueda + por tiendas visitadas
    let candidates: any[] = []
    const byCategoryPromises = topCategories
      .map((name) => {
        const id = categoriaNameToId.get(normalize(name))
        if (id) {
          const filters: any = { categoria: String(id), per_page: limit * 2, sort_by: "fecha_creacion", sort_order: "desc" }
          if (priceMin != null) filters.precio_min = priceMin
          if (priceMax != null) filters.precio_max = priceMax
          return productosService.getProductos(filters as any)
        }
        return null
      })
      .filter(Boolean) as Promise<any>[]

    const topSearchTerm = searches[0]?.query || ""
    const bySearchPromise = topSearchTerm
      ? productosService.getProductos(({ search: topSearchTerm, per_page: limit * 2, sort_by: "fecha_creacion", sort_order: "desc", ...(priceMin != null ? { precio_min: priceMin } : {}), ...(priceMax != null ? { precio_max: priceMax } : {} ) } as any))
      : null

    // Candidatos por tiendas más vistas
    const storeEntries = Object.entries(behavior.storeViews).map(([sid, m]) => ({ storeId: Number(sid), metrics: m }))
    const topStores = storeEntries.sort((a, b) => b.metrics.viewCount - a.metrics.viewCount).slice(0, 2)
    const byStorePromises = topStores.map(({ storeId }) => {
      const filters: any = { per_page: limit * 2, sort_by: "fecha_creacion", sort_order: "desc" }
      if (priceMin != null) filters.precio_min = priceMin
      if (priceMax != null) filters.precio_max = priceMax
      return productosService.getProductosByTienda(storeId, filters)
    })

    const responses = await Promise.all([...(byCategoryPromises || []), ...(bySearchPromise ? [bySearchPromise] : []), ...byStorePromises]).catch(() => [])
    candidates = responses.flatMap((r: any) => (r?.data ?? []))

    // Fallback si no hay señales
    if (!Array.isArray(candidates) || candidates.length === 0) {
      try {
        const resp = await productosService.getProductos({ sort_by: "fecha_creacion", sort_order: "desc", per_page: limit * 3 })
        candidates = resp.data
      } catch {
        candidates = []
      }
    }

    // 5) Scoring y filtrado
    const viewedIds = new Set(Object.keys(behavior.productViews).map((id) => Number(id)))
    const avgPrice = (
      viewedProducts.filter(Boolean).reduce((sum: number, p: any) => sum + (p?.precio || 0), 0) /
      (viewedProducts.filter(Boolean).length || 1)
    ) || avgViewedPrice || 0

    const dedup = new Map<number, any>()
    candidates.forEach((p) => {
      if (!dedup.has(p.id_producto)) dedup.set(p.id_producto, p)
    })

    // Afinidad por tienda (normalizada)
    const storeAffinityRaw = new Map<number, number>()
    let maxStoreRaw = 0
    storeEntries.forEach(({ storeId, metrics }) => {
      const raw = (metrics?.viewCount || 0) * 0.7 + Math.min((metrics?.totalDuration || 0) / 60000, 10) * 0.3
      storeAffinityRaw.set(storeId, raw)
      if (raw > maxStoreRaw) maxStoreRaw = raw
    })
    const storeAffinity = new Map<number, number>()
    storeAffinityRaw.forEach((raw, sid) => {
      storeAffinity.set(sid, maxStoreRaw > 0 ? raw / maxStoreRaw : 0)
    })

    const scored = Array.from(dedup.values())
      .filter((p) => !viewedIds.has(p.id_producto))
      .map((p) => {
        const catScore = maxScore > 0 ? (categoryScores[p.categoria] || 0) / maxScore : 0
        // Price score por rango de búsqueda o por promedio visto
        let priceScore = 0
        if (priceMin != null || priceMax != null) {
          const min = priceMin ?? p.precio
          const max = priceMax ?? p.precio
          if (p.precio >= min && p.precio <= max) {
            priceScore = 1
          } else {
            const dist = p.precio < min ? (min - p.precio) / min : (p.precio - max) / max
            priceScore = Math.max(0, 1 - dist)
          }
        } else {
          const priceDiff = avgPrice > 0 ? Math.abs(p.precio - avgPrice) / avgPrice : 1
          priceScore = Math.max(0, 1 - priceDiff)
        }
        const discountScore = Math.max(0, (p.descuento || 0) / 100)
        const storeScore = storeAffinity.get(p.tiendaId) || 0
        const score = catScore * 0.4 + priceScore * 0.3 + discountScore * 0.1 + storeScore * 0.2
        return { ...p, score }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    return scored
  }

  const buildStoreRecommendations = async (behavior: any, limit: number) => {
    const viewsArray = Object.entries(behavior.storeViews).map(([storeId, v]) => ({ storeId: Number(storeId), metrics: v }))
    const sorted = viewsArray
      .map((sv) => ({ ...sv, score: sv.metrics.viewCount * 0.6 + Math.min(sv.metrics.totalDuration / 60000, 10) * 0.4 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    const detailed = await Promise.all(
      sorted.map(async ({ storeId, metrics, score }) => {
        try {
          const { data } = await tiendasService.getTiendaById(storeId)
          return { ...data, __metrics: metrics, score }
        } catch {
          return null
        }
      })
    )

    return detailed.filter(Boolean)
  }

  const handleProductClick = (productId: number, source: string) => {
    const tracker = BehaviorTracker.getInstance()
    tracker.trackProductClick(productId, source)
  }

  if (!showRecentlyViewed && !showRecommended && !showStores) {
    return null
  }

  return (
    <div className="space-y-8">
      {/* Recently Viewed */}
      {showRecentlyViewed && recentlyViewed.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Vistos recientemente</CardTitle>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/historial">
                Ver todos <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recentlyViewed.map(({ product, metrics }) => (
                <Link
                  key={product.id_producto}
                  href={`/productos/${product.id_producto}`}
                  onClick={() => handleProductClick(product.id_producto, "recently-viewed")}
                  className="group block"
                >
                  <div className="aspect-square relative bg-muted rounded-lg overflow-hidden mb-2">
                    <Image
                      src={product.imagen || "/placeholder.svg"}
                      alt={product.nombre}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <h4 className="font-medium text-sm line-clamp-2 group-hover:text-blue-600">{product.nombre}</h4>
              <div className="flex items-center justify-between mt-1">
                <p className="text-sm font-semibold">{formatearPrecioParaguayo(product.precio)}</p>
              </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommended Products */}
      {showRecommended && recommended.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Recomendado para ti</CardTitle>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/recomendaciones">
                Ver más <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recommended.map((product) => (
                <Link
                  key={product.id_producto}
                  href={`/productos/${product.id_producto}`}
                  onClick={() => handleProductClick(product.id_producto, "recommended")}
                  className="group block"
                >
                  <div className="aspect-square relative bg-muted rounded-lg overflow-hidden mb-2">
                    <Image
                      src={product.imagen || "/placeholder.svg"}
                      alt={product.nombre}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                    {product.descuento > 0 && (
                      <Badge className="absolute top-2 left-2 bg-red-500">-{product.descuento}%</Badge>
                    )}
                  </div>
                  <h4 className="font-medium text-sm line-clamp-2 group-hover:text-blue-600">{product.nombre}</h4>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm font-semibold">{formatearPrecioParaguayo(product.precio)}</p>
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(product.score * 100)}% match
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommended Stores */}
      {showStores && recommendedStores.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Tiendas que te pueden interesar</CardTitle>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/tiendas">
                Ver todas <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendedStores.map((store) => (
                <Link
                  key={store.id}
                  href={`/tiendas/${store.id}`}
                  className="group flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="w-16 h-16 relative bg-muted rounded-lg overflow-hidden">
                    <Image src={store.logo || "/placeholder.svg"} alt={store.nombre} fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium group-hover:text-blue-600">{store.nombre}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-1">{store.descripcion}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center">
                        <span className="text-sm font-medium">{store.calificacion ?? 0}</span>
                        <span className="text-yellow-400 ml-1">★</span>
                      </div>
                      <Badge variant="outline" className="text-xs">{(store.categorias?.[0]) || ""}</Badge>
                      {/* Ocultamos métricas internas de vistas/tiempo para el cliente */}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
