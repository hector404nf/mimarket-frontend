"use client"

import { useEffect, useState } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import SmartSearch from "@/components/smart-search"

export default function BusquedaInteligentePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto w-full">
          <div className="px-4 md:px-6 py-6 md:py-10">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-4">Búsqueda Inteligente</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">Cargando sistema de búsqueda inteligente...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full">
        <div className="px-4 md:px-6 py-6 md:py-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Búsqueda Inteligente</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Usa lenguaje natural para encontrar exactamente lo que buscas. Nuestro sistema combina inteligencia
              artificial con tu historial de navegación para ofrecerte las mejores recomendaciones.
            </p>
          </div>

          <SmartSearch />

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">NLP</span>
              </div>
              <h3 className="font-semibold mb-2">Procesamiento de Lenguaje Natural</h3>
              <p className="text-sm text-muted-foreground">
                Entiende tu intención y extrae información relevante de tu consulta
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 font-bold">AI</span>
              </div>
              <h3 className="font-semibold mb-2">Análisis de Comportamiento</h3>
              <p className="text-sm text-muted-foreground">
                Considera tu historial de navegación y preferencias personales
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 font-bold">ML</span>
              </div>
              <h3 className="font-semibold mb-2">Recomendaciones Personalizadas</h3>
              <p className="text-sm text-muted-foreground">
                Combina ambos análisis para sugerir productos y tiendas perfectos para ti
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
