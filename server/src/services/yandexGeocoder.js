import axios from 'axios'

const MOSCOW_CENTER = { lat: 55.755864, lon: 37.617698 }
const MKAD_APPROX_POLYGON = [
  { lat: 55.9127, lon: 37.3956 },
  { lat: 55.9096, lon: 37.4976 },
  { lat: 55.9042, lon: 37.5910 },
  { lat: 55.8957, lon: 37.6911 },
  { lat: 55.8757, lon: 37.7860 },
  { lat: 55.8326, lon: 37.8418 },
  { lat: 55.7634, lon: 37.8429 },
  { lat: 55.7016, lon: 37.8424 },
  { lat: 55.6383, lon: 37.7886 },
  { lat: 55.5825, lon: 37.7036 },
  { lat: 55.5742, lon: 37.5935 },
  { lat: 55.5750, lon: 37.4950 },
  { lat: 55.6105, lon: 37.4219 },
  { lat: 55.6825, lon: 37.3703 },
  { lat: 55.7616, lon: 37.3683 },
  { lat: 55.8370, lon: 37.3835 }
]
const ACCEPTED_PRECISIONS = new Set(['exact', 'number'])
const ADDRESS_EXTRA_DETAILS_RE =
  /(?:^|[,\s;])((?:(?:кв(?:артира)?\.?|ап(?:артаменты|\.)?|офис|пом(?:ещение)?\.?|подъезд|этаж|домофон)\s*(?:№|#|n|no|номер)?\s*[\p{L}\d/-]+|частный\s+дом)(?:[\s,;/-].*)?)$/iu

function toRadians(value) {
  return Number(value) * Math.PI / 180
}

function getDistanceKm(a, b) {
  const earthRadiusKm = 6371
  const dLat = toRadians(b.lat - a.lat)
  const dLon = toRadians(b.lon - a.lon)
  const lat1 = toRadians(a.lat)
  const lat2 = toRadians(b.lat)

  const haversine =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}

function isPointInsidePolygon(point, polygon) {
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const current = polygon[i]
    const previous = polygon[j]

    const intersects =
      current.lat > point.lat !== previous.lat > point.lat &&
      point.lon <
        ((previous.lon - current.lon) * (point.lat - current.lat)) /
          (previous.lat - current.lat) +
          current.lon

    if (intersects) inside = !inside
  }

  return inside
}

function getAddressComponents(meta) {
  return meta?.Address?.Components || []
}

function hasMoscowLocality(components) {
  return components.some(component => {
    const kind = String(component.kind || '').toLowerCase()
    const name = String(component.name || '').trim().toLowerCase()
    return ['locality', 'province'].includes(kind) && name === 'москва'
  })
}

function hasHouseComponent(components) {
  return components.some(component => String(component.kind || '').toLowerCase() === 'house')
}

function parsePoint(point) {
  const [lon, lat] = String(point?.pos || '').split(' ').map(Number)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  return { lat, lon }
}

function getFirstGeoObject(data) {
  return data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject || null
}

function normalizeAddressExtraDetails(details) {
  const cleanDetails = String(details || '').replace(/\s+/g, ' ').trim()
  if (!cleanDetails) return ''

  return cleanDetails
    .replace(/^кв(?:артира)?\.?\s*/i, 'кв. ')
    .replace(/^ап(?:артаменты|\.)?\s*/i, 'ап. ')
    .replace(/^пом(?:ещение)?\.?\s*/i, 'пом. ')
    .replace(/^частный\s+дом/i, 'частный дом')
    .replace(/\s+/g, ' ')
    .trim()
}

function splitCourierAddressDetails(address) {
  const cleanAddress = String(address || '').replace(/\s+/g, ' ').trim()
  const match = cleanAddress.match(ADDRESS_EXTRA_DETAILS_RE)

  if (!match) {
    return {
      originalAddress: cleanAddress,
      geocodeAddress: cleanAddress,
      extraDetails: ''
    }
  }

  const geocodeAddress = cleanAddress
    .slice(0, match.index)
    .replace(/[,\s;]+$/g, '')
    .trim()
  const extraDetails = normalizeAddressExtraDetails(match[1])

  if (geocodeAddress.length < 6 || !extraDetails) {
    return {
      originalAddress: cleanAddress,
      geocodeAddress: cleanAddress,
      extraDetails: ''
    }
  }

  return {
    originalAddress: cleanAddress,
    geocodeAddress,
    extraDetails
  }
}

function withCourierAddressDetails(address, extraDetails) {
  const normalizedAddress = String(address || '').trim()
  const normalizedDetails = normalizeAddressExtraDetails(extraDetails)
  if (!normalizedAddress || !normalizedDetails) return normalizedAddress

  return `${normalizedAddress}, ${normalizedDetails}`
}

export async function validateMoscowCourierAddress(address) {
  const apiKey = String(process.env.YANDEX_GEOCODER_API_KEY || '').trim()
  const { originalAddress, geocodeAddress, extraDetails } = splitCourierAddressDetails(address)

  if (!apiKey) {
    return {
      valid: false,
      code: 'YANDEX_NOT_CONFIGURED',
      message: 'Проверка адреса временно недоступна. Не настроен ключ Яндекс Геокодера.'
    }
  }

  if (originalAddress.length < 6 || geocodeAddress.length < 6) {
    return {
      valid: false,
      code: 'ADDRESS_TOO_SHORT',
      message: 'Укажите полный адрес: улицу и номер дома.'
    }
  }

  const query = /(^|[\s,])москва([\s,]|$)/i.test(geocodeAddress)
    ? geocodeAddress
    : `Москва, ${geocodeAddress}`

  const response = await axios.get('https://geocode-maps.yandex.ru/v1/', {
    timeout: Number(process.env.YANDEX_GEOCODER_TIMEOUT_MS || 10000),
    params: {
      apikey: apiKey,
      geocode: query,
      lang: 'ru_RU',
      format: 'json',
      results: 1
    },
    validateStatus: () => true
  })

  if (Number(response.status || 0) >= 400) {
    return {
      valid: false,
      code: 'YANDEX_REQUEST_FAILED',
      message: 'Не удалось проверить адрес через Яндекс. Попробуйте ещё раз.',
      details: response.data
    }
  }

  const geoObject = getFirstGeoObject(response.data)
  if (!geoObject) {
    return {
      valid: false,
      code: 'ADDRESS_NOT_FOUND',
      message: 'Яндекс не нашёл такой адрес. Проверьте улицу и номер дома.'
    }
  }

  const meta = geoObject?.metaDataProperty?.GeocoderMetaData || {}
  const point = parsePoint(geoObject?.Point)
  const components = getAddressComponents(meta)
  const precision = String(meta.precision || '').toLowerCase()
  const kind = String(meta.kind || '').toLowerCase()
  const normalizedAddress = withCourierAddressDetails(
    meta?.Address?.formatted || geoObject?.name || geocodeAddress,
    extraDetails
  )

  if (!point) {
    return {
      valid: false,
      code: 'COORDINATES_NOT_FOUND',
      message: 'Не удалось определить координаты адреса. Уточните адрес.'
    }
  }

  if (!hasMoscowLocality(components)) {
    return {
      valid: false,
      code: 'NOT_MOSCOW',
      message: 'Курьерская доставка доступна только по Москве в пределах МКАД.',
      normalizedAddress,
      coordinates: point
    }
  }

  if (kind !== 'house' || !hasHouseComponent(components) || !ACCEPTED_PRECISIONS.has(precision)) {
    return {
      valid: false,
      code: 'HOUSE_REQUIRED',
      message: 'Укажите точный адрес с номером дома.',
      normalizedAddress,
      coordinates: point
    }
  }

  const distanceFromCenterKm = getDistanceKm(MOSCOW_CENTER, point)
  if (!isPointInsidePolygon(point, MKAD_APPROX_POLYGON)) {
    return {
      valid: false,
      code: 'OUTSIDE_MKAD',
      message: 'Адрес находится за пределами МКАД. Выберите СДЭК или самовывоз.',
      normalizedAddress,
      coordinates: point,
      distanceFromCenterKm
    }
  }

  return {
    valid: true,
    normalizedAddress,
    coordinates: point,
    precision,
    distanceFromCenterKm
  }
}

export default {
  validateMoscowCourierAddress
}
