"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Upload, X, Camera, Trash2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"
import { marcas } from "@/lib/data"
import { categoriasService } from "@/lib/api/categorias"
import { productosService } from "@/lib/api/productos"
import { useProfileType } from "@/hooks/use-profile-type"

interface ImageFile {
  file: File
  preview: string
  id: string
}

function normalizeImageUrl(url: string): string {
  try {
    if (!url) return url
    // Si viene del backend con http://localhost:8010, usar la ruta proxyeada /storage/*
    const match = url.match(/^https?:\/\/localhost:8010(\/.*)$/)
    if (match && match[1]) {
      return match[1]
    }
    return url
  } catch {
    return url
  }
}

export default function ProductEditForm({ productoId }: { productoId: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [imagenes, setImagenes] = useState<ImageFile[]>([])
  const [imagenesActuales, setImagenesActuales] = useState<string[]>([])
  const [galeriaActual, setGaleriaActual] = useState<Array<{ id: number; url: string; thumb_url?: string }>>([])
  const [galeriaEliminar, setGaleriaEliminar] = useState<number[]>([])
  const [principalMediaId, setPrincipalMediaId] = useState<number | null>(null)
  const [eliminarPrincipal, setEliminarPrincipal] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [categoriasList, setCategoriasList] = useState<{ id: number; nombre: string }[]>([])
  const [categoriasLoading, setCategoriasLoading] = useState(true)
  const [productoLoading, setProductoLoading] = useState(true)

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    categoriaId: "",
    marca: "",
    tipoVenta: "",
    stock: "",
    tiempoEntrega: "",
    descuento: "0",
    tags: "",
  })

  const { storeInfo } = useProfileType()

  const maxImagenes = 8
  const maxTamañoMB = 5

  useEffect(() => {
    // Cargar categorías
    const loadCategorias = async () => {
      try {
        setCategoriasLoading(true)
        const cats = await categoriasService.getCategorias()
        setCategoriasList(cats.map((c) => ({ id: c.id, nombre: c.nombre })))
      } catch (err) {
        console.error("Error cargando categorías", err)
      } finally {
        setCategoriasLoading(false)
      }
    }

    // Cargar producto
    const loadProducto = async () => {
      try {
        setProductoLoading(true)
        const { data } = await productosService.getProducto(productoId)
        setFormData((prev) => ({
          ...prev,
          nombre: data.nombre || "",
          descripcion: data.descripcion || "",
          precio: (data.precio ?? "").toString(),
          // Intentar resolver categoría por nombre
          categoriaId: "",
          marca: data.tienda?.nombre_tienda || "",
          tipoVenta: (data.tipoVenta as any) || "directa",
          stock: (data.stock ?? "").toString(),
          tiempoEntrega: data.tiempoEntrega || "",
          descuento: data.descuento ? data.descuento.toString() : "0",
          tags: (data.tags || []).join(", "),
        }))
        // Cargar imágenes actuales del producto para previsualización
        const principal = (data as any).imagen ? [normalizeImageUrl((data as any).imagen)] : []
        setImagenesActuales(principal)
        setPrincipalMediaId((data as any).imagenPrincipalMediaId ?? null)
        const gm = (data as any).galeriaMedia || []
        setGaleriaActual(gm.map((g: any) => ({ id: g.id, url: normalizeImageUrl(g.url), thumb_url: g.thumb_url ? normalizeImageUrl(g.thumb_url) : undefined })))
      } catch (err) {
        toast({ title: "Producto no encontrado", description: "No se pudo cargar el producto", variant: "destructive" })
        console.error("Error cargando producto", err)
      } finally {
        setProductoLoading(false)
      }
    }

    loadCategorias()
    loadProducto()
  }, [productoId])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const procesarArchivos = (files: FileList) => {
    const nuevos: ImageFile[] = []
    for (let i = 0; i < files.length && imagenes.length + nuevos.length < maxImagenes; i++) {
      const file = files[i]
      if (file.size / (1024 * 1024) > maxTamañoMB) {
        toast({
          title: "Archivo demasiado grande",
          description: `La imagen ${file.name} supera ${maxTamañoMB}MB`,
          variant: "destructive",
        })
        continue
      }
      const preview = URL.createObjectURL(file)
      nuevos.push({ file, preview, id: Math.random().toString(36).slice(2) })
    }
    setImagenes((prev) => [...prev, ...nuevos])
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      procesarArchivos(e.dataTransfer.files)
    }
  }

  const removeImage = (id: string) => {
    setImagenes((prev) => prev.filter((img) => img.id !== id))
  }

  const toggleEliminarGaleria = (mediaId: number) => {
    setGaleriaEliminar((prev) => (prev.includes(mediaId) ? prev.filter((id) => id !== mediaId) : [...prev, mediaId]))
  }

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    if (!productoId) return

    try {
      setLoading(true)

      // Construir parcial de producto
      const productoParcial = {
        id: productoId,
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio: Number(formData.precio),
        stock: formData.tipoVenta === "delivery" ? 0 : Number(formData.stock || 0),
        tipoVenta: formData.tipoVenta as any,
        tiempoEntrega: formData.tiempoEntrega,
        // Campos opcionales
        precio_oferta: undefined,
        activo: undefined,
        destacado: undefined,
      } as any

      // Selecciones de imágenes (opcional): primera como principal, resto como galería
      const imagenPrincipal = imagenes[0]?.file
      const imagenesGaleria = imagenes.slice(1).map((i) => i.file)

      const idCategoria = formData.categoriaId ? Number(formData.categoriaId) : undefined

      const updateResp = await productosService.updateProducto(
        productoId,
        productoParcial,
        imagenPrincipal,
        imagenesGaleria,
        imagenPrincipal ? true : undefined,
        imagenesGaleria.length > 0 ? false : undefined,
        idCategoria
      )

      // Si se marcó eliminar la imagen principal y NO se subió una nueva
      if (eliminarPrincipal && !imagenPrincipal && principalMediaId) {
        try {
          await productosService.deleteProductoImage(productoId, principalMediaId, 'images')
          toast({ title: "Imagen principal eliminada", description: "La imagen principal fue eliminada" })
        } catch (err) {
          toast({ title: "No se pudo eliminar la imagen principal", description: "Intenta nuevamente", variant: "destructive" })
          console.error("Error eliminando imagen principal", err)
        }
      }

      // Si hay imágenes de galería marcadas para eliminar, proceder
      if (galeriaEliminar.length > 0) {
        try {
          await Promise.all(
            galeriaEliminar.map((mediaId) => productosService.deleteProductoImage(productoId, mediaId, 'gallery'))
          )
          toast({ title: "Galería actualizada", description: `Se eliminaron ${galeriaEliminar.length} imágenes de la galería` })
        } catch (delErr) {
          toast({ title: "Algunas imágenes no se eliminaron", description: "Revisa tu conexión o permisos", variant: "destructive" })
          console.error("Error eliminando imágenes de galería", delErr)
        }
      }

      toast({ title: "Producto actualizado", description: `Se guardaron los cambios del producto #${productoId}` })
      router.push("/dashboard-tienda/productos")
    } catch (error) {
      toast({ title: "Error", description: "No se pudo actualizar el producto", variant: "destructive" })
      console.error("Error actualizando producto", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sección de imágenes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Imágenes del Producto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Imagen principal actual */}
          {imagenesActuales.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Imagen principal actual:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {imagenesActuales.map((src, idx) => (
                  <div key={`${src}-${idx}`} className="relative">
                    <Image src={src} alt={`imagen-${idx + 1}`} width={200} height={200} className={`rounded-md object-cover ${eliminarPrincipal ? 'opacity-50 ring-2 ring-destructive' : ''}`} />
                    {idx === 0 && (
                      <Badge className="absolute top-2 left-2 bg-black/70 text-white">Principal</Badge>
                    )}
                    {idx === 0 && principalMediaId && (
                      <div className="absolute top-2 right-2 flex gap-2">
                        {!eliminarPrincipal ? (
                          <Button type="button" size="sm" variant="destructive" onClick={() => setEliminarPrincipal(true)} className="shadow">
                            <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                          </Button>
                        ) : (
                          <Button type="button" size="sm" variant="secondary" onClick={() => setEliminarPrincipal(false)} className="shadow">
                            <RotateCcw className="h-4 w-4 mr-1" /> Restaurar
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Galería actual con opción de marcado para eliminar */}
          {galeriaActual.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Galería actual (puedes marcar para eliminar al guardar):</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {galeriaActual.map((g) => {
                  const marcado = galeriaEliminar.includes(g.id)
                  return (
                    <div key={g.id} className="relative group">
                      <Image src={g.url} alt={`galeria-${g.id}`} width={200} height={200} className={`rounded-md object-cover ${marcado ? 'opacity-50 ring-2 ring-destructive' : ''}`} />
                      <div className="absolute top-2 right-2 flex gap-2">
                        {!marcado ? (
                          <Button type="button" size="sm" variant="destructive" onClick={() => toggleEliminarGaleria(g.id)} className="shadow">
                            <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                          </Button>
                        ) : (
                          <Button type="button" size="sm" variant="secondary" onClick={() => toggleEliminarGaleria(g.id)} className="shadow">
                            <RotateCcw className="h-4 w-4 mr-1" /> Restaurar
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Zona de subida */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            <div className="space-y-2">
              <p className="text-lg font-medium">Arrastra y suelta tus imágenes aquí</p>
              <p className="text-sm text-muted-foreground">
                Puedes seleccionar hasta {maxImagenes} imágenes. Si no subes nuevas, se mantienen las actuales.
              </p>
            </div>
            <div className="mt-4">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files && procesarArchivos(e.target.files)}
              />
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>Seleccionar imágenes</Button>
            </div>
          </div>

          {/* Vista previa de imágenes seleccionadas */}
          {imagenes.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {imagenes.map((img) => (
                <div key={img.id} className="relative">
                  <Image src={img.preview} alt="preview" width={200} height={200} className="rounded-md object-cover" />
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                    onClick={() => removeImage(img.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Alert>
            <AlertDescription>
              Para cambiar la imagen principal, sube una nueva como primera imagen. Las demás se añadirán a la galería.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Datos básicos */}
      <Card>
        <CardHeader>
          <CardTitle>Datos del producto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input id="nombre" value={formData.nombre} onChange={(e) => handleInputChange("nombre", e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="marca">Marca</Label>
              <Select value={formData.marca} onValueChange={(value) => handleInputChange("marca", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una marca" />
                </SelectTrigger>
                <SelectContent>
                  {marcas.map((marca) => (
                    <SelectItem key={marca} value={marca}>
                      {marca}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción *</Label>
            <Textarea id="descripcion" value={formData.descripcion} onChange={(e) => handleInputChange("descripcion", e.target.value)} rows={4} required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="precio">Precio *</Label>
              <Input id="precio" type="number" step="0.01" min="0" value={formData.precio} onChange={(e) => handleInputChange("precio", e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descuento">Descuento (%)</Label>
              <Input id="descuento" type="number" min="0" max="100" value={formData.descuento} onChange={(e) => handleInputChange("descuento", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría</Label>
              <Select value={formData.categoriaId} onValueChange={(value) => handleInputChange("categoriaId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder={categoriasLoading ? "Cargando..." : "Selecciona categoría"} />
                </SelectTrigger>
                <SelectContent>
                  {categoriasList.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuración de venta */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Venta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipoVenta">Tipo de venta *</Label>
              <Select value={formData.tipoVenta} onValueChange={(value) => handleInputChange("tipoVenta", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="directa">Venta directa</SelectItem>
                  <SelectItem value="pedido">Por pedido</SelectItem>
                  <SelectItem value="delivery">Delivery/Retiro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Stock disponible</Label>
              <Input id="stock" type="number" min="0" value={formData.stock} onChange={(e) => handleInputChange("stock", e.target.value)} placeholder="0" disabled={formData.tipoVenta === "delivery"} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tiempoEntrega">Tiempo de entrega</Label>
              <Input id="tiempoEntrega" value={formData.tiempoEntrega} onChange={(e) => handleInputChange("tiempoEntrega", e.target.value)} placeholder="Ej: 2-3 días, Inmediato" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Etiquetas (separadas por comas)</Label>
            <Input id="tags" value={formData.tags} onChange={(e) => handleInputChange("tags", e.target.value)} placeholder="Ej: nuevo, oferta, premium, importado" />
          </div>
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row gap-4 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando cambios..." : "Guardar cambios"}
        </Button>
      </div>
    </form>
  )
}