export function requestBrowserLocation(geolocation, timeoutMs = 12000) {
  if (!geolocation?.getCurrentPosition) {
    return Promise.reject(Object.assign(new Error('Geolocation unavailable'), { code: 'UNAVAILABLE' }))
  }

  return new Promise((resolve, reject) => {
    let settled = false
    const finish = (callback, value) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      callback(value)
    }
    const timer = setTimeout(() => {
      finish(reject, Object.assign(new Error('Geolocation timed out'), { code: 'TIMEOUT' }))
    }, timeoutMs)

    try {
      geolocation.getCurrentPosition(position => {
        const { latitude, longitude, accuracy } = position?.coords || {}
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
          finish(reject, Object.assign(new Error('Invalid coordinates'), { code: 'UNAVAILABLE' }))
          return
        }
        finish(resolve, { latitude, longitude, accuracy })
      }, error => {
        finish(reject, error)
      }, { enableHighAccuracy: false, timeout: Math.max(1000, timeoutMs - 2000), maximumAge: 300000 })
    } catch (error) {
      finish(reject, error)
    }
  })
}
