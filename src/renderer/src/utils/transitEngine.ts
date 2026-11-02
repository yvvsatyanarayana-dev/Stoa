export interface TransitEstimate {
  transitMinutes: number
  mode: 'flight' | 'drive' | 'transit' | 'walk'
  distanceKm: number
  isCrossTimezone: boolean
  timezoneDifferenceHours: number
}

const MAJOR_CITIES: Record<string, { lat: number; lon: number; tz: number }> = {
  'new york': { lat: 40.71, lon: -74.0, tz: -5 },
  'nyc': { lat: 40.71, lon: -74.0, tz: -5 },
  'london': { lat: 51.5, lon: -0.12, tz: 0 },
  'paris': { lat: 48.85, lon: 2.35, tz: 1 },
  'berlin': { lat: 52.52, lon: 13.4, tz: 1 },
  'tokyo': { lat: 35.67, lon: 139.65, tz: 9 },
  'san francisco': { lat: 37.77, lon: -122.41, tz: -8 },
  'sf': { lat: 37.77, lon: -122.41, tz: -8 },
  'los angeles': { lat: 34.05, lon: -118.24, tz: -8 },
  'la': { lat: 34.05, lon: -118.24, tz: -8 },
  'chicago': { lat: 41.87, lon: -87.62, tz: -6 },
  'singapore': { lat: 1.35, lon: 103.81, tz: 8 },
  'sydney': { lat: -33.86, lon: 151.2, tz: 10 },
  'toronto': { lat: 43.65, lon: -79.38, tz: -5 },
  'seattle': { lat: 47.6, lon: -122.33, tz: -8 },
  'boston': { lat: 42.36, lon: -71.05, tz: -5 },
  'mumbai': { lat: 19.07, lon: 72.87, tz: 5.5 },
  'delhi': { lat: 28.61, lon: 77.2, tz: 5.5 },
  'bengaluru': { lat: 12.97, lon: 77.59, tz: 5.5 },
  'hyderabad': { lat: 17.38, lon: 78.48, tz: 5.5 }
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

export function estimateOfflineTransit(origin: string, destination: string): TransitEstimate {
  const o = (origin || '').trim().toLowerCase()
  const d = (destination || '').trim().toLowerCase()

  if (!o || !d || o === d || o.includes('zoom') || d.includes('zoom') || o.includes('meet') || d.includes('meet') || o.includes('online') || d.includes('online')) {
    return { transitMinutes: 0, mode: 'walk', distanceKm: 0, isCrossTimezone: false, timezoneDifferenceHours: 0 }
  }

  // Same building / campus transition
  if ((o.includes('room') && d.includes('room')) || (o.includes('hall') && d.includes('hall')) || (o.includes('floor') && d.includes('floor')) || (o.includes('lab') && d.includes('lab'))) {
    return { transitMinutes: 10, mode: 'walk', distanceKm: 0.5, isCrossTimezone: false, timezoneDifferenceHours: 0 }
  }

  let originCity: { lat: number; lon: number; tz: number } | null = null
  let destCity: { lat: number; lon: number; tz: number } | null = null

  for (const [key, coords] of Object.entries(MAJOR_CITIES)) {
    if (o.includes(key)) originCity = coords
    if (d.includes(key)) destCity = coords
  }

  if (originCity && destCity && originCity !== destCity) {
    const dist = haversineDistance(originCity.lat, originCity.lon, destCity.lat, destCity.lon)
    const flightMinutes = Math.round((dist / 800) * 60) + 120 // 2h airport/security buffer
    const tzDiff = Math.abs(destCity.tz - originCity.tz)
    return {
      transitMinutes: flightMinutes,
      mode: dist > 500 ? 'flight' : 'drive',
      distanceKm: dist,
      isCrossTimezone: tzDiff > 0,
      timezoneDifferenceHours: tzDiff
    }
  }

  // Intra-city distinct locations heuristic
  return {
    transitMinutes: 35,
    mode: 'drive',
    distanceKm: 18,
    isCrossTimezone: false,
    timezoneDifferenceHours: 0
  }
}
