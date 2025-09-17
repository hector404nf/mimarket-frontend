export interface NLPAnalysis {
  categories: string[]
  intent: "buy" | "compare" | "browse" | "price" | "info"
  sentiment: "positive" | "neutral" | "negative"
  urgency: number // 0-1
  priceRange: { min?: number; max?: number } | null
  saleType: "directa" | "pedido" | "delivery" | null
}

export class NLPEngine {
  private categoryKeywords = {
    tecnología: ["teléfono", "celular", "móvil", "laptop", "computadora", "tablet", "auriculares", "cargador", "cable"],
    ropa: ["camisa", "pantalón", "vestido", "zapatos", "zapatillas", "chaqueta", "abrigo", "ropa"],
    hogar: ["muebles", "decoración", "cocina", "baño", "sala", "dormitorio", "jardín"],
    deportes: ["deportivo", "ejercicio", "gym", "fitness", "pelota", "bicicleta"],
    comida: ["pizza", "hamburguesa", "comida", "restaurante", "delivery", "almuerzo", "cena"],
    libros: ["libro", "novela", "educativo", "lectura", "estudio"],
    juguetes: ["juguete", "niños", "bebé", "infantil", "juego"],
    belleza: ["maquillaje", "perfume", "crema", "belleza", "cuidado", "cosmético"],
  }

  private intentKeywords = {
    buy: ["comprar", "necesito", "quiero", "busco", "vender"],
    compare: ["comparar", "diferencia", "mejor", "vs", "versus"],
    browse: ["ver", "mostrar", "explorar", "navegar"],
    price: ["precio", "costo", "barato", "económico", "oferta", "descuento"],
    info: ["información", "detalles", "características", "especificaciones"],
  }

  private urgencyKeywords = {
    high: ["urgente", "ahora", "ya", "inmediato", "rápido", "hoy"],
    medium: ["pronto", "esta semana", "próximo"],
    low: ["algún día", "cuando pueda", "no urgente"],
  }

  private saleTypeKeywords = {
    directa: ["inmediato", "stock", "disponible", "ahora"],
    pedido: ["pedido", "encargar", "hacer", "personalizado"],
    delivery: ["delivery", "entrega", "domicilio", "envío"],
  }

  analyze(text: string): NLPAnalysis {
    const normalizedText = this.normalizeText(text)

    return {
      categories: this.extractCategories(normalizedText),
      intent: this.detectIntent(normalizedText),
      sentiment: this.analyzeSentiment(normalizedText),
      urgency: this.calculateUrgency(normalizedText),
      priceRange: this.extractPriceRange(normalizedText),
      saleType: this.detectSaleType(normalizedText),
    }
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .trim()
  }

  private extractCategories(text: string): string[] {
    const categories: string[] = []

    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      if (keywords.some((keyword) => text.includes(keyword))) {
        categories.push(category)
      }
    }

    return categories
  }

  private detectIntent(text: string): NLPAnalysis["intent"] {
    for (const [intent, keywords] of Object.entries(this.intentKeywords)) {
      if (keywords.some((keyword) => text.includes(keyword))) {
        return intent as NLPAnalysis["intent"]
      }
    }
    return "browse"
  }

  private analyzeSentiment(text: string): NLPAnalysis["sentiment"] {
    const positiveWords = ["bueno", "excelente", "genial", "perfecto", "increíble"]
    const negativeWords = ["malo", "terrible", "horrible", "pésimo", "awful"]

    const positiveCount = positiveWords.filter((word) => text.includes(word)).length
    const negativeCount = negativeWords.filter((word) => text.includes(word)).length

    if (positiveCount > negativeCount) return "positive"
    if (negativeCount > positiveCount) return "negative"
    return "neutral"
  }

  private calculateUrgency(text: string): number {
    if (this.urgencyKeywords.high.some((word) => text.includes(word))) return 0.9
    if (this.urgencyKeywords.medium.some((word) => text.includes(word))) return 0.6
    if (this.urgencyKeywords.low.some((word) => text.includes(word))) return 0.2
    return 0.5
  }

  private extractPriceRange(text: string): { min?: number; max?: number } | null {
    const priceRegex = /₲\s?(\d+(?:[.,]\d{3})*)/g
    const matches = text.match(priceRegex)

    if (!matches) return null

    const prices = matches.map((match) => Number.parseFloat(match.replace("₲", "").replace(/[.,]/g, "")))

    if (prices.length === 1) {
      if (text.includes("menos de") || text.includes("máximo")) {
        return { max: prices[0] }
      }
      if (text.includes("más de") || text.includes("mínimo")) {
        return { min: prices[0] }
      }
    }

    if (prices.length >= 2) {
      return { min: Math.min(...prices), max: Math.max(...prices) }
    }

    return null
  }

  private detectSaleType(text: string): NLPAnalysis["saleType"] {
    for (const [saleType, keywords] of Object.entries(this.saleTypeKeywords)) {
      if (keywords.some((keyword) => text.includes(keyword))) {
        return saleType as NLPAnalysis["saleType"]
      }
    }
    return null
  }
}

export const nlpEngine = new NLPEngine()
