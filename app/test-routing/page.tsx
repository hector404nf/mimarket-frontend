"use client"

import dynamic from "next/dynamic"
import { useState } from "react"

const TrackingMap = dynamic(() => import("@/components/tracking-map"), { ssr: false })

export default function TestRoutingPage() {
  const [tracking, setTracking] = useState(true)
  // Coordenadas de ejemplo (Asunción)
  const destination = { lat: -25.3000, lng: -57.6350 }

  return (
    <div className="min-h-screen p-4">
      <h1 className="text-xl font-semibold mb-4">Prueba de Routing (proxy backend)</h1>
      <TrackingMap destination={destination} tracking={tracking} debug={true} onPositionUpdate={() => {}} />
      <div className="mt-3">
        <button
          className="px-3 py-1 border rounded"
          onClick={() => setTracking((t) => !t)}
        >
          {tracking ? "Pausar tracking" : "Iniciar tracking"}
        </button>
        <span className="ml-3 text-sm text-muted-foreground">En modo manual, haz click para fijar origen.</span>
      </div>
    </div>
  )
}