import { api } from '@/lib/axios'

export interface ComisionResumen {
  total_comisiones: number
  monto_total: number
  pendientes: number
  monto_pendiente: number
  pagadas: number
  monto_pagado: number
  vencidas: number
  promedio_comision: number
}

export interface ComisionItem {
  id_comision: number
  id_orden: number
  id_tienda: number
  id_plan: number
  monto_venta: number
  porcentaje_comision: number
  monto_comision: number
  estado: string
  fecha_vencimiento?: string
  created_at: string
  updated_at: string
  // Relaciones mínimas opcionales
  orden?: any
  planTienda?: any
}

export interface ComisionesResponse {
  data: ComisionItem[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

class ComisionesService {
  async getResumenComisionesTienda(
    tiendaId: number,
    params?: { fecha_inicio?: string; fecha_fin?: string }
  ): Promise<{ data: ComisionResumen }> {
    const response = await api.get<{ data: ComisionResumen }>(`/v1/comisiones/tienda/${tiendaId}/resumen`, {
      params,
    })
    // Algunos controladores devuelven directamente el objeto sin {data}; normalizar
    const payload = (response.data as any)
    const normalized: ComisionResumen = (payload.data ?? payload) as ComisionResumen
    return { data: normalized }
  }

  async getComisionesTienda(
    tiendaId: number,
    params?: { estado?: 'pendiente' | 'pagada' | 'cancelada'; fecha_inicio?: string; fecha_fin?: string; page?: number; per_page?: number }
  ): Promise<ComisionesResponse> {
    const response = await api.get<any>(`/v1/comisiones/tienda/${tiendaId}`, { params })

    const paginator = response.data?.data ?? response.data
    const items: ComisionItem[] = (paginator?.data ?? paginator) as ComisionItem[]
    return {
      data: Array.isArray(items) ? items : [],
      current_page: paginator?.current_page ?? 1,
      last_page: paginator?.last_page ?? 1,
      per_page: paginator?.per_page ?? (params?.per_page ?? 15),
      total: paginator?.total ?? (Array.isArray(items) ? items.length : 0),
    }
  }
}

export const comisionesService = new ComisionesService()