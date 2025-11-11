"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { categoriasService, type Categoria } from "@/lib/api/categorias"
import { tiendasService, type TiendaFrontend } from "@/lib/api/tiendas"

export default function ProductFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [precioMin, setPrecioMin] = useState(0)
  const [precioMax, setPrecioMax] = useState(1000)
  const [categorias, setCategorias] = useState<string[]>([])
  // Catálogo dinámico desde BD
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<Categoria[]>([])
  const [tiendasDisponibles, setTiendasDisponibles] = useState<TiendaFrontend[]>([])
  const [tiendaSeleccionadaId, setTiendaSeleccionadaId] = useState<string | null>(null)
  const [tiposVenta, setTiposVenta] = useState<string[]>([])
  const [filtrarPorPrecio, setFiltrarPorPrecio] = useState<boolean>(false)

  // Inicializar filtros desde URL
  useEffect(() => {
    // Categorías (soporte para una o múltiples)
    const categoriaParam = searchParams.get("categoria")
    const categoriasParam = searchParams.get("categorias")
    if (categoriasParam) {
      setCategorias(categoriasParam.split(","))
    } else if (categoriaParam) {
      setCategorias([categoriaParam])
    }

    // Tipos de venta (soporte para uno o múltiples)
    const tipoVentaParam = searchParams.get("tipoVenta")
    const tiposVentaParam = searchParams.get("tiposVenta")
    if (tiposVentaParam) {
      setTiposVenta(tiposVentaParam.split(","))
    } else if (tipoVentaParam) {
      setTiposVenta([tipoVentaParam])
    }

    // Tienda (marca)
    const tiendaParam = searchParams.get("tienda")
    if (tiendaParam) {
      setTiendaSeleccionadaId(tiendaParam)
    }

    // Precios
    const precioMinParam = searchParams.get("precio_min")
    const precioMaxParam = searchParams.get("precio_max")
    if (precioMinParam) {
      setPrecioMin(parseInt(precioMinParam))
    }
    if (precioMaxParam) {
      setPrecioMax(parseInt(precioMaxParam))
    }
    setFiltrarPorPrecio(Boolean(precioMinParam || precioMaxParam))
  }, [searchParams])

  // Cargar categorías y tiendas desde backend (independiente para no ocultar categorías si falla tiendas)
  useEffect(() => {
    (async () => {
      try {
        const cats = await categoriasService.getCategorias()
        setCategoriasDisponibles(cats)
      } catch (e) {
        console.warn('No se pudieron cargar categorías para filtros:', e)
      }

      try {
        const tiendas = await tiendasService.getTiendas({ verificada: true })
        setTiendasDisponibles(tiendas.data)
      } catch (e) {
        console.warn('No se pudieron cargar tiendas para filtros (no afecta categorías):', e)
      }
    })()
  }, [])

  // Aplicar filtros
  const aplicarFiltros = async () => {
    console.log('ProductFilters - Aplicando filtros con categorías:', categorias)
    const params = new URLSearchParams()

    if (categorias.length > 0) {
      params.set("categorias", categorias.join(","))
      console.log('ProductFilters - Parámetro categorias generado:', categorias.join(","))
      try {
        const cats = await categoriasService.getCategorias()
        const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
        const mapNameToId = new Map(cats.map(c => [norm(c.nombre), c.id_categoria]))
        const firstId = mapNameToId.get(norm(categorias[0]))
        if (firstId) {
          params.set("categoria", String(firstId))
        }
      } catch (e) {
        console.warn('No se pudo mapear categorías a ID', e)
      }
    }

    // Tienda seleccionada
    if (tiendaSeleccionadaId) {
      params.set("tienda", tiendaSeleccionadaId)
    }

    if (tiposVenta.length > 0) {
      params.set("tiposVenta", tiposVenta.join(","))
    }

    // Validar y aplicar rango de precios solo si el check está activo
    if (filtrarPorPrecio) {
      const safeMin = Math.max(0, precioMin || 0)
      const safeMax = Math.max(safeMin, precioMax || 0)
      params.set("precio_min", safeMin.toString())
      params.set("precio_max", safeMax.toString())
    }

    const busqueda = searchParams.get("busqueda")
    if (busqueda) {
      params.set("busqueda", busqueda)
    }

    router.push(`/?${params.toString()}`)

    // Cerrar el Sheet en móvil si existe
    const closeButton = document.querySelector("[data-radix-collection-item]")
    if (closeButton && window.innerWidth < 768) {
      ;(closeButton as HTMLButtonElement).click()
    }
  }

  // Limpiar filtros
  const limpiarFiltros = () => {
    setPrecioMin(0)
    setPrecioMax(1000)
    setCategorias([])
    setTiendaSeleccionadaId(null)
    setTiposVenta([])
    setFiltrarPorPrecio(false)

    const busqueda = searchParams.get("busqueda")
    if (busqueda) {
      router.push(`/?busqueda=${busqueda}`)
    } else {
      router.push("/")
    }

    // Cerrar el Sheet en móvil si existe
    const closeButton = document.querySelector("[data-radix-collection-item]")
    if (closeButton && window.innerWidth < 768) {
      ;(closeButton as HTMLButtonElement).click()
    }
  }

  // Manejar cambio de categoría
  const toggleCategoria = (categoria: string) => {
    console.log('ProductFilters - Toggle categoría:', categoria)
    console.log('ProductFilters - Categorías actuales:', categorias)
    if (categorias.includes(categoria)) {
      const nuevasCategorias = categorias.filter((c) => c !== categoria)
      console.log('ProductFilters - Removiendo categoría, nuevas categorías:', nuevasCategorias)
      setCategorias(nuevasCategorias)
    } else {
      const nuevasCategorias = [...categorias, categoria]
      console.log('ProductFilters - Agregando categoría, nuevas categorías:', nuevasCategorias)
      setCategorias(nuevasCategorias)
    }
  }

  // Manejar cambio de tienda (marca)
  const handleSeleccionTienda = (id: string) => {
    setTiendaSeleccionadaId(id)
  }

  // Manejar cambio de tipo de venta
  const toggleTipoVenta = (tipo: string) => {
    if (tiposVenta.includes(tipo)) {
      setTiposVenta(tiposVenta.filter((t) => t !== tipo))
    } else {
      setTiposVenta([...tiposVenta, tipo])
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Filtros</h3>
        <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
          Limpiar
        </Button>
      </div>

      <Accordion type="multiple" defaultValue={["categorias", "tipoVenta", "precio", "marcas"]} className="w-full">
        <AccordionItem value="tipoVenta">
          <AccordionTrigger>Tipo de venta</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {[
                { value: "directa", label: "Compra directa" },
                { value: "pedido", label: "Por pedido" },
                { value: "delivery", label: "Delivery/Retiro" },
              ].map((tipo) => (
                <div key={tipo.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tipo-${tipo.value}`}
                    checked={tiposVenta.includes(tipo.value)}
                    onCheckedChange={() => toggleTipoVenta(tipo.value)}
                  />
                  <Label htmlFor={`tipo-${tipo.value}`}>{tipo.label}</Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="categorias">
          <AccordionTrigger>Categorías</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {categoriasDisponibles.map((c) => (
                <div key={c.id_categoria} className="flex items-center space-x-2">
                  <Checkbox
                    id={`categoria-${c.id_categoria}`}
                    checked={categorias.includes(c.nombre)}
                    onCheckedChange={() => toggleCategoria(c.nombre)}
                  />
                  <Label htmlFor={`categoria-${c.id_categoria}`}>{c.nombre}</Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="precio">
          <AccordionTrigger>Precio</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="filtrar-precio"
                  checked={filtrarPorPrecio}
                  onCheckedChange={(checked) => setFiltrarPorPrecio(Boolean(checked))}
                />
                <Label htmlFor="filtrar-precio">Filtrar por precio</Label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="precio-min">Precio mínimo</Label>
                  <Input
                    id="precio-min"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={precioMin}
                    onChange={(e) => setPrecioMin(Number(e.target.value) || 0)}
                    placeholder="0"
                    disabled={!filtrarPorPrecio}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="precio-max">Precio máximo</Label>
                  <Input
                    id="precio-max"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={precioMax}
                    onChange={(e) => setPrecioMax(Number(e.target.value) || 0)}
                    placeholder="1000000"
                    disabled={!filtrarPorPrecio}
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="marcas">
          <AccordionTrigger>Marcas</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {tiendasDisponibles.map((t) => (
                <div key={t.id} className="flex items-center space-x-2">
                  <input
                    id={`tienda-${t.id}`}
                    type="radio"
                    name="marca"
                    value={t.id}
                    checked={tiendaSeleccionadaId === String(t.id)}
                    onChange={(e) => handleSeleccionTienda(e.target.value)}
                    className="h-4 w-4 border border-muted-foreground"
                  />
                  <Label htmlFor={`tienda-${t.id}`}>{t.nombre}</Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button className="w-full" onClick={aplicarFiltros}>
        Aplicar filtros
      </Button>
    </div>
  )
}
