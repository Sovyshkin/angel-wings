import crypto from 'crypto'

const TERMINAL_KEY = process.env.TINKOFF_TERMINAL_KEY
const SECRET_KEY = process.env.TINKOFF_SECRET_KEY
const TEST_MODE = process.env.TINKOFF_TEST_MODE === 'true'

const API_URL = TEST_MODE
  ? 'https://rest-api-test.tinkoff.ru'
  : 'https://rest-api.tinkoff.ru'

function log(level, message, data = null) {
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] [TINKOFF] ${message}`
  console.log(logMessage, data ? JSON.stringify(data, null, 2) : '')
}

function generateToken(params) {
  const str = Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== '')
    .sort()
    .map(key => params[key])
    .join('')

  if (!SECRET_KEY) return ''

  return crypto
    .createHash('sha256')
    .update(str + SECRET_KEY)
    .digest('hex')
}

export async function initPayment(orderId, amount, description, customerEmail, customerPhone) {
  log('info', '=== INIT PAYMENT ===')
  log('info', `OrderId: ${orderId}, Amount: ${amount}, Description: ${description}`)
  log('info', `Email: ${customerEmail}, Phone: ${customerPhone}`)
  log('info', `TerminalKey: ${TERMINAL_KEY}, TestMode: ${TEST_MODE}`)
  log('info', `API_URL: ${API_URL}`)

  if (!TERMINAL_KEY || !SECRET_KEY) {
    log('error', 'Tinkoff API не настроен - отсутствуют ключи')
    throw new Error('Tinkoff API не настроен. Укажите TINKOFF_TERMINAL_KEY и TINKOFF_SECRET_KEY в .env')
  }

  const params = {
    TerminalKey: TERMINAL_KEY,
    Amount: amount,
    OrderId: orderId,
    Description: description || `Order #${orderId}`
  }

  log('debug', 'Параметры для токена:', params)

  const token = generateToken(params)
  log('debug', `Сгенерированный токен: ${token}`)

  const payload = {
    TerminalKey: TERMINAL_KEY,
    Amount: amount,
    OrderId: orderId,
    Description: description || `Order #${orderId}`,
    Token: token,
    NotificationURL: `${process.env.API_URL || 'http://localhost:3005'}/api/payment/callback`,
    SuccessURL: `${process.env.CLIENT_URL || 'http://localhost:5173'}/order-success`,
    FailURL: `${process.env.CLIENT_URL || 'http://localhost:5173'}/order-failed`,
    PayType: 'O',
    Email: customerEmail || '',
    Phone: customerPhone || ''
  }

  log('info', 'Отправка запроса на Init:', `${API_URL}/v2/Init`)
  log('debug', 'Payload:', payload)

  try {
    log('info', `Запрос Init: ${API_URL}/v2/Init`)
    const response = await fetch(`${API_URL}/v2/Init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify(payload)
    })

    log('info', `Ответ HTTP: ${response.status} ${response.statusText}`)

    const responseText = await response.text()
    log('info', `Raw response: ${responseText}`)

    let result
    try {
      result = JSON.parse(responseText)
    } catch {
      result = { raw: responseText }
    }
    log('info', 'Результат Init:', result)

    if (result.Success) {
      log('info', `Платеж инициирован! PaymentId: ${result.PaymentId}, URL: ${result.PaymentURL}`)
    } else {
      log('warn', `Платеж НЕ инициирован - Success: false`)
      log('warn', `ErrorCode: ${result.ErrorCode}, Message: ${result.Message}`)
    }

    return result
  } catch (error) {
    log('error', `Ошибка при запросе Init: ${error.message}`)
    throw new Error(`Ошибка платежа: ${error.message}`)
  }
}

export async function getPaymentState(paymentId) {
  log('info', '=== GET PAYMENT STATE ===')
  log('info', `PaymentId: ${paymentId}`)

  const params = {
    TerminalKey: TERMINAL_KEY,
    PaymentId: paymentId
  }

  const token = generateToken(params)
  log('debug', `Токен: ${token}`)

  const payload = {
    TerminalKey: TERMINAL_KEY,
    PaymentId: paymentId,
    Token: token
  }

  try {
    log('info', `Запрос GetState: ${API_URL}/v2/GetState`)
    const response = await fetch(`${API_URL}/v2/GetState`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    log('info', `Ответ HTTP: ${response.status}`)

    const result = await response.json()
    log('info', 'Результат GetState:', result)

    return result
  } catch (error) {
    log('error', `Ошибка GetState: ${error.message}`)
    throw error
  }
}

export async function confirmPayment(orderId, sum) {
  log('info', '=== CONFIRM PAYMENT ===')
  log('info', `PaymentId: ${orderId}, Amount: ${sum}`)

  const params = {
    TerminalKey: TERMINAL_KEY,
    PaymentId: orderId,
    Amount: sum
  }

  const token = generateToken(params)

  const payload = {
    TerminalKey: TERMINAL_KEY,
    PaymentId: orderId,
    Amount: sum,
    Token: token
  }

  try {
    const response = await fetch(`${API_URL}/v2/Confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const result = await response.json()
    log('info', 'Результат Confirm:', result)

    return result
  } catch (error) {
    log('error', `Ошибка Confirm: ${error.message}`)
    throw error
  }
}

export async function cancelPayment(orderId, reason) {
  log('info', '=== CANCEL PAYMENT ===')
  log('info', `PaymentId: ${orderId}, Reason: ${reason}`)

  const params = {
    TerminalKey: TERMINAL_KEY,
    PaymentId: orderId
  }

  const token = generateToken(params)

  const payload = {
    TerminalKey: TERMINAL_KEY,
    PaymentId: orderId,
    Token: token,
    Reason: reason || ''
  }

  try {
    const response = await fetch(`${API_URL}/v2/Cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const result = await response.json()
    log('info', 'Результат Cancel:', result)

    return result
  } catch (error) {
    log('error', `Ошибка Cancel: ${error.message}`)
    throw error
  }
}

export function verifyCallback(data) {
  log('info', '=== VERIFY CALLBACK ===')
  log('debug', 'Данные callback:', data)

  const { TerminalKey, OrderId, Amount, Success, Token } = data

  if (!SECRET_KEY) {
    log('warn', 'SECRET_KEY не установлен, пропускаем верификацию')
    return false
  }

  const params = {
    TerminalKey: TerminalKey,
    OrderId: OrderId,
    Amount: Amount,
    Success: Success
  }

  const expectedToken = generateToken(params)
  const isValid = Token === expectedToken

  log('info', `Верификация: ${isValid ? 'УСПЕШНО' : 'ОШИБКА'}`)
  log('debug', `Ожидаемый токен: ${expectedToken}`)
  log('debug', `Полученный токен: ${Token}`)

  return isValid
}