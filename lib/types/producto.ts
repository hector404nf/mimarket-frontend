// Interfaz que coincide con el backend
export interface ProductoBackend {
  id_producto: number;
  id_tienda: number;
  user_id: number;
  id_categoria: number;
  nombre: string;
  slug: string;
  descripcion: string;
  precio: number;
  precio_oferta?: number;
  stock: number;
  sku: string;
  peso?: number;
  dimensiones?: string;
  // Campo real en BD/API
  tipo_vendedor?: 'directa' | 'pedido' | 'delivery';
  imagen_principal: string;
  imagen_principal_thumb?: string;
  imagen_principal_media_id?: number;
  imagenes_adicionales: Array<{
    id: number;
    url: string;
    thumb_url: string;
    preview_url: string;
    name: string;
    file_name: string;
    size: number;
  }>;
  activo: boolean;
  destacado: boolean;
  calificacion_promedio: number;
  total_ventas: number;
  fecha_creacion: string;
  fecha_actualizacion: string;
  // Relaciones
  tienda?: {
    id_tienda: number;
    nombre_tienda: string;
    descripcion?: string;
    logo?: string;
    calificacion_promedio: number;
  };
  categoria?: {
    id_categoria: number;
    nombre: string;
    descripcion?: string;
  };
}

// Interfaz para el frontend (mantener compatibilidad)
export interface Producto {
  id: number;
  id_producto: number; // Agregar para compatibilidad con backend
  nombre: string;
  descripcion: string;
  precio: number;
  descuento?: number;
  categoria: string;
  marca?: string;
  imagen?: string; // Mantener para compatibilidad
  imagenes: string[];
  // Medios de galería con IDs para edición/borrado
  galeriaMedia?: Array<{ id: number; url: string; thumb_url?: string; preview_url?: string }>;
  // ID de la imagen principal para poder eliminarla
  imagenPrincipalMediaId?: number;
  tipoVenta?: "directa" | "pedido" | "delivery";
  stock: number;
  tiempoEntrega?: string;
  tiendaId: number;
  rating: number;
  reviews?: number;
  tags?: string[];
  // Campos adicionales del backend
  slug?: string;
  precio_oferta?: number;
  sku?: string;
  peso?: number;
  dimensiones?: string;
  activo?: boolean;
  destacado?: boolean;
  total_ventas?: number;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

// Función para convertir de backend a frontend
export function mapProductoBackendToFrontend(producto: ProductoBackend): Producto {
  // Extraer URLs de las imágenes adicionales
  const imagenesAdicionales = producto.imagenes_adicionales?.map(img => img.url) || [];
  
  return {
    id: producto.id_producto,
    id_producto: producto.id_producto, // Mantener para compatibilidad
    nombre: producto.nombre,
    descripcion: producto.descripcion,
    precio: producto.precio,
    descuento: producto.precio_oferta ? 
      Math.round(((producto.precio - producto.precio_oferta) / producto.precio) * 100) : 0,
    categoria: producto.categoria?.nombre || '',
    marca: producto.tienda?.nombre_tienda || '',
    imagen: producto.imagen_principal,
    imagenes: [producto.imagen_principal, ...imagenesAdicionales],
    galeriaMedia: producto.imagenes_adicionales?.map(img => ({ id: img.id, url: img.url, thumb_url: img.thumb_url, preview_url: img.preview_url })) || [],
    imagenPrincipalMediaId: producto.imagen_principal_media_id,
    tipoVenta: producto.tipo_vendedor ?? "directa",
    stock: producto.stock,
    tiempoEntrega: "2-3 días", // Sin campo dedicado; mantener por defecto
    tiendaId: producto.id_tienda,
    rating: producto.calificacion_promedio,
    reviews: producto.total_ventas,
    tags: [],
    // Campos adicionales
    slug: producto.slug,
    precio_oferta: producto.precio_oferta,
    sku: producto.sku,
    peso: producto.peso,
    dimensiones: producto.dimensiones,
    activo: producto.activo,
    destacado: producto.destacado,
    total_ventas: producto.total_ventas,
    fecha_creacion: producto.fecha_creacion,
    fecha_actualizacion: producto.fecha_actualizacion,
  };
}

// Función para convertir de frontend a backend
export function mapProductoFrontendToBackend(producto: Producto): Omit<ProductoBackend, 'id_producto' | 'fecha_creacion' | 'fecha_actualizacion'> {
  // Convertir URLs de imágenes adicionales a objetos (simplificado para crear/actualizar)
  const imagenesAdicionales = Array.isArray(producto.imagenes)
    ? producto.imagenes.slice(1).map((url, index) => ({
      id: 0, // Se asignará en el backend
      url: url,
      thumb_url: url, // Por defecto, el backend generará las miniaturas
      preview_url: url,
      name: `imagen-${index + 1}`,
      file_name: `imagen-${index + 1}.jpg`,
      size: 0
    }))
    : [];

  return {
    id_tienda: producto.tiendaId,
    user_id: 1, // Por defecto, debería venir del contexto de auth
    id_categoria: 1, // Por defecto, debería mapearse desde categoria
    nombre: producto.nombre,
    slug: producto.slug || '',
    descripcion: producto.descripcion,
    precio: producto.precio,
    precio_oferta: producto.precio_oferta,
    stock: producto.stock,
    sku: producto.sku || '',
    peso: producto.peso,
    dimensiones: producto.dimensiones,
    imagen_principal: producto.imagen ?? (Array.isArray(producto.imagenes) ? producto.imagenes[0] : ''),
    imagen_principal_thumb: undefined,
    imagenes_adicionales: imagenesAdicionales,
    activo: producto.activo ?? true,
    destacado: producto.destacado ?? false,
    calificacion_promedio: producto.rating,
    total_ventas: producto.total_ventas || 0,
  };
}