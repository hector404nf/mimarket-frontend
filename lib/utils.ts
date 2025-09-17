import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea un precio según las normas paraguayas
 * Usa punto (.) como separador de miles
 * @param precio - El precio a formatear
 * @returns El precio formateado con el símbolo ₲
 */
export function formatearPrecioParaguayo(precio: number): string {
  // Convertir a string y agregar puntos como separadores de miles
  const precioFormateado = precio.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `₲${precioFormateado}`
}
