import React, { useEffect, useState } from 'react'
import type { LatLngExpression } from 'leaflet'

// Chargement dynamique des composants Leaflet pour éviter les erreurs SSR
const loadLeafletComponents = async () => {
  try {
    const { MapContainer, TileLayer, Marker, Popup } = await import('react-leaflet')
    const L = await import('leaflet')
    
    // Configuration des icônes Leaflet
    const setupLeafletIcons = () => {
      try {
        // Configuration sécurisée des icônes par défaut
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        })
      } catch (error) {
        console.warn('Could not configure Leaflet icons:', error)
      }
    }
    
    setupLeafletIcons()
    
    return { MapContainer, TileLayer, Marker, Popup, L }
  } catch (error) {
    console.error('Failed to load Leaflet components:', error)
    return null
  }
}

interface Location {
  id: string
  name: string
  lat: number
  lng: number
  info?: string
  type?: 'institution' | 'country' | 'scholarship'
}

interface MapComponentProps {
  locations: Location[]
  center?: [number, number]
  zoom?: number
  height?: string
  className?: string
}

interface Location {
  id: string
  name: string
  lat: number
  lng: number
  info?: string
  type?: 'institution' | 'country' | 'scholarship'
}

interface MapComponentProps {
  locations: Location[]
  center?: [number, number]
  zoom?: number
  height?: string
  className?: string
}

interface LeafletComponents {
  MapContainer: any
  TileLayer: any
  Marker: any
  Popup: any
  L: any
}

// Composant de chargement
const MapLoadingFallback = ({ height, className }: { height: string; className?: string }) => (
  <div className={`rounded-lg overflow-hidden shadow-lg ${className || ''} flex items-center justify-center bg-gray-50`} style={{ height }}>
    <div className="text-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600 mb-2">Chargement de la carte...</p>
      <p className="text-sm text-gray-500">Veuillez patienter</p>
    </div>
  </div>
)

// Composant d'erreur
const MapErrorFallback = ({ height, className }: { height: string; className?: string }) => (
  <div className={`rounded-lg overflow-hidden shadow-lg ${className || ''} flex items-center justify-center bg-red-50`} style={{ height }}>
    <div className="text-center p-8">
      <div className="text-red-600 mb-4">
        <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.782-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <p className="text-red-700 mb-2">Erreur lors du chargement de la carte</p>
      <p className="text-sm text-red-600">Fonctionnalité temporairement indisponible</p>
    </div>
  </div>
)

// Composant de carte interne
const LeafletMap = ({ 
  components, 
  locations, 
  center, 
  zoom, 
  height, 
  className 
}: { 
  components: LeafletComponents
} & MapComponentProps) => {
  const { MapContainer, TileLayer, Marker, Popup, L } = components
  
  // Création sécurisée des icônes personnalisées
  const createSafeIcon = (type?: string) => {
    try {
      const color = type === 'institution' ? '#3B82F6' : type === 'scholarship' ? '#10B981' : '#F59E0B'
      
      return L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div style="
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background-color: ${color};
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              width: 8px;
              height: 8px;
              background-color: white;
              border-radius: 50%;
            "></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
      })
    } catch (error) {
      console.warn('Failed to create custom icon, using default:', error)
      // Fallback vers icône par défaut
      return undefined
    }
  }
  
  // Validation et filtrage des emplacements
  const validLocations = locations.filter(location => {
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      return false
    }
    if (isNaN(location.lat) || isNaN(location.lng)) {
      return false
    }
    if (location.lat < -90 || location.lat > 90) {
      return false
    }
    if (location.lng < -180 || location.lng > 180) {
      return false
    }
    return true
  })
  
  return (
    <div className={`rounded-lg overflow-hidden shadow-lg ${className || ''}`} style={{ height }}>
      <MapContainer 
        center={center as LatLngExpression} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        attributionControl={true}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={18}
        />
        {validLocations.map((location) => {
          const customIcon = createSafeIcon(location.type)
          
          return (
            <Marker 
              key={location.id}
              position={[location.lat, location.lng] as LatLngExpression}
              icon={customIcon}
            >
              <Popup>
                <div className="p-3 min-w-[200px] max-w-[300px]">
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">{location.name}</h3>
                  {location.info && (
                    <p className="text-xs text-gray-600 mb-2 leading-relaxed">{location.info}</p>
                  )}
                  <div className="text-xs text-gray-500 font-medium">
                    {location.type === 'institution' ? 'Institution' : 
                     location.type === 'scholarship' ? 'Bourse' : 'Pays'}
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}

export default function MapComponent({ 
  locations, 
  center = [46.2276, 2.2137], // France par défaut
  zoom = 6,
  height = '400px',
  className 
}: MapComponentProps) {
  const [leafletComponents, setLeafletComponents] = useState<LeafletComponents | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  
  useEffect(() => {
    let isMounted = true
    
    const initializeMap = async () => {
      try {
        setIsLoading(true)
        setHasError(false)
        
        // Importer le CSS de Leaflet
        await import('leaflet/dist/leaflet.css')
        
        // Charger les composants Leaflet
        const components = await loadLeafletComponents()
        
        if (!components) {
          throw new Error('Failed to load Leaflet components')
        }
        
        if (isMounted) {
          setLeafletComponents(components)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Map initialization failed:', error)
        if (isMounted) {
          setHasError(true)
          setIsLoading(false)
        }
      }
    }
    
    // Délai léger pour éviter les conflits d'initialisation
    const timeoutId = setTimeout(initializeMap, 100)
    
    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [])
  
  // Gestion des états de chargement et d'erreur
  if (isLoading) {
    return <MapLoadingFallback height={height} className={className} />
  }
  
  if (hasError || !leafletComponents) {
    return <MapErrorFallback height={height} className={className} />
  }
  
  // Protection supplémentaire contre les erreurs de rendu
  try {
    return (
      <LeafletMap 
        components={leafletComponents}
        locations={locations}
        center={center}
        zoom={zoom}
        height={height}
        className={className}
      />
    )
  } catch (error) {
    console.error('MapComponent rendering error:', error)
    return <MapErrorFallback height={height} className={className} />
  }
}