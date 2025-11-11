import { api } from '../axios'

export interface OrdenDetalleProducto {
  id_producto: number
  nombre?: string
  precio?: number
  descuento?: number
  imagen_principal_url?: string
  imagen_url?: string
  tipo_venta?: string
  tipoVenta?: string
}

export interface OrdenDetalle {
  id_producto: number
  cantidad: number
  precio_unitario: number
  subtotal: number
  producto?: OrdenDetalleProducto
}

export interface OrdenBackend {
  id_orden: number
  numero_orden: string
  total: number
  estado: string
  created_at: string
  metodo_pago?: string
  direccion_envio?: string
  notas?: string
  detalles: OrdenDetalle[]
  user?: {
    id: number
    name: string
    apellido?: string
    email: string
    telefono?: string
  }
  store_info?: {
    id: number
    nombre: string
    telefono?: string
    rating?: number
  }
}

export interface OrdenTrackingSnapshot {
  latitud?: number | string
  longitud?: number | string
  precision?: number
  velocidad?: number
  heading?: number
  tracking_activo?: boolean
  updated_at?: string
}

export interface OrdenTrackingUpdatePayload {
  latitud: number
  longitud: number
  precision?: number
  velocidad?: number
  heading?: number
  tracking_activo?: boolean
  fuente?: 'store_app' | 'driver_app'
}

class OrdenesService {
  async getOrdenesByUsuario(usuarioId: number): Promise<OrdenBackend[]> {
    const response = await api.get<any>(`/v1/ordenes/usuario/${usuarioId}`)
    // Soportar respuestas con o sin envoltura { data }
    const data = Array.isArray(response.data) ? response.data : (response.data.data || [])
    return data as OrdenBackend[]
  }

  async getOrdenesByTienda(tiendaId: number): Promise<OrdenBackend[]> {
    const response = await api.get<any>(`/v1/ordenes/tienda/${tiendaId}`)
    const data = Array.isArray(response.data) ? response.data : (response.data.data || [])
    return data as OrdenBackend[]
  }

  async getOrden(id: number): Promise<OrdenBackend> {
    const response = await api.get<any>(`/v1/ordenes/${id}`)
    const data = response.data?.data ?? response.data
    return data as OrdenBackend
  }

  async updateOrdenEstado(ordenId: number, estado: string, motivo?: string, notificarCliente = true): Promise<OrdenBackend> {
    const response = await api.patch<any>(`/v1/ordenes/${ordenId}/status`, {
      estado,
      motivo,
      notificar_cliente: notificarCliente,
    })
    const data = response.data?.data ?? response.data
    return data as OrdenBackend
  }

  async getTracking(ordenId: number): Promise<OrdenTrackingSnapshot | null> {
    const response = await api.get<any>(`/v1/ordenes/${ordenId}/tracking`)
    const data = response.data?.data ?? response.data
    return (data ?? null) as OrdenTrackingSnapshot | null
  }

  async updateTracking(ordenId: number, payload: OrdenTrackingUpdatePayload): Promise<OrdenTrackingSnapshot> {
    const response = await api.post<any>(`/v1/ordenes/${ordenId}/tracking`, payload)
    const data = response.data?.data ?? response.data
    return data as OrdenTrackingSnapshot
  }

  streamTracking(ordenId: number): EventSource {
    // Usa el proxy local "/api" configurado en Axios
    const base = `/api/v1/ordenes/${ordenId}/tracking/stream`
    // Enviar token por query para autenticar SSE cuando los headers no están disponibles
    let url = base
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token')
      if (token) {
        const qp = `token=${encodeURIComponent(token)}`
        url = `${base}?${qp}`
      }
    }
    // No dependemos de cookies; el token en query permite la autorización
    const es = new EventSource(url)
    return es
  }
}

export const ordenesService = new OrdenesService()