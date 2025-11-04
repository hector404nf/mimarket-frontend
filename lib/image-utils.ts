/**
 * Utilidades para el manejo de imágenes de productos
 */

export interface ProductoConImagenes {
  imagen_principal?: string
  imagenes_adicionales?: Array<{ 
    id?: number
    url: string
    thumb_url?: string
    preview_url?: string
    name?: string
    file_name?: string
    size?: number
    alt_text?: string 
  }>
  // También soportar el formato del tipo Producto
  imagen?: string
  imagenes?: string[]
}

/**
 * Obtiene todas las imágenes de un producto (principal + adicionales)
 */
export function getImagenesProducto(producto: any): string[] {
  console.log('=== getImagenesProducto INICIO ===')
  console.log('Producto recibido:', producto)
  
  if (!producto) {
    console.log('Producto es null/undefined, retornando array vacío')
    return [];
  }
  
  const imagenes: string[] = [];
  
  // Agregar imagen principal si existe
  console.log('Verificando imagen principal...')
  console.log('producto.imagen_principal:', producto.imagen_principal)
  console.log('producto.imagen:', producto.imagen)
  
  if (producto.imagen_principal) {
    imagenes.push(producto.imagen_principal);
    console.log('Imagen principal agregada:', producto.imagen_principal)
  } else if (producto.imagen) {
    imagenes.push(producto.imagen);
    console.log('Imagen (fallback) agregada:', producto.imagen)
  }
  
  // Agregar imágenes adicionales si existen
  console.log('Verificando imágenes adicionales...')
  console.log('producto.imagenes_adicionales:', producto.imagenes_adicionales)
  console.log('Es array?', Array.isArray(producto.imagenes_adicionales))
  
  if (producto.imagenes_adicionales && Array.isArray(producto.imagenes_adicionales)) {
    console.log('Procesando', producto.imagenes_adicionales.length, 'imágenes adicionales')
    
    producto.imagenes_adicionales.forEach((imagen: any, index: number) => {
      console.log(`Procesando imagen ${index}:`, imagen)
      console.log(`Tipo:`, typeof imagen)
      
      if (typeof imagen === 'string') {
        imagenes.push(imagen);
        console.log(`Imagen ${index} agregada como string:`, imagen)
      } else if (imagen && typeof imagen === 'object' && imagen.url) {
        imagenes.push(imagen.url);
        console.log(`Imagen ${index} agregada desde objeto.url:`, imagen.url)
      } else {
        console.log(`Imagen ${index} no válida:`, imagen)
      }
    });
  } else {
    console.log('No hay imágenes adicionales válidas')
  }
  
  // Verificar también el array imagenes del frontend
  console.log('Verificando producto.imagenes (frontend)...')
  console.log('producto.imagenes:', producto.imagenes)
  
  if (producto.imagenes && Array.isArray(producto.imagenes) && producto.imagenes.length > 1) {
    console.log('Usando imagenes del frontend, longitud:', producto.imagenes.length)
    // Si ya tenemos imágenes del mapeo del frontend, usarlas
    const imagenesFromFrontend = producto.imagenes.filter((img: string) => img && img.trim() !== '')
    if (imagenesFromFrontend.length > imagenes.length) {
      console.log('Usando imagenes del frontend en lugar de las calculadas')
      return imagenesFromFrontend
    }
  }
  
  // Si no hay imágenes, usar placeholder
  if (imagenes.length === 0) {
    imagenes.push('/placeholder-product.jpg');
    console.log('No hay imágenes, usando placeholder')
  }
  
  console.log('=== getImagenesProducto RESULTADO ===')
  console.log('Imágenes finales:', imagenes)
  console.log('Total:', imagenes.length)
  console.log('=== getImagenesProducto FIN ===')
  
  return imagenes;
}

/**
 * Obtiene la imagen principal de un producto
 */
export function getImagenPrincipalProducto(producto: ProductoConImagenes): string {
  return producto.imagen_principal || producto.imagen || "/placeholder.svg"
}

/**
 * Obtiene una imagen específica por índice
 */
export function getImagenPorIndice(producto: ProductoConImagenes, indice: number): string {
  const imagenes = getImagenesProducto(producto)
  return imagenes[indice] || "/placeholder.svg"
}