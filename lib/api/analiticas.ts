import { api } from '../axios'

export interface AnaliticasRango {
  fecha_inicio: string
  fecha_fin: string
}

export interface AnaliticasOrdenesEstado {
  pendiente: number
  procesando: number
  enviado: number
  entregado: number
  cancelado: number
}

export interface AnaliticasOrdenes {
  total: number
  por_estado: AnaliticasOrdenesEstado
  ingresos_tienda: number
  tiempo_promedio_entrega_horas: number
}

export interface AnaliticasConversion {
  usuarios_con_carrito: number
  usuarios_con_orden: number
  usuarios_convierten: number
  tasa_conversion_por_usuario: number
}

export interface AnaliticasSatisfaccion {
  total_resenas: number
  promedio_calificacion: number
}

export interface AnaliticasTopProducto {
  id_producto: number
  cantidad_total: number
  monto_total: number
}

export interface AnaliticasTienda {
  rango: AnaliticasRango
  ordenes: AnaliticasOrdenes
  conversion: AnaliticasConversion
  satisfaccion: AnaliticasSatisfaccion
  top_productos: AnaliticasTopProducto[]
}

class AnaliticasService {
  async getAnaliticasTienda(
    tiendaId: number,
    params?: { fecha_inicio?: string; fecha_fin?: string }
  ): Promise<AnaliticasTienda> {
    const response = await api.get<any>(`/v1/analiticas/tienda/${tiendaId}`, { params })
    const payload = response.data
    const data: AnaliticasTienda = (payload?.data ?? payload) as AnaliticasTienda
    return data
  }
}

export const analiticasService = new AnaliticasService()