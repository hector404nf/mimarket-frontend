interface DeliveryZone {
  id: string
  name: string
  price: number
  estimatedTime: string
  coordinates: Array<{ lat: number; lng: number }>
  color: string
}

interface StoreConfig {
  deliveryZones: DeliveryZone[]
  coordinates: [number, number]
}

export function detectDeliveryZone(
  userLocation: [number, number],
  storeConfig: StoreConfig,
): { zone: DeliveryZone | null; distance: number } {
  const [userLat, userLng] = userLocation
  const [storeLat, storeLng] = storeConfig.coordinates

  // Calcular distancia a la tienda
  const distance = calculateDistance(userLat, userLng, storeLat, storeLng)

  // Verificar si el usuario está dentro de alguna zona
  for (const zone of storeConfig.deliveryZones) {
    if (isPointInPolygon(userLocation, zone.coordinates)) {
      return { zone, distance }
    }
  }

  return { zone: null, distance }
}

function isPointInPolygon(point: [number, number], polygon: Array<{ lat: number; lng: number }>): boolean {
  const [lat, lng] = point
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng
    const yi = polygon[i].lat
    const xj = polygon[j].lng
    const yj = polygon[j].lat

    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }

  return inside
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Radio de la Tierra en km
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

export function getDeliveryPriceForLocation(
  userLocation: [number, number],
  storeId: string,
): { price: number; zoneName: string; estimatedTime: string } | null {
  // Obtener configuración de la tienda desde localStorage
  const storeConfig = localStorage.getItem("storeConfig")
  if (!storeConfig) return null

  const config = JSON.parse(storeConfig)
  const { zone } = detectDeliveryZone(userLocation, config)

  if (zone) {
    return {
      price: zone.price,
      zoneName: zone.name,
      estimatedTime: zone.estimatedTime,
    }
  }

  return null
}
