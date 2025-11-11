import { api } from '../axios'

export interface CategoriaBackend {
  id_categoria: number
  nombre: string
  slug?: string
  descripcion?: string
  icono?: string
  icono_url?: string
  icono_thumb_url?: string
  activo?: boolean
  orden?: number
  productos_count?: number
}

export interface Categoria {
  id: number
  id_categoria: number
  nombre: string
  slug?: string
  descripcion?: string
  icono_url?: string
}

export function mapCategoriaBackendToFrontend(c: CategoriaBackend): Categoria {
  return {
    id: c.id_categoria,
    id_categoria: c.id_categoria,
    nombre: c.nombre,
    slug: c.slug,
    descripcion: c.descripcion,
    icono_url: c.icono_thumb_url || c.icono_url,
  }
}

class CategoriasService {
  async getCategorias(): Promise<Categoria[]> {
    const response = await api.get<{ data: CategoriaBackend[] }>('/v1/categorias')
    return (response.data?.data || []).map(mapCategoriaBackendToFrontend)
  }
}

export const categoriasService = new CategoriasService()