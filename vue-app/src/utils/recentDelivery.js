const MAX_RECENT = 3

function clean(value, max = 160) {
  return String(value || '').trim().slice(0, max)
}

export function normalizeRecentCity(value) {
  const name = clean(value?.name || value?.city, 100)
  const code = clean(value?.code || value?.cityCode, 30)
  if (!name || !code) return null
  return {
    name,
    code,
    country: clean(value?.country || value?.cityCountry, 80),
    countryCode: clean(value?.countryCode || value?.cityCountryCode, 10)
  }
}

export function normalizeRecentPickup(value) {
  const code = clean(value?.code || value?.pickupPoint?.code || value?.deliveryPickupPoint, 40)
  if (!code) return null
  return {
    code,
    name: clean(value?.name || value?.pickupPoint?.name || value?.deliveryPickupName, 100) || code,
    address: clean(value?.address || value?.pickupPoint?.address || value?.shippingAddress, 200),
    city: clean(value?.city || value?.deliveryCity, 100),
    cityCode: clean(value?.cityCode, 30),
    country: clean(value?.country || value?.cityCountry, 80),
    countryCode: clean(value?.countryCode || value?.cityCountryCode, 10)
  }
}

export function mergeRecent(list, entry, key = 'code') {
  if (!entry) return Array.isArray(list) ? list.slice(0, MAX_RECENT) : []
  const previous = Array.isArray(list) ? list : []
  return [entry, ...previous.filter(item => String(item?.[key]) !== String(entry[key]))].slice(0, MAX_RECENT)
}

export function readRecentDelivery(storage, key) {
  try {
    const parsed = JSON.parse(storage.getItem(key) || '{}')
    return {
      cities: (Array.isArray(parsed.cities) ? parsed.cities : []).map(normalizeRecentCity).filter(Boolean).slice(0, MAX_RECENT),
      pickups: (Array.isArray(parsed.pickups) ? parsed.pickups : []).map(normalizeRecentPickup).filter(Boolean).slice(0, MAX_RECENT)
    }
  } catch {
    return { cities: [], pickups: [] }
  }
}

export function writeRecentDelivery(storage, key, history) {
  try {
    storage.setItem(key, JSON.stringify({
      cities: (history.cities || []).slice(0, MAX_RECENT),
      pickups: (history.pickups || []).slice(0, MAX_RECENT)
    }))
  } catch {
    // Storage can be disabled; checkout must keep working.
  }
}
