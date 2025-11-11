import { api } from '../axios'

export interface ClienteResumenBackend {
  id: number
  nombre: string
  email: string
  telefono?: string
  avatar?: string
  fechaRegistro: string
  totalPedidos: number
  totalGastado: number
  ultimoPedido: string
  estado: string
  direccion?: string
}

class ClientesService {
  async getClientesByTienda(tiendaId: number): Promise<ClienteResumenBackend[]> {
    const response = await api.get<any>(`/v1/clientes/tienda/${tiendaId}`)
    const payload = response.data
    // Normalizar: el backend puede devolver array directo o { data: [] }
    const list: ClienteResumenBackend[] = Array.isArray(payload)
      ? payload
      : (payload?.data ?? [])
    return list
  }
}

export const clientesService = new ClientesService()