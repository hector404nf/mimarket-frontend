import { api } from '../axios'

export type MetodoTipo = 'tarjeta' | 'efectivo' | 'transferencia'

export interface MetodoPagoBackend {
  id_metodo: number
  user_id: number
  tipo: MetodoTipo
  marca?: string
  terminacion?: string
  nombre_titular?: string
  mes_venc?: number
  anio_venc?: number
  banco?: string
  predeterminada: boolean
  activo: boolean
  metadata?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface MetodoPagoCreatePayload {
  user_id: number
  tipo: MetodoTipo
  marca?: string
  terminacion?: string
  nombre_titular?: string
  mes_venc?: number
  anio_venc?: number
  banco?: string
  predeterminada?: boolean
  activo?: boolean
  metadata?: Record<string, any>
}

class MetodosPagoService {
  async getByUsuario(usuarioId: number): Promise<MetodoPagoBackend[]> {
    const response = await api.get<any>(`/v1/metodos-pago/usuario/${usuarioId}`)
    const data = Array.isArray(response.data) ? response.data : (response.data?.data || [])
    return data as MetodoPagoBackend[]
  }

  async create(payload: MetodoPagoCreatePayload): Promise<MetodoPagoBackend> {
    const response = await api.post<any>(`/v1/metodos-pago`, payload)
    const data = response.data?.data ?? response.data
    return data as MetodoPagoBackend
  }

  async update(id: number, payload: Partial<MetodoPagoCreatePayload>): Promise<MetodoPagoBackend> {
    const response = await api.patch<any>(`/v1/metodos-pago/${id}`, payload)
    const data = response.data?.data ?? response.data
    return data as MetodoPagoBackend
  }

  async delete(id: number): Promise<void> {
    await api.delete<any>(`/v1/metodos-pago/${id}`)
  }

  async setDefault(id: number): Promise<MetodoPagoBackend> {
    const response = await api.patch<any>(`/v1/metodos-pago/${id}/predeterminar`)
    const data = response.data?.data ?? response.data
    return data as MetodoPagoBackend
  }
}

export const metodosPagoService = new MetodosPagoService()