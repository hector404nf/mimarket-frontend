import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { authService } from '@/lib/auth'
import { toast } from '@/components/ui/use-toast'

interface CheckoutData {
  metodo_pago: string
  id_metodo_pago?: number
  direccion_envio?: string
  notas?: string
  codigo_cupon?: string
  latitud?: number
  longitud?: number
}

interface CheckoutTotals {
  subtotal: number
  impuestos: number
  costo_envio: number
  descuento: number
  total: number
  cupon_aplicado?: {
    codigo: string
    descripcion: string
    tipo: string
    valor: number
    descuento_aplicado: number
  }
  items_count: number
}

interface CheckoutResponse {
  message: string
  orden: {
    id_orden: number
    numero_orden: string
    total: number
    estado: string
    created_at: string
    detalles: Array<{
      id_producto: number
      cantidad: number
      precio_unitario: number
      subtotal: number
      producto: {
        nombre: string
        imagen_url?: string
      }
    }>
  }
  resumen: {
    subtotal: number
    impuestos: number
    costo_envio: number
    descuento: number
    total: number
  }
}

export function useCheckout() {
  const [isLoading, setIsLoading] = useState(false)
  const [totals, setTotals] = useState<CheckoutTotals | null>(null)
  const { isAuthenticated } = useAuth()

  // Construir URL dinámica:
  // - Si hay NEXT_PUBLIC_API_URL, añadir "/api" solo si el valor no termina en "/api".
  // - Si no hay, usar el proxy local "/api".
  const buildApiUrl = (path: string) => {
    const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '')
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    const prefix = base ? (base.endsWith('/api') ? base : `${base}/api`) : '/api'
    return `${prefix}${normalizedPath}`
  }

  const calculateTotals = async (codigoCupon?: string): Promise<CheckoutTotals | null> => {
    const token = authService.getToken()
    if (!token || !isAuthenticated) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para continuar",
        variant: "destructive"
      })
      return null
    }

    setIsLoading(true)
    try {
      const response = await fetch(buildApiUrl('/v1/checkout/calculate'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          codigo_cupon: codigoCupon || undefined
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al calcular totales')
      }

      const data: CheckoutTotals = await response.json()
      setTotals(data)
      return data
    } catch (error) {
      console.error('Error calculating totals:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al calcular totales",
        variant: "destructive"
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const processCheckout = async (checkoutData: CheckoutData): Promise<CheckoutResponse | null> => {
    const token = authService.getToken()
    if (!token || !isAuthenticated) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para continuar",
        variant: "destructive"
      })
      return null
    }

    setIsLoading(true)
    try {
      const response = await fetch(buildApiUrl('/v1/checkout/process'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(checkoutData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Manejar errores específicos
        if (response.status === 400 && errorData.producto) {
          toast({
            title: "Stock insuficiente",
            description: `${errorData.message}. Stock disponible: ${errorData.stock_disponible}`,
            variant: "destructive"
          })
        } else {
          throw new Error(errorData.message || 'Error al procesar el pedido')
        }
        return null
      }

      const data: CheckoutResponse = await response.json()
      
      toast({
        title: "¡Pedido realizado con éxito!",
        description: `Tu pedido ${data.orden.numero_orden} ha sido procesado.`
      })

      return data
    } catch (error) {
      console.error('Error processing checkout:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al procesar el pedido",
        variant: "destructive"
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    totals,
    calculateTotals,
    processCheckout
  }
}