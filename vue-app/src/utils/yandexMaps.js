let mapsApiPromise = null

export function loadYandexMaps(apiKey) {
  if (!apiKey) return Promise.reject(new Error('Yandex Maps API key is missing'))
  if (window.ymaps?.Map) return Promise.resolve(window.ymaps)
  if (mapsApiPromise) return mapsApiPromise

  mapsApiPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    const timeout = window.setTimeout(() => fail(new Error('Yandex Maps API timed out')), 15000)
    let finished = false

    function fail(error) {
      if (finished) return
      finished = true
      window.clearTimeout(timeout)
      script.remove()
      reject(error)
    }

    script.async = true
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(apiKey)}&lang=ru_RU`
    script.onerror = () => fail(new Error('Yandex Maps API failed to load'))
    script.onload = () => {
      if (!window.ymaps?.ready) return fail(new Error('Yandex Maps API is unavailable'))
      window.ymaps.ready(() => {
        if (finished) return
        finished = true
        window.clearTimeout(timeout)
        resolve(window.ymaps)
      }, fail)
    }
    document.head.append(script)
  }).catch(error => {
    mapsApiPromise = null
    throw error
  })

  return mapsApiPromise
}
