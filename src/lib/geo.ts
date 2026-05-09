import {
  collection,
  endAt,
  getDocs,
  orderBy,
  query,
  startAt,
  where,
} from 'firebase/firestore'
import {
  distanceBetween,
  geohashForLocation,
  geohashQueryBounds,
} from 'geofire-common'

import { db } from '@/lib/firebase'
import { RADIUS_EXPANSION_STEPS_M } from '@/constants'
import type { LatLng, Ngo, ReportCategory } from '@/types'

export function locationToGeohash(loc: LatLng): string {
  return geohashForLocation([loc.lat, loc.lng])
}

export async function findMatchingNgo(input: {
  location: LatLng
  category: ReportCategory
}): Promise<Ngo | null> {
  const { location, category } = input
  const center: [number, number] = [location.lat, location.lng]

  for (const radius of RADIUS_EXPANSION_STEPS_M) {
    const bounds = geohashQueryBounds(center, radius)
    const snapshots = await Promise.all(
      bounds.map((b) =>
        getDocs(
          query(
            collection(db, 'ngos'),
            where('categories', 'array-contains', category),
            orderBy('geohash'),
            startAt(b[0]),
            endAt(b[1]),
          ),
        ),
      ),
    )

    const seen = new Map<string, Ngo>()
    for (const snap of snapshots) {
      for (const docSnap of snap.docs) {
        if (!seen.has(docSnap.id)) {
          seen.set(docSnap.id, docSnap.data() as Ngo)
        }
      }
    }

    const within: Array<{ ngo: Ngo; distanceM: number }> = []
    for (const ngo of seen.values()) {
      const distanceM =
        distanceBetween(center, [ngo.location.lat, ngo.location.lng]) * 1000
      if (distanceM <= radius) {
        within.push({ ngo, distanceM })
      }
    }

    if (within.length > 0) {
      within.sort((a, b) => a.distanceM - b.distanceM)
      return within[0].ngo
    }
  }

  return null
}
