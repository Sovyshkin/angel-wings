import crypto from 'crypto'

const CDEK_ACCOUNT = process.env.CDEK_ACCOUNT
const CDEK_PASSWORD = process.env.CDEK_PASSWORD
const CDEK_URL = process.env.CDEK_URL || 'https://api.cdek.ru/v2'
const CDEK_TOKEN_URL = process.env.CDEK_TOKEN_URL || 'https://api.cdek.ru/v2/oauth/token'

const CDEK_SENDER_LOCATION = {
  code: 44,
  city: 'Москва',
  address: 'Волоколамский пр-д, 1',
  postal_code: '125424'
}

const CIS_FAST_DELIVERY_COUNTRY_CODES = new Set(['KZ', 'BY', 'KG', 'AM', 'UZ', 'AZ', 'MD'])
const CIS_FAST_DELIVERY_COUNTRY_NAMES = new Set([
  'казахстан',
  'беларусь',
  'белоруссия',
  'кыргызстан',
  'киргизия',
  'армения',
  'узбекистан',
  'азербайджан',
  'молдова',
  'молдавия'
])

function normalizeCountryText(value) {
  return String(value || '').trim().toLowerCase().replace(/ё/g, 'е')
}

export function isCisFastDeliveryCountry(value) {
  const normalized = normalizeCountryText(value)
  if (!normalized) return false

  return CIS_FAST_DELIVERY_COUNTRY_CODES.has(normalized.toUpperCase()) ||
    CIS_FAST_DELIVERY_COUNTRY_NAMES.has(normalized)
}

export function isCisFastDeliveryLocation(location = {}) {
  return [
    location.country_code,
    location.countryCode,
    location.country,
    location.country_name,
    location.countryName
  ].some(isCisFastDeliveryCountry)
}

function isFastCisTariff(tariff = {}) {
  const name = normalizeCountryText(tariff.tariff_name || tariff.name || tariff.description)
  return name.includes('быстро') && !name.includes('очень')
}

function normalizeTariffList(result) {
  if (Array.isArray(result)) return result
  if (Array.isArray(result?.tariff_codes)) return result.tariff_codes
  if (Array.isArray(result?.tariffs)) return result.tariffs
  return []
}

function normalizeCalculatorPackages({ packages, weight, length, width, height }) {
  if (Array.isArray(packages) && packages.length) {
    return packages.map(pkg => ({
      weight: Math.max(1, Number(pkg.weight) || 1),
      length: Number(pkg.length) || 10,
      width: Number(pkg.width) || 10,
      height: Number(pkg.height) || 10
    }))
  }

  return [{
    weight: Math.max(1, Number(weight) || 1),
    length: Number(length) || 10,
    width: Number(width) || 10,
    height: Number(height) || 10
  }]
}

function isEnvEnabled(value, defaultValue = true) {
  if (value === undefined || value === null || value === '') return defaultValue
  return !['0', 'false', 'no', 'off'].includes(String(value).trim().toLowerCase())
}

function normalizeServiceCode(value) {
  return String(value || '').trim().toUpperCase()
}

function getDefaultRecipientServices(recipientPhone) {
  if (!isEnvEnabled(process.env.CDEK_ENABLE_RECIPIENT_SMS, true)) {
    return []
  }

  const serviceCodes = String(process.env.CDEK_SMS_SERVICE_CODES || 'SMS')
    .split(',')
    .map(normalizeServiceCode)
    .filter(Boolean)

  return serviceCodes.map(code => {
    const service = { code }

    // For the SMS service CDEK expects the recipient phone in the parameter field.
    if (code === 'SMS') {
      service.parameter = recipientPhone
    }

    return service
  })
}

function normalizeCdekServices(services = [], recipientPhone) {
  const normalized = []
  const seen = new Set()

  const addService = (service) => {
    const item = typeof service === 'string' ? { code: service } : service
    const code = normalizeServiceCode(item?.code)

    if (!code) return

    const normalizedService = { ...item, code }
    if (code === 'SMS' && !normalizedService.parameter) {
      normalizedService.parameter = recipientPhone
    }

    const key = `${normalizedService.code}:${normalizedService.parameter || ''}`
    if (seen.has(key)) return

    seen.add(key)
    normalized.push(normalizedService)
  }

  getDefaultRecipientServices(recipientPhone).forEach(addService)

  if (Array.isArray(services)) {
    services.forEach(addService)
  }

  return normalized
}

function log(level, message, data = null) {
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] [CDEK] ${message}`
  console.log(logMessage, data ? JSON.stringify(data, null, 2) : '')
}

// Получение OAuth токена
let cachedToken = null
let tokenExpiry = 0

export async function getAuthToken() {
  // Проверяем кэш токена
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken
  }

  if (!CDEK_ACCOUNT || !CDEK_PASSWORD) {
    throw new Error('CDEK credentials not configured. Set CDEK_ACCOUNT and CDEK_PASSWORD in .env')
  }

  const credentials = Buffer.from(`${CDEK_ACCOUNT}:${CDEK_PASSWORD}`).toString('base64')

  try {
    log('info', 'Getting OAuth token from CDEK')
    
    // Пробуем разные форматы авторизации
    const response = await fetch(CDEK_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: `grant_type=client_credentials&client_id=${CDEK_ACCOUNT}&client_secret=${CDEK_PASSWORD}`
    })

    const data = await response.json()
    log('debug', 'Token response:', data)

    if (data.access_token) {
      cachedToken = data.access_token
      tokenExpiry = Date.now() + (data.expires_in || 3600) * 1000 - 60000 // запас 60 секунд
      return cachedToken
    }

    throw new Error('No access_token in response: ' + JSON.stringify(data))
  } catch (error) {
    log('error', 'Failed to get CDEK token:', error)
    throw error
  }
}

// Универсальный запрос к API СДЭК
async function cdekRequest(endpoint, method = 'GET', body = null) {
  const token = await getAuthToken()

  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  log('info', `${method} ${CDEK_URL}${endpoint}`)
  if (body) log('debug', 'Body:', body)

  try {
    const response = await fetch(`${CDEK_URL}${endpoint}`, options)
    const responseText = await response.text()
    log('info', `Response status: ${response.status}`)

    let result
    try {
      result = JSON.parse(responseText)
    } catch {
      result = { raw: responseText }
    }

    log('debug', 'Response:', result)

    if (!response.ok) {
      throw { status: response.status, data: result }
    }

    return result
  } catch (error) {
    log('error', `API request failed: ${error.message || JSON.stringify(error)}`)
    throw error
  }
}

// ==================== КАЛЬКУЛЯТОР ====================

const FALLBACK_TARIFFS = [
  { id: 136, name: 'Экспресс лайт склад-склад', description: 'ПВЗ → ПВЗ', delivery_mode: 1 },
  { id: 137, name: 'Экспресс лайт склад-дверь', description: 'ПВЗ/склад → дверь', delivery_mode: 2 },
  { id: 138, name: 'Экспресс лайт дверь-дверь', description: 'Дверь → дверь', delivery_mode: 2 }
]

// Получить список тарифов
export async function getTariffs() {
  try {
    return await cdekRequest('/tariff/list', 'POST', {
      type: 1 // 1 - все тарифы
    })
  } catch (error) {
    if (error?.status === 410) {
      log('warn', 'Tariff list endpoint returned 410. Using local fallback tariffs.')
      return FALLBACK_TARIFFS
    }
    throw error
  }
}

// Расчёт стоимости доставки по конкретному тарифу
export async function calculateDeliveryByTariff({ tariff_code, from_code, to_code, weight, length, width, height }) {
  const packages = normalizeCalculatorPackages({ weight, length, width, height })
  // Для /calculator/tariff поле date не является обязательным - убираем его
  return cdekRequest('/calculator/tariff', 'POST', {
    tariff_code,
    from_location: { ...CDEK_SENDER_LOCATION },
    to_location: { code: to_code },
    packages
  })
}

// Расчёт стоимости доставки (автоматический выбор тарифа)
export async function calculateDelivery({ from_code, to_code, weight, length, width, height }) {
  const packages = normalizeCalculatorPackages({ weight, length, width, height })
  // Для /calculator поле date не является обязательным - убираем его
  return cdekRequest('/calculator', 'POST', {
    from_location: { ...CDEK_SENDER_LOCATION },
    to_location: { code: to_code },
    packages
  })
}

export async function getAvailableTariffs({ to_code, packages, weight, length, width, height }) {
  return cdekRequest('/calculator/tarifflist', 'POST', {
    from_location: { ...CDEK_SENDER_LOCATION },
    to_location: { code: to_code },
    packages: normalizeCalculatorPackages({ packages, weight, length, width, height })
  })
}

async function getDestinationLocation({ to_code, to_location }) {
  const destination = { ...(to_location || {}) }

  if (!destination.code && to_code) {
    destination.code = to_code
  }

  if (!isCisFastDeliveryLocation(destination) && destination.code) {
    try {
      const cityInfo = await getCityInfo(destination.code)
      Object.assign(destination, cityInfo || {})
    } catch (error) {
      log('warn', 'Could not resolve destination country for tariff override.', {
        to_code: destination.code,
        error: error?.message || error?.data || error
      })
    }
  }

  return destination
}

async function resolveTariffForDestination({ tariff_code, to_code, to_location, packages, weight, length, width, height }) {
  const destination = await getDestinationLocation({ to_code, to_location })

  if (!isCisFastDeliveryLocation(destination)) {
    return { tariff_code, tariff_name: null, overridden: false }
  }

  const tariffList = await getAvailableTariffs({
    to_code: destination.code || to_code,
    packages,
    weight,
    length,
    width,
    height
  })
  const fastTariff = normalizeTariffList(tariffList).find(isFastCisTariff)

  if (!fastTariff?.tariff_code) {
    throw new Error('Для доставки в страны СНГ нужен тариф СДЭК "Быстро", но СДЭК не вернул его для выбранного направления. Попробуйте другой город или ПВЗ.')
  }

  return {
    tariff_code: Number(fastTariff.tariff_code),
    tariff_name: fastTariff.tariff_name || fastTariff.name || 'Быстро',
    overridden: Number(fastTariff.tariff_code) !== Number(tariff_code)
  }
}

export async function calculateDeliveryWithDestinationTariff({
  tariff_code,
  to_code,
  to_location,
  weight,
  length,
  width,
  height
}) {
  const resolvedTariff = await resolveTariffForDestination({
    tariff_code,
    to_code,
    to_location,
    weight,
    length,
    width,
    height
  })

  const result = await calculateDeliveryByTariff({
    tariff_code: resolvedTariff.tariff_code,
    to_code,
    weight,
    length,
    width,
    height
  })

  return {
    ...result,
    selected_tariff_code: resolvedTariff.tariff_code,
    selected_tariff_name: resolvedTariff.tariff_name || result?.tariff_name || null,
    tariff_overridden: resolvedTariff.overridden
  }
}

// ==================== ПВЗ (Пункты выдачи заказов) ====================

// Получить список ПВЗ
export async function getPickupPoints({ city_code, postcode, limit = 50 }) {
  const params = new URLSearchParams()
  if (city_code) params.append('city_code', city_code)
  if (postcode) params.append('postal_code', postcode)
  params.append('limit', limit)
  params.append('type', 'PVZ')

  return cdekRequest(`/deliverypoints?${params.toString()}`, 'GET')
}

// Получить информацию о конкретном ПВЗ
export async function getPickupPoint(code) {
  return cdekRequest(`/deliverypoints/${code}`, 'GET')
}

// ==================== ЛОКАЦИИ ====================

// Поиск города по названию
export async function findCity(name) {
  // GET запрос с параметром city в query
  return cdekRequest(`/location/cities?city=${encodeURIComponent(name)}`, 'GET')
}

// Получить информацию о городе по коду
export async function getCityInfo(code) {
  return cdekRequest(`/location/cities/${code}`, 'GET')
}

// ==================== ЗАКАЗЫ ====================

export function normalizePackageItems(pkg, packageIndex) {
  const providedItems = Array.isArray(pkg.items) && pkg.items.length ? pkg.items : null
  const sourceItems = providedItems || [pkg]

  return sourceItems.map((item, itemIndex) => {
    const amount = Math.max(1, parseInt(item.amount, 10) || 1)
    const rawCost = Math.max(0, Number(item.cost) || 0)
    const rawWeight = Math.max(1, parseInt(item.weight, 10) || 0)

    // Legacy payloads stored the whole line total in cost. CDEK expects a unit price.
    const unitCost = providedItems ? rawCost : rawCost / amount
    const unitWeight = providedItems ? rawWeight : Math.max(1, Math.round(rawWeight / amount))

    return {
      name: item.name || pkg.name || 'Товар',
      ware_key: item.ware_key || pkg.ware_key || `ITEM-${packageIndex + 1}-${itemIndex + 1}`,
      payment: { type: 'prepayment', value: 0 },
      cost: Math.round(unitCost * 100) / 100,
      amount,
      weight: unitWeight
    }
  })
}

// Создать заказ на доставку
export async function createOrder({ 
  number, 
  tariff_code, 
  comment,
  recipient_name,
  recipient_phone,
  recipient_email,
  delivery_point, // код ПВЗ
  to_location,
  packages,
  from_contact,
  address,
  delivery_recipient_cost,
  services
}) {
  const resolvedTariff = await resolveTariffForDestination({
    tariff_code: tariff_code || 137,
    to_code: to_location?.code,
    to_location,
    packages
  })

  if (resolvedTariff.overridden) {
    log('info', 'CIS destination detected. Tariff overridden to CDEK Fast.', {
      order: number,
      requestedTariffCode: tariff_code,
      selectedTariffCode: resolvedTariff.tariff_code,
      selectedTariffName: resolvedTariff.tariff_name
    })
  }

  const orderPayload = {
    number: String(number),
    tariff_code: resolvedTariff.tariff_code || tariff_code || 137, // safer default for pickup flow; explicit value should be passed from client
    comment: comment || '',
    // Фиксированный адрес отправления
    from_location: { ...CDEK_SENDER_LOCATION },
    recipient: {
      name: recipient_name,
      phones: [{ number: recipient_phone }],
      email: recipient_email
    },
    packages: packages.map((pkg, idx) => ({
      number: `PKG-${number}-${idx + 1}`, // Уникальный номер посылки
      weight: pkg.weight,
      length: pkg.length || 10,
      width: pkg.width || 10,
      height: pkg.height || 10,
      items: normalizePackageItems(pkg, idx).map((item, itemIndex) => ({
        ...item,
        ware_key: item.ware_key || `ITEM-${number}-${idx + 1}-${itemIndex + 1}`
      }))
    }))
  }

  const hasDeliveryPoint = Boolean(delivery_point)
  const recipientDeliveryCostValue = typeof delivery_recipient_cost === 'object' && delivery_recipient_cost !== null
    ? delivery_recipient_cost.value
    : delivery_recipient_cost
  const recipientDeliveryCost = Math.max(0, Number(recipientDeliveryCostValue) || 0)

  if (recipientDeliveryCost > 0) {
    // СДЭК взимает эту сумму с получателя, сайт ее не принимает в оплату.
    orderPayload.delivery_recipient_cost = {
      value: Math.round(recipientDeliveryCost * 100) / 100
    }
  }

  const cdekServices = normalizeCdekServices(services, recipient_phone)
  if (cdekServices.length > 0) {
    orderPayload.services = cdekServices
  }

  // Если указан ПВЗ, to_location/address передавать нельзя
  if (hasDeliveryPoint) {
    orderPayload.delivery_point = delivery_point
  } else {
    // Для курьера обязателен адрес получателя
    if (to_location && (to_location.code || to_location.address || to_location.city)) {
      orderPayload.to_location = { ...to_location }
    } else if (address) {
      orderPayload.to_location = { address }
    }
  }

  // Контакт отправителя
  if (from_contact) {
    orderPayload.sender = from_contact
  }

  log('info', 'Creating CDEK order:', orderPayload)
  return cdekRequest('/orders', 'POST', orderPayload)
}

// Получить информацию о заказе
export async function getOrder(uuid) {
  return cdekRequest(`/orders/${uuid}`, 'GET')
}

// Получить список заказов
export async function getOrders({ order_number, date_from, date_to }) {
  const params = new URLSearchParams()
  if (order_number) params.append('order_number', order_number)
  if (date_from) params.append('date_from', date_from)
  if (date_to) params.append('date_to', date_to)

  return cdekRequest(`/orders?${params.toString()}`, 'GET')
}

// Удалить заказ
export async function deleteOrder(uuid) {
  return cdekRequest(`/orders/${uuid}`, 'DELETE')
}

// Отменить заказ
export async function cancelOrder(uuid) {
  return cdekRequest(`/orders/${uuid}/cancel`, 'POST')
}

// ==================== КУРЬЕР ====================

// Вызвать курьера
export async function callCourier({ 
  date, 
  time_from, 
  time_to, 
  lunch_from, 
  lunch_to,
  contact,
  address
}) {
  return cdekRequest('/courier', 'POST', {
    date,
    time_from,
    time_to,
    lunch_from,
    lunch_to,
    contact,
    address
  })
}

// ==================== ШАБЛОНЫ ПЕЧАТИ ====================

// Получить UUID печатной формы
export async function getPrintForm(order_uuid) {
  return cdekRequest(`/orders/${order_uuid}/print`, 'POST')
}

// ==================== БАЛАНС И СТАТУСЫ ====================

// Информация о балансе
export async function getBalance() {
  try {
    return await cdekRequest('/accounting/balance', 'GET')
  } catch (error) {
    if (error?.status === 410) {
      log('warn', 'Balance endpoint returned 410. Returning fallback balance object.')
      return {
        balance: 0,
        orders_balance: 0,
        unavailable: true,
        message: 'Endpoint /accounting/balance currently unavailable (410 Gone)'
      }
    }
    throw error
  }
}

// Статусы заказов
export async function getOrderStatuses(state) {
  const params = new URLSearchParams()
  if (state) params.append('state', state)
  return cdekRequest(`/statuses?${params.toString()}`, 'GET')
}

export default {
  getAuthToken,
  getTariffs,
  calculateDeliveryByTariff,
  calculateDeliveryWithDestinationTariff,
  calculateDelivery,
  getAvailableTariffs,
  getPickupPoints,
  getPickupPoint,
  findCity,
  getCityInfo,
  createOrder,
  getOrder,
  getOrders,
  deleteOrder,
  cancelOrder,
  callCourier,
  getPrintForm,
  getBalance,
  getOrderStatuses
}
