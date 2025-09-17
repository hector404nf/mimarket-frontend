import { Suspense } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import ProductUploadForm from "@/components/product-upload-form"
import { Skeleton } from "@/components/ui/skeleton"

export default function SubirProductoPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full">
        <div className="px-4 md:px-6 py-6 md:py-10">
          <h1 className="text-3xl font-bold mb-6">Subir un nuevo producto</h1>
          <Suspense fallback={<FormSkeleton />}>
            <ProductUploadForm />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function FormSkeleton() {
  return (
    <div className="space-y-6">
      {Array(6)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      <Skeleton className="h-10 w-full max-w-[200px]" />
    </div>
  )
}
