let isLoading = false
let isLoaded = false
let loadPromise: Promise<void> | null = null

export const loadGoogleMaps = (): Promise<void> => {
  if (isLoaded) {
    return Promise.resolve()
  }

  if (isLoading && loadPromise) {
    return loadPromise
  }

  isLoading = true

  loadPromise = new Promise((resolve, reject) => {
    // Verificar si Google Maps ya está cargado
    if (window.google && window.google.maps) {
      isLoaded = true
      isLoading = false
      resolve()
      return
    }

    // Validar API key
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey || apiKey === 'undefined') {
      // No lanzar error estridente; simplemente rechazar suavemente
      isLoading = false
      loadPromise = null
      reject(new Error("Google Maps API key missing"))
      return
    }

    // Evitar cargas duplicadas: revisar si ya existe un script de Google Maps
    const existingScript = Array.from(document.getElementsByTagName('script')).find((s) =>
      s.src && s.src.includes('maps.googleapis.com/maps/api/js')
    )
    if (existingScript) {
      // Si existe, esperar a que termine de cargar o verificar disponibilidad
      const checkLoaded = () => {
        if (window.google && window.google.maps) {
          isLoaded = true
          isLoading = false
          resolve()
        } else {
          setTimeout(checkLoaded, 300)
        }
      }
      checkLoaded()
      return
    }

    // Crear el script
    const script = document.createElement("script")
    script.id = "google-maps-js"
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,drawing`
    script.async = true
    script.defer = true

    // Timeout de 30 segundos
    const timeout = setTimeout(() => {
      isLoading = false
      loadPromise = null
      reject(new Error("Google Maps API load timeout"))
    }, 30000)

    script.onload = () => {
      clearTimeout(timeout)
      isLoaded = true
      isLoading = false
      resolve()
    }

    script.onerror = (error) => {
      clearTimeout(timeout)
      isLoading = false
      loadPromise = null
      reject(new Error("Failed to load Google Maps API"))
    }

    document.head.appendChild(script)
  })

  return loadPromise
}

export const isGoogleMapsLoaded = (): boolean => {
  return isLoaded && window.google && window.google.maps
}
