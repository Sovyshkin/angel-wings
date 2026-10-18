import { getAcquiringEstimate } from './paymentAcquiring.js'

export const PARTNER_REPORT_TAX_RATE = 0.11412

const toCents = value => Math.round((Number(value) || 0) * 100)
const fromCents = value => value / 100

export function allocateOrderItems(order) {
  const items = order.items || []
  const grossCents = items.map(item => toCents(item.price) * Math.max(0, Number(item.quantity) || 0))
  const subtotal = grossCents.reduce((sum, value) => sum + value, 0)
  const discount = Math.min(subtotal, Math.max(0, toCents(order.discountAmount)))
  const exactShares = grossCents.map(value => subtotal > 0 ? discount * value / subtotal : 0)
  const discounts = exactShares.map(Math.floor)
  let remaining = discount - discounts.reduce((sum, value) => sum + value, 0)
  const remainderOrder = exactShares.map((share, index) => ({ index, fraction: share - discounts[index] }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index)
  for (const { index } of remainderOrder) {
    if (remaining-- <= 0) break
    discounts[index]++
  }

  return items.map((item, index) => {
    const itemDiscount = discounts[index]
    return {
      item,
      gross: fromCents(grossCents[index]),
      discount: fromCents(itemDiscount),
      net: fromCents(grossCents[index] - itemDiscount)
    }
  })
}

export function getOrderReportAmounts(order, acquiringPercent) {
  const paid = String(order.paymentStatus || '').toUpperCase() === 'PAID'
  const revenue = paid ? fromCents(toCents(order.total)) : 0
  const tax = paid ? fromCents(Math.round(toCents(order.total) * PARTNER_REPORT_TAX_RATE)) : 0
  const estimate = getAcquiringEstimate(order, acquiringPercent)
  const acquiring = estimate.amount
  const acquiringSource = estimate.source
  return { revenue, tax, acquiring, acquiringSource, balance: fromCents(toCents(revenue) - toCents(tax) - toCents(acquiring)) }
}

export function formatOrderComposition(items = []) {
  const money = value => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(Number(value || 0))
  return items.length
    ? items.map(item => `${item.title} — ${item.quantity} шт. × ${money(item.price)} ₽ = ${money(item.gross)} ₽${item.discount ? ` (после скидки ${money(item.net)} ₽)` : ''}`).join('\n')
    : 'Нет позиций'
}
