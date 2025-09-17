"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function SearchComponent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState("")

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
      />
    </form>
  )
}
