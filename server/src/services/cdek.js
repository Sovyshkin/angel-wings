import crypto from 'crypto'

const CDEK_ACCOUNT = process.env.CDEK_ACCOUNT
const CDEK_PASSWORD = process.env.CDEK_PASSWORD
const CDEK_URL = process.env.CDEK_URL || 'https://api.cdek.ru/v2'
const CDEK_TOKEN_URL = process.env.CDEK_TOKEN_URL || 'https://api.cdek.ru/v2/oauth/token'

const CDEK_SENDER_LOCATION = {
  code: 270,
  city: 'Москва',
  address: 'Волоколамский пр-д, 1',
  postal_code: '125424'
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

// Получить список тарифов
export async function getTariffs() {
  return cdekRequest('/tariff/list', 'POST', {
    type: 1 // 1 - все тарифы
  })
}

// Расчёт стоимости доставки по конкретному тарифу
export async function calculateDeliveryByTariff({ tariff_code, from_code, to_code, weight, length, width, height }) {
  // Для /calculator/tariff поле date не является обязательным - убираем его
  return cdekRequest('/calculator/tariff', 'POST', {
    tariff_code,
    from_location: { code: from_code },
    to_location: { code: to_code },
    packages: [{
      weight: weight,
      length: length || 10,
      width: width || 10,
      height: height || 10
    }]
  })
}

// Расчёт стоимости доставки (автоматический выбор тарифа)
export async function calculateDelivery({ from_code, to_code, weight, length, width, height }) {
  // Для /calculator поле date не является обязательным - убираем его
  return cdekRequest('/calculator', 'POST', {
    from_location: { code: from_code },
    to_location: { code: to_code },
    packages: [{
      weight: weight,
      length: length || 10,
      width: width || 10,
      height: height || 10
    }]
  })
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
  address
}) {
  const orderPayload = {
    number: String(number),
    tariff_code: tariff_code || 137, // safer default for pickup flow; explicit value should be passed from client
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
      items: [{
        name: pkg.name || 'Товар',
        ware_key: pkg.ware_key || `ITEM-${number}-${idx + 1}`,
        payment: { type: 'prepayment', value: 0 }, // Способ и сумма оплаты
        cost: pkg.cost || 0,
        amount: pkg.amount || 1,
        weight: pkg.weight // Вес товара (обязательно!)
      }]
    }))
  }

  const hasDeliveryPoint = Boolean(delivery_point)

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
  return cdekRequest('/accounting/balance', 'GET')
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
  calculateDelivery,
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
