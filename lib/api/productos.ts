import { Producto, ProductoBackend, mapProductoBackendToFrontend, mapProductoFrontendToBackend } from '@/lib/types/producto';
import { api, ApiResponse } from '../axios';

export interface ProductoResponse {
  data: Producto[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ProductoBackendResponse {
  data: ProductoBackend[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ProductoFilters {
  categoria?: string;
  tienda?: string;
  search?: string;
  sort_by?: 'nombre' | 'precio' | 'fecha_creacion' | 'calificacion_promedio';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

class ProductosService {

  async getProductos(filters: ProductoFilters = {}): Promise<ProductoResponse> {
    const response = await api.get<ProductoBackendResponse>('/v1/productos', { params: filters });
    
    return {
      ...response.data,
      data: response.data.data.map(mapProductoBackendToFrontend),
    };
  }

  async getProducto(id: number): Promise<{ data: Producto }> {
    const response = await api.get<{ data: ProductoBackend }>(`/v1/productos/${id}`);
    
    return {
      data: mapProductoBackendToFrontend(response.data.data),
    };
  }

  async getProductosByCategoria(categoriaId: number, filters: Omit<ProductoFilters, 'categoria'> = {}): Promise<ProductoResponse> {
    const response = await api.get<ProductoBackendResponse>(`/v1/productos/categoria/${categoriaId}`, { params: filters });
    
    return {
      ...response.data,
      data: response.data.data.map(mapProductoBackendToFrontend),
    };
  }

  async getProductosByTienda(tiendaId: number, filters: Omit<ProductoFilters, 'tienda'> = {}): Promise<ProductoResponse> {
    const response = await api.get<ProductoBackendResponse>(`/v1/productos/tienda/${tiendaId}`, { params: filters });
    
    return {
      ...response.data,
      data: response.data.data.map(mapProductoBackendToFrontend),
    };
  }

  async createProducto(producto: Omit<Producto, 'id'>, imagenPrincipal?: File, imagenesGaleria?: File[]): Promise<{ data: Producto }> {
    const backendData = mapProductoFrontendToBackend(producto as Producto);
    
    const formData = new FormData();
    
    // Agregar datos del producto
    Object.entries(backendData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });
    
    // Agregar imagen principal
    if (imagenPrincipal) {
      formData.append('imagen_principal', imagenPrincipal);
    }
    
    // Agregar imágenes de galería
    if (imagenesGaleria && imagenesGaleria.length > 0) {
      imagenesGaleria.forEach((imagen) => {
        formData.append('imagenes_galeria[]', imagen);
      });
    }
    
    const response = await api.upload<{ data: ProductoBackend }>('/v1/productos', formData);
    
    return {
      data: mapProductoBackendToFrontend(response.data.data),
    };
  }

  async updateProducto(
    id: number, 
    producto: Partial<Producto>, 
    imagenPrincipal?: File, 
    imagenesGaleria?: File[],
    reemplazarImagenPrincipal?: boolean,
    reemplazarGaleria?: boolean
  ): Promise<{ data: Producto }> {
    const backendData = mapProductoFrontendToBackend(producto as Producto);
    
    const formData = new FormData();
    
    // Agregar datos del producto
    Object.entries(backendData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });
    
    // Agregar imagen principal
    if (imagenPrincipal) {
      formData.append('imagen_principal', imagenPrincipal);
    }
    
    // Agregar imágenes de galería
    if (imagenesGaleria && imagenesGaleria.length > 0) {
      imagenesGaleria.forEach((imagen) => {
        formData.append('imagenes_galeria[]', imagen);
      });
    }
    
    // Agregar flags de reemplazo
    if (reemplazarImagenPrincipal !== undefined) {
      formData.append('reemplazar_imagen_principal', reemplazarImagenPrincipal.toString());
    }
    
    if (reemplazarGaleria !== undefined) {
      formData.append('reemplazar_galeria', reemplazarGaleria.toString());
    }
    
    // Agregar método PUT para Laravel
    formData.append('_method', 'PUT');
    
    const response = await api.upload<{ data: ProductoBackend }>(`/v1/productos/${id}`, formData);
    
    return {
      data: mapProductoBackendToFrontend(response.data.data),
    };
  }

  async deleteProducto(id: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/v1/productos/${id}`);
    return response.data;
  }

  async deleteProductoImage(id: number, mediaId: number, collection: 'images' | 'gallery'): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/v1/productos/${id}/imagen`, {
      data: {
        media_id: mediaId,
        collection: collection,
      },
    });
    return response.data;
  }
}

export const productosService = new ProductosService();