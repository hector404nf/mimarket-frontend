import { api } from '@/lib/axios'

export interface BusquedaBackend {
  id: number
  user_id?: number | null
  termino_busqueda: string
  resultados_encontrados: number
  filtros_aplicados?: any
  ip_address?: string | null
  created_at?: string
}

export interface BusquedaPayload {
  user_id?: number | null
  termino_busqueda: string
  resultados_encontrados: number
  filtros_aplicados?: any
  ip_address?: string | null
}

class BusquedasService {
  async logBusqueda(payload: BusquedaPayload): Promise<{ data: BusquedaBackend } | { success: boolean } > {
    try {
      const res = await api.post<{ data: BusquedaBackend }>(`/v1/busquedas`, payload)
      return res.data
    } catch (e) {
      // No bloquear flujo de UI por fallos en registro
      return { success: false }
    }
  }

  async getPopulares(): Promise<{ data: Array<{ termino: string; total: number }> } | { data: any[] }> {
    try {
      const res = await api.get<{ data: Array<{ termino: string; total: number }> }>(`/v1/busquedas/populares`)
      return res.data
    } catch {
      return { data: [] }
    }
  }

  async getRecientesUsuario(usuarioId: number): Promise<{ data: BusquedaBackend[] }> {
    const res = await api.get<{ data: BusquedaBackend[] }>(`/v1/busquedas/recientes/${usuarioId}`)
    return res.data
  }

  async getHistorialUsuario(usuarioId: number): Promise<{ data: BusquedaBackend[] }> {
    const res = await api.get<{ data: BusquedaBackend[] }>(`/v1/busquedas/usuario/${usuarioId}`)
    return res.data
  }
}

export const busquedasService = new BusquedasService()