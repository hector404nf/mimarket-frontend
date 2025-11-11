"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, Brain, TrendingUp, Star } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RecommendationEngine, type RecommendationResult } from "@/lib/recommendation-engine"
import { productosService } from "@/lib/api/productos"
import { tiendasService, type TiendaFrontend } from "@/lib/api/tiendas"
import { categoriasService, type Categoria } from "@/lib/api/categorias"
import { nlpEngine } from "@/lib/nlp-engine"
import { busquedasService } from "@/lib/api/busquedas"
import { useAuth } from "@/contexts/auth-context"
import { BehaviorTracker } from "@/lib/behavior-tracker"
import Image from "next/image"

export default function SmartSearch({ variant = "full" }: { variant?: "navbar" | "full" }) {
  const router = useRouter()
  const { user } = useAuth()
  const [query, setQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [recentSuggestions, setRecentSuggestions] = useState<string[]>([])
  const [popularSuggestions, setPopularSuggestions] = useState<string[]>([])
  const [recommendations, setRecommendations] = useState<RecommendationResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [mounted, setMounted] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout>()

  const [recommendationEngine, setRecommendationEngine] = useState<RecommendationEngine | null>(null)
  const [behaviorTracker, setBehaviorTracker] = useState<BehaviorTracker | null>(null)
  const [categoriasMap, setCategoriasMap] = useState<Map<string, number>>(new Map())

  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[^\w\s-]/g, "").replace(/[\u0300-\u036f]/g, "")

  useEffect(() => {
    setMounted(true)
    setRecommendationEngine(RecommendationEngine.getInstance())
    setBehaviorTracker(BehaviorTracker.getInstance())
    // Cargar sugerencias populares (no bloquea UI si falla)
    void busquedasService.getPopulares().then((res) => {
      const terms = (res.data || []).map((r: any) => r.termino ?? r.term ?? "").filter(Boolean)
      setPopularSuggestions(terms.slice(0, 8))
    }).catch(() => setPopularSuggestions([]))
    // Pre-cargar categorías para mapeo a id
    categoriasService.getCategorias().then((cats: Categoria[]) => {
      const map = new Map<string, number>()
      cats.forEach((c) => {
        map.set(norm(c.nombre), c.id_categoria)
        if (c.slug) map.set(norm(c.slug), c.id_categoria)
      })
      setCategoriasMap(map)
    }).catch(() => setCategoriasMap(new Map()))
  }, [])

  useEffect(() => {
    if (mounted && query.length > 2 && variant !== "navbar") {
      // Debounce para evitar demasiadas consultas
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      debounceRef.current = setTimeout(() => {
        generateRecommendations()
      }, 500)
      setShowSuggestions(false)
    } else {
      setShowResults(false)
      setRecommendations(null)
      // Mostrar sugerencias cuando hay poco texto o vacío
      if (behaviorTracker) {
        const recents = behaviorTracker.getRecentSearches(10).map((s) => s.query)
        setRecentSuggestions(recents)
      }
      setShowSuggestions(true)
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, mounted, variant])

  const generateRecommendations = async () => {
    if (!query.trim() || !recommendationEngine || !behaviorTracker) return

    setIsLoading(true)

    try {
      // Simular un pequeño delay para mostrar el loading
      await new Promise((resolve) => setTimeout(resolve, 200))

      // Intentar resultados desde backend usando NLP para construir filtros
      const backendResult = await generateBackendRecommendations()

      if (backendResult) {
        setRecommendations(backendResult)
        setShowResults(true)
        behaviorTracker.trackSearch(query, backendResult.products.length + backendResult.stores.length)
        // Registrar búsqueda en backend (no bloquea UI si falla)
        void busquedasService.logBusqueda({
          user_id: user?.id ?? null,
          termino_busqueda: query,
          resultados_encontrados: backendResult.products.length + backendResult.stores.length,
          filtros_aplicados: (backendResult as any)?.filters
        })
        return
      }

      // Fallback local si backend no devuelve datos
      const local = recommendationEngine.generateRecommendations(query, 8)
      setRecommendations(local)
      setShowResults(true)
      behaviorTracker.trackSearch(query, local.products.length + local.stores.length)
    } catch (error) {
      console.error("Error generating recommendations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Construye recomendaciones desde backend con ayuda de NLP
  const generateBackendRecommendations = async (): Promise<RecommendationResult | null> => {
    try {
      const analysis = nlpEngine.analyze(query)
      const categoriaId = analysis.categories
        .map((c) => categoriasMap.get(norm(c)))
        .find((id) => typeof id === 'number')

      const ordenar = analysis.intent === 'price' ? 'precio' : 'fecha_creacion'
      const direccion = analysis.intent === 'price' ? 'asc' : 'desc'

      const productosResp = await productosService.getProductos({
        search: query,
        categoria: categoriaId as any,
        sort_by: ordenar as any,
        sort_order: direccion as any,
        per_page: 12,
        ...(analysis.priceRange?.min ? { precio_min: analysis.priceRange.min } : {}),
        ...(analysis.priceRange?.max ? { precio_max: analysis.priceRange.max } : {}),
      } as any)

      const tiendasResp = await tiendasService.getTiendas({ search: query, per_page: 6 })

      const reasonsForProduct = (p: any) => {
        const reasons: string[] = []
        if (categoriaId && norm(p.categoria) === norm(analysis.categories[0] || '')) {
          reasons.push(`Coincide con la categoría detectada`)
        }
        if (analysis.priceRange?.max && p.precio <= analysis.priceRange.max) {
          reasons.push('Dentro del rango de precio')
        }
        if (analysis.saleType && p.tipoVenta === analysis.saleType) {
          reasons.push(`Tipo de venta ${analysis.saleType}`)
        }
        return reasons
      }

      const computeConfidence = (reasons: string[]) => {
        const base = 0.5
        const bonus = Math.min(reasons.length * 0.15, 0.4)
        return Math.min(base + bonus, 1)
      }

      const products = (productosResp.data || []).map((p: any) => {
        const reasons = reasonsForProduct(p)
        return {
          product: p,
          score: reasons.length,
          reasons,
          confidence: computeConfidence(reasons),
        }
      })

      const stores = (tiendasResp.data || []).map((t: TiendaFrontend) => {
        const reasons: string[] = []
        if (Array.isArray(t.categorias) && analysis.categories.some((c) => t.categorias.map(norm).includes(norm(c)))) {
          reasons.push('Tienda relevante para tu categoría')
        }
        if ((t.calificacion ?? 0) >= 4.5) {
          reasons.push('Excelentes calificaciones')
        }
        return {
          store: t,
          score: reasons.length,
          reasons,
          confidence: computeConfidence(reasons),
        }
      })

      const explanationParts: string[] = []
      if (analysis.categories.length > 0) {
        explanationParts.push(`Detecté categorías: ${analysis.categories.join(', ')}`)
      }
      explanationParts.push(`Intención: ${analysis.intent}`)
      if (analysis.priceRange?.min || analysis.priceRange?.max) {
        const min = analysis.priceRange.min ? `min ₲${analysis.priceRange.min.toLocaleString()}` : ''
        const max = analysis.priceRange.max ? `max ₲${analysis.priceRange.max.toLocaleString()}` : ''
        explanationParts.push(`Rango de precio ${[min, max].filter(Boolean).join(' ')}`)
      }

      const fallbackNLP = recommendationEngine!.generateRecommendations(query, 1).nlpAnalysis

      const result: RecommendationResult & { filters?: any } = {
        products,
        stores,
        nlpAnalysis: fallbackNLP as any,
        explanation: explanationParts.join('. '),
        filters: {
          categoria: categoriaId,
          ordenar,
          direccion,
          precio_min: analysis.priceRange?.min,
          precio_max: analysis.priceRange?.max,
        },
      }

      if (products.length === 0 && stores.length === 0) {
        return null
      }

      return result
    } catch (err) {
      // Si falla el backend, devolver null para activar fallback local
      return null
    }
  }

  // Modo compacto para el navbar: input con sugerencias y navegación al buscar
  if (variant === "navbar") {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const term = query.trim()
      if (!term) return
      behaviorTracker?.trackSearch(term, 0)
      void busquedasService.logBusqueda({ user_id: user?.id ?? null, termino_busqueda: term, resultados_encontrados: 0 })
      setShowSuggestions(false)
      router.push(`/?busqueda=${encodeURIComponent(term)}`)
    }

    const pickSuggestion = (term: string) => {
      setQuery(term)
      behaviorTracker?.trackSearch(term, 0)
      void busquedasService.logBusqueda({ user_id: user?.id ?? null, termino_busqueda: term, resultados_encontrados: 0 })
      setShowSuggestions(false)
      router.push(`/?busqueda=${encodeURIComponent(term)}`)
    }

    return (
      <div className="relative w-full">
        <form onSubmit={handleSubmit} className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Buscar productos, categorías o marcas"
            className="w-full pl-8"
          />
        </form>
        {showSuggestions && (recentSuggestions.length > 0 || popularSuggestions.length > 0) && (
          <div className="absolute z-50 left-0 right-0 mt-2 bg-background border rounded-md shadow-sm p-2">
            {recentSuggestions.length > 0 && (
              <div className="mb-2">
                <div className="flex items-center justify-between px-2 mb-1">
                  <p className="text-xs text-muted-foreground">Búsquedas recientes</p>
                  <button
                    type="button"
                    className="text-[11px] text-blue-600 hover:underline"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      behaviorTracker?.clearSearches()
                      setRecentSuggestions([])
                      setShowSuggestions(true)
                    }}
                  >
                    Limpiar historial
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSuggestions
                    .filter((t) => !query || t.toLowerCase().includes(query.toLowerCase()))
                    .slice(0, 8)
                    .map((term) => (
                      <Badge
                        key={`recent-${term}`}
                        variant="secondary"
                        className="cursor-pointer"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => pickSuggestion(term)}
                      >
                        {term}
                      </Badge>
                    ))}
                </div>
              </div>
            )}
            {popularSuggestions.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground px-2 mb-1">Populares</p>
                <div className="flex flex-wrap gap-2">
                  {popularSuggestions
                    .filter((t) => !query || t.toLowerCase().includes(query.toLowerCase()))
                    .slice(0, 8)
                    .map((term) => (
                      <Badge
                        key={`pop-${term}`}
                        variant="outline"
                        className="cursor-pointer"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => pickSuggestion(term)}
                      >
                        {term}
                      </Badge>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
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
            onFocus={() => {
              if (!query || query.length <= 2) {
                if (behaviorTracker) {
                  const recents = behaviorTracker.getRecentSearches(10).map((s) => s.query)
                  setRecentSuggestions(recents)
                }
                setShowSuggestions(true)
              }
            }}
            className="pl-10 pr-12 h-12 text-base"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Brain className="h-4 w-4 animate-pulse text-blue-600" />
            </div>
          )}
          {showSuggestions && (recentSuggestions.length > 0 || popularSuggestions.length > 0) && (
            <div className="absolute z-20 left-0 right-0 mt-2 bg-background border rounded-md shadow-sm">
              <div className="p-2">
                {recentSuggestions.filter((t) => !query || t.toLowerCase().includes(query.toLowerCase())).length > 0 && (
                  <div className="mb-2">
                    <div className="flex items-center justify-between px-2 mb-1">
                      <p className="text-xs text-muted-foreground">Búsquedas recientes</p>
                      <button
                        type="button"
                        className="text-[11px] text-blue-600 hover:underline"
                        onClick={() => {
                          behaviorTracker?.clearSearches()
                          setRecentSuggestions([])
                          setShowSuggestions(true)
                        }}
                      >
                        Limpiar historial
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSuggestions
                        .filter((t) => !query || t.toLowerCase().includes(query.toLowerCase()))
                        .slice(0, 8)
                        .map((term) => (
                          <Badge
                            key={term}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => {
                              setQuery(term)
                              setShowSuggestions(false)
                              setShowResults(false)
                              // Forzar generación inmediata
                              void generateRecommendations()
                            }}
                          >
                            {term}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
                {popularSuggestions.filter((t) => !query || t.toLowerCase().includes(query.toLowerCase())).length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground px-2 mb-1">Populares</p>
                    <div className="flex flex-wrap gap-2">
                      {popularSuggestions
                        .filter((t) => !query || t.toLowerCase().includes(query.toLowerCase()))
                        .slice(0, 8)
                        .map((term) => (
                          <Badge
                            key={term}
                            variant="outline"
                            className="cursor-pointer"
                            onClick={() => {
                              setQuery(term)
                              setShowSuggestions(false)
                              setShowResults(false)
                              void generateRecommendations()
                            }}
                          >
                            {term}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
              </div>
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
