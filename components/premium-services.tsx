"use client"

import { useState } from "react"
import { Shield, Clock, Gift, Truck, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { formatearPrecioParaguayo } from "@/lib/utils"

interface PremiumService {
  id: string
  name: string
  description: string
  price: number
  icon: React.ComponentType<{ className?: string }>
  category: 'protection' | 'delivery' | 'gift'
  popular?: boolean
}

interface PremiumServicesProps {
  selectedServices: string[]
  onServiceToggle: (serviceId: string, price: number) => void
  cartTotal: number
}

const PREMIUM_SERVICES: PremiumService[] = [
  {
    id: 'extended-warranty',
    name: 'Garantía Extendida',
    description: 'Extiende la garantía de tus productos por 12 meses adicionales',
    price: 25000,
    icon: Shield,
    category: 'protection',
    popular: true
  },
  {
    id: 'express-delivery',
    name: 'Entrega Express',
    description: 'Recibe tu pedido en 24 horas o menos',
    price: 35000,
    icon: Clock,
    category: 'delivery',
    popular: true
  },
  {
    id: 'premium-packaging',
    name: 'Empaque Premium',
    description: 'Empaque especial con caja de regalo y tarjeta personalizada',
    price: 15000,
    icon: Gift,
    category: 'gift'
  },
  {
    id: 'white-glove-delivery',
    name: 'Entrega Premium',
    description: 'Instalación y configuración incluida en tu domicilio',
    price: 50000,
    icon: Truck,
    category: 'delivery'
  },
  {
    id: 'damage-protection',
    name: 'Protección contra Daños',
    description: 'Cobertura completa contra daños accidentales por 6 meses',
    price: 20000,
    icon: Shield,
    category: 'protection'
  }
]

export default function PremiumServices({ selectedServices, onServiceToggle, cartTotal }: PremiumServicesProps) {
  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'protection':
        return 'Protección y Garantías'
      case 'delivery':
        return 'Opciones de Entrega'
      case 'gift':
        return 'Servicios de Regalo'
      default:
        return 'Otros Servicios'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'protection':
        return Shield
      case 'delivery':
        return Truck
      case 'gift':
        return Gift
      default:
        return CheckCircle
    }
  }

  const groupedServices = PREMIUM_SERVICES.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = []
    }
    acc[service.category].push(service)
    return acc
  }, {} as Record<string, PremiumService[]>)

  const totalServicesPrice = selectedServices.reduce((total, serviceId) => {
    const service = PREMIUM_SERVICES.find(s => s.id === serviceId)
    return total + (service?.price || 0)
  }, 0)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-blue-600" />
          Servicios Premium
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Mejora tu experiencia de compra con nuestros servicios adicionales
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groupedServices).map(([category, services]) => {
          const CategoryIcon = getCategoryIcon(category)
          
          return (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-2">
                <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium text-sm">{getCategoryTitle(category)}</h4>
              </div>
              
              <div className="space-y-2">
                {services.map((service) => {
                  const isSelected = selectedServices.includes(service.id)
                  const ServiceIcon = service.icon
                  
                  return (
                    <div
                      key={service.id}
                      className={`relative p-3 border rounded-lg transition-all cursor-pointer hover:border-blue-300 ${
                        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                      onClick={() => onServiceToggle(service.id, service.price)}
                    >
                      {service.popular && (
                        <Badge 
                          variant="secondary" 
                          className="absolute -top-2 -right-2 bg-orange-100 text-orange-800 text-xs"
                        >
                          Popular
                        </Badge>
                      )}
                      
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => onServiceToggle(service.id, service.price)}
                          className="mt-1"
                        />
                        
                        <ServiceIcon className={`h-5 w-5 mt-0.5 ${
                          isSelected ? 'text-blue-600' : 'text-muted-foreground'
                        }`} />
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-sm">{service.name}</h5>
                            <span className="font-semibold text-sm">
                              {formatearPrecioParaguayo(service.price)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {service.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
        
        {selectedServices.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="font-medium text-sm">Total servicios premium:</span>
              <span className="font-semibold text-blue-600">
                {formatearPrecioParaguayo(totalServicesPrice)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedServices.length} servicio{selectedServices.length !== 1 ? 's' : ''} seleccionado{selectedServices.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}