import Link from "next/link"
import Image from "next/image"
import { MapPin, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { tiendas } from "@/lib/stores-data"
import { productos } from "@/lib/data"

export default function StoreList() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tiendas.map((tienda) => {
        const productosTienda = productos.filter((p) => p.tiendaId === tienda.id)

        return (
          <Link
            key={tienda.id}
            href={`/tiendas/${tienda.id}`}
            className="group border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="aspect-video relative bg-muted">
              <Image
                src={tienda.imagenPortada || "/placeholder.svg?height=200&width=400"}
                alt={tienda.nombre}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-3 right-3">
                <div className="flex items-center gap-1 bg-white/90 rounded-full px-2 py-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-medium">{tienda.calificacion}</span>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-start gap-3 mb-3">
                <div className="relative h-12 w-12 rounded-full bg-muted overflow-hidden shrink-0">
                  <Image
                    src={tienda.logo || "/placeholder.svg?height=50&width=50"}
                    alt={`Logo de ${tienda.nombre}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-lg truncate">{tienda.nombre}</h3>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="text-sm truncate">{tienda.ciudad}</span>
                  </div>
                </div>
              </div>

              <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{tienda.descripcion}</p>

              <div className="flex flex-wrap gap-1 mb-3">
                {tienda.categorias.slice(0, 2).map((categoria) => (
                  <Badge key={categoria} variant="secondary" className="text-xs">
                    {categoria}
                  </Badge>
                ))}
                {tienda.categorias.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{tienda.categorias.length - 2}
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {productosTienda.length} producto{productosTienda.length !== 1 ? "s" : ""}
                </span>
                <span className="text-muted-foreground">{tienda.ventasTotales}+ ventas</span>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
