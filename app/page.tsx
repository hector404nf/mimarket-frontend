import { Suspense } from "react"
import Navbar from "@/components/navbar"
import ProductList from "@/components/product-list"
import ProductFilters from "@/components/product-filters"
import Footer from "@/components/footer"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import RecommendationsSection from "@/components/recommendations-section"
import ProtectedRoute from "@/components/ProtectedRoute"

export default function Home() {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full">
        <section className="px-4 md:px-6 py-6 md:py-10 w-full">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Botón de filtros para móvil */}
            <div className="md:hidden mb-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full flex items-center justify-between">
                    <span>Filtros</span>
                    <SlidersHorizontal className="h-4 w-4 ml-2" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[350px]">
                  <SheetHeader>
                    <SheetTitle>Filtros</SheetTitle>
                  </SheetHeader>
                  <div className="py-4">
                    <Suspense fallback={<div>Cargando filtros...</div>}>
                      <ProductFilters />
                    </Suspense>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Filtros para desktop */}
            <aside className="hidden md:block w-64 shrink-0">
              <Suspense fallback={<div>Cargando filtros...</div>}>
                <ProductFilters />
              </Suspense>
            </aside>

            <div className="flex-1">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Productos</h2>
                <Button asChild>
                  <Link href="/subir-producto">
                    <Plus className="mr-2 h-4 w-4" />
                    Subir producto
                  </Link>
                </Button>
              </div>
              <Suspense fallback={<ProductListSkeleton />}>
                <ProductList />
              </Suspense>
            </div>
          </div>
        </section>

        {/* Sección de recomendaciones */}
        <section className="px-4 md:px-6 py-6">
          <Suspense fallback={<div>Cargando recomendaciones...</div>}>
            <RecommendationsSection showRecentlyViewed={true} showRecommended={true} showStores={true} maxItems={6} />
          </Suspense>
        </section>
      </main>
      <Footer />
    </div>
    </ProtectedRoute>
  )
}

function ProductListSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array(6)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="border rounded-lg overflow-hidden">
            <Skeleton className="h-48 w-full" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </div>
        ))}
    </div>
  )
}
