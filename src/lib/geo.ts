// TODO(person 1): geofire-common geohash query + radius expansion to find the
// best-matching NGO for a given report. Filled in next prompt.
import type { LatLng, Ngo, ReportCategory } from '@/types'

export function locationToGeohash(_loc: LatLng): string {
  throw new Error('not implemented')
}

export async function findMatchingNgo(_input: {
  location: LatLng
  category: ReportCategory
}): Promise<Ngo | null> {
  throw new Error('not implemented')
}
