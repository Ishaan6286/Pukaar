import { geohashForLocation, distanceBetween, geohashQueryBounds } from 'geofire-common'
import { getDocs, query, orderBy, startAt, endAt, where } from 'firebase/firestore'
import { collections } from './firestore'
import type { NgoProfile } from '@/types'

/**
 * Generates a geohash for a given latitude and longitude.
 */
export function getGeohash(lat: number, lng: number): string {
  return geohashForLocation([lat, lng])
}

/**
 * Intelligent NGO Matching System
 * Finds the nearest verified NGO that serves the required category using Geohashing.
 * Falls back to expanding radius if no NGO is found.
 */
export async function findNearestNgo(
  lat: number, 
  lng: number,
  category?: string
): Promise<NgoProfile | null> {
  const center: [number, number] = [lat, lng]
  
  // Define our search rings (in meters)
  const radiusSteps = [
    5 * 1000,    // 5 km (Immediate vicinity)
    15 * 1000,   // 15 km (City level)
    50 * 1000,   // 50 km (Regional)
    200 * 1000   // 200 km (Wide net fallback)
  ]

  try {
    for (const radiusInM of radiusSteps) {
      // 1. Calculate Geohash Bounds for current radius
      const bounds = geohashQueryBounds(center, radiusInM)
      
      const promises = bounds.map((b) => {
        // Note: Firestore requires a composite index for:
        // verificationStatus (ASC) + location.geohash (ASC)
        const q = query(
          collections.ngos,
          where('verificationStatus', '==', 'verified'),
          orderBy('location.geohash'),
          startAt(b[0]),
          endAt(b[1])
        )
        return getDocs(q)
      })

      // 2. Execute bounded queries concurrently
      const snapshots = await Promise.all(promises)
      
      const matchingNgos: { ngo: NgoProfile; distance: number }[] = []

      // 3. Process results and calculate exact distances
      for (const snap of snapshots) {
        for (const doc of snap.docs) {
          const ngo = doc.data() as NgoProfile
          
          if (!ngo.location || !ngo.location.lat || !ngo.location.lng) continue

          // Exact distance check (Geohash bounds are rectangular, radius is circular)
          const distanceInKm = distanceBetween(
            center, 
            [ngo.location.lat, ngo.location.lng]
          )
          
          const distanceInM = distanceInKm * 1000

          if (distanceInM <= radiusInM) {
            // Apply category filter if provided
            if (category && ngo.categories && ngo.categories.length > 0) {
              if (ngo.categories.includes(category)) {
                matchingNgos.push({ ngo, distance: distanceInKm })
              }
            } else {
              // No category filter, accept any verified NGO in radius
              matchingNgos.push({ ngo, distance: distanceInKm })
            }
          }
        }
      }

      // 4. If we found NGOs in this radius, sort by exact distance and return nearest
      if (matchingNgos.length > 0) {
        matchingNgos.sort((a, b) => a.distance - b.distance)
        return matchingNgos[0].ngo
      }
      
      // Otherwise, loop continues and expands to the next radius step
    }

    // 5. Absolute fallback: If no NGO found within 200km, just fetch any verified NGO globally
    console.warn('No NGO found within max radius. Falling back to global search.')
    const fallbackQuery = query(
      collections.ngos,
      where('verificationStatus', '==', 'verified')
    )
    const fallbackSnap = await getDocs(fallbackQuery)
    if (!fallbackSnap.empty) {
      // Return the first one found
      return fallbackSnap.docs[0].data() as NgoProfile
    }

    return null
    
  } catch (error) {
    console.error('Error finding nearest NGO:', error)
    return null
  }
}
