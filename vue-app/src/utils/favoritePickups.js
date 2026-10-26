import { normalizeRecentPickup } from './recentDelivery.js'

export const MAX_FAVORITE_PICKUPS = 10

export function normalizeFavoritePickup(value) {
  const pickup = normalizeRecentPickup(value)
  if (!pickup || !pickup.city || !pickup.cityCode) return null
  return pickup
}

export function readFavoritePickups(storage, key) {
  try {
    const parsed = JSON.parse(storage.getItem(key) || '[]')
    if (!Array.isArray(parsed)) return []
    const codes = new Set()
    return parsed.map(normalizeFavoritePickup).filter(point => {
      if (!point || codes.has(point.code)) return false
      codes.add(point.code)
      return true
    }).slice(0, MAX_FAVORITE_PICKUPS)
  } catch {
    return []
  }
}

export function writeFavoritePickups(storage, key, points) {
  try {
    const codes = new Set()
    const normalized = points.map(normalizeFavoritePickup).filter(point => {
      if (!point || codes.has(point.code)) return false
      codes.add(point.code)
      return true
    }).slice(0, MAX_FAVORITE_PICKUPS)
    storage.setItem(key, JSON.stringify(normalized))
  } catch {
    // Checkout remains usable when browser storage is disabled.
  }
}
