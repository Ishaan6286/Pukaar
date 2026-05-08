import { useState, useEffect, useRef, useMemo } from 'react'
import { CitizenLayout } from '@/components/Layout'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { collections, subscribeToQuery } from '@/lib/db'
import { HelpLocation } from '@/types'
import { distanceBetween } from 'geofire-common'

const FILTER_TYPES = ['All', 'shelter', 'food_bank', 'hospital', 'police', 'fire_station', 'relief_camp']

function formatType(type: string) {
  return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function getIcon(type: string) {
  const mapping: any = {
    shelter: 'home_work',
    food_bank: 'restaurant',
    hospital: 'local_hospital',
    police: 'local_police',
    fire_station: 'fire_truck',
    relief_camp: 'nights_stay'
  }
  return mapping[type] || 'location_on'
}

function getColor(type: string) {
  const mapping: any = {
    shelter: 'text-violet-600 bg-violet-100 border-violet-200',
    food_bank: 'text-amber-600 bg-amber-100 border-amber-200',
    hospital: 'text-rose-600 bg-rose-100 border-rose-200',
    police: 'text-blue-600 bg-blue-100 border-blue-200',
    fire_station: 'text-red-600 bg-red-100 border-red-200',
    relief_camp: 'text-teal-600 bg-teal-100 border-teal-200'
  }
  return mapping[type] || 'text-gray-600 bg-gray-100 border-gray-200'
}

function getHexColor(type: string) {
  const mapping: any = {
    shelter: '#7C3AED',
    food_bank: '#D97706',
    hospital: '#E11D48',
    police: '#2563EB',
    fire_station: '#DC2626',
    relief_camp: '#0D9488'
  }
  return mapping[type] || '#4B5563'
}

export default function HelpMap() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<{ [id: string]: maplibregl.Marker }>({})

  const [filter, setFilter] = useState('All')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [locations, setLocations] = useState<HelpLocation[]>([])
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null)

  // 1. Get User Location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        console.warn('Geolocation failed, defaulting to city center', err)
        setUserLoc({ lat: 28.6139, lng: 77.2090 }) // Default New Delhi
      }
    )
  }, [])

  // 2. Fetch Live Help Locations from Firestore
  useEffect(() => {
    const unsub = subscribeToQuery<HelpLocation>(
      collections.helpLocations,
      [],
      (data) => setLocations(data)
    )
    return () => unsub()
  }, [])

  // 3. Process & Sort Data
  const processedLocations = useMemo(() => {
    let filtered = filter === 'All' ? locations : locations.filter(l => l.type === filter)
    
    return filtered.map(loc => {
      let distKm = 0
      if (userLoc && loc.location?.lat) {
        distKm = distanceBetween([userLoc.lat, userLoc.lng], [loc.location.lat, loc.location.lng])
      }
      return { ...loc, distKm }
    }).sort((a, b) => a.distKm - b.distKm)
  }, [locations, filter, userLoc])

  // 4. Initialize MapLibre
  useEffect(() => {
    if (!mapContainer.current || !userLoc) return
    if (map.current) return // initialize map only once

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap Contributors'
          }
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
      center: [userLoc.lng, userLoc.lat],
      zoom: 12
    })

    // Add User Location Marker
    const userEl = document.createElement('div')
    userEl.className = 'w-4 h-4 rounded-full bg-primary border-2 border-white shadow-[0_0_15px_rgba(103,80,164,0.6)] animate-pulse'
    new maplibregl.Marker(userEl)
      .setLngLat([userLoc.lng, userLoc.lat])
      .addTo(map.current)

    map.current.addControl(new maplibregl.NavigationControl(), 'bottom-right')
  }, [userLoc])

  // 5. Sync Markers with Data
  useEffect(() => {
    if (!map.current) return

    // Remove old markers
    Object.values(markersRef.current).forEach(marker => marker.remove())
    markersRef.current = {}

    processedLocations.forEach(loc => {
      if (!loc.location?.lat || !loc.location?.lng) return

      const el = document.createElement('div')
      el.className = `w-8 h-8 rounded-full border-2 shadow-md flex items-center justify-center cursor-pointer transition-transform hover:scale-110 ${
        selectedId === loc.id ? 'scale-125 z-10' : ''
      }`
      el.style.backgroundColor = 'white'
      el.style.borderColor = getHexColor(loc.type)
      
      const icon = document.createElement('span')
      icon.className = 'material-icons text-[16px]'
      icon.style.color = getHexColor(loc.type)
      icon.innerText = getIcon(loc.type)
      el.appendChild(icon)

      el.addEventListener('click', (e) => {
        e.stopPropagation()
        setSelectedId(loc.id!)
        map.current?.flyTo({ center: [loc.location.lng, loc.location.lat], zoom: 14 })
      })

      const marker = new maplibregl.Marker(el)
        .setLngLat([loc.location.lng, loc.location.lat])
        .addTo(map.current)

      markersRef.current[loc.id!] = marker
    })
  }, [processedLocations, selectedId])

  return (
    <CitizenLayout>
      <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row overflow-hidden">
        
        {/* Map Panel */}
        <div className="relative flex-1 min-h-[40vh] md:min-h-0">
          <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

          {/* Filter chips overlay */}
          <div className="absolute top-4 left-4 right-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide z-10">
            {FILTER_TYPES.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all shadow-md backdrop-blur-md ${
                  filter === f ? 'bg-primary text-white border-primary' : 'bg-white/95 text-foreground border-border hover:border-primary/40'}`}>
                {f === 'All' ? 'All' : formatType(f)}
              </button>
            ))}
          </div>

          {/* Info badge */}
          <div className="absolute bottom-6 left-4 bg-white/95 backdrop-blur rounded-xl px-4 py-2.5 text-xs font-bold text-foreground shadow-lg flex items-center gap-2 z-10 border border-border">
            <span className="material-icons text-base text-primary">my_location</span>
            {processedLocations.length} locations found
          </div>
        </div>

        {/* Sidebar Panel */}
        <div className="w-full md:w-96 flex flex-col bg-background border-l border-border shadow-xl z-20 overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-border bg-card">
            <h1 className="font-heading font-bold text-lg text-foreground mb-1">Nearby Support</h1>
            <p className="text-xs text-muted-foreground">Find real-time verified assistance based on your location.</p>
          </div>

          {/* Location cards list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30">
            {processedLocations.length === 0 && (
              <div className="text-center p-8 text-muted-foreground">
                <span className="material-icons text-4xl mb-2 opacity-50">search_off</span>
                <p className="text-sm font-medium">No {filter !== 'All' ? formatType(filter) : 'locations'} found nearby.</p>
              </div>
            )}

            {processedLocations.map(loc => {
              const isSelected = selectedId === loc.id
              const distText = loc.distKm < 1 ? `${(loc.distKm * 1000).toFixed(0)} m` : `${loc.distKm.toFixed(1)} km`

              return (
                <div
                  key={loc.id}
                  onClick={() => {
                    setSelectedId(loc.id!)
                    if (loc.location?.lat && loc.location?.lng && map.current) {
                      map.current.flyTo({ center: [loc.location.lng, loc.location.lat], zoom: 15 })
                    }
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' 
                      : 'border-border bg-card hover:border-primary/40 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${getColor(loc.type)}`}>
                      <span className="material-icons text-2xl">{getIcon(loc.type)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="font-heading font-bold text-sm text-foreground truncate">{loc.name}</div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <span className="font-medium text-primary">{distText}</span>
                        <span>•</span>
                        <span className={`font-semibold ${loc.isOpen ? 'text-teal-600' : 'text-rose-600'}`}>
                          {loc.isOpen ? 'Open Now' : 'Closed'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="badge-tag">{formatType(loc.type)}</span>
                        {loc.capacity && (
                          <span className="badge-tag bg-blue-50 text-blue-700 border-blue-200">
                            {loc.currentOccupancy || 0}/{loc.capacity} Occupancy
                          </span>
                        )}
                      </div>

                      {isSelected && (
                        <div className="mt-3 animate-fade-in-up">
                          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                            <span className="font-semibold text-foreground">Address:</span> {loc.location.address}
                          </p>
                          <div className="flex gap-2 pt-3 border-t border-border">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`https://www.google.com/maps/dir/?api=1&destination=${loc.location.lat},${loc.location.lng}`)
                              }}
                              className="btn-primary text-xs py-2 flex-1 flex items-center justify-center gap-1 shadow-sm"
                            >
                              <span className="material-icons text-sm">directions</span>Directions
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                window.location.href = `tel:${loc.contactPhone}`
                              }}
                              className="btn-secondary text-xs py-2 flex-1 flex items-center justify-center gap-1"
                            >
                              <span className="material-icons text-sm">phone</span>{loc.contactPhone}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </CitizenLayout>
  )
}
