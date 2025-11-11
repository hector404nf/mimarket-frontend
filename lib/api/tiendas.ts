import { api, ApiResponse } from '@/lib/axios';

// Tipos aproximados según el backend actual
export interface TiendaBackend {
  id_tienda: number;
  nombre_tienda: string;
  descripcion?: string;
  logo?: string;
  portada?: string; // imagen de portada si existe
  direccion?: string;
  ciudad?: string;
  telefono_contacto?: string;
  email_contacto?: string;
  calificacion_promedio?: number;
  total_resenas?: number; // algunos backend usan "reseñas" sin tilde
  total_reseñas?: number; // fallback con tilde
  categoria_principal?: string;
  categorias?: Array<{ nombre: string } | string>;
  horarios?: string[];
  fecha_creacion?: string;
  ventas_totales?: number;
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
}

function mapTiendaBackendToFrontend(tienda: TiendaBackend): TiendaFrontend {
  const categoriasArray: string[] = Array.isArray(tienda.categorias)
    ? tienda.categorias.map((c: any) => (typeof c === 'string' ? c : (c?.nombre ?? ''))).filter(Boolean)
    : tienda.categoria_principal ? [tienda.categoria_principal] : []

  const totalReseñas = (tienda.total_reseñas as any) ?? (tienda.total_resenas as any)

  return {
    id: tienda.id_tienda,
    nombre: tienda.nombre_tienda,
    descripcion: tienda.descripcion,
    logo: tienda.logo,
    imagenPortada: tienda.portada,
    direccion: tienda.direccion,
    ciudad: tienda.ciudad,
    telefono: tienda.telefono_contacto,
    email: tienda.email_contacto,
    calificacion: tienda.calificacion_promedio,
    totalReseñas: typeof totalReseñas === 'number' ? totalReseñas : undefined,
    categorias: categoriasArray,
    horarios: Array.isArray(tienda.horarios) ? tienda.horarios : [],
    fechaRegistro: tienda.fecha_creacion,
    ventasTotales: tienda.ventas_totales,
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