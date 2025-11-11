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
  // Filtros adicionales usados desde la URL
  tipoVenta?: 'directa' | 'pedido' | 'delivery';
  tiposVenta?: Array<'directa' | 'pedido' | 'delivery'>;
  precio_min?: number;
  precio_max?: number;
}

class ProductosService {

  async getProductos(filters: ProductoFilters = {}): Promise<ProductoResponse> {
    // Adaptar filtros del frontend al contrato esperado por el backend
    // Backend (ProductoController@index) espera: categoria (id), tienda (id), precio_min, precio_max,
    // buscar (texto), ordenar (nombre|precio|created_at), direccion (asc|desc), per_page
    const params: Record<string, any> = {};

    // Passthrough de filtros compatibles directamente
    if (typeof filters.categoria !== 'undefined') params.categoria = filters.categoria;
    if (typeof filters.tienda !== 'undefined') params.tienda = filters.tienda;
    if (typeof filters.page !== 'undefined') params.page = filters.page;
    if (typeof filters.per_page !== 'undefined') params.per_page = filters.per_page;

    // Rango de precios (si se usan desde la URL)
    if (filters.precio_min !== undefined) params.precio_min = filters.precio_min;
    if (filters.precio_max !== undefined) params.precio_max = filters.precio_max;

    // Tipo de venta: mapear a 'tipo_vendedor' para backend
    if (filters.tiposVenta && Array.isArray(filters.tiposVenta) && filters.tiposVenta.length > 0) {
      params.tipo_vendedor = filters.tiposVenta.join(',');
    } else if (filters.tipoVenta) {
      params.tipo_vendedor = filters.tipoVenta;
    }

    // Buscar: mapear 'search' -> 'buscar' para index
    if (typeof filters.search === 'string' && filters.search.trim() !== '') {
      params.buscar = filters.search.trim();
    }

    // Ordenamiento: mapear sort_by/sort_order -> ordenar/direccion
    if (typeof filters.sort_by !== 'undefined') {
      const mapSortBy = (sb: NonNullable<ProductoFilters['sort_by']>) => {
        switch (sb) {
          case 'nombre':
            return 'nombre';
          case 'precio':
            return 'precio';
          case 'fecha_creacion':
            return 'created_at';
          case 'calificacion_promedio':
            // No soportado explícitamente en index; usar created_at por defecto
            return 'created_at';
          default:
            return 'created_at';
        }
      };
      params.ordenar = mapSortBy(filters.sort_by!);
    }

    if (typeof filters.sort_order !== 'undefined') {
      params.direccion = filters.sort_order;
    }

    const response = await api.get<ProductoBackendResponse>('/v1/productos', { params });

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

  async createProducto(
    producto: Omit<Producto, 'id'>,
    imagenPrincipal?: File,
    imagenesGaleria?: File[],
    idCategoria?: number
  ): Promise<{ data: Producto }> {
    const backendData = mapProductoFrontendToBackend(producto as Producto);
    
    const formData = new FormData();
    
    // Agregar datos del producto (evitar forzar user_id desde frontend)
    Object.entries(backendData).forEach(([key, value]) => {
      // user se toma del token en backend
      if (key === 'user_id') return;
      // No enviar 'stock' como tal; el backend espera 'cantidad_stock'
      if (key === 'stock') return;
      // No enviar imágenes como URL en creación (backend espera archivos)
      if (key === 'imagen_principal' || key === 'imagenes_adicionales') return;
      if (value !== undefined && value !== null) {
        // Convertir booleanos a '1'/'0' para máxima compatibilidad con validación boolean
        if (typeof value === 'boolean') {
          formData.append(key, value ? '1' : '0');
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    // Asegurar id_categoria si se proporcionó explícitamente
    if (typeof idCategoria === 'number') {
      formData.set('id_categoria', idCategoria.toString());
    }
    
    // Mapear stock a la clave real esperada por el backend
    if (typeof producto.stock === 'number') {
      formData.set('cantidad_stock', producto.stock.toString());
    }
    
    // Mapear tipo de vendedor a la clave esperada
    formData.set('tipo_vendedor', (producto.tipoVenta ?? 'directa'));
    
    // Normalizar booleanos explícitamente (opcionales en backend)
    if (typeof producto.activo === 'boolean') {
      formData.set('activo', producto.activo ? '1' : '0');
    }
    if (typeof producto.destacado === 'boolean') {
      formData.set('destacado', producto.destacado ? '1' : '0');
    }
    
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
    reemplazarGaleria?: boolean,
    idCategoria?: number
  ): Promise<{ data: Producto }> {
    const backendData = mapProductoFrontendToBackend(producto as Producto);
    
    const formData = new FormData();
    
    // Agregar datos del producto (evitar forzar user_id desde frontend)
    Object.entries(backendData).forEach(([key, value]) => {
      if (key === 'user_id') return; // user se toma del token en backend
      // No enviar 'stock' como tal; el backend espera 'cantidad_stock'
      if (key === 'stock') return;
      // No enviar id_categoria desde el mapeo; se controla por parámetro explícito
      if (key === 'id_categoria') return;
      // No enviar imágenes como URL en actualización (backend espera archivos)
      if (key === 'imagen_principal' || key === 'imagenes_adicionales') return;
      // No enviar sku si está vacío (evita gatillar validación innecesaria)
      if (key === 'sku' && (value === '' || value === undefined || value === null)) return;
      if (value !== undefined && value !== null) {
        // Convertir booleanos a '1'/'0'
        if (typeof value === 'boolean') {
          formData.append(key, value ? '1' : '0');
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    // Asegurar id_categoria si se proporcionó explícitamente
    if (typeof idCategoria === 'number') {
      formData.set('id_categoria', idCategoria.toString());
    }
    
    // Mapear stock a la clave real esperada por el backend (si viene en parcial)
    if (typeof producto.stock === 'number') {
      formData.set('cantidad_stock', producto.stock.toString());
    }
    
    // Mapear tipo de vendedor si viene en parcial
    if (producto.tipoVenta) {
      formData.set('tipo_vendedor', producto.tipoVenta);
    }
    
    // Normalizar booleanos explícitamente
    if (typeof producto.activo === 'boolean') {
      formData.set('activo', producto.activo ? '1' : '0');
    }
    if (typeof producto.destacado === 'boolean') {
      formData.set('destacado', producto.destacado ? '1' : '0');
    }
    
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
      formData.append('reemplazar_imagen_principal', reemplazarImagenPrincipal ? '1' : '0');
    }
    
    if (reemplazarGaleria !== undefined) {
      formData.append('reemplazar_galeria', reemplazarGaleria ? '1' : '0');
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