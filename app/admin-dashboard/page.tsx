'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  Calendar,
  Download
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import axios from '@/lib/axios'

interface EstadisticasGenerales {
  comisiones: {
    total: number
    pendientes: number
    liquidadas: number
    porcentaje_liquidadas: number
  }
  liquidaciones: {
    total: number
    pendientes: number
    procesadas: number
    pagadas: number
  }
  tiendas: {
    total: number
    activas: number
    porcentaje_activas: number
  }
  ordenes: {
    total: number
    con_comisiones: number
    porcentaje_procesadas: number
  }
}

interface GananciasPeriodo {
  periodo: string
  fecha_inicio: string
  fecha_fin: string
  ganancias_por_dia: Array<{
    fecha: string
    total_comisiones: number
    cantidad_comisiones: number
  }>
  top_tiendas: Array<{
    nombre_tienda: string
    id_tienda: number
    total_comisiones: number
    cantidad_comisiones: number
  }>
  resumen: {
    total_comisiones: number
    cantidad_comisiones: number
    promedio_diario: number
  }
}

interface LiquidacionPendiente {
  id_liquidacion: number
  id_tienda: number
  monto_total: number
  cantidad_comisiones: number
  created_at: string
  tienda: {
    nombre_tienda: string
  }
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [estadisticas, setEstadisticas] = useState<EstadisticasGenerales | null>(null)
  const [ganancias, setGanancias] = useState<GananciasPeriodo | null>(null)
  const [liquidacionesPendientes, setLiquidacionesPendientes] = useState<LiquidacionPendiente[]>([])
  const [periodo, setPeriodo] = useState('mes')

  useEffect(() => {
    if (!user || user.tipo_usuario !== 'administrador') {
      router.push('/login')
      return
    }
    
    cargarDatos()
  }, [user, router])

  useEffect(() => {
    if (periodo) {
      cargarGanancias()
    }
  }, [periodo])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      
      const [estadisticasRes, liquidacionesRes] = await Promise.all([
        axios.get('/api/v1/admin/dashboard/estadisticas'),
        axios.get('/api/v1/admin/dashboard/liquidaciones-pendientes')
      ])

      setEstadisticas(estadisticasRes.data.data)
      setLiquidacionesPendientes(liquidacionesRes.data.data.liquidaciones)
      
      await cargarGanancias()
    } catch (error) {
      console.error('Error al cargar datos:', error)
      toast.error('Error al cargar los datos del dashboard')
    } finally {
      setLoading(false)
    }
  }

  const cargarGanancias = async () => {
    try {
      const response = await axios.get(`/api/v1/admin/dashboard/ganancias?periodo=${periodo}`)
      setGanancias(response.data.data)
    } catch (error) {
      console.error('Error al cargar ganancias:', error)
      toast.error('Error al cargar las ganancias')
    }
  }

  const formatearMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(monto)
  }

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!estadisticas) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar datos</h2>
          <p className="text-gray-600 mb-4">No se pudieron cargar las estadísticas del dashboard</p>
          <Button onClick={cargarDatos}>Reintentar</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard de Administración</h1>
        <p className="text-gray-600">Gestiona las comisiones y liquidaciones de la plataforma</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="earnings">Ganancias</TabsTrigger>
          <TabsTrigger value="liquidations">Liquidaciones</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Tarjetas de estadísticas principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Comisiones</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatearMoneda(estadisticas.comisiones.total)}</div>
                <p className="text-xs text-muted-foreground">
                  {estadisticas.comisiones.porcentaje_liquidadas.toFixed(1)}% liquidadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tiendas Activas</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estadisticas.tiendas.activas}</div>
                <p className="text-xs text-muted-foreground">
                  de {estadisticas.tiendas.total} tiendas totales
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Órdenes Procesadas</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estadisticas.ordenes.con_comisiones}</div>
                <p className="text-xs text-muted-foreground">
                  {estadisticas.ordenes.porcentaje_procesadas.toFixed(1)}% del total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Liquidaciones Pendientes</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estadisticas.liquidaciones.pendientes}</div>
                <p className="text-xs text-muted-foreground">
                  de {estadisticas.liquidaciones.total} totales
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Estado de comisiones y liquidaciones */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Estado de Comisiones</CardTitle>
                <CardDescription>Distribución actual de comisiones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pendientes</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{formatearMoneda(estadisticas.comisiones.pendientes)}</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Liquidadas</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{formatearMoneda(estadisticas.comisiones.liquidadas)}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estado de Liquidaciones</CardTitle>
                <CardDescription>Progreso de liquidaciones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pendientes</span>
                  <Badge variant="outline">{estadisticas.liquidaciones.pendientes}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Procesadas</span>
                  <Badge variant="secondary">{estadisticas.liquidaciones.procesadas}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pagadas</span>
                  <Badge variant="default">{estadisticas.liquidaciones.pagadas}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="earnings" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Análisis de Ganancias</h2>
            <div className="flex items-center gap-4">
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semana">Semana</SelectItem>
                  <SelectItem value="mes">Mes</SelectItem>
                  <SelectItem value="año">Año</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          {ganancias && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Total del Período</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatearMoneda(ganancias.resumen.total_comisiones)}</div>
                    <p className="text-xs text-muted-foreground">
                      {ganancias.resumen.cantidad_comisiones} comisiones
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Promedio Diario</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatearMoneda(ganancias.resumen.promedio_diario)}</div>
                    <p className="text-xs text-muted-foreground">
                      {formatearFecha(ganancias.fecha_inicio)} - {formatearFecha(ganancias.fecha_fin)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Top Tienda</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {ganancias.top_tiendas.length > 0 ? (
                      <>
                        <div className="text-lg font-bold">{ganancias.top_tiendas[0].nombre_tienda}</div>
                        <p className="text-xs text-muted-foreground">
                          {formatearMoneda(ganancias.top_tiendas[0].total_comisiones)}
                        </p>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">Sin datos</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Top Tiendas por Comisiones</CardTitle>
                  <CardDescription>Las tiendas que más comisiones han generado en el período</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {ganancias.top_tiendas.slice(0, 5).map((tienda, index) => (
                      <div key={tienda.id_tienda} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">{tienda.nombre_tienda}</p>
                            <p className="text-sm text-muted-foreground">{tienda.cantidad_comisiones} comisiones</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatearMoneda(tienda.total_comisiones)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="liquidations" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Liquidaciones Pendientes</h2>
            <Button onClick={cargarDatos}>
              Actualizar
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Liquidaciones por Procesar</CardTitle>
              <CardDescription>
                {liquidacionesPendientes.length} liquidaciones esperando procesamiento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {liquidacionesPendientes.length > 0 ? (
                <div className="space-y-4">
                  {liquidacionesPendientes.map((liquidacion) => (
                    <div key={liquidacion.id_liquidacion} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{liquidacion.tienda.nombre_tienda}</p>
                        <p className="text-sm text-muted-foreground">
                          {liquidacion.cantidad_comisiones} comisiones • Creada el {formatearFecha(liquidacion.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{formatearMoneda(liquidacion.monto_total)}</p>
                        <Badge variant="outline">Pendiente</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">¡Todo al día!</h3>
                  <p className="text-muted-foreground">No hay liquidaciones pendientes por procesar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <h2 className="text-2xl font-bold">Métricas de Rendimiento</h2>
          <div className="text-center py-8">
            <BarChart3 className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Próximamente</h3>
            <p className="text-muted-foreground">Las métricas detalladas estarán disponibles pronto</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}