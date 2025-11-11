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
    tecnología: [
      "telefono", "teléfono", "cel", "celular", "movil", "móvil", "smartphone",
      "laptop", "notebook", "computadora", "pc", "tablet",
      "auriculares", "audifonos", "audífonos", "cargador", "cable",
      "monitor", "teclado", "mouse"
    ],
    ropa: [
      "camisa", "remera", "playera", "polera", "pantalon", "pantalón", "jeans",
      "vestido", "zapatos", "zapatillas", "tenis", "chaqueta", "abrigo", "ropa", "medias", "calcetines"
    ],
    hogar: [
      "muebles", "decoracion", "decoración", "cocina", "baño", "bano", "sala", "dormitorio", "jardin", "jardín",
      "electrodomestico", "electrodoméstico", "heladera", "refrigerador", "microondas", "lavarropas", "lavadora", "licuadora"
    ],
    deportes: [
      "deportivo", "ejercicio", "gym", "fitness", "pelota", "balon", "balón", "bicicleta", "raqueta", "botines"
    ],
    comida: [
      "pizza", "hamburguesa", "comida", "restaurante", "delivery", "almuerzo", "cena", "comida rapida", "rápida", "pedido"
    ],
    libros: ["libro", "novela", "educativo", "lectura", "estudio"],
    juguetes: ["juguete", "niños", "ninos", "bebé", "bebe", "infantil", "juego"],
    belleza: ["maquillaje", "perfume", "crema", "belleza", "cuidado", "cosmetico", "cosmético", "skincare"],
  }

  private intentKeywords = {
    buy: ["comprar", "comprame", "adquirir", "necesito", "quiero", "busco", "ordenar", "solicitar", "vender"],
    compare: ["comparar", "comparativa", "diferencia", "mejor", "vs", "versus", "mejor que"],
    browse: ["ver", "mostrar", "explorar", "navegar"],
    price: ["precio", "costo", "barato", "barata", "economico", "económico", "oferta", "promo", "promocion", "promoción", "rebaja", "descuento"],
    info: ["informacion", "información", "detalles", "caracteristicas", "características", "especificaciones"],
  }

  private urgencyKeywords = {
    high: ["urgente", "ahora", "ya", "inmediato", "rápido", "hoy"],
    medium: ["pronto", "esta semana", "próximo"],
    low: ["algún día", "cuando pueda", "no urgente"],
  }

  private saleTypeKeywords = {
    directa: ["inmediato", "stock", "disponible", "ahora", "retiro", "en tienda", "pickup"],
    pedido: ["pedido", "encargar", "encargo", "preorden", "hacer", "personalizado"],
    delivery: ["delivery", "entrega", "domicilio", "envio", "envío", "a domicilio", "enviar"],
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
    // Normalizar posibles prefijos de moneda
    const t = text.replace(/₲|gs\.?|pyg|guaranies?|g\$/gi, "")

    const parseTokenToNumber = (raw: string): number | null => {
      const cleaned = raw.trim().toLowerCase()
      const unitMatch = cleaned.match(/(mil|millon(?:es)?)/)
      const numMatch = cleaned.match(/[\d.,]+/)
      if (!numMatch) return null
      const base = Number.parseFloat(numMatch[0].replace(/\./g, "").replace(/,/g, ""))
      if (!Number.isFinite(base)) return null
      if (!unitMatch) return base
      const unit = unitMatch[1]
      if (unit.startsWith("mil")) return base * 1_000
      return base * 1_000_000
    }

    // Rango "entre X y Y" o "de X a Y"
    const rangeMatch = t.match(/(?:entre|de)\s*([\d.,]+\s*(?:mil|millon(?:es)?)?)\s*(?:y|a)\s*([\d.,]+\s*(?:mil|millon(?:es)?)?)/)
    if (rangeMatch) {
      const a = parseTokenToNumber(rangeMatch[1]!)
      const b = parseTokenToNumber(rangeMatch[2]!)
      if (a != null && b != null) {
        return { min: Math.min(a, b), max: Math.max(a, b) }
      }
    }

    // Extraer todos los números posibles
    const tokens = Array.from(t.matchAll(/[\d.,]+\s*(?:mil|millon(?:es)?)?/g)).map((m) => m[0])
    const prices = tokens
      .map(parseTokenToNumber)
      .filter((n): n is number => n != null)

    if (prices.length === 0) return null

    // Patrones de límite
    const maxHints = ["menos de", "maximo", "máximo", "hasta", "tope", "barato"]
    const minHints = ["mas de", "más de", "desde", "minimo", "mínimo", "mayor a"]

    if (prices.length === 1) {
      const value = prices[0]
      if (maxHints.some((h) => t.includes(h))) return { max: value }
      if (minHints.some((h) => t.includes(h))) return { min: value }
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
