export const PAYMENT_TYPE_RATES = Object.freeze({ sbp: 0.4, card: 2.5 })

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

export function getAcquiringEstimate(order, fallbackPercent = 2.7, fallbackFixed = 0) {
  if (String(order?.paymentStatus || '').toUpperCase() !== 'PAID') {
    return { amount: 0, source: 'Не оплачен' }
  }

  const actual = order?.acquiringFee
  if (actual !== null && actual !== undefined && Number.isFinite(Number(actual))) {
    return { amount: Math.max(0, Math.round(Number(actual) * 100)) / 100, source: 'Фактическая сумма' }
  }

  const type = normalizePaymentType(order?.paymentType)
  const rate = PAYMENT_TYPE_RATES[type]
  const percent = rate ?? (Number.isFinite(Number(fallbackPercent)) ? Math.max(0, Number(fallbackPercent)) : 2.7)
  const fixed = rate === undefined && Number.isFinite(Number(fallbackFixed)) ? Math.max(0, Number(fallbackFixed)) : 0
  const paymentAmount = order?.paymentAmount === null || order?.paymentAmount === undefined
    ? order?.total : order.paymentAmount
  const cents = Math.max(0, Math.round((Number(paymentAmount) || 0) * 100))
  const feeCents = Math.round(cents * percent / 100 + fixed * 100)
  const source = type === 'sbp' ? 'Расчёт: СБП 0,4%'
    : type === 'card' ? 'Расчёт: карта 2,5%'
      : `Оценка: способ оплаты неизвестен, ${percent}%${fixed ? ` + ${fixed} ₽` : ''}`
  return { amount: feeCents / 100, source }
}
