"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, Brain, TrendingUp, Star } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RecommendationEngine, type RecommendationResult } from "@/lib/recommendation-engine"
import { BehaviorTracker } from "@/lib/behavior-tracker"
import Image from "next/image"

export default function SmartSearch() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [recommendations, setRecommendations] = useState<RecommendationResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [mounted, setMounted] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout>()

  const [recommendationEngine, setRecommendationEngine] = useState<RecommendationEngine | null>(null)
  const [behaviorTracker, setBehaviorTracker] = useState<BehaviorTracker | null>(null)

  useEffect(() => {
    setMounted(true)
    setRecommendationEngine(RecommendationEngine.getInstance())
    setBehaviorTracker(BehaviorTracker.getInstance())
  }, [])

  useEffect(() => {
    if (mounted && query.length > 2) {
      // Debounce para evitar demasiadas consultas
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      debounceRef.current = setTimeout(() => {
        generateRecommendations()
      }, 500)
    } else {
      setShowResults(false)
      setRecommendations(null)
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, mounted])

  const generateRecommendations = async () => {
    if (!query.trim() || !recommendationEngine || !behaviorTracker) return

    setIsLoading(true)

    try {
      // Simular un pequeño delay para mostrar el loading
      await new Promise((resolve) => setTimeout(resolve, 300))

      const result = recommendationEngine.generateRecommendations(query, 8)
      setRecommendations(result)
      setShowResults(true)

      // Rastrear la búsqueda
      behaviorTracker.trackSearch(query, result.products.length + result.stores.length)
    } catch (error) {
      console.error("Error generating recommendations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProductClick = (productId: number) => {
    if (behaviorTracker) {
      behaviorTracker.trackProductClick(productId, "smart-search")
    }
    router.push(`/productos/${productId}`)
  }

  const handleStoreClick = (storeId: number) => {
    if (behaviorTracker) {
      behaviorTracker.trackProductClick(storeId, "smart-search")
    }
    router.push(`/tiendas/${storeId}`)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-100 text-green-800"
    if (confidence >= 0.6) return "bg-yellow-100 text-yellow-800"
    return "bg-gray-100 text-gray-800"
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Barra de búsqueda inteligente */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Busca con lenguaje natural: 'Necesito un teléfono barato para gaming'..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-12 h-12 text-base"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Brain className="h-4 w-4 animate-pulse text-blue-600" />
            </div>
          )}
        </div>
      </div>

      {/* Resultados de recomendaciones */}
      {showResults && recommendations && (
        <div className="mt-6 space-y-6">
          {/* Explicación del análisis */}
          {recommendations.explanation && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Brain className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Análisis de tu búsqueda:</p>
                    <p className="text-sm text-blue-700 mt-1">{recommendations.explanation}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recomendaciones de productos */}
          {recommendations.products.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Productos Recomendados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendations.products.map((rec) => (
                    <div
                      key={rec.product.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleProductClick(rec.product.id)}
                    >
                      <div className="relative h-32 mb-3">
                        <Image
                          src={rec.product.imagen || "/placeholder.svg"}
                          alt={rec.product.nombre}
                          fill
                          className="object-cover rounded"
                        />
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-medium text-sm line-clamp-2">{rec.product.nombre}</h3>

                        <div className="flex items-center justify-between">
                          <span className="font-semibold">₲{rec.product.precio.toLocaleString()}</span>
                          <Badge className={getConfidenceColor(rec.confidence)}>
                            {Math.round(rec.confidence * 100)}% match
                          </Badge>
                        </div>

                        <div className="space-y-1">
                          {rec.reasons.slice(0, 2).map((reason, index) => (
                            <p key={index} className="text-xs text-muted-foreground">
                              • {reason}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recomendaciones de tiendas */}
          {recommendations.stores.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Tiendas Recomendadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendations.stores.map((rec) => (
                    <div
                      key={rec.store.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleStoreClick(rec.store.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative h-12 w-12 rounded-full overflow-hidden">
                          <Image
                            src={rec.store.logo || "/placeholder.svg"}
                            alt={rec.store.nombre}
                            fill
                            className="object-cover"
                          />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-medium">{rec.store.nombre}</h3>
                            <Badge className={getConfidenceColor(rec.confidence)}>
                              {Math.round(rec.confidence * 100)}%
                            </Badge>
                          </div>

                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{rec.store.descripcion}</p>

                          <div className="space-y-1">
                            {rec.reasons.slice(0, 2).map((reason, index) => (
                              <p key={index} className="text-xs text-muted-foreground">
                                • {reason}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sin resultados */}
          {recommendations.products.length === 0 && recommendations.stores.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No encontré recomendaciones específicas para tu búsqueda.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Intenta con términos más específicos o explora nuestras categorías.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
