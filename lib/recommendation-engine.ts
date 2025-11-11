"use client"

import { NLPEngine, nlpEngine, type NLPAnalysis } from "./nlp-engine"
import { BehaviorTracker, type CategoryInterest } from "./behavior-tracker"
import { productos } from "./data"
import { tiendas } from "./stores-data"

// Motor de recomendaciones inteligente
export class RecommendationEngine {
  private static instance: RecommendationEngine
  private nlpEngine: NLPEngine | undefined
  private behaviorTracker: BehaviorTracker

  constructor() {
    // Guard against SSR
    if (typeof window !== "undefined") {
      this.nlpEngine = nlpEngine
      this.behaviorTracker = BehaviorTracker.getInstance()
    }
  }

  public static getInstance(): RecommendationEngine {
    // Guard against SSR
    if (typeof window === "undefined") {
      return new RecommendationEngine()
    }

    if (!RecommendationEngine.instance) {
      RecommendationEngine.instance = new RecommendationEngine()
    }
    return RecommendationEngine.instance
  }

  // Generar recomendaciones basadas en consulta NLP y comportamiento
  public generateRecommendations(query: string, limit = 10): RecommendationResult {
    // Guard against SSR
    if (typeof window === "undefined" || !this.nlpEngine || !this.behaviorTracker) {
      return {
        products: [],
        stores: [],
        nlpAnalysis: {
          categories: [],
          intent: "browse",
          sentiment: "neutral",
          urgency: 0,
          priceRange: null,
          saleType: null,
        },
        explanation: "Sistema no disponible en el servidor",
      }
    }

    // Procesar consulta con NLP
    const analysis = this.nlpEngine.analyze(query)
    const keywords = this.extractKeywords(query)

    // Obtener datos de comportamiento
    const behaviorData = this.behaviorTracker.getBehaviorData()
    const interestCategories = this.behaviorTracker.getInterestCategories()
    const mostViewedProducts = this.behaviorTracker.getMostViewedProducts()

    // Generar recomendaciones de productos
    const productRecommendations = this.generateProductRecommendations(
      analysis,
      keywords,
      interestCategories,
      mostViewedProducts,
      limit,
    )

    // Generar recomendaciones de tiendas
    const storeRecommendations = this.generateStoreRecommendations(analysis, interestCategories, Math.ceil(limit / 3))

    return {
      products: productRecommendations,
      stores: storeRecommendations,
      nlpAnalysis: analysis,
      explanation: this.generateExplanation(analysis, interestCategories),
    }
  }

  private generateProductRecommendations(
    analysis: NLPAnalysis,
    keywords: string[],
    interests: CategoryInterest[],
    viewedProducts: any[],
    limit: number,
  ): ProductRecommendation[] {
    const recommendations: ProductRecommendation[] = []

    productos.forEach((producto) => {
      let score = 0
      const reasons: string[] = []

      // Score basado en NLP
      const nlpScore = this.calculateNLPScore(producto, analysis, keywords)
      score += nlpScore.score
      reasons.push(...nlpScore.reasons)

      // Score basado en comportamiento
      const behaviorScore = this.calculateBehaviorScore(producto, interests, viewedProducts)
      score += behaviorScore.score
      reasons.push(...behaviorScore.reasons)

      // Score basado en afinidad del usuario
      const affinityScore = this.behaviorTracker.calculateProductAffinity(producto.id)
      score += affinityScore * 0.3
      if (affinityScore > 0.5) {
        reasons.push("Has mostrado interés en este producto anteriormente")
      }

      if (score > 0) {
        recommendations.push({
          product: producto,
          score,
          reasons,
          confidence: Math.min(score / 3, 1),
        })
      }
    })

    return recommendations.sort((a, b) => b.score - a.score).slice(0, limit)
  }

  private generateStoreRecommendations(
    analysis: NLPAnalysis,
    interests: CategoryInterest[],
    limit: number,
  ): StoreRecommendation[] {
    const recommendations: StoreRecommendation[] = []

    tiendas.forEach((tienda) => {
      let score = 0
      const reasons: string[] = []

      // Score basado en categorías de la tienda vs intereses del usuario
      const categoryMatch = tienda.categorias.some((categoria) =>
        interests.some(
          (interest) =>
            categoria.toLowerCase().includes(interest.category) || interest.category.includes(categoria.toLowerCase()),
        ),
      )

      if (categoryMatch) {
        score += 1
        reasons.push("Tienda especializada en tus categorías de interés")
      }

      // Score basado en NLP
      const nlpCategoryMatch = analysis.categories.some((nlpCat) =>
        tienda.categorias.some(
          (storeCat) => storeCat.toLowerCase().includes(nlpCat) || nlpCat.includes(storeCat.toLowerCase()),
        ),
      )

      if (nlpCategoryMatch) {
        score += 1.5
        reasons.push("Coincide con lo que estás buscando")
      }

      // Score basado en calificación de la tienda
      if (tienda.calificacion >= 4.5) {
        score += 0.5
        reasons.push("Tienda con excelentes calificaciones")
      }

      if (score > 0) {
        recommendations.push({
          store: tienda,
          score,
          reasons,
          confidence: Math.min(score / 3, 1),
        })
      }
    })

    return recommendations.sort((a, b) => b.score - a.score).slice(0, limit)
  }

  private calculateNLPScore(producto: any, analysis: NLPAnalysis, keywords: string[]): ScoreResult {
    let score = 0
    const reasons: string[] = []

    // Coincidencia de categoría
    const categoriaProducto = (producto.categoria || "").toLowerCase()
    const categoryMatched = analysis.categories.some((cat) => cat === categoriaProducto)
    if (categoryMatched) {
      score += 1.5
      reasons.push(`Coincide con la categoría "${categoriaProducto}"`)
    }

    // Coincidencia de palabras clave
    const nombre = (producto.nombre || "").toLowerCase()
    const descripcion = (producto.descripcion || "").toLowerCase()
    const keywordMatches = keywords.filter((kw) => nombre.includes(kw) || descripcion.includes(kw))
    if (keywordMatches.length > 0) {
      score += keywordMatches.length * 0.3
      reasons.push(`Coincide con palabras clave: ${keywordMatches.join(", ")}`)
    }

    // Tipo de venta
    if (analysis.saleType && analysis.saleType === producto.tipoVenta) {
      score += 1
      reasons.push(`Tipo de venta coincide: ${analysis.saleType}`)
    }

    // Urgencia
    if (analysis.urgency > 0.5 && producto.tipoVenta === "directa") {
      score += analysis.urgency
      reasons.push("Disponible para compra inmediata")
    }

    return { score, reasons }
  }

  private calculateBehaviorScore(producto: any, interests: CategoryInterest[], viewedProducts: any[]): ScoreResult {
    let score = 0
    const reasons: string[] = []

    // Score basado en categorías de interés
    const categoryInterest = interests.find((interest) => interest.category === producto.categoria.toLowerCase())
    if (categoryInterest) {
      const normalizedScore = Math.min(categoryInterest.score / 10, 1)
      score += normalizedScore
      reasons.push(`Te interesa la categoría "${categoryInterest.category}"`)
    }

    // Score basado en productos similares vistos
    const similarViewed = viewedProducts.filter((viewed) => {
      const viewedProduct = productos.find((p) => p.id === viewed.productId)
      return viewedProduct && viewedProduct.categoria === producto.categoria
    })

    if (similarViewed.length > 0) {
      score += Math.min(similarViewed.length * 0.2, 1)
      reasons.push("Has visto productos similares recientemente")
    }

    return { score, reasons }
  }

  private generateExplanation(analysis: NLPAnalysis, interests: CategoryInterest[]): string {
    const explanations: string[] = []

    if (analysis.categories.length > 0) {
      explanations.push(`Detecté que buscas productos de: ${analysis.categories.join(", ")}`)
    }

    explanations.push(`Tu intención parece ser: ${analysis.intent}`)

    if (interests.length > 0) {
      explanations.push(
        `Basándome en tu historial, te interesan: ${interests
          .slice(0, 3)
          .map((i) => i.category)
          .join(", ")}`,
      )
    }

    return explanations.join(". ")
  }

  private extractKeywords(text: string): string[] {
    const stopwords = new Set([
      "de","la","que","el","en","y","a","los","del","se","las","por","un","para","con","no","una","su","al","lo",
      "como","más","pero","sus","le","ya","o","este","sí","porque","esta","entre","cuando","muy","sin","sobre","también",
    ])
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .split(/\W+/)
      .filter((w) => w && !stopwords.has(w) && w.length >= 3)
      .slice(0, 10)
  }
}

// Tipos para recomendaciones
export interface RecommendationResult {
  products: ProductRecommendation[]
  stores: StoreRecommendation[]
  nlpAnalysis: NLPAnalysis
  explanation: string
}

export interface ProductRecommendation {
  product: any
  score: number
  reasons: string[]
  confidence: number
}

export interface StoreRecommendation {
  store: any
  score: number
  reasons: string[]
  confidence: number
}

interface ScoreResult {
  score: number
  reasons: string[]
}
