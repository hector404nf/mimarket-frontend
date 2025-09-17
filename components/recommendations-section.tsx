"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronRight, Clock, TrendingUp, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { productos } from "@/lib/data"
import { tiendas } from "@/lib/stores-data"
import { useBehaviorTracking } from "@/hooks/use-behavior-tracking"
import { nlpEngine } from "@/lib/nlp-engine"
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
  const { getBehaviorData, trackProductClick } = useBehaviorTracking()
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([])
  const [recommended, setRecommended] = useState<any[]>([])
  const [recommendedStores, setRecommendedStores] = useState<any[]>([])

  useEffect(() => {
    const behavior = getBehaviorData()

    // Recently viewed products
    if (showRecentlyViewed) {
      const recentViews = behavior.productViews
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, maxItems)
        .map((view) => productos.find((p) => p.id === view.productId))
        .filter(Boolean)

      setRecentlyViewed(recentViews)
    }

    // Recommended products based on behavior
    if (showRecommended) {
      const categoryInterests = calculateCategoryInterests(behavior)
      const recommendedProducts = getRecommendedProducts(behavior, categoryInterests, maxItems)
      setRecommended(recommendedProducts)
    }

    // Recommended stores
    if (showStores) {
      const categoryInterests = calculateCategoryInterests(behavior)
      const recommendedStoresList = getRecommendedStores(behavior, categoryInterests, maxItems)
      setRecommendedStores(recommendedStoresList)
    }
  }, [showRecentlyViewed, showRecommended, showStores, maxItems, getBehaviorData])

  const calculateCategoryInterests = (behavior: any) => {
    const categoryScores: { [key: string]: number } = {}

    // Score based on product views
    behavior.productViews.forEach((view: any) => {
      const product = productos.find((p) => p.id === view.productId)
      if (product) {
        const score = Math.min(view.duration / 1000 / 30, 1) // Max 30 seconds = 1 point
        categoryScores[product.categoria] = (categoryScores[product.categoria] || 0) + score
      }
    })

    // Score based on searches
    behavior.searches.forEach((search: any) => {
      const analysis = nlpEngine.analyze(search.query)
      analysis.categories.forEach((category) => {
        categoryScores[category] = (categoryScores[category] || 0) + 0.5
      })
    })

    // Score based on cart actions
    behavior.cartActions.forEach((action: any) => {
      const product = productos.find((p) => p.id === action.productId)
      if (product) {
        const score = action.action === "add" ? 1 : -0.5
        categoryScores[product.categoria] = (categoryScores[product.categoria] || 0) + score
      }
    })

    return categoryScores
  }

  const getRecommendedProducts = (behavior: any, categoryInterests: any, limit: number) => {
    const viewedProductIds = new Set(behavior.productViews.map((v: any) => v.productId))

    return productos
      .filter((product) => !viewedProductIds.has(product.id))
      .map((product) => ({
        ...product,
        score: calculateProductScore(product, behavior, categoryInterests),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  const getRecommendedStores = (behavior: any, categoryInterests: any, limit: number) => {
    const viewedStoreIds = new Set(behavior.storeViews.map((v: any) => v.storeId))

    return tiendas
      .filter((store) => !viewedStoreIds.has(store.id))
      .map((store) => ({
        ...store,
        score: calculateStoreScore(store, categoryInterests),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  const calculateProductScore = (product: any, behavior: any, categoryInterests: any) => {
    let score = 0

    // Category interest score
    score += (categoryInterests[product.categoria] || 0) * 2

    // Recency bonus for similar products
    const recentViews = behavior.productViews.filter((v: any) => Date.now() - v.timestamp < 7 * 24 * 60 * 60 * 1000) // Last 7 days

    const similarViews = recentViews.filter((v: any) => {
      const viewedProduct = productos.find((p) => p.id === v.productId)
      return viewedProduct && viewedProduct.categoria === product.categoria
    })

    score += similarViews.length * 0.5

    // Price preference
    const avgViewedPrice =
      recentViews.reduce((sum: number, v: any) => {
        const viewedProduct = productos.find((p) => p.id === v.productId)
        return sum + (viewedProduct?.precio || 0)
      }, 0) / (recentViews.length || 1)

    const priceDiff = Math.abs(product.precio - avgViewedPrice) / avgViewedPrice
    score += Math.max(0, 1 - priceDiff) // Closer to average price = higher score

    // Discount bonus
    if (product.descuento > 0) {
      score += product.descuento / 100
    }

    return score
  }

  const calculateStoreScore = (store: any, categoryInterests: any) => {
    let score = 0

    // Category alignment
    if (store.categoria && categoryInterests[store.categoria]) {
      score += categoryInterests[store.categoria] * 2
    }

    // Rating bonus
    score += (store.rating || 0) / 5

    return score
  }

  const handleProductClick = (productId: number, source: string) => {
    trackProductClick(productId, source)
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
              {recentlyViewed.map((product) => (
                <Link
                  key={product.id}
                  href={`/productos/${product.id}`}
                  onClick={() => handleProductClick(product.id, "recently-viewed")}
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
                  <p className="text-sm font-semibold mt-1">{formatearPrecioParaguayo(product.precio)}</p>
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
                  key={product.id}
                  href={`/productos/${product.id}`}
                  onClick={() => handleProductClick(product.id, "recommended")}
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
                    <Image src={store.imagen || "/placeholder.svg"} alt={store.nombre} fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium group-hover:text-blue-600">{store.nombre}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-1">{store.descripcion}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center">
                        <span className="text-sm font-medium">{store.rating}</span>
                        <span className="text-yellow-400 ml-1">★</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {store.categoria}
                      </Badge>
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
