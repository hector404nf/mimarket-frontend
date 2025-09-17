export interface Review {
  id: number
  userId: string
  userName: string
  userAvatar: string
  rating: number
  comment: string
  date: string
  productId?: number
  storeId?: number
  helpful: number
  verified: boolean
}

export const reviews: Review[] = [
  // Reseñas de productos
  {
    id: 1,
    userId: "user1",
    userName: "María González",
    userAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop",
    rating: 5,
    comment: "Excelente smartphone, la cámara es increíble y la batería dura todo el día. Muy recomendado.",
    date: "2024-01-15",
    productId: 1,
    helpful: 12,
    verified: true,
  },
  {
    id: 2,
    userId: "user2",
    userName: "Carlos Ruiz",
    userAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop",
    rating: 4,
    comment: "Buen producto, aunque el precio es un poco alto. La calidad es excelente.",
    date: "2024-01-10",
    productId: 1,
    helpful: 8,
    verified: true,
  },
  {
    id: 3,
    userId: "user3",
    userName: "Ana López",
    userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop",
    rating: 5,
    comment: "Las zapatillas son súper cómodas, perfectas para correr. El diseño también es muy bonito.",
    date: "2024-01-12",
    productId: 3,
    helpful: 15,
    verified: true,
  },
  {
    id: 4,
    userId: "user4",
    userName: "Pedro Martín",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop",
    rating: 4,
    comment: "La pizza estaba deliciosa, ingredientes frescos y masa perfecta. Llegó caliente.",
    date: "2024-01-14",
    productId: 13,
    helpful: 6,
    verified: true,
  },
  // Reseñas de tiendas
  {
    id: 5,
    userId: "user5",
    userName: "Laura Fernández",
    userAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=50&h=50&fit=crop",
    rating: 5,
    comment: "Excelente atención al cliente, productos de calidad y envío rápido. Muy recomendable.",
    date: "2024-01-13",
    storeId: 1,
    helpful: 20,
    verified: true,
  },
  {
    id: 6,
    userId: "user6",
    userName: "Roberto Silva",
    userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop",
    rating: 4,
    comment: "Buena variedad de productos deportivos, precios competitivos. El local es amplio y bien organizado.",
    date: "2024-01-11",
    storeId: 4,
    helpful: 10,
    verified: true,
  },
]
