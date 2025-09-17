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

    // Crear el script
    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,drawing`
    script.async = true
    script.defer = true

    script.onload = () => {
      isLoaded = true
      isLoading = false
      resolve()
    }

    script.onerror = (error) => {
      isLoading = false
      loadPromise = null
      reject(new Error("Failed to load Google Maps API"))
    }

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

    document.head.appendChild(script)
  })

  return loadPromise
}

export const isGoogleMapsLoaded = (): boolean => {
  return isLoaded && window.google && window.google.maps
}
