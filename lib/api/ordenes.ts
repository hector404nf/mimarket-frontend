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
}

export const ordenesService = new OrdenesService()