import { DEFAULT_ACQUIRING_SETTINGS, UNKNOWN_PAYMENT_PERCENT } from './acquiringSettings.js'

export function normalizePaymentType(value) {
  const type = String(value || '').trim().toLowerCase()
  return ['sbp', 'card', 'tinkoff', 'dolyame', 'digitalruble'].includes(type) ? type : null
}

export function getPaymentTypeLabel(value) {
  const type = normalizePaymentType(value)
  return ({ sbp: 'СБП', card: 'Карта', tinkoff: 'Т-Pay', dolyame: 'Долями', digitalruble: 'Цифровой рубль' })[type] || 'Неизвестен'
}

export function extractTochkaPaymentType(payload) {
  const data = payload?.Data || payload?.data || {}
  const operation = (Array.isArray(data.Operation) ? data.Operation[0] : data.Operation)
    || (Array.isArray(data.operation) ? data.operation[0] : data.operation)
  return normalizePaymentType(operation?.paymentType || operation?.PaymentType
    || data.paymentType || data.PaymentType || payload?.paymentType || payload?.PaymentType)
}

export function getAcquiringEstimate(order, rates = DEFAULT_ACQUIRING_SETTINGS) {
  if (String(order?.paymentStatus || '').toUpperCase() !== 'PAID') {
    return { amount: 0, source: 'Не оплачен' }
  }

  const actual = order?.acquiringFee
  if (actual !== null && actual !== undefined && Number.isFinite(Number(actual))) {
    return { amount: Math.max(0, Math.round(Number(actual) * 100)) / 100, source: 'Фактическая сумма' }
  }

  const type = normalizePaymentType(order?.paymentType)
  const settings = { ...DEFAULT_ACQUIRING_SETTINGS, ...rates }
  const percent = type === 'sbp' ? settings.sbpPercent : type === 'card' ? settings.cardPercent : UNKNOWN_PAYMENT_PERCENT
  const paymentAmount = order?.paymentAmount === null || order?.paymentAmount === undefined
    ? order?.total : order.paymentAmount
  const cents = Math.max(0, Math.round((Number(paymentAmount) || 0) * 100))
  const feeCents = Math.round(cents * percent / 100)
  const source = type === 'sbp' ? `Расчёт: СБП ${percent.toLocaleString('ru-RU')}%`
    : type === 'card' ? `Расчёт: карта ${percent.toLocaleString('ru-RU')}%`
      : `Оценка: способ оплаты неизвестен, ${percent}%`
  return { amount: feeCents / 100, source }
}
