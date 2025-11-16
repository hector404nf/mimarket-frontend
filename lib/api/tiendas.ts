import { api, ApiResponse } from '@/lib/axios';

// Tipos aproximados según el backend actual
export interface TiendaBackend {
  id_tienda: number;
  nombre_tienda: string;
  descripcion?: string;
  logo?: string;
  portada?: string;
  banner?: string;
  direccion?: string;
  ciudad?: string;
  telefono_contacto?: string;
  email_contacto?: string;
  calificacion_promedio?: number;
  total_resenas?: number; // algunos backend usan "reseñas" sin tilde
  total_reseñas?: number; // fallback con tilde
  categoria_principal?: string;
  categorias?: Array<{ nombre: string } | string>;
  horarios?: any[];
  fecha_creacion?: string;
  ventas_totales?: number;
  productos_count?: number;
  banco_nombre?: string;
  banco_cuenta?: string;
  banco_titular?: string;
  banco_tipo?: string;
}

// Tipo para el frontend consumido por las páginas de tienda
export interface TiendaFrontend {
  id: number;
  nombre: string;
  descripcion?: string;
  logo?: string;
  imagenPortada?: string;
  direccion?: string;
  ciudad?: string;
  telefono?: string;
  email?: string;
  calificacion?: number;
  totalReseñas?: number;
  categorias: string[];
  horarios: string[];
  fechaRegistro?: string;
  ventasTotales?: number;
  productosCount?: number;
  bancoNombre?: string;
  bancoCuenta?: string;
  bancoTitular?: string;
  bancoTipo?: string;
}

function mapTiendaBackendToFrontend(tienda: TiendaBackend): TiendaFrontend {
  const categoriasArray: string[] = Array.isArray(tienda.categorias)
    ? tienda.categorias.map((c: any) => (typeof c === 'string' ? c : (c?.nombre ?? ''))).filter(Boolean)
    : tienda.categoria_principal ? [tienda.categoria_principal] : []

  const totalReseñas = (tienda.total_reseñas as any) ?? (tienda.total_resenas as any)

  const daysMap: Record<string, string> = {
    domingo: 'Domingo',
    lunes: 'Lunes',
    martes: 'Martes',
    miercoles: 'Miércoles',
    miércoles: 'Miércoles',
    jueves: 'Jueves',
    viernes: 'Viernes',
    sabado: 'Sábado',
    sábado: 'Sábado',
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo',
  }
  const horariosLines: string[] = Array.isArray(tienda.horarios)
    ? (typeof tienda.horarios[0] === 'string'
        ? (tienda.horarios as string[]).filter((s) => typeof s === 'string' && /\S/.test(s))
        : (tienda.horarios as any[])
            .map((h: any) => {
              const key = String(h?.dia_semana || '').toLowerCase()
              const day = daysMap[key] || (h?.dia_semana || '')
              const cerrado = !!h?.cerrado || (!h?.hora_apertura && !h?.hora_cierre)
              if (cerrado) return `${day}: Cerrado`
              const oa = String(h?.hora_apertura || '').slice(0, 5)
              const oc = String(h?.hora_cierre || '').slice(0, 5)
              return `${day}: ${oa} - ${oc}`
            })
            .filter((s: string) => s && /\S/.test(s)))
    : []

  return {
    id: tienda.id_tienda,
    nombre: tienda.nombre_tienda,
    descripcion: tienda.descripcion,
    logo: tienda.logo,
    imagenPortada: tienda.banner || tienda.portada,
    direccion: tienda.direccion,
    ciudad: tienda.ciudad,
    telefono: tienda.telefono_contacto,
    email: tienda.email_contacto,
    calificacion: tienda.calificacion_promedio,
    totalReseñas: typeof totalReseñas === 'number' ? totalReseñas : undefined,
    categorias: categoriasArray,
    horarios: horariosLines,
    fechaRegistro: tienda.fecha_creacion,
    ventasTotales: tienda.ventas_totales,
    productosCount: typeof tienda.productos_count === 'number' ? tienda.productos_count : undefined,
    bancoNombre: tienda.banco_nombre,
    bancoCuenta: tienda.banco_cuenta,
    bancoTitular: tienda.banco_titular,
    bancoTipo: tienda.banco_tipo,
  }
}

class TiendasService {
  async getTiendaById(tiendaId: number): Promise<{ data: TiendaFrontend }> {
    const response = await api.get<ApiResponse<TiendaBackend>>(`/v1/tiendas/${tiendaId}`)
    const backend = response.data.data as TiendaBackend
    return { data: mapTiendaBackendToFrontend(backend) }
  }

  async getTiendas(params: Record<string, any> = {}): Promise<{ data: TiendaFrontend[] }> {
    const response = await api.get<ApiResponse<TiendaBackend[]>>('/v1/tiendas', { params })
    const list = Array.isArray(response.data.data) ? response.data.data : []
    return { data: list.map(mapTiendaBackendToFrontend) }
  }
}

export const tiendasService = new TiendasService()
export { mapTiendaBackendToFrontend }