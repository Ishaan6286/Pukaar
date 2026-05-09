import 'maplibre-gl/dist/maplibre-gl.css'
import maplibregl from 'maplibre-gl'
import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart } from 'lucide-react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'

import { Button } from '@/components/ui/button'
import HelpLocationPin from '@/components/HelpLocationPin'
import { db } from '@/lib/firebase'
import { DEFAULT_DEMO_LOCATION } from '@/constants'
import type { HelpLocation, HelpLocationType } from '@/types'

const ICON_BY_TYPE: Record<HelpLocationType, string> = {
  food_bank: '🍱',
  shelter: '🏠',
  animal_rescue: '🐾',
  community_kitchen: '🥣',
}

export default function HelpMap() {
  const navigate = useNavigate()
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const popupRootsRef = useRef<
    Array<{ root: ReturnType<typeof createRoot>; container: HTMLDivElement }>
  >([])
  const markersRef = useRef<maplibregl.Marker[]>([])
  const userMarkerRef = useRef<maplibregl.Marker | null>(null)
  const [locations, setLocations] = useState<HelpLocation[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = query(
      collection(db, 'help_locations'),
      where('type', '==', 'food_bank'),
    )
    const unsub = onSnapshot(
      q,
      (snap) => setLocations(snap.docs.map((d) => d.data() as HelpLocation)),
      (err) => setError(err.message),
    )
    return unsub
  }, [])

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
      center: [DEFAULT_DEMO_LOCATION.lng, DEFAULT_DEMO_LOCATION.lat],
      zoom: 12,
    })
    map.addControl(new maplibregl.NavigationControl(), 'top-right')
    mapRef.current = map

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const center: [number, number] = [pos.coords.longitude, pos.coords.latitude]
          map.flyTo({ center, zoom: 13 })

          const wrapper = document.createElement('div')
          wrapper.setAttribute('data-user-pin', '')
          wrapper.className = 'relative w-5 h-5'
          wrapper.innerHTML = `
            <div class="absolute inset-0 rounded-full bg-primary opacity-60 animate-ping"></div>
            <div class="relative w-5 h-5 rounded-full bg-primary border-2 border-white shadow-soft"></div>
          `

          userMarkerRef.current = new maplibregl.Marker({ element: wrapper })
            .setLngLat(center)
            .addTo(map)
        },
        () => {
          // Permission denied or unavailable — silently fall back to DEFAULT_DEMO_LOCATION.
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      )
    }

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    popupRootsRef.current.forEach(({ root }) => root.unmount())
    popupRootsRef.current = []
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    for (const loc of locations) {
      const popupContainer = document.createElement('div')
      const root = createRoot(popupContainer)
      root.render(
        <HelpLocationPin
          location={loc}
          onDirections={() => {
            window.open(
              `https://www.google.com/maps/dir/?api=1&destination=${loc.location.lat},${loc.location.lng}`,
              '_blank',
              'noopener,noreferrer',
            )
          }}
        />,
      )
      popupRootsRef.current.push({ root, container: popupContainer })

      const popup = new maplibregl.Popup({ offset: 25, closeButton: true }).setDOMContent(
        popupContainer,
      )

      const markerEl = document.createElement('div')
      markerEl.setAttribute('data-help-pin', '')
      markerEl.className =
        'flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground border-2 border-white shadow-lg'
      markerEl.innerText = ICON_BY_TYPE[loc.type] ?? '📍'

      const marker = new maplibregl.Marker(markerEl)
        .setLngLat([loc.location.lng, loc.location.lat])
        .setPopup(popup)
        .addTo(map)
      markersRef.current.push(marker)
    }
  }, [locations])

  useEffect(() => {
    return () => {
      popupRootsRef.current.forEach(({ root }) => root.unmount())
      popupRootsRef.current = []
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
      userMarkerRef.current?.remove()
      userMarkerRef.current = null
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Back" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="bg-brand-gradient w-8 h-8 rounded-xl flex items-center justify-center shadow-soft">
            <Heart aria-hidden="true" className="h-4 w-4 text-white" />
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-xl font-semibold tracking-tight">Food Banks Near You</h1>
          <p className="text-xs text-muted-foreground">
            Find a food bank when you need one
          </p>
        </div>
        <div className="w-16" />
      </div>
      <div className="flex-1 min-h-0 relative">
        <div ref={mapContainerRef} className="absolute inset-0" />
        {error && (
          <div className="absolute bottom-4 left-4 right-4 p-3 rounded-lg bg-destructive text-destructive-foreground text-sm">
            Couldn't load help locations: {error}
          </div>
        )}
        {!error && locations.length === 0 && (
          <div className="absolute bottom-4 left-4 right-4 p-3 rounded-lg bg-muted text-muted-foreground text-sm text-center">
            No food banks loaded yet. Check back in a moment.
          </div>
        )}
      </div>
    </div>
  )
}
