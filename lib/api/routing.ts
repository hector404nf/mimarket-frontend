import apiClient, { api } from '@/lib/axios'

export type LatLng = { lat: number; lng: number }

export type RoutingResponse = {
  ok: boolean
  source?: string
  geometry?: any
  distance?: number
  duration?: number
  error?: string
  message?: string
}

export const routingService = {
  async driving(origin: LatLng, destination: LatLng): Promise<RoutingResponse> {
    const res = await api.get<RoutingResponse>('/v1/routing/driving', {
      params: {
        origin_lat: origin.lat,
        origin_lng: origin.lng,
        dest_lat: destination.lat,
        dest_lng: destination.lng,
      },
      // Evitar que se agregue Authorization si no hay token, pero se mantiene por defecto
      timeout: 15000,
    })
    return res.data as any
  },
}