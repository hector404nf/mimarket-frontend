"use client"

// Rastreador de comportamiento del usuario
export class BehaviorTracker {
  private static instance: BehaviorTracker
  private storageKey = "user-behavior-data"
  private sessionKey = "behavior-session-id"

  public static getInstance(): BehaviorTracker {
    // Guard against SSR
    if (typeof window === "undefined") {
      return new BehaviorTracker()
    }

    if (!BehaviorTracker.instance) {
      BehaviorTracker.instance = new BehaviorTracker()
    }
    return BehaviorTracker.instance
  }

  // Rastrear vista de producto
  public trackProductView(productId: number, duration = 0): void {
    const data = this.getBehaviorData()
    const timestamp = Date.now()

    if (!data.productViews[productId]) {
      data.productViews[productId] = {
        viewCount: 0,
        totalDuration: 0,
        lastViewed: timestamp,
        firstViewed: timestamp,
      }
    }

    data.productViews[productId].viewCount++
    data.productViews[productId].totalDuration += duration
    data.productViews[productId].lastViewed = timestamp

    this.saveBehaviorData(data)
  }

  // Rastrear vista de tienda
  public trackStoreView(storeId: number, duration = 0): void {
    const data = this.getBehaviorData()
    const timestamp = Date.now()

    if (!data.storeViews[storeId]) {
      data.storeViews[storeId] = {
        viewCount: 0,
        totalDuration: 0,
        lastViewed: timestamp,
        firstViewed: timestamp,
      }
    }

    data.storeViews[storeId].viewCount++
    data.storeViews[storeId].totalDuration += duration
    data.storeViews[storeId].lastViewed = timestamp

    this.saveBehaviorData(data)
  }

  // Rastrear búsqueda
  public trackSearch(query: string, resultsCount: number): void {
    const data = this.getBehaviorData()
    const timestamp = Date.now()

    data.searches.push({
      query,
      timestamp,
      resultsCount,
    })

    // Mantener solo las últimas 50 búsquedas
    if (data.searches.length > 50) {
      data.searches = data.searches.slice(-50)
    }

    this.saveBehaviorData(data)
  }

  // Rastrear clic en producto
  public trackProductClick(productId: number, context: string): void {
    const data = this.getBehaviorData()
    const timestamp = Date.now()

    data.clicks.push({
      type: "product",
      id: productId,
      context,
      timestamp,
    })

    // Mantener solo los últimos 100 clics
    if (data.clicks.length > 100) {
      data.clicks = data.clicks.slice(-100)
    }

    this.saveBehaviorData(data)
  }

  // Rastrear adición al carrito
  public trackAddToCart(productId: number): void {
    const data = this.getBehaviorData()
    const timestamp = Date.now()

    data.cartActions.push({
      action: "add",
      productId,
      timestamp,
    })

    this.saveBehaviorData(data)
  }

  // Obtener datos de comportamiento
  public getBehaviorData(): BehaviorData {
    if (typeof window === "undefined") {
      return this.getEmptyBehaviorData()
    }

    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error("Error loading behavior data:", error)
    }

    return this.getEmptyBehaviorData()
  }

  // Limpiar todo el historial de comportamiento
  public clearAll(): void {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(this.storageKey)
      } catch (error) {
        console.error("Error clearing behavior data:", error)
      }
    }
  }

  // Limpiar solo el historial de búsquedas
  public clearSearches(): void {
    const data = this.getBehaviorData()
    data.searches = []
    this.saveBehaviorData(data)
  }

  // Obtener productos más vistos
  public getMostViewedProducts(limit = 10): ProductViewData[] {
    const data = this.getBehaviorData()
    return Object.entries(data.productViews)
      .map(([id, viewData]) => ({ productId: Number.parseInt(id), ...viewData }))
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, limit)
  }

  // Obtener tiendas más visitadas
  public getMostViewedStores(limit = 5): StoreViewData[] {
    const data = this.getBehaviorData()
    return Object.entries(data.storeViews)
      .map(([id, viewData]) => ({ storeId: Number.parseInt(id), ...viewData }))
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, limit)
  }

  // Obtener búsquedas recientes
  public getRecentSearches(limit = 10): SearchData[] {
    const data = this.getBehaviorData()
    return data.searches.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit)
  }

  // Obtener categorías de interés basadas en comportamiento
  public getInterestCategories(): CategoryInterest[] {
    const data = this.getBehaviorData()
    const categoryScores: { [key: string]: number } = {}

    // Analizar productos vistos
    Object.entries(data.productViews).forEach(([productId, viewData]) => {
      // Aquí necesitaríamos acceso a los datos del producto para obtener su categoría
      // Por simplicidad, usaremos un mapeo básico
      const category = this.getProductCategory(Number.parseInt(productId))
      if (category) {
        categoryScores[category] = (categoryScores[category] || 0) + viewData.viewCount
      }
    })

    return Object.entries(categoryScores)
      .map(([category, score]) => ({ category, score }))
      .sort((a, b) => b.score - a.score)
  }

  // Calcular score de afinidad para un producto
  public calculateProductAffinity(productId: number): number {
    const data = this.getBehaviorData()
    const viewData = data.productViews[productId]

    if (!viewData) return 0

    const recencyScore = this.calculateRecencyScore(viewData.lastViewed)
    const frequencyScore = Math.min(viewData.viewCount / 10, 1)
    const durationScore = Math.min(viewData.totalDuration / 60000, 1) // Normalizar a minutos

    return recencyScore * 0.4 + frequencyScore * 0.4 + durationScore * 0.2
  }

  private calculateRecencyScore(timestamp: number): number {
    const now = Date.now()
    const daysSince = (now - timestamp) / (1000 * 60 * 60 * 24)

    if (daysSince <= 1) return 1
    if (daysSince <= 7) return 0.8
    if (daysSince <= 30) return 0.5
    return 0.2
  }

  private getProductCategory(productId: number): string | null {
    // Mapeo simplificado - en una app real esto vendría de la base de datos
    const categoryMap: { [key: number]: string } = {
      1: "electronica",
      2: "electronica",
      3: "deportes",
      4: "electronica",
      5: "ropa",
      6: "hogar",
      7: "electronica",
      8: "belleza",
      9: "deportes",
      10: "hogar",
      11: "ropa",
      12: "belleza",
      13: "comida",
      14: "comida",
      15: "comida",
      16: "bebidas",
    }
    return categoryMap[productId] || null
  }

  private saveBehaviorData(data: BehaviorData): void {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(data))
      } catch (error) {
        console.error("Error saving behavior data:", error)
      }
    }
  }

  private getEmptyBehaviorData(): BehaviorData {
    return {
      productViews: {},
      storeViews: {},
      searches: [],
      clicks: [],
      cartActions: [],
    }
  }

  // Obtener/crear un ID de sesión para agregación
  public getSessionId(): string {
    if (typeof window === "undefined") return "ssr"
    try {
      let id = localStorage.getItem(this.sessionKey)
      if (!id) {
        id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
        localStorage.setItem(this.sessionKey, id)
      }
      return id
    } catch {
      return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    }
  }

  // Construir un resumen agregable para sincronización con backend
  public getAggregatedSummary(): BehaviorSummary {
    const data = this.getBehaviorData()
    const date = new Date()
    const isoDate = date.toISOString().slice(0, 10)

    // Agregar métricas por producto
    const productMetrics: BehaviorProductMetrics[] = Object.entries(data.productViews).map(([productId, viewData]) => {
      const clicksForProduct = data.clicks.filter((c) => c.type === "product" && c.id === Number(productId)).length
      const addToCartForProduct = data.cartActions.filter((a) => a.productId === Number(productId) && a.action === "add").length
      const avg = viewData.viewCount > 0 ? Math.round(viewData.totalDuration / viewData.viewCount) : 0
      return {
        product_id: Number(productId),
        views_count: viewData.viewCount,
        total_duration_ms: viewData.totalDuration,
        avg_duration_ms: avg,
        add_to_cart_count: addToCartForProduct,
        clicks_count: clicksForProduct,
      }
    })

    // Agregar métricas por tienda
    const storeMetrics: BehaviorStoreMetrics[] = Object.entries(data.storeViews).map(([storeId, viewData]) => {
      const avg = viewData.viewCount > 0 ? Math.round(viewData.totalDuration / viewData.viewCount) : 0
      return {
        store_id: Number(storeId),
        views_count: viewData.viewCount,
        total_duration_ms: viewData.totalDuration,
        avg_duration_ms: avg,
      }
    })

    // Agregar métricas por término de búsqueda
    const searchCounts = new Map<string, number>()
    data.searches.forEach((s) => {
      const key = s.query.trim().toLowerCase()
      searchCounts.set(key, (searchCounts.get(key) || 0) + 1)
    })
    const searchMetrics: BehaviorSearchMetrics[] = Array.from(searchCounts.entries()).map(([term, count]) => ({
      term,
      search_count: count,
      result_clicks: 0,
      conversion_rate: 0,
    }))

    return {
      session_id: this.getSessionId(),
      date: isoDate,
      product_metrics: productMetrics,
      store_metrics: storeMetrics,
      search_metrics: searchMetrics,
    }
  }
}

// Tipos para datos de comportamiento
export interface BehaviorData {
  productViews: { [productId: number]: ViewData }
  storeViews: { [storeId: number]: ViewData }
  searches: SearchData[]
  clicks: ClickData[]
  cartActions: CartActionData[]
}

export interface ViewData {
  viewCount: number
  totalDuration: number
  lastViewed: number
  firstViewed: number
}

export interface ProductViewData extends ViewData {
  productId: number
}

export interface StoreViewData extends ViewData {
  storeId: number
}

export interface SearchData {
  query: string
  timestamp: number
  resultsCount: number
}

export interface ClickData {
  type: "product" | "store"
  id: number
  context: string
  timestamp: number
}

export interface CartActionData {
  action: "add" | "remove"
  productId: number
  timestamp: number
}

export interface CategoryInterest {
  category: string
  score: number
}

// Tipos para resumen agregado
export interface BehaviorSummary {
  session_id: string
  date: string
  product_metrics: BehaviorProductMetrics[]
  store_metrics: BehaviorStoreMetrics[]
  search_metrics: BehaviorSearchMetrics[]
}

export interface BehaviorProductMetrics {
  product_id: number
  views_count: number
  total_duration_ms: number
  avg_duration_ms: number
  add_to_cart_count?: number
  clicks_count?: number
}

export interface BehaviorStoreMetrics {
  store_id: number
  views_count: number
  total_duration_ms: number
  avg_duration_ms: number
}

export interface BehaviorSearchMetrics {
  term: string
  search_count: number
  result_clicks?: number
  conversion_rate?: number
}
