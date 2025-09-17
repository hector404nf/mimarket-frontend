import { Suspense } from "react"
import Navbar from "@/components/navbar"
import StoreList from "@/components/store-list"
import Footer from "@/components/footer"
import { Skeleton } from "@/components/ui/skeleton"

export default function TiendasPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full">
        <section className="px-4 md:px-6 py-6 md:py-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Nuestras Tiendas</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Descubre las mejores tiendas de nuestro marketplace. Cada una con productos únicos y de calidad.
            </p>
          </div>
          <Suspense fallback={<StoreListSkeleton />}>
            <StoreList />
          </Suspense>
        </section>
      </main>
      <Footer />
    </div>
  )
}

function StoreListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array(6)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="border rounded-lg overflow-hidden">
            <Skeleton className="h-48 w-full" />
            <div className="p-6 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          </div>
        ))}
    </div>
  )
}
