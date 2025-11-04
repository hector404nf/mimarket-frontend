import React from "react"
import {
  Smartphone,
  Shirt,
  Footprints,
  Home,
  Sparkles,
  Dumbbell,
  BookOpen,
  Gamepad2,
  LucideIcon
} from "lucide-react"

// Mapeo de categorías a iconos de Lucide React
export const categoryIcons: Record<string, LucideIcon> = {
  // Por slug
  "electronicos": Smartphone,
  "ropa": Shirt,
  "calzado": Footprints,
  "hogar": Home,
  "belleza": Sparkles,
  "deportes": Dumbbell,
  "libros": BookOpen,
  "juguetes": Gamepad2,
  
  // Por nombre (fallback)
  "Electrónicos": Smartphone,
  "Ropa": Shirt,
  "Calzado": Footprints,
  "Hogar": Home,
  "Belleza": Sparkles,
  "Deportes": Dumbbell,
  "Libros": BookOpen,
  "Juguetes": Gamepad2,
}

// Función para obtener el icono de una categoría
export const getCategoryIcon = (categorySlug: string, categoryName?: string): LucideIcon => {
  // Primero buscar por slug
  let icon = categoryIcons[categorySlug]
  
  // Si no encuentra por slug, buscar por nombre
  if (!icon && categoryName) {
    icon = categoryIcons[categoryName]
  }
  
  // Fallback por defecto
  return icon || Home
}

// Función para renderizar el icono de una categoría
export const CategoryIcon: React.FC<{
  categorySlug: string
  categoryName?: string
  className?: string
  [key: string]: any
}> = ({ 
  categorySlug, 
  categoryName, 
  className = "h-5 w-5",
  ...props 
}) => {
  const IconComponent = getCategoryIcon(categorySlug, categoryName)
  return <IconComponent className={className} {...props} />
}

// Lista de todas las categorías con sus iconos (para uso en componentes)
export const categoriesWithIcons = [
  { slug: "electronicos", name: "Electrónicos", icon: Smartphone },
  { slug: "ropa", name: "Ropa", icon: Shirt },
  { slug: "calzado", name: "Calzado", icon: Footprints },
  { slug: "hogar", name: "Hogar", icon: Home },
  { slug: "belleza", name: "Belleza", icon: Sparkles },
  { slug: "deportes", name: "Deportes", icon: Dumbbell },
  { slug: "libros", name: "Libros", icon: BookOpen },
  { slug: "juguetes", name: "Juguetes", icon: Gamepad2 },
]