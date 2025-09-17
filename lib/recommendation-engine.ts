"use client"

import { NLPEngine, type NLPResult } from "./nlp-engine"
import { BehaviorTracker, type CategoryInterest } from "./behavior-tracker"
import { productos } from "./data"
import { tiendas } from "./stores-data"

// Motor de recomendaciones inteligente
export class RecommendationEngine {
  private static instance: RecommendationEngine
  private nlpEngine: NLPEngine
  private behaviorTracker: BehaviorTracker

  constructor() {
    // Guard against SSR
    if (typeof window !== "undefined") {
      this.nlpEngine = NLPEngine.getInstance()
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
          intent: { intent: "unknown", confidence: 0 },
          categories: [],
          keywords: [],
          urgency: 0,
          salesType: null,
        },
        explanation: "Sistema no disponible en el servidor",
      }
    }

    // Procesar consulta con NLP
    const nlpResult = this.nlpEngine.processQuery(query)

    // Obtener datos de comportamiento
    const behaviorData = this.behaviorTracker.getBehaviorData()
    const interestCategories = this.behaviorTracker.getInterestCategories()
    const mostViewedProducts = this.behaviorTracker.getMostViewedProducts()

    // Generar recomendaciones de productos
    const productRecommendations = this.generateProductRecommendations(
      nlpResult,
      interestCategories,
      mostViewedProducts,
      limit,
    )

    // Generar recomendaciones de tiendas
    const storeRecommendations = this.generateStoreRecommendations(nlpResult, interestCategories, Math.ceil(limit / 3))

    return {
      products: productRecommendations,
      stores: storeRecommendations,
      nlpAnalysis: nlpResult,
      explanation: this.generateExplanation(nlpResult, interestCategories),
    }
  }

  private generateProductRecommendations(
    nlpResult: NLPResult,
    interests: CategoryInterest[],
    viewedProducts: any[],
    limit: number,
  ): ProductRecommendation[] {
    const recommendations: ProductRecommendation[] = []

    productos.forEach((producto) => {
      let score = 0
      const reasons: string[] = []

      // Score basado en NLP
      const nlpScore = this.calculateNLPScore(producto, nlpResult)
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
    nlpResult: NLPResult,
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
      const nlpCategoryMatch = nlpResult.categories.some((nlpCat) =>
        tienda.categorias.some(
          (storeCat) =>
            storeCat.toLowerCase().includes(nlpCat.category) || nlpCat.category.includes(storeCat.toLowerCase()),
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

  private calculateNLPScore(producto: any, nlpResult: NLPResult): ScoreResult {
    let score = 0
    const reasons: string[] = []

    // Coincidencia de categoría
    const categoryMatch = nlpResult.categories.find((cat) => cat.category === producto.categoria.toLowerCase())
    if (categoryMatch) {
      score += categoryMatch.confidence * 2
      reasons.push(`Coincide con la categoría "${categoryMatch.category}"`)
    }

    // Coincidencia de palabras clave
    const keywordMatches = nlpResult.keywords.filter(
      (keyword) =>
        producto.nombre.toLowerCase().includes(keyword) || producto.descripcion.toLowerCase().includes(keyword),
    )
    if (keywordMatches.length > 0) {
      score += keywordMatches.length * 0.3
      reasons.push(`Coincide con palabras clave: ${keywordMatches.join(", ")}`)
    }

    // Tipo de venta
    if (nlpResult.salesType && nlpResult.salesType === producto.tipoVenta) {
      score += 1
      reasons.push(`Tipo de venta coincide: ${nlpResult.salesType}`)
    }

    // Urgencia
    if (nlpResult.urgency > 0.5 && producto.tipoVenta === "directa") {
      score += nlpResult.urgency
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

  private generateExplanation(nlpResult: NLPResult, interests: CategoryInterest[]): string {
    const explanations: string[] = []

    if (nlpResult.categories.length > 0) {
      explanations.push(`Detecté que buscas productos de: ${nlpResult.categories.map((c) => c.category).join(", ")}`)
    }

    if (nlpResult.intent.confidence > 0.5) {
      explanations.push(`Tu intención parece ser: ${nlpResult.intent.intent}`)
    }

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
}

// Tipos para recomendaciones
export interface RecommendationResult {
  products: ProductRecommendation[]
  stores: StoreRecommendation[]
  nlpAnalysis: NLPResult
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
