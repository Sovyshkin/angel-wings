import { getAcquiringEstimate } from './paymentAcquiring.js'
import { getBilledOrderTotal } from './orderEditAmounts.js'
import { getOrderItemUnitCost } from './productCost.js'

export const PARTNER_REPORT_TAX_RATE = 0.11412

export function getReportOrderWhere(includeAllOrders, promoCodeIds = []) {
  if (includeAllOrders) return {}
  return {
    OR: [
      { partnerId: { not: null } },
      { commission: { isNot: null } },
      { promoCodeId: { in: promoCodeIds } }
    ]
  }
}

export function getReportPartnerName(partner, partnerId) {
  return partner?.user?.name || (partnerId ? `Партнёр #${partnerId}` : 'Без партнёра')
}

const toCents = value => Math.round((Number(value) || 0) * 100)
const fromCents = value => value / 100

function distributeCents(totalCents, weights) {
  if (!weights.length) return []
  const sign = totalCents < 0 ? -1 : 1
  const total = Math.abs(totalCents)
  const safeWeights = weights.map(weight => Math.max(0, Math.round(weight)))
  const weightSum = safeWeights.reduce((sum, weight) => sum + weight, 0)
  const shares = safeWeights.map(weight => total * (weightSum ? weight / weightSum : 1 / weights.length))
  const allocated = shares.map(Math.floor)
  let remainder = total - allocated.reduce((sum, value) => sum + value, 0)
  const byFraction = shares.map((share, index) => ({ index, fraction: share - allocated[index] }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index)
  for (const { index } of byFraction) {
    if (remainder-- <= 0) break
    allocated[index]++
  }
  return allocated.map(value => sign * value)
}

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
    const unitCost = toCents(getOrderItemUnitCost(item))
    const cost = unitCost * Math.max(0, Number(item.quantity) || 0)
    return {
      item,
      gross: fromCents(grossCents[index]),
      discount: fromCents(itemDiscount),
      net: fromCents(grossCents[index] - itemDiscount),
      unitCost: fromCents(unitCost),
      cost: fromCents(cost)
    }
  })
}

export function getOrderProductCost(order) {
  return fromCents(allocateOrderItems(order).reduce((sum, line) => sum + toCents(line.cost), 0))
}

export function allocateOrderFinancials(order, amounts) {
  const items = allocateOrderItems(order)
  const weights = items.map(line => toCents(line.net))
  const paid = distributeCents(toCents(amounts.revenue), weights)
  const tax = distributeCents(toCents(amounts.tax), paid)
  const acquiring = distributeCents(toCents(amounts.acquiring), paid)
  const commission = distributeCents(toCents(amounts.revenue ? order.commission?.amount : 0), weights)
  const isPaid = String(order.paymentStatus || '').toUpperCase() === 'PAID'

  return items.map((line, index) => {
    const balanceCents = paid[index] - tax[index] - acquiring[index] - commission[index]
    return {
      ...line,
      paid: fromCents(paid[index]),
      tax: fromCents(tax[index]),
      acquiring: fromCents(acquiring[index]),
      commission: fromCents(commission[index]),
      balance: fromCents(balanceCents),
      profit: isPaid ? fromCents(balanceCents - toCents(line.cost)) : null
    }
  })
}

export function getOrderReportAmounts(order, acquiringSettings) {
  const paid = String(order.paymentStatus || '').toUpperCase() === 'PAID'
  const paidAmount = getBilledOrderTotal(order)
  const revenue = paid ? fromCents(toCents(paidAmount)) : 0
  const tax = paid ? fromCents(Math.round(toCents(paidAmount) * PARTNER_REPORT_TAX_RATE)) : 0
  const estimate = getAcquiringEstimate(order, acquiringSettings)
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
