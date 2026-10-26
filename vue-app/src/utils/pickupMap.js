export function pickupCoordinates(point) {
  const latitude = Number(point?.location?.latitude ?? point?.latitude)
  const longitude = Number(point?.location?.longitude ?? point?.longitude)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180 || (latitude === 0 && longitude === 0)) return null
  return { latitude, longitude }
}

export function distanceKm(from, to) {
  const radians = degrees => degrees * Math.PI / 180
  const lat1 = radians(from.latitude)
  const lat2 = radians(to.latitude)
  const deltaLat = lat2 - lat1
  const deltaLon = radians(to.longitude - from.longitude)
  const arc = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc))
}

export function pickupMatchesHours(point, filter) {
  if (filter === 'all') return true
  const days = Array.isArray(point?.work_time_list) ? point.work_time_list : []
  if (filter === 'everyday') return new Set(days.filter(day => String(day.time || '').trim()).map(day => Number(day.day))).size === 7
  if (filter === 'late') {
    return days.some(day => {
      const closing = String(day.time || '').match(/(?:\/|[-–])\s*(\d{1,2}):(\d{2})\s*$/)
      return closing && Number(closing[1]) * 60 + Number(closing[2]) >= 20 * 60
    }) || /(?:20|21|22|23):\d{2}|24\/7|круглосуточно/i.test(String(point?.work_time || ''))
  }
  return true
}
