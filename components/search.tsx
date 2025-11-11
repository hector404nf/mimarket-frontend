"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { BehaviorTracker } from "@/lib/behavior-tracker"
import { busquedasService } from "@/lib/api/busquedas"
import { useAuth } from "@/contexts/auth-context"

export default function SearchComponent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [recentSuggestions, setRecentSuggestions] = useState<string[]>([])
  const [behaviorTracker] = useState(() => BehaviorTracker.getInstance())

  useEffect(() => {
    const busqueda = searchParams.get("busqueda")
    if (busqueda) {
      setSearchTerm(busqueda)
    }
  }, [searchParams])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    if (searchTerm.trim()) {
      const params = new URLSearchParams(searchParams.toString())
      params.set("busqueda", searchTerm)
      // Registrar búsqueda local para sugerencias futuras
      behaviorTracker.trackSearch(searchTerm, 0)
      // Registrar búsqueda en backend (no bloquear UI)
      void busquedasService.logBusqueda({
        user_id: user?.id ?? null,
        termino_busqueda: searchTerm.trim(),
        resultados_encontrados: 0,
      })
      router.push(`/?${params.toString()}`)
    } else {
      const params = new URLSearchParams(searchParams.toString())
      params.delete("busqueda")
      router.push(`/?${params.toString()}`)
    }
  }

  return (
    <form onSubmit={handleSearch} className="relative w-full">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Buscar productos..."
        className="w-full pl-8"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => {
          const recents = behaviorTracker.getRecentSearches(8).map((s) => s.query)
          setRecentSuggestions(recents)
          setShowSuggestions(true)
        }}
        onBlur={() => {
          // pequeño delay para permitir click
          setTimeout(() => setShowSuggestions(false), 150)
        }}
      />
      {showSuggestions && (recentSuggestions.length > 0) && (
        <div className="absolute z-20 left-0 right-0 mt-2 bg-background border rounded-md shadow-sm p-2">
          <p className="text-xs text-muted-foreground px-2 mb-1">Búsquedas recientes</p>
          <div className="flex flex-wrap gap-2">
            {recentSuggestions
              .filter((t) => !searchTerm || t.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((term) => (
                <Badge
                  key={term}
                  variant="secondary"
                  className="cursor-pointer"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setSearchTerm(term)
                    const params = new URLSearchParams(searchParams.toString())
                    params.set("busqueda", term)
                    behaviorTracker.trackSearch(term, 0)
                    void busquedasService.logBusqueda({
                      user_id: user?.id ?? null,
                      termino_busqueda: term,
                      resultados_encontrados: 0,
                    })
                    router.push(`/?${params.toString()}`)
                    setShowSuggestions(false)
                  }}
                >
                  {term}
                </Badge>
              ))}
          </div>
        </div>
      )}
    </form>
  )
}
