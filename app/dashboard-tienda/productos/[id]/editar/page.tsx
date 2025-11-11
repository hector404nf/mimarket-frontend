import type { Metadata } from "next"
import ProductEditForm from "@/components/product-edit-form"
import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Editar producto | MiMarket",
}

export default function EditarProductoPage({ params }: { params: { id: string } }) {
  const productoId = Number(params.id)

  return (
    <div className="container mx-auto px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle>Editar producto #{productoId}</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div> Cargando formulario...</div>}>
            <ProductEditForm productoId={productoId} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}