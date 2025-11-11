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
  const entero = Math.round(Number(precio) || 0)
  const formato = new Intl.NumberFormat('es-PY', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(entero)
  return `₲${formato}`
}
