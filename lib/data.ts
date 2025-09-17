export interface Producto {
  id: number
  nombre: string
  descripcion: string
  precio: number
  descuento: number
  categoria: string
  marca: string
  imagen?: string // Mantener para compatibilidad
  imagenes: string[] // Nueva propiedad para múltiples imágenes
  tipoVenta: "directa" | "pedido" | "delivery"
  stock: number
  tiempoEntrega: string
  tiendaId: number
  rating: number
  reviews: number
  tags: string[]
}

export const productos: Producto[] = [
  {
    id: 1,
    nombre: "Smartphone Samsung Galaxy A54",
    descripcion:
      "Teléfono inteligente con cámara de 50MP, pantalla AMOLED de 6.4 pulgadas y batería de larga duración.",
    precio: 2199000,
    descuento: 15,
    categoria: "Electrónicos",
    marca: "Samsung",
    imagen: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    imagenes: [
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1580910051074-3eb694886505?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1556656793-08538906a9f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    ],
    tipoVenta: "directa",
    stock: 25,
    tiempoEntrega: "Inmediato",
    tiendaId: 1,
    rating: 4.5,
    reviews: 128,
    tags: ["smartphone", "android", "cámara", "5g"],
  },
  {
    id: 2,
    nombre: "Laptop HP Pavilion 15",
    descripcion: "Laptop con procesador Intel Core i5, 8GB RAM, 256GB SSD, perfecta para trabajo y estudio.",
    precio: 4799000,
    descuento: 10,
    categoria: "Electrónicos",
    marca: "HP",
    imagen: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    imagenes: [
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1484788984921-03950022c9ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    ],
    tipoVenta: "directa",
    stock: 12,
    tiempoEntrega: "Inmediato",
    tiendaId: 1,
    rating: 4.3,
    reviews: 89,
    tags: ["laptop", "intel", "ssd", "trabajo"],
  },
  {
    id: 3,
    nombre: "Auriculares Sony WH-1000XM4",
    descripcion: "Auriculares inalámbricos con cancelación de ruido activa y hasta 30 horas de batería.",
    precio: 1499000,
    descuento: 20,
    categoria: "Electrónicos",
    marca: "Sony",
    imagen: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    imagenes: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    ],
    tipoVenta: "delivery",
    stock: 0,
    tiempoEntrega: "2-3 días",
    tiendaId: 2,
    rating: 4.8,
    reviews: 256,
    tags: ["auriculares", "inalámbrico", "cancelación ruido", "sony"],
  },
  {
    id: 4,
    nombre: "Camiseta Polo Ralph Lauren",
    descripcion: "Camiseta polo clásica de algodón 100%, disponible en varios colores y tallas.",
    precio: 650000,
    descuento: 0,
    categoria: "Ropa",
    marca: "Ralph Lauren",
    imagen: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    imagenes: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1503341504253-dff4815485f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    ],
    tipoVenta: "directa",
    stock: 45,
    tiempoEntrega: "Inmediato",
    tiendaId: 3,
    rating: 4.2,
    reviews: 67,
    tags: ["polo", "algodón", "clásico", "casual"],
  },
  {
    id: 5,
    nombre: "Zapatillas Nike Air Max 270",
    descripcion: "Zapatillas deportivas con tecnología Air Max para máxima comodidad y estilo urbano.",
    precio: 950000,
    descuento: 25,
    categoria: "Calzado",
    marca: "Nike",
    imagen: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    imagenes: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    ],
    tipoVenta: "pedido",
    stock: 8,
    tiempoEntrega: "5-7 días",
    tiendaId: 1,
    rating: 4.6,
    reviews: 194,
    tags: ["zapatillas", "deportivo", "air max", "urbano"],
  },
  {
    id: 6,
    nombre: "Cafetera Nespresso Vertuo",
    descripcion: "Cafetera de cápsulas con tecnología Centrifusion para el café perfecto.",
    precio: 1299000,
    descuento: 15,
    categoria: "Hogar",
    marca: "Nespresso",
    imagen: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    imagenes: [
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    ],
    tipoVenta: "delivery",
    stock: 0,
    tiempoEntrega: "1-2 días",
    tiendaId: 2,
    rating: 4.4,
    reviews: 112,
    tags: ["cafetera", "nespresso", "cápsulas", "automática"],
  },
  {
    id: 7,
    nombre: "Tablet iPad Air 5ta Gen",
    descripcion: "Tablet con chip M1, pantalla Liquid Retina de 10.9 pulgadas y compatibilidad con Apple Pencil.",
    precio: 4399000,
    descuento: 8,
    categoria: "Electrónicos",
    marca: "Apple",
    imagen: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    imagenes: [
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1561154464-82e9adf32764?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1587033411391-5d9e51cce126?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    ],
    tipoVenta: "directa",
    stock: 18,
    tiempoEntrega: "Inmediato",
    tiendaId: 1,
    rating: 4.7,
    reviews: 203,
    tags: ["tablet", "ipad", "apple", "m1", "pencil"],
  },
  {
    id: 8,
    nombre: "Perfume Chanel No. 5",
    descripcion: "Fragancia icónica y atemporal, eau de parfum de 100ml.",
    precio: 1099000,
    descuento: 0,
    categoria: "Belleza",
    marca: "Chanel",
    imagen: "https://images.unsplash.com/photo-1541643600914-78b084683601?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    imagenes: [
      "https://images.unsplash.com/photo-1541643600914-78b084683601?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1594035910387-fea47794261f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1615634260167-c8cdede054de?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    ],
    tipoVenta: "delivery",
    stock: 0,
    tiempoEntrega: "3-5 días",
    tiendaId: 3,
    rating: 4.9,
    reviews: 89,
    tags: ["perfume", "chanel", "clásico", "elegante"],
  },
]

export const categorias = ["Electrónicos", "Ropa", "Calzado", "Hogar", "Belleza", "Deportes", "Libros", "Juguetes"]

export const marcas = ["Samsung", "Apple", "Nike", "Adidas", "Sony", "HP", "Dell", "Zara", "H&M", "Ralph Lauren"]
