"use client"

import { useState, useEffect, useRef, forwardRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Loader2 } from "lucide-react"
import { loadGoogleMaps } from "@/lib/google-maps-loader"
import { toast } from "@/components/ui/use-toast"

interface AddressAutocompleteProps {
  value: string
  onChange: (address: string) => void
  onPlaceSelect?: (place: google.maps.places.PlaceResult) => void
  placeholder?: string
  label?: string
  id?: string
  className?: string
}

interface AddressSuggestion {
  description: string
  place_id: string
}

const AddressAutocomplete = forwardRef<HTMLInputElement, AddressAutocompleteProps>(({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Escribe tu dirección...",
  label,
  id,
  className
}, ref) => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isGoogleMapsReady, setIsGoogleMapsReady] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null)
  const placesService = useRef<google.maps.places.PlacesService | null>(null)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  // Inicializar Google Maps y servicios
  useEffect(() => {
    const initializeGoogleMaps = async () => {
      try {
        await loadGoogleMaps()
        
        if (window.google && window.google.maps && window.google.maps.places) {
          autocompleteService.current = new google.maps.places.AutocompleteService()
          
          // Crear un div temporal para el PlacesService
          const tempDiv = document.createElement('div')
          placesService.current = new google.maps.places.PlacesService(tempDiv)
          
          setIsGoogleMapsReady(true)
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error)
        toast({
          title: "Error",
          description: "No se pudo cargar el servicio de direcciones",
          variant: "destructive"
        })
      }
    }

    initializeGoogleMaps()
  }, [])

  // Función para buscar sugerencias
  const searchSuggestions = async (input: string) => {
    if (!autocompleteService.current || !input.trim() || input.length < 3) {
      setSuggestions([])
      return
    }

    setIsLoading(true)

    try {
      const request: google.maps.places.AutocompletionRequest = {
        input: input.trim(),
        componentRestrictions: { country: 'py' },
        types: ['address'],
      }

      autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
        console.log('🔍 Autocomplete response:', { status, predictions: predictions?.length || 0 });
        setIsLoading(false)
        
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          const addressSuggestions = predictions.map(prediction => ({
            description: prediction.description,
            place_id: prediction.place_id
          }))
          console.log('✅ Suggestions generated:', addressSuggestions.length);
          setSuggestions(addressSuggestions)
          setShowSuggestions(true)
        } else {
          console.log('❌ No suggestions or error:', status);
          setSuggestions([])
          setShowSuggestions(false)
        }
      })
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      setIsLoading(false)
      setSuggestions([])
    }
  }

  // Manejar cambios en el input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange?.(newValue)

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      if (isGoogleMapsReady) {
        console.log('🔎 Searching for:', newValue);
        searchSuggestions(newValue)
      } else {
        console.log('⚠️ Google Maps not ready yet');
      }
    }, 300)
  }

  // Manejar selección de sugerencia
  const handleSuggestionSelect = (suggestion: AddressSuggestion) => {
    console.log('🏠 AddressAutocomplete: Suggestion selected:', suggestion.description)
    onChange?.(suggestion.description)
    setSuggestions([])
    setShowSuggestions(false)

    if (onPlaceSelect && placesService.current) {
      console.log('🏠 AddressAutocomplete: Getting place details for:', suggestion.place_id)
      const request: google.maps.places.PlaceDetailsRequest = {
        placeId: suggestion.place_id,
        fields: ['geometry', 'formatted_address', 'name', 'address_components']
      }

      placesService.current.getDetails(request, (place, status) => {
        console.log('🏠 AddressAutocomplete: Place details response:', { place, status })
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          console.log('🏠 AddressAutocomplete: Calling onPlaceSelect with place:', place)
          onPlaceSelect?.(place)
        } else {
          console.error('🏠 AddressAutocomplete: Failed to get place details:', status)
        }
      })
    } else {
      console.warn('🏠 AddressAutocomplete: onPlaceSelect or placesService not available')
    }
  }

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const isInsideInput = inputRef.current && inputRef.current.contains(target)
      const isInsideDropdown = dropdownRef.current && dropdownRef.current.contains(target)
      
      if (!isInsideInput && !isInsideDropdown) {
        console.log('🚪 Closing suggestions - click outside');
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

  return (
    <div className={`relative ${className}`}>
      {label && <Label htmlFor={id}>{label}</Label>}
      
      <div className="relative">
        <Input
          ref={ref || inputRef}
          id={id}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="pr-10"
          autoComplete="off"
        />
        
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <MapPin className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div ref={dropdownRef} className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {console.log('🎯 Rendering suggestions dropdown with', suggestions.length, 'items')}
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.place_id}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ Mouse down on suggestion:', suggestion.description);
                console.log('🔵 Processing suggestion selection:', suggestion.description);
                handleSuggestionSelect(suggestion);
              }}
              className="w-full px-4 py-3 text-left hover:bg-muted transition-colors border-b border-border last:border-b-0 flex items-start gap-3"
            >
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <span className="text-sm text-foreground">{suggestion.description}</span>
            </button>
          ))}
        </div>
      )}

      {!isGoogleMapsReady && (
        <p className="text-xs text-muted-foreground mt-1">
          Cargando servicio de direcciones...
        </p>
      )}
    </div>
  )
})

AddressAutocomplete.displayName = "AddressAutocomplete"

export default AddressAutocomplete