"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Upload, X, Camera, AlertCircle } from "lucide-react"
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

export default function ProductUploadForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [imagenes, setImagenes] = useState<ImageFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [categoriasList, setCategoriasList] = useState<{ id: number; nombre: string }[]>([])
  const [categoriasLoading, setCategoriasLoading] = useState(true)

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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validarArchivo = (file: File): string | null => {
    if (!file.type.startsWith("image/")) {
      return "El archivo debe ser una imagen"
    }
    if (file.size > maxTamañoMB * 1024 * 1024) {
      return `La imagen debe ser menor a ${maxTamañoMB}MB`
    }
    return null
  }

  const procesarArchivos = (files: FileList | File[]) => {
    const archivosArray = Array.from(files)
    const nuevasImagenes: ImageFile[] = []

    archivosArray.forEach((file) => {
      const error = validarArchivo(file)
      if (error) {
        toast({
          title: "Error en archivo",
          description: `${file.name}: ${error}`,
          variant: "destructive",
        })
        return
      }

      if (imagenes.length + nuevasImagenes.length >= maxImagenes) {
        toast({
          title: "Límite alcanzado",
          description: `Solo puedes subir máximo ${maxImagenes} imágenes`,
          variant: "destructive",
        })
        return
      }

      const id = Math.random().toString(36).substr(2, 9)
      const preview = URL.createObjectURL(file)
      nuevasImagenes.push({ file, preview, id })
    })

    setImagenes((prev) => [...prev, ...nuevasImagenes])
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      procesarArchivos(e.target.files)
    }
  }

  // Cargar categorías reales del backend
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        setCategoriasLoading(true)
        const data = await categoriasService.getCategorias()
        setCategoriasList(data.map(c => ({ id: c.id, nombre: c.nombre })))
      } catch (err: any) {
        console.error("Error cargando categorías", err)
        toast({
          title: "Error al cargar categorías",
          description: err?.message || "No se pudieron cargar las categorías",
          variant: "destructive",
        })
      } finally {
        setCategoriasLoading(false)
      }
    }
    fetchCategorias()
  }, [])

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

  const eliminarImagen = (id: string) => {
    setImagenes((prev) => {
      const imagen = prev.find((img) => img.id === id)
      if (imagen) {
        URL.revokeObjectURL(imagen.preview)
      }
      return prev.filter((img) => img.id !== id)
    })
  }

  const moverImagen = (fromIndex: number, toIndex: number) => {
    setImagenes((prev) => {
      const nuevasImagenes = [...prev]
      const [imagenMovida] = nuevasImagenes.splice(fromIndex, 1)
      nuevasImagenes.splice(toIndex, 0, imagenMovida)
      return nuevasImagenes
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (imagenes.length === 0) {
      toast({
        title: "Error",
        description: "Debes subir al menos una imagen del producto",
        variant: "destructive",
      })
      return
    }

    if (!formData.nombre || !formData.descripcion || !formData.precio || !formData.categoriaId) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const categoriaIdNum = Number(formData.categoriaId)
      const categoriaSeleccionada = categoriasList.find(c => c.id === categoriaIdNum)
      const descuentoNum = Number.parseInt(formData.descuento) || 0
      const precioNum = Number.parseFloat(formData.precio)
      const precioOferta = descuentoNum > 0 ? Number((precioNum * (1 - descuentoNum / 100)).toFixed(2)) : undefined

      const nuevoProducto = {
        id_producto: 0,
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio: precioNum,
        precio_oferta: precioOferta,
        categoria: categoriaSeleccionada?.nombre || "",
        marca: formData.marca || undefined,
        imagenes: [],
        tipoVenta: (formData.tipoVenta || "directa") as any,
        stock: Number.parseInt(formData.stock) || 0,
        tiempoEntrega: formData.tiempoEntrega || undefined,
        tiendaId: storeInfo?.id || 0,
        rating: 0,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      }

      const imagenPrincipal = imagenes[0]?.file
      const imagenesGaleria = imagenes.slice(1).map((img) => img.file)

      const response = await productosService.createProducto(
        nuevoProducto,
        imagenPrincipal,
        imagenesGaleria,
        categoriaIdNum
      )

      toast({
        title: "¡Producto creado!",
        description: `Tu producto "${response.data.nombre}" ha sido publicado exitosamente`,
      })

      router.push("/dashboard-tienda/productos")
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un problema al crear el producto",
        variant: "destructive",
      })
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
          {/* Zona de subida */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
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
              <p className="text-sm text-muted-foreground">o haz clic para seleccionar archivos</p>
              <p className="text-xs text-muted-foreground">
                Máximo {maxImagenes} imágenes • Hasta {maxTamañoMB}MB cada una • JPG, PNG, WEBP
              </p>
            </div>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
          </div>

          {/* Vista previa de imágenes */}
          {imagenes.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">
                  Imágenes seleccionadas ({imagenes.length}/{maxImagenes})
                </h4>
                <Badge variant="outline">La primera imagen será la principal</Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {imagenes.map((imagen, index) => (
                  <div key={imagen.id} className="relative group">
                    <div className="aspect-square relative border rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={imagen.preview || "/placeholder.svg"}
                        alt={`Imagen ${index + 1}`}
                        fill
                        className="object-cover"
                      />

                      {/* Badge de imagen principal */}
                      {index === 0 && <Badge className="absolute top-2 left-2 text-xs bg-primary">Principal</Badge>}

                      {/* Botón eliminar */}
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => eliminarImagen(imagen.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>

                      {/* Número de imagen */}
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {index + 1}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {imagenes.length > 1 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Puedes reordenar las imágenes arrastrándolas. La primera imagen será la que se muestre como
                    principal.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información básica */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Producto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del producto *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => handleInputChange("nombre", e.target.value)}
                placeholder="Ej: iPhone 15 Pro Max"
                required
              />
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
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => handleInputChange("descripcion", e.target.value)}
              placeholder="Describe las características principales del producto..."
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="precio">Precio *</Label>
              <Input
                id="precio"
                type="number"
                step="0.01"
                min="0"
                value={formData.precio}
                onChange={(e) => handleInputChange("precio", e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descuento">Descuento (%)</Label>
              <Input
                id="descuento"
                type="number"
                min="0"
                max="100"
                value={formData.descuento}
                onChange={(e) => handleInputChange("descuento", e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría *</Label>
              <Select value={formData.categoriaId} onValueChange={(value) => handleInputChange("categoriaId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder={categoriasLoading ? "Cargando categorías..." : "Selecciona categoría"} />
                </SelectTrigger>
                <SelectContent>
                  {categoriasList.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.nombre}
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
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => handleInputChange("stock", e.target.value)}
                placeholder="0"
                disabled={formData.tipoVenta === "delivery"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tiempoEntrega">Tiempo de entrega</Label>
              <Input
                id="tiempoEntrega"
                value={formData.tiempoEntrega}
                onChange={(e) => handleInputChange("tiempoEntrega", e.target.value)}
                placeholder="Ej: 2-3 días, Inmediato"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Etiquetas (separadas por comas)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => handleInputChange("tags", e.target.value)}
              placeholder="Ej: nuevo, oferta, premium, importado"
            />
          </div>
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row gap-4 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading || imagenes.length === 0}>
          {loading ? "Creando producto..." : "Crear producto"}
        </Button>
      </div>
    </form>
  )
}
